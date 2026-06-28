import { clearDraft, loadDraft, saveDraft } from "./draftOrder";

const accountA = "account-aaa";
const accountB = "account-bbb";

const item1 = { product_id: "prod-1", boxes: 2, extra_units: 0 };
const item2 = { product_id: "prod-2", boxes: 0, extra_units: 3 };

beforeEach(() => {
  localStorage.clear();
});

it("loadDraft returns null when key is absent", () => {
  expect(loadDraft(accountA)).toBeNull();
});

it("loadDraft returns stored items after saveDraft", () => {
  saveDraft(accountA, [item1, item2]);

  expect(loadDraft(accountA)).toEqual([item1, item2]);
});

it("loadDraft returns null when localStorage contains invalid JSON", () => {
  localStorage.setItem("draft:account-aaa", "not-json{{{");

  expect(loadDraft(accountA)).toBeNull();
});

it("loadDraft returns null when stored value is not an array", () => {
  localStorage.setItem("draft:account-aaa", JSON.stringify({ foo: "bar" }));

  expect(loadDraft(accountA)).toBeNull();
});

it("saveDraft overwrites previous draft for the same accountId", () => {
  saveDraft(accountA, [item1]);
  saveDraft(accountA, [item2]);

  expect(loadDraft(accountA)).toEqual([item2]);
});

it("clearDraft removes the key so loadDraft returns null", () => {
  saveDraft(accountA, [item1]);
  clearDraft(accountA);

  expect(loadDraft(accountA)).toBeNull();
});

it("keys for different accountIds are independent", () => {
  saveDraft(accountA, [item1]);
  saveDraft(accountB, [item2]);

  expect(loadDraft(accountA)).toEqual([item1]);
  expect(loadDraft(accountB)).toEqual([item2]);

  clearDraft(accountA);

  expect(loadDraft(accountA)).toBeNull();
  expect(loadDraft(accountB)).toEqual([item2]);
});
