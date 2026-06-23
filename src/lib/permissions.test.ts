import { can, permissions } from "./permissions";

describe("can", () => {
  describe("admin", () => {
    it("can write users", () => {
      expect(can("admin", permissions.users.write)).toBe(true);
    });

    it("can invite users", () => {
      expect(can("admin", permissions.users.invite)).toBe(true);
    });

    it("can change password", () => {
      expect(can("admin", permissions.users.changePassword)).toBe(true);
    });

    it("can write accounts", () => {
      expect(can("admin", permissions.accounts.write)).toBe(true);
    });

    it("can manage account users", () => {
      expect(can("admin", permissions.accounts.manageUsers)).toBe(true);
    });

    it("can write products", () => {
      expect(can("admin", permissions.products.write)).toBe(true);
    });

    it("can write templates", () => {
      expect(can("admin", permissions.templates.write)).toBe(true);
    });

    it("can place orders", () => {
      expect(can("admin", permissions.orders.place)).toBe(true);
    });
  });

  describe("staff", () => {
    it("can place orders", () => {
      expect(can("staff", permissions.orders.place)).toBe(true);
    });

    it("cannot write users", () => {
      expect(can("staff", permissions.users.write)).toBe(false);
    });

    it("cannot invite users", () => {
      expect(can("staff", permissions.users.invite)).toBe(false);
    });

    it("cannot change password", () => {
      expect(can("staff", permissions.users.changePassword)).toBe(false);
    });

    it("cannot write accounts", () => {
      expect(can("staff", permissions.accounts.write)).toBe(false);
    });

    it("cannot manage account users", () => {
      expect(can("staff", permissions.accounts.manageUsers)).toBe(false);
    });

    it("cannot write products", () => {
      expect(can("staff", permissions.products.write)).toBe(false);
    });

    it("cannot write templates", () => {
      expect(can("staff", permissions.templates.write)).toBe(false);
    });
  });

  describe("user", () => {
    it("can place orders", () => {
      expect(can("user", permissions.orders.place)).toBe(true);
    });

    it("cannot write users", () => {
      expect(can("user", permissions.users.write)).toBe(false);
    });

    it("cannot write accounts", () => {
      expect(can("user", permissions.accounts.write)).toBe(false);
    });

    it("cannot write products", () => {
      expect(can("user", permissions.products.write)).toBe(false);
    });

    it("cannot write templates", () => {
      expect(can("user", permissions.templates.write)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns false for undefined role", () => {
      expect(can(undefined, permissions.users.write)).toBe(false);
    });

    it("returns false for unknown role", () => {
      expect(can("superuser", permissions.users.write)).toBe(false);
    });

    it("returns false for __proto__ to prevent prototype pollution", () => {
      expect(can("__proto__", permissions.users.write)).toBe(false);
    });

    it("returns false for constructor to prevent prototype pollution", () => {
      expect(can("constructor", permissions.users.write)).toBe(false);
    });
  });
});
