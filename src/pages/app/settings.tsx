import { useRef, useEffect } from "react";
import { setupPage } from '@capgo/capacitor-transitions/react';

export default function Settings() {
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (pageRef.current) {
      return setupPage(pageRef.current);
    }
  }, []);

  return (
    <cap-page ref={pageRef}>
      <div className="pt-(--safe-area-top) p-6 space-y-5">
        <p className="text-sm text-muted-foreground">Mobilify Boilerplate</p>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          change "settings.tsx" to change this screen
        </p>
      </div>
    </cap-page>
  );
}
