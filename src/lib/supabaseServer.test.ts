import { singleFlight } from "@/lib/supabaseServer";

describe("singleFlight", () => {
  it("shares one in-flight call across concurrent requests for the same key", async () => {
    const cache = new Map<string, Promise<string>>();
    let resolveRun: (value: string) => void = () => {};
    const run = vi.fn().mockReturnValue(
      new Promise<string>((resolve) => {
        resolveRun = resolve;
      }),
    );

    const callA = singleFlight(cache, "same-key", run);
    const callB = singleFlight(cache, "same-key", run);
    resolveRun("resolved-value");
    const [resultA, resultB] = await Promise.all([callA, callB]);

    expect(run).toHaveBeenCalledTimes(1);
    expect(resultA).toBe("resolved-value");
    expect(resultB).toBe("resolved-value");
  });

  it("runs a fresh call for a different key", async () => {
    const cache = new Map<string, Promise<string>>();
    const run = vi.fn().mockResolvedValueOnce("value-a").mockResolvedValueOnce("value-b");

    const resultA = await singleFlight(cache, "key-a", run);
    const resultB = await singleFlight(cache, "key-b", run);

    expect(run).toHaveBeenCalledTimes(2);
    expect(resultA).toBe("value-a");
    expect(resultB).toBe("value-b");
  });

  it("runs a fresh call once the previous in-flight promise for the same key has settled", async () => {
    const cache = new Map<string, Promise<string>>();
    const run = vi.fn().mockResolvedValueOnce("first-call").mockResolvedValueOnce("second-call");

    const firstResult = await singleFlight(cache, "same-key", run);
    const secondResult = await singleFlight(cache, "same-key", run);

    expect(run).toHaveBeenCalledTimes(2);
    expect(firstResult).toBe("first-call");
    expect(secondResult).toBe("second-call");
  });

  it("does not cache a rejected call, so the next request for the same key retries", async () => {
    const cache = new Map<string, Promise<string>>();
    const run = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce("recovered");

    await expect(singleFlight(cache, "same-key", run)).rejects.toThrow("boom");
    const result = await singleFlight(cache, "same-key", run);

    expect(run).toHaveBeenCalledTimes(2);
    expect(result).toBe("recovered");
  });
});
