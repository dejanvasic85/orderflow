import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Not in lib.dom: `beforeinstallprompt` is a Chromium extension to the install
 * flow. Declaring it on WindowEventMap types the listener at the call site
 * instead of needing a cast there.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }

  // Safari's own installed-app flag, which predates display-mode.
  interface Navigator {
    standalone?: boolean;
  }

  // Stashed by the pre-hydration script in __root.tsx.
  interface Window {
    __bwowInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export const installConfigValue = {
  dismissedKey: "bwow:install-dismissed",
  standaloneQuery: "(display-mode: standalone)",
  iosPattern: /iphone|ipad|ipod/i,
  // Chrome, Firefox and Edge on iOS are still WebKit, but none of them can add
  // to the home screen, so the Safari instructions would be wrong for them.
  iosOtherBrowserPattern: /crios|fxios|edgios/i,
} as const;

function isStandalone(): boolean {
  return (
    window.matchMedia(installConfigValue.standaloneQuery).matches || navigator.standalone === true
  );
}

/*
 * iPadOS Safari reports a desktop macOS user-agent by default, so the string
 * alone misses most iPads. A Mac reporting touch points is the standard
 * tell-apart, since desktop Safari reports none.
 */
function isIosSafari(): boolean {
  const agent = navigator.userAgent;

  if (installConfigValue.iosOtherBrowserPattern.test(agent)) {
    return false;
  }

  const isIpadOs = navigator.maxTouchPoints > 1 && /macintosh/i.test(agent);
  return installConfigValue.iosPattern.test(agent) || isIpadOs;
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(installConfigValue.dismissedKey) === "true";
  } catch {
    // Private browsing can throw; treat an unreadable flag as "not dismissed".
    return false;
  }
}

function writeDismissed(): void {
  try {
    localStorage.setItem(installConfigValue.dismissedKey, "true");
  } catch {
    // Private browsing throws; the prompt simply returns next session.
  }
}

export interface InstallState {
  /** The app can still be installed on this device, one way or another. */
  canInstall: boolean;
  /** No programmatic prompt exists here, so show the manual steps instead. */
  needsManualSteps: boolean;
  /** Volunteer the prompt, as opposed to waiting to be asked. */
  shouldOfferPrompt: boolean;
  dismissPrompt: () => void;
  promptInstall: () => Promise<void>;
}

export function useInstallState(): InstallState {
  // The event itself lives in a ref so the callbacks below stay stable and
  // always see the current one, even from a toast closure created earlier.
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [hasDeferredPrompt, setHasDeferredPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  // Starts dismissed so server render and first paint never offer anything;
  // the effect below decides once the real browser state is readable.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const standalone = isStandalone();

    setInstalled(standalone);
    setDismissed(readDismissed());
    setIsIos(!standalone && isIosSafari());

    // The event fires as soon as the install criteria are met, which can be
    // before React hydrates. The pre-hydration script parks it on `window`.
    deferredPromptRef.current = window.__bwowInstallPrompt ?? null;
    setHasDeferredPrompt(deferredPromptRef.current !== null);

    // Chromium fires this instead of showing its own mini-infobar. Holding the
    // event is the only way to open the real prompt later.
    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      deferredPromptRef.current = event;
      setHasDeferredPrompt(true);
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setHasDeferredPrompt(false);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismissPrompt = useCallback(() => {
    setDismissed(true);
    writeDismissed();
  }, []);

  const promptInstall = useCallback(async () => {
    const deferred = deferredPromptRef.current;

    if (!deferred) {
      return;
    }

    // Consumed either way: a declined prompt cannot be replayed, and Chromium
    // issues a fresh event if the user becomes eligible again.
    deferredPromptRef.current = null;
    window.__bwowInstallPrompt = null;
    setHasDeferredPrompt(false);

    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;

      if (outcome === "accepted") {
        setInstalled(true);
      }
    } catch {
      // The prompt could not be shown; nothing left to do but let it go.
    }
  }, []);

  // Chromium can install programmatically; iOS Safari needs the manual steps.
  const canInstall = !installed && (hasDeferredPrompt || isIos);

  return {
    canInstall,
    needsManualSteps: isIos && !hasDeferredPrompt,
    shouldOfferPrompt: canInstall && !dismissed,
    dismissPrompt,
    promptInstall,
  };
}
