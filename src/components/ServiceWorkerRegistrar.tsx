import { useEffect } from "react";

const serviceWorkerPath = "/sw.js";

/** Registers the service worker that makes the app installable. Renders nothing. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register(serviceWorkerPath).catch(() => {
        // Non-fatal: installability is a progressive enhancement.
      });
    };

    // Wait for load so SW registration never competes with initial render work.
    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
