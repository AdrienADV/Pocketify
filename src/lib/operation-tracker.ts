import { useEffect, useSyncExternalStore } from "react"

export type ResourceType = "application" | "service" | "database"
export type ResourceAction = "start" | "stop" | "restart"

export type ResourceOperation = {
  type: ResourceType
  uuid: string
  action: ResourceAction
  startedAt: number
  expiresAt: number
}

const DEFAULT_TIMEOUT_MS = 120_000
const MIN_VISIBLE_MS = 2_500
const RESTART_VISIBLE_MS = 12_000

const operations = new Map<string, ResourceOperation>()
const listeners = new Set<() => void>()
const expiryTimers = new Map<string, ReturnType<typeof setTimeout>>()
let version = 0

function operationKey(type: ResourceType, uuid: string) {
  return `${type}:${uuid}`
}

function emit() {
  version += 1
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return version
}

function normalizeStatus(raw: string | undefined): string {
  return ((raw ?? "").split(":")[0] ?? "").toLowerCase()
}

function isStoppedStatus(status: string) {
  return !status || status === "stopped" || status.includes("exited")
}

function isRunningStatus(status: string) {
  return status.startsWith("running")
}

function isErrorStatus(status: string) {
  return status.includes("error") || status.includes("unhealthy")
}

function scheduleExpiry(key: string, expiresAt: number) {
  const existing = expiryTimers.get(key)
  if (existing) clearTimeout(existing)

  const delay = Math.max(0, expiresAt - Date.now())
  const timer = setTimeout(() => {
    const operation = operations.get(key)
    if (operation && operation.expiresAt <= Date.now()) {
      operations.delete(key)
      expiryTimers.delete(key)
      emit()
    }
  }, delay)

  expiryTimers.set(key, timer)
}

export function trackResourceOperation(
  type: ResourceType,
  uuid: string | undefined,
  action: ResourceAction,
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  if (!uuid) return

  const key = operationKey(type, uuid)
  const now = Date.now()
  const operation: ResourceOperation = {
    type,
    uuid,
    action,
    startedAt: now,
    expiresAt: now + timeoutMs,
  }

  operations.set(key, operation)
  scheduleExpiry(key, operation.expiresAt)
  emit()
}

export function clearResourceOperation(type: ResourceType, uuid: string | undefined) {
  if (!uuid) return

  const key = operationKey(type, uuid)
  const timer = expiryTimers.get(key)
  if (timer) clearTimeout(timer)

  expiryTimers.delete(key)
  if (operations.delete(key)) emit()
}

export function settleResourceOperation(
  type: ResourceType,
  uuid: string | undefined,
  rawStatus: string | undefined,
) {
  if (!uuid) return

  const key = operationKey(type, uuid)
  const operation = operations.get(key)
  if (!operation) return

  const now = Date.now()
  if (operation.expiresAt <= now) {
    clearResourceOperation(type, uuid)
    return
  }

  const age = now - operation.startedAt
  const status = normalizeStatus(rawStatus)

  if (isErrorStatus(status)) {
    clearResourceOperation(type, uuid)
    return
  }

  if (operation.action === "stop" && isStoppedStatus(status) && age >= MIN_VISIBLE_MS) {
    clearResourceOperation(type, uuid)
    return
  }

  if (operation.action === "start" && isRunningStatus(status) && age >= MIN_VISIBLE_MS) {
    clearResourceOperation(type, uuid)
    return
  }

  if (operation.action === "restart" && isRunningStatus(status) && age >= RESTART_VISIBLE_MS) {
    clearResourceOperation(type, uuid)
  }
}

export function operationStatus(action: ResourceAction): string {
  if (action === "stop") return "stopping"
  if (action === "restart") return "restarting"
  return "starting"
}

export function useResourceOperation(type: ResourceType, uuid: string | undefined) {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  if (!uuid) return null

  return operations.get(operationKey(type, uuid)) ?? null
}

export function useActiveResourceOperations(type?: ResourceType) {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return Array.from(operations.values()).filter((operation) => {
    return type ? operation.type === type : true
  })
}

export function useHasActiveResourceOperations(type?: ResourceType) {
  return useActiveResourceOperations(type).length > 0
}

export function useDisplayedResourceStatus(
  type: ResourceType,
  uuid: string | undefined,
  rawStatus: string | undefined,
) {
  const operation = useResourceOperation(type, uuid)
  const operationAction = operation?.action
  const operationStartedAt = operation?.startedAt

  useEffect(() => {
    settleResourceOperation(type, uuid, rawStatus)

    if (!operationAction || !operationStartedAt) return undefined

    const minVisibleMs = operationAction === "restart" ? RESTART_VISIBLE_MS : MIN_VISIBLE_MS
    const settleAt = operationStartedAt + minVisibleMs
    const timer = setTimeout(() => {
      settleResourceOperation(type, uuid, rawStatus)
    }, Math.max(0, settleAt - Date.now()))

    return () => clearTimeout(timer)
  }, [operationAction, operationStartedAt, rawStatus, type, uuid])

  return operation ? operationStatus(operation.action) : rawStatus
}
