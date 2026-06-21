import { ok, type Result } from "@/lib/result";
import type {
  AddTemplateItemInput,
  CreateTemplateInput,
  SaveTemplateItemsInput,
  TemplateItemRow,
  TemplateRow,
  TemplateWithItems,
  UpdateTemplateInput,
} from "./schema";
import type { TemplateRepository } from "./templates.repository";

export type TemplateServiceDeps = {
  repo: TemplateRepository;
  authorize: () => Promise<void>;
};

async function ensureTemplateId(
  repo: TemplateRepository,
  accountId: string,
): Promise<Result<string>> {
  const existing = await repo.findTemplateForAccount(accountId);
  if (!existing.ok) return existing;
  if (existing.value) return ok(existing.value.id);
  const created = await repo.createTemplate({ account_id: accountId, name: "Default" });
  if (!created.ok) return created;
  return ok(created.value.id);
}

export async function getTemplateForAccount(
  deps: TemplateServiceDeps,
  accountId: string,
): Promise<Result<TemplateWithItems | null>> {
  return deps.repo.findTemplateForAccount(accountId);
}

export async function getTemplate(
  deps: TemplateServiceDeps,
  id: string,
): Promise<Result<TemplateWithItems>> {
  return deps.repo.findTemplateById(id);
}

export async function createTemplate(
  deps: TemplateServiceDeps,
  data: CreateTemplateInput,
): Promise<Result<TemplateRow>> {
  return deps.repo.createTemplate(data);
}

export async function updateTemplate(
  deps: TemplateServiceDeps,
  data: UpdateTemplateInput,
): Promise<Result<TemplateRow>> {
  return deps.repo.updateTemplate(data);
}

export async function addTemplateItem(
  deps: TemplateServiceDeps,
  data: AddTemplateItemInput,
): Promise<Result<TemplateItemRow>> {
  return deps.repo.createTemplateItem(data);
}

export async function removeTemplateItem(
  deps: TemplateServiceDeps,
  id: string,
): Promise<Result<void>> {
  return deps.repo.deleteTemplateItem(id);
}

export async function saveTemplateItems(
  deps: TemplateServiceDeps,
  data: SaveTemplateItemsInput,
): Promise<Result<void>> {
  await deps.authorize();

  const templateIdResult = await ensureTemplateId(deps.repo, data.account_id);
  if (!templateIdResult.ok) return templateIdResult;

  return deps.repo.saveTemplateItemBatch({
    templateId: templateIdResult.value,
    toRemove: data.toRemove,
    toUpdate: data.toUpdate,
    toAdd: data.toAdd,
  });
}

export { ensureTemplateId };
