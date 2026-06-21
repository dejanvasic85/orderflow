import { evaluatePassword } from "@/lib/auth/passwordStrength";

it("returns score 0 and no label for an empty password", () => {
  const result = evaluatePassword("");

  expect(result.score).toBe(0);
  expect(result.label).toBeNull();
  expect(result.meetsRequirements).toBe(false);
});

it("marks a short lowercase password as Weak", () => {
  const result = evaluatePassword("abc");

  expect(result.label).toBe("Weak");
  expect(result.meetsRequirements).toBe(false);
});

it("reports which requirements a short lowercase password fails", () => {
  const result = evaluatePassword("abc");

  expect(result.met.minLength).toBe(false);
  expect(result.met.lowercase).toBe(true);
  expect(result.met.uppercase).toBe(false);
  expect(result.met.number).toBe(false);
});

it("rejects a password that is missing an uppercase letter", () => {
  const result = evaluatePassword("abcdefg1");

  expect(result.met.uppercase).toBe(false);
  expect(result.meetsRequirements).toBe(false);
});

it("accepts a password that meets every hard requirement", () => {
  const result = evaluatePassword("Abcdef12");

  expect(result.met.minLength).toBe(true);
  expect(result.met.lowercase).toBe(true);
  expect(result.met.uppercase).toBe(true);
  expect(result.met.number).toBe(true);
  expect(result.meetsRequirements).toBe(true);
});

it("scores a long mixed password with a symbol as Strong", () => {
  const result = evaluatePassword("Abcdefghij12!");

  expect(result.score).toBe(4);
  expect(result.label).toBe("Strong");
  expect(result.meetsRequirements).toBe(true);
});
