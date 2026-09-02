import { act, render, screen } from "@testing-library/react";
import { showInstallToast } from "@/lib/install/installToast";
import { InstallPrompt } from "./InstallPrompt";

vi.mock("@/lib/install/installToast", () => ({ showInstallToast: vi.fn() }));

const iphoneSafariAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const chromeDesktopAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function setUserAgent(userAgent: string) {
  Object.defineProperty(navigator, "userAgent", { value: userAgent, configurable: true });
  Object.defineProperty(navigator, "maxTouchPoints", { value: 0, configurable: true });
  Object.defineProperty(window, "matchMedia", {
    value: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
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
});

it("offers to install once the browser defers a prompt", () => {
  setUserAgent(chromeDesktopAgent);
  window.__bwowInstallPrompt = makeInstallPromptEvent();

  render(<InstallPrompt />);

  expect(showInstallToast).toHaveBeenCalled();
});

it("offers nothing to a browser that never defers a prompt", () => {
  setUserAgent(chromeDesktopAgent);

  render(<InstallPrompt />);

  expect(showInstallToast).not.toHaveBeenCalled();
});

it("offers nothing when the prompt was already dismissed", () => {
  setUserAgent(iphoneSafariAgent);
  localStorage.setItem("bwow:install-dismissed", "true");

  render(<InstallPrompt />);

  expect(showInstallToast).not.toHaveBeenCalled();
});

it("opens the browser install prompt when the offer is accepted", async () => {
  setUserAgent(chromeDesktopAgent);
  const event = makeInstallPromptEvent();
  window.__bwowInstallPrompt = event;

  render(<InstallPrompt />);
  await act(async () => {
    vi.mocked(showInstallToast).mock.calls[0][0].onInstall();
  });

  expect(event.prompt).toHaveBeenCalled();
});

it("shows the manual steps on iOS Safari, which has no install prompt", async () => {
  setUserAgent(iphoneSafariAgent);

  render(<InstallPrompt />);
  await act(async () => {
    vi.mocked(showInstallToast).mock.calls[0][0].onInstall();
  });

  expect(await screen.findByText("Add to Home Screen")).toBeInTheDocument();
});

it("remembers the dismissal when the offer is declined", async () => {
  setUserAgent(iphoneSafariAgent);

  render(<InstallPrompt />);
  await act(async () => {
    vi.mocked(showInstallToast).mock.calls[0][0].onDismiss();
  });

  expect(localStorage.getItem("bwow:install-dismissed")).toBe("true");
});
