import { render } from "@testing-library/react";
import { ServiceWorkerRegistrar } from "./ServiceWorkerRegistrar";

it("registers the service worker when the document has already loaded", () => {
  const register = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "serviceWorker", {
    value: { register },
    configurable: true,
  });
  Object.defineProperty(document, "readyState", {
    value: "complete",
    configurable: true,
  });

  render(<ServiceWorkerRegistrar />);

  expect(register).toHaveBeenCalledWith("/sw.js");
});

it("waits for the load event before registering when the document is still loading", () => {
  const register = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "serviceWorker", {
    value: { register },
    configurable: true,
  });
  Object.defineProperty(document, "readyState", {
    value: "loading",
    configurable: true,
  });

  render(<ServiceWorkerRegistrar />);

  expect(register).not.toHaveBeenCalled();

  window.dispatchEvent(new Event("load"));

  expect(register).toHaveBeenCalledWith("/sw.js");
});

it("does nothing when the browser has no service worker support", () => {
  Object.defineProperty(navigator, "serviceWorker", {
    value: undefined,
    configurable: true,
  });

  const result = render(<ServiceWorkerRegistrar />);

  expect(result.container).toBeEmptyDOMElement();
});
