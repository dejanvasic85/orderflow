import { clearDraft, loadDraft, saveDraft } from "./draftOrder";

const accountA = "account-aaa";
const accountB = "account-bbb";

const item1 = { product_id: "prod-1", boxes: 2, extra_bottles: 0 };
const item2 = { product_id: "prod-2", boxes: 0, extra_bottles: 3 };

beforeEach(() => {
  localStorage.clear();
});

it("loadDraft returns [] when key is absent", () => {
  expect(loadDraft(accountA)).toEqual([]);
});

it("loadDraft returns stored items after saveDraft", () => {
  saveDraft(accountA, [item1, item2]);

  expect(loadDraft(accountA)).toEqual([item1, item2]);
});

it("loadDraft returns [] when localStorage contains invalid JSON", () => {
  localStorage.setItem("draft:account-aaa", "not-json{{{");

  expect(loadDraft(accountA)).toEqual([]);
});

it("loadDraft returns [] when stored value is not an array", () => {
  localStorage.setItem("draft:account-aaa", JSON.stringify({ foo: "bar" }));

  expect(loadDraft(accountA)).toEqual([]);
});

it("saveDraft overwrites previous draft for the same accountId", () => {
  saveDraft(accountA, [item1]);
  saveDraft(accountA, [item2]);

  expect(loadDraft(accountA)).toEqual([item2]);
});

it("clearDraft removes the key so loadDraft returns []", () => {
  saveDraft(accountA, [item1]);
  clearDraft(accountA);

  expect(loadDraft(accountA)).toEqual([]);
});

it("keys for different accountIds are independent", () => {
  saveDraft(accountA, [item1]);
  saveDraft(accountB, [item2]);

  expect(loadDraft(accountA)).toEqual([item1]);
  expect(loadDraft(accountB)).toEqual([item2]);

  clearDraft(accountA);

  expect(loadDraft(accountA)).toEqual([]);
  expect(loadDraft(accountB)).toEqual([item2]);
});
