import { createServerFn } from "@tanstack/react-start";
import {
  addTemplateItemSchema,
  createTemplateSchema,
  removeTemplateItemSchema,
  saveTemplateItemsSchema,
  updateTemplateSchema,
} from "./schema";
import {
  deleteTemplateItem,
  fetchTemplate,
  fetchTemplateForAccount,
  insertTemplate,
  insertTemplateItem,
  patchTemplate,
  saveTemplateItemsForAccount,
} from "./templates.server";

export const getTemplateForAccount = createServerFn({ method: "GET", strict: { output: false } })
  .validator((accountId: string) => accountId)
  .handler(async ({ data: accountId }) => fetchTemplateForAccount(accountId));

export const getTemplate = createServerFn({ method: "GET", strict: { output: false } })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => fetchTemplate(id));

export const createTemplate = createServerFn({ method: "POST", strict: { output: false } })
  .validator(createTemplateSchema)
  .handler(async ({ data }) => insertTemplate(data));

export const updateTemplate = createServerFn({ method: "POST", strict: { output: false } })
  .validator(updateTemplateSchema)
  .handler(async ({ data }) => patchTemplate(data));

export const addTemplateItem = createServerFn({ method: "POST", strict: { output: false } })
  .validator(addTemplateItemSchema)
  .handler(async ({ data }) => insertTemplateItem(data));

export const removeTemplateItem = createServerFn({ method: "POST", strict: { output: false } })
  .validator(removeTemplateItemSchema)
  .handler(async ({ data }) => deleteTemplateItem(data.id));

export const saveTemplateItems = createServerFn({ method: "POST", strict: { output: false } })
  .validator(saveTemplateItemsSchema)
  .handler(async ({ data }) => saveTemplateItemsForAccount(data));
