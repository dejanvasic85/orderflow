import { err, ok } from "@/lib/result";
import type { TemplateRepository } from "./templates.repository";
import {
  addTemplateItem,
  createTemplate,
  ensureTemplateId,
  getTemplate,
  getTemplateForAccount,
  removeTemplateItem,
  saveTemplateItems,
  type TemplateServiceDeps,
  updateTemplate,
} from "./templates.service";

const existingTemplate = {
  id: "tmpl-1",
  accountId: "acc-1",
  name: "Default",
  createdBy: "u-1",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  templateItems: [],
};

function makeRepo(overrides: Partial<TemplateRepository> = {}): TemplateRepository {
  return {
    findTemplateForAccount: vi.fn().mockResolvedValue(ok(existingTemplate)),
    findTemplateById: vi.fn().mockResolvedValue(ok(existingTemplate)),
    createTemplate: vi.fn().mockResolvedValue(ok({ id: "tmpl-new", name: "Default" })),
    updateTemplate: vi.fn().mockResolvedValue(ok(existingTemplate)),
    createTemplateItem: vi.fn().mockResolvedValue(ok({ id: "item-1" })),
    deleteTemplateItem: vi.fn().mockResolvedValue(ok()),
    saveTemplateItemBatch: vi.fn().mockResolvedValue(ok()),
    ...overrides,
  };
}

function makeDeps(overrides: Partial<TemplateServiceDeps> = {}): TemplateServiceDeps {
  return {
    repo: makeRepo(),
    authorize: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("ensureTemplateId", () => {
  it("returns the existing template id when a template already exists", async () => {
    const createTemplate = vi.fn();
    const repo = makeRepo({
      findTemplateForAccount: vi.fn().mockResolvedValue(ok(existingTemplate)),
      createTemplate,
    });

    const result = await ensureTemplateId(repo, "acc-1");

    expect(result).toEqual(ok("tmpl-1"));
    expect(createTemplate).not.toHaveBeenCalled();
  });

  it("creates a new template and returns its id when none exists", async () => {
    const createTemplate = vi.fn().mockResolvedValue(ok({ id: "tmpl-new", name: "Default" }));
    const repo = makeRepo({
      findTemplateForAccount: vi.fn().mockResolvedValue(ok(null)),
      createTemplate,
    });

    const result = await ensureTemplateId(repo, "acc-1");

    expect(result).toEqual(ok("tmpl-new"));
    expect(createTemplate).toHaveBeenCalledWith({ accountId: "acc-1", name: "Default" });
  });

  it("propagates a repo error from findTemplateForAccount", async () => {
    const createTemplate = vi.fn();
    const repo = makeRepo({
      findTemplateForAccount: vi.fn().mockResolvedValue(err({ message: "db error" })),
      createTemplate,
    });

    const result = await ensureTemplateId(repo, "acc-1");

    expect(result).toEqual(err({ message: "db error" }));
    expect(createTemplate).not.toHaveBeenCalled();
  });

  it("propagates a repo error from createTemplate", async () => {
    const repo = makeRepo({
      findTemplateForAccount: vi.fn().mockResolvedValue(ok(null)),
      createTemplate: vi.fn().mockResolvedValue(err({ message: "insert failed" })),
    });

    const result = await ensureTemplateId(repo, "acc-1");

    expect(result).toEqual(err({ message: "insert failed" }));
  });
});

describe("saveTemplateItems", () => {
  const validInput = {
    accountId: "acc-1",
    toRemove: ["item-old"],
    toUpdate: [{ id: "item-2", boxCount: 3, unitCount: 0 }],
    toAdd: [{ productId: "prod-1", boxCount: 2, unitCount: 0 }],
  };

  it("calls authorize before any repo operations", async () => {
    const authorize = vi.fn().mockResolvedValue(undefined);
    const findTemplateForAccount = vi.fn().mockResolvedValue(ok(existingTemplate));
    const deps = makeDeps({ repo: makeRepo({ findTemplateForAccount }), authorize });

    await saveTemplateItems(deps, validInput);

    expect(authorize).toHaveBeenCalledTimes(1);
    expect(authorize.mock.invocationCallOrder[0]).toBeLessThan(
      findTemplateForAccount.mock.invocationCallOrder[0],
    );
  });

  it("throws without calling repo when authorize rejects", async () => {
    const findTemplateForAccount = vi.fn();
    const saveTemplateItemBatch = vi.fn();
    const deps = makeDeps({
      repo: makeRepo({ findTemplateForAccount, saveTemplateItemBatch }),
      authorize: vi.fn().mockRejectedValue(new Error("Forbidden")),
    });

    await expect(saveTemplateItems(deps, validInput)).rejects.toThrow("Forbidden");
    expect(findTemplateForAccount).not.toHaveBeenCalled();
    expect(saveTemplateItemBatch).not.toHaveBeenCalled();
  });

  it("calls saveTemplateItemBatch with the resolved templateId", async () => {
    const saveTemplateItemBatch = vi.fn().mockResolvedValue(ok());
    const deps = makeDeps({
      repo: makeRepo({
        findTemplateForAccount: vi.fn().mockResolvedValue(ok(existingTemplate)),
        saveTemplateItemBatch,
      }),
    });

    await saveTemplateItems(deps, validInput);

    expect(saveTemplateItemBatch).toHaveBeenCalledWith({
      templateId: "tmpl-1",
      toRemove: validInput.toRemove,
      toUpdate: validInput.toUpdate,
      toAdd: validInput.toAdd,
    });
  });

  it("creates a new template when none exists before saving batch", async () => {
    const createTemplate = vi.fn().mockResolvedValue(ok({ id: "tmpl-new", name: "Default" }));
    const saveTemplateItemBatch = vi.fn().mockResolvedValue(ok());
    const deps = makeDeps({
      repo: makeRepo({
        findTemplateForAccount: vi.fn().mockResolvedValue(ok(null)),
        createTemplate,
        saveTemplateItemBatch,
      }),
    });

    await saveTemplateItems(deps, validInput);

    expect(createTemplate).toHaveBeenCalledWith({ accountId: "acc-1", name: "Default" });
    expect(saveTemplateItemBatch).toHaveBeenCalledWith(
      expect.objectContaining({ templateId: "tmpl-new" }),
    );
  });

  it("propagates a repo error from saveTemplateItemBatch", async () => {
    const saveTemplateItemBatch = vi.fn().mockResolvedValue(err({ message: "batch failed" }));
    const deps = makeDeps({ repo: makeRepo({ saveTemplateItemBatch }) });

    const result = await saveTemplateItems(deps, validInput);

    expect(result).toEqual(err({ message: "batch failed" }));
  });
});

describe("getTemplateForAccount", () => {
  it("delegates to repo.findTemplateForAccount", async () => {
    const findTemplateForAccount = vi.fn().mockResolvedValue(ok(existingTemplate));
    const deps = makeDeps({ repo: makeRepo({ findTemplateForAccount }) });

    const result = await getTemplateForAccount(deps, "acc-1");

    expect(result).toEqual(ok(existingTemplate));
    expect(findTemplateForAccount).toHaveBeenCalledWith("acc-1");
  });
});

describe("getTemplate", () => {
  it("delegates to repo.findTemplateById", async () => {
    const findTemplateById = vi.fn().mockResolvedValue(ok(existingTemplate));
    const deps = makeDeps({ repo: makeRepo({ findTemplateById }) });

    const result = await getTemplate(deps, "tmpl-1");

    expect(result).toEqual(ok(existingTemplate));
    expect(findTemplateById).toHaveBeenCalledWith("tmpl-1");
  });
});

describe("createTemplate", () => {
  it("delegates to repo.createTemplate", async () => {
    const row = { id: "tmpl-new", name: "My Template" } as never;
    const createTemplateFn = vi.fn().mockResolvedValue(ok(row));
    const deps = makeDeps({ repo: makeRepo({ createTemplate: createTemplateFn }) });
    const input = { accountId: "acc-1", name: "My Template" };

    const result = await createTemplate(deps, input);

    expect(result).toEqual(ok(row));
    expect(createTemplateFn).toHaveBeenCalledWith(input);
  });

  it("propagates a repo error", async () => {
    const createTemplateFn = vi.fn().mockResolvedValue(err({ message: "insert failed" }));
    const deps = makeDeps({ repo: makeRepo({ createTemplate: createTemplateFn }) });

    const result = await createTemplate(deps, { accountId: "acc-1", name: "My Template" });

    expect(result).toEqual(err({ message: "insert failed" }));
  });
});

describe("updateTemplate", () => {
  it("delegates to repo.updateTemplate", async () => {
    const updated = { ...existingTemplate, name: "Renamed" } as never;
    const updateTemplateFn = vi.fn().mockResolvedValue(ok(updated));
    const deps = makeDeps({ repo: makeRepo({ updateTemplate: updateTemplateFn }) });
    const input = { id: "tmpl-1", name: "Renamed" };

    const result = await updateTemplate(deps, input);

    expect(result).toEqual(ok(updated));
    expect(updateTemplateFn).toHaveBeenCalledWith(input);
  });

  it("propagates a repo error", async () => {
    const updateTemplateFn = vi.fn().mockResolvedValue(err({ message: "update failed" }));
    const deps = makeDeps({ repo: makeRepo({ updateTemplate: updateTemplateFn }) });

    const result = await updateTemplate(deps, { id: "tmpl-1", name: "Renamed" });

    expect(result).toEqual(err({ message: "update failed" }));
  });
});

describe("addTemplateItem", () => {
  it("delegates to repo.createTemplateItem", async () => {
    const item = { id: "item-1", productId: "prod-1" } as never;
    const createTemplateItem = vi.fn().mockResolvedValue(ok(item));
    const deps = makeDeps({ repo: makeRepo({ createTemplateItem }) });
    const input = { templateId: "tmpl-1", productId: "prod-1", boxCount: 2, unitCount: 0 };

    const result = await addTemplateItem(deps, input);

    expect(result).toEqual(ok(item));
    expect(createTemplateItem).toHaveBeenCalledWith(input);
  });
});

describe("removeTemplateItem", () => {
  it("delegates to repo.deleteTemplateItem", async () => {
    const deleteTemplateItem = vi.fn().mockResolvedValue(ok());
    const deps = makeDeps({ repo: makeRepo({ deleteTemplateItem }) });

    const result = await removeTemplateItem(deps, "item-1");

    expect(result).toEqual(ok());
    expect(deleteTemplateItem).toHaveBeenCalledWith("item-1");
  });
});
