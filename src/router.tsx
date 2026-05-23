import type { Location } from "react-router"
import { Routes, Route, Navigate } from "react-router"
import { isAuthenticated } from "@/lib/auth"
import ProtectedRoute from "./components/protected-route"
import GuestRoute from "./components/guest-route"
import TabLayout from "./layouts/tab-layout"
import Onboarding from "./pages/onboarding"
import Home from "./pages/app/home"
import Settings from "./pages/app/settings"

interface RouterProps {
  location: Location
}

export default function Router({ location }: Readonly<RouterProps>) {
  return (
    <Routes location={location}>
      <Route element={<GuestRoute />}>
        <Route path="onboarding" element={<Onboarding />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="app" element={<TabLayout />}>
          <Route index element={<Home />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate to={isAuthenticated() ? "/app" : "/onboarding"} replace />
        }
      />
    </Routes>
  )
}
