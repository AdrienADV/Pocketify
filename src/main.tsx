import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router";
import './index.css'
import App from './app'
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from './components/theme-provider';
import { queryClient } from "@/lib/query-client"
import { initTransitions } from '@capgo/capacitor-transitions/react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

CapacitorUpdater.notifyAppReady();
import '@capgo/capacitor-transitions';


initTransitions({ platform: 'auto' });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <App />
          <Toaster mobileOffset={{ top: 'var(--safe-area-top)' }} position="top-center" visibleToasts={1} />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
