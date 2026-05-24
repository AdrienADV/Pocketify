import { $api } from "@/lib/api/client"

export function useCurrentTeam() {
  return $api.useQuery("get", "/teams/current")
}
