import { createServerFn } from "@tanstack/react-start";
import { assertAdmin } from "@/lib/auth/auth.server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  addTemplateItemSchema,
  createTemplateSchema,
  removeTemplateItemSchema,
  saveTemplateItemsSchema,
  updateTemplateSchema,
} from "./schema";
import { createTemplateRepository } from "./templates.repository";
import {
  addTemplateItem as addTemplateItemSvc,
  createTemplate as createTemplateSvc,
  getTemplate as getTemplateSvc,
  getTemplateForAccount as getTemplateForAccountSvc,
  removeTemplateItem as removeTemplateItemSvc,
  saveTemplateItems as saveTemplateItemsSvc,
  type TemplateServiceDeps,
  updateTemplate as updateTemplateSvc,
} from "./templates.service";

const deps: TemplateServiceDeps = {
  repo: createTemplateRepository(),
  authorize: () => assertAdmin(createSupabaseServerClient()),
};

export const getTemplateForAccount = createServerFn({ method: "GET", strict: { output: false } })
  .validator((accountId: string) => accountId)
  .handler(async ({ data: accountId }) => getTemplateForAccountSvc(deps, accountId));

export const getTemplate = createServerFn({ method: "GET", strict: { output: false } })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => getTemplateSvc(deps, id));

export const createTemplate = createServerFn({ method: "POST", strict: { output: false } })
  .validator(createTemplateSchema)
  .handler(async ({ data }) => createTemplateSvc(deps, data));

export const updateTemplate = createServerFn({ method: "POST", strict: { output: false } })
  .validator(updateTemplateSchema)
  .handler(async ({ data }) => updateTemplateSvc(deps, data));

export const addTemplateItem = createServerFn({ method: "POST", strict: { output: false } })
  .validator(addTemplateItemSchema)
  .handler(async ({ data }) => addTemplateItemSvc(deps, data));

export const removeTemplateItem = createServerFn({ method: "POST", strict: { output: false } })
  .validator(removeTemplateItemSchema)
  .handler(async ({ data }) => removeTemplateItemSvc(deps, data.id));

export const saveTemplateItems = createServerFn({ method: "POST", strict: { output: false } })
  .validator(saveTemplateItemsSchema)
  .handler(async ({ data }) => saveTemplateItemsSvc(deps, data));
