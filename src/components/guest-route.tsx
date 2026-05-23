import { Navigate, Outlet } from "react-router"
import { isAuthenticated } from "@/lib/auth"

export default function GuestRoute() {
  if (isAuthenticated()) return <Navigate to="/app" replace />
  return <Outlet />
}
