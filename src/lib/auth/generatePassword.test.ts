import { generatePassword } from "./generatePassword";
import { passwordSchema } from "./schema";

describe("generatePassword", () => {
  it("returns 14 characters", () => {
    expect(generatePassword()).toHaveLength(14);
  });

  it("satisfies the password schema", () => {
    expect(passwordSchema.safeParse(generatePassword()).success).toBe(true);
  });

  it("includes a lowercase letter", () => {
    expect(generatePassword()).toMatch(/[a-z]/);
  });

  it("includes an uppercase letter", () => {
    expect(generatePassword()).toMatch(/[A-Z]/);
  });

  it("includes a digit", () => {
    expect(generatePassword()).toMatch(/[0-9]/);
  });

  it("omits characters that look alike", () => {
    expect(generatePassword()).not.toMatch(/[0O1lI]/);
  });

  it("returns a different password each call", () => {
    expect(generatePassword()).not.toBe(generatePassword());
  });
});
