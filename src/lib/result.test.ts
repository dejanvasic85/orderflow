import { combine, err, mapResult, ok, unwrapOr } from "./result";

describe("mapResult", () => {
  it("applies the function to the value when ok", () => {
    const result = mapResult(ok(2), (n) => n * 10);

    expect(result).toEqual(ok(20));
  });

  it("passes through the error unchanged when not ok", () => {
    const result = mapResult(err({ message: "boom" }), (n: number) => n * 10);

    expect(result).toEqual(err({ message: "boom" }));
  });
});

describe("unwrapOr", () => {
  it("returns the value when ok", () => {
    expect(unwrapOr(ok("hello"), "fallback")).toBe("hello");
  });

  it("returns the fallback when not ok", () => {
    expect(unwrapOr(err({ message: "boom" }), "fallback")).toBe("fallback");
  });
});

describe("combine", () => {
  it("returns all values as a tuple when every result is ok", () => {
    const result = combine([ok("a"), ok(2), ok(true)]);

    expect(result).toEqual(ok(["a", 2, true]));
  });

  it("returns the first error when one result fails", () => {
    const result = combine([ok("a"), err({ message: "second failed" }), ok(true)]);

    expect(result).toEqual(err({ message: "second failed" }));
  });

  it("returns the first error when multiple results fail", () => {
    const result = combine([err({ message: "first failed" }), err({ message: "second failed" })]);

    expect(result).toEqual(err({ message: "first failed" }));
  });
});
