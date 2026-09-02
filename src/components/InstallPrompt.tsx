import { useCallback, useEffect, useRef, useState } from "react";
import { InstallInstructions } from "@/components/InstallInstructions";
import { type InstallState, useInstallState } from "@/lib/install/installState";
import { showInstallToast } from "@/lib/install/installToast";

/** Offers the app install once per browser, then renders the iOS fallback dialog. */
export function InstallPrompt() {
  const install = useInstallState();
  const [showInstructions, setShowInstructions] = useState(false);

  // The toast outlives the render that created it, so its handlers read the
  // latest state through a ref rather than a captured copy.
  const installRef = useRef<InstallState>(install);
  const offered = useRef(false);

  useEffect(() => {
    installRef.current = install;
  }, [install]);

  const handleInstall = useCallback(() => {
    const state = installRef.current;
    state.dismissPrompt();

    if (state.needsManualSteps) {
      setShowInstructions(true);
      return;
    }

    void state.promptInstall();
  }, []);

  const handleDismiss = useCallback(() => {
    installRef.current.dismissPrompt();
  }, []);

  useEffect(() => {
    if (!install.shouldOfferPrompt || offered.current) {
      return;
    }

    offered.current = true;
    showInstallToast({ onInstall: handleInstall, onDismiss: handleDismiss });
  }, [install.shouldOfferPrompt, handleInstall, handleDismiss]);

  return <InstallInstructions open={showInstructions} onOpenChange={setShowInstructions} />;
}
