import { Navigate, Outlet } from "react-router"
import { isAuthenticated } from "@/lib/auth"

export default function ProtectedRoute() {
  if (!isAuthenticated()) return <Navigate to="/onboarding" replace />
  return <Outlet />
}
