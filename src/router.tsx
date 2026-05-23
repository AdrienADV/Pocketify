import type { Location } from 'react-router';
import { Routes, Route, Navigate } from "react-router";
import TabLayout from "./layouts/tab-layout";
import Home from "./pages/app/home";
import Settings from "./pages/app/settings";
import Details from "./pages/app/home/details";

interface RouterProps {
    location: Location;
}

export default function Router({ location }: RouterProps) {
    return (
        <Routes location={location}>
            <Route path="app" element={<TabLayout />}>
                <Route index element={<Home />} />
                <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="app/details" element={<Details />} />

            <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
    );
}
