import { createRequestLogger, log } from "./logger";

describe("log (prod / JSON mode)", () => {
  beforeEach(() => {
    vi.stubEnv("DEV", false);
  });

  it("emits a single JSON line for info with level, event, msg and ts", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    log.info("auth.confirm", "verified");

    expect(spy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.level).toBe("info");
    expect(parsed.event).toBe("auth.confirm");
    expect(parsed.msg).toBe("verified");
    expect(typeof parsed.ts).toBe("string");
  });

  it("routes warn through console.warn", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    log.warn("auth.confirm", "otp verification failed");

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("routes error through console.error", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    log.error("order.db", "create order failed");

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("merges structured fields into the JSON output", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    log.info("invite", "sent", { email: "sam@bwow.au" });

    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.email).toBe("sam@bwow.au");
  });

  it("serializes an Error field to name and message", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    log.error("auth.otp", "verify failed", { error: new TypeError("bad token") });

    const parsed = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(parsed.error).toEqual({ name: "TypeError", message: "bad token" });
  });
});

describe("log (dev / pretty mode)", () => {
  beforeEach(() => {
    vi.stubEnv("DEV", true);
  });

  it("renders a non-JSON string containing the level and event", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    log.info("auth.confirm", "verified");

    const line = spy.mock.calls[0][0];
    expect(() => JSON.parse(line)).toThrow();
    expect(line).toContain("INFO");
    expect(line).toContain("auth.confirm");
  });
});

describe("createRequestLogger", () => {
  beforeEach(() => {
    vi.stubEnv("DEV", false);
  });

  it("attaches the reqId to every line", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    const requestLog = createRequestLogger("a3f1");
    requestLog.info("request", "start", { method: "GET" });

    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.reqId).toBe("a3f1");
    expect(parsed.method).toBe("GET");
  });
});
