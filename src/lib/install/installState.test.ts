import { act, renderHook } from "@testing-library/react";
import { installConfigValue, useInstallState } from "./installState";

const chromeDesktopAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const iphoneSafariAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const iphoneChromeAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1";
const ipadSafariAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";

function setBrowser(userAgent: string, maxTouchPoints = 0, standalone = false) {
  Object.defineProperty(navigator, "userAgent", { value: userAgent, configurable: true });
  Object.defineProperty(navigator, "maxTouchPoints", { value: maxTouchPoints, configurable: true });
  Object.defineProperty(window, "matchMedia", {
    value: () => ({ matches: standalone, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    configurable: true,
  });
}

function makeInstallPromptEvent() {
  const event = new Event("beforeinstallprompt");
  return Object.assign(event, {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome: "accepted" as const }),
  });
}

beforeEach(() => {
  localStorage.clear();
  window.__bwowInstallPrompt = null;
  setBrowser(chromeDesktopAgent);
});

it("cannot install before any deferred prompt arrives", () => {
  const { result } = renderHook(() => useInstallState());

  expect(result.current.canInstall).toBe(false);
  expect(result.current.shouldOfferPrompt).toBe(false);
});

it("offers the prompt once Chromium defers one", () => {
  const { result } = renderHook(() => useInstallState());

  act(() => {
    window.dispatchEvent(makeInstallPromptEvent());
  });

  expect(result.current.canInstall).toBe(true);
  expect(result.current.shouldOfferPrompt).toBe(true);
  expect(result.current.needsManualSteps).toBe(false);
});

it("adopts a prompt that fired before hydration", () => {
  window.__bwowInstallPrompt = makeInstallPromptEvent();

  const { result } = renderHook(() => useInstallState());

  expect(result.current.canInstall).toBe(true);
});

it("asks iOS Safari for the manual steps because it has no prompt", () => {
  setBrowser(iphoneSafariAgent);

  const { result } = renderHook(() => useInstallState());

  expect(result.current.canInstall).toBe(true);
  expect(result.current.needsManualSteps).toBe(true);
});

it("treats iPadOS Safari as iOS despite its desktop user-agent", () => {
  setBrowser(ipadSafariAgent, 5);

  const { result } = renderHook(() => useInstallState());

  expect(result.current.needsManualSteps).toBe(true);
});

it("offers nothing to Chrome on iOS, which cannot add to the home screen", () => {
  setBrowser(iphoneChromeAgent);

  const { result } = renderHook(() => useInstallState());

  expect(result.current.canInstall).toBe(false);
});

it("offers nothing when the app is already running standalone", () => {
  setBrowser(iphoneSafariAgent, 0, true);

  const { result } = renderHook(() => useInstallState());

  expect(result.current.canInstall).toBe(false);
});

it("stops offering after the user dismisses the prompt", () => {
  setBrowser(iphoneSafariAgent);
  const { result } = renderHook(() => useInstallState());

  act(() => {
    result.current.dismissPrompt();
  });

  expect(result.current.canInstall).toBe(true);
  expect(result.current.shouldOfferPrompt).toBe(false);
});

it("remembers a dismissal across sessions", () => {
  localStorage.setItem(installConfigValue.dismissedKey, "true");
  setBrowser(iphoneSafariAgent);

  const { result } = renderHook(() => useInstallState());

  expect(result.current.shouldOfferPrompt).toBe(false);
});

it("stops offering after the app reports itself installed", () => {
  const { result } = renderHook(() => useInstallState());

  act(() => {
    window.dispatchEvent(makeInstallPromptEvent());
  });
  act(() => {
    window.dispatchEvent(new Event("appinstalled"));
  });

  expect(result.current.canInstall).toBe(false);
});

it("opens the deferred prompt when asked to install", async () => {
  const event = makeInstallPromptEvent();
  const { result } = renderHook(() => useInstallState());

  act(() => {
    window.dispatchEvent(event);
  });
  await act(async () => {
    await result.current.promptInstall();
  });

  expect(event.prompt).toHaveBeenCalled();
  expect(result.current.canInstall).toBe(false);
});

it("does nothing when asked to install with no deferred prompt", async () => {
  const { result } = renderHook(() => useInstallState());

  await act(async () => {
    await result.current.promptInstall();
  });

  expect(result.current.canInstall).toBe(false);
});
