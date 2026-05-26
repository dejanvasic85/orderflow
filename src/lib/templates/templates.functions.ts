import { createServerFn } from "@tanstack/react-start";
import {
  addTemplateItemSchema,
  createTemplateSchema,
  removeTemplateItemSchema,
  updateTemplateSchema,
} from "./schema";
import {
  deleteTemplateItem,
  fetchTemplate,
  fetchTemplateForAccount,
  insertTemplate,
  insertTemplateItem,
  patchTemplate,
} from "./templates.server";

export const getTemplateForAccount = createServerFn({ method: "GET", strict: { output: false } })
  .inputValidator((accountId: string) => accountId)
  .handler(async ({ data: accountId }) => fetchTemplateForAccount(accountId));

export const getTemplate = createServerFn({ method: "GET", strict: { output: false } })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => fetchTemplate(id));

export const createTemplate = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(createTemplateSchema)
  .handler(async ({ data }) => insertTemplate(data));

export const updateTemplate = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(updateTemplateSchema)
  .handler(async ({ data }) => patchTemplate(data));

export const addTemplateItem = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(addTemplateItemSchema)
  .handler(async ({ data }) => insertTemplateItem(data));

export const removeTemplateItem = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(removeTemplateItemSchema)
  .handler(async ({ data }) => deleteTemplateItem(data.id));
