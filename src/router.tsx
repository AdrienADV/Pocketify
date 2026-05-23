import type { Location } from "react-router"
import { Routes, Route, Navigate } from "react-router"
import { isAuthenticated } from "@/lib/auth"
import ProtectedRoute from "./components/protected-route"
import GuestRoute from "./components/guest-route"
import TabLayout from "./layouts/tab-layout"
import Onboarding from "./pages/onboarding"
import Home from "./pages/app/home"
import Settings from "./pages/app/settings"
import Applications from "./pages/app/applications"
import ApplicationDetail from "./pages/app/application-detail"
import Services from "./pages/app/services"
import ServiceDetail from "./pages/app/service-detail"
import Servers from "./pages/app/servers"
import ServerDetail from "./pages/app/server-detail"
import DeploymentLogs from "./pages/app/deployment-logs"

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
        <Route path="applications" element={<Applications />} />
        <Route path="applications/:uuid" element={<ApplicationDetail />} />
        <Route path="services" element={<Services />} />
        <Route path="services/:uuid" element={<ServiceDetail />} />
        <Route path="servers" element={<Servers />} />
        <Route path="servers/:uuid" element={<ServerDetail />} />
        <Route path="deployments/:uuid" element={<DeploymentLogs />} />
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
