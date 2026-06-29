import { useEffect } from "react";

const serviceWorkerPath = "/sw.js";

/**
 * Registers the minimal service worker that makes the app installable on phones.
 * Renders nothing; runs once after hydration, browser-only. Registration failures
 * are non-fatal — the app works without it, you just lose the install prompt.
 */
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
