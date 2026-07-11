import { err, ok } from "./result";
import { unwrapOrThrow, valueOrNotFound } from "./resultLoader";

describe("unwrapOrThrow", () => {
  it("returns the value when ok", () => {
    expect(unwrapOrThrow(ok("hello"))).toBe("hello");
  });

  it("throws an Error with the result's error message when not ok", () => {
    expect(() => unwrapOrThrow(err({ message: "boom" }))).toThrow("boom");
  });
});

describe("valueOrNotFound", () => {
  it("returns the value when present", () => {
    expect(valueOrNotFound("hello")).toBe("hello");
  });

  it("returns falsy-but-defined values like 0 and empty string", () => {
    expect(valueOrNotFound(0)).toBe(0);
    expect(valueOrNotFound("")).toBe("");
  });

  it("throws when the value is null", () => {
    expect(() => valueOrNotFound(null)).toThrow();
  });

  it("throws when the value is undefined", () => {
    expect(() => valueOrNotFound(undefined)).toThrow();
  });
});
