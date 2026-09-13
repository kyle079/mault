import { createCollectionSchema } from "@magic-vault/shared";
import type { z } from "zod";
export {
  createCollectionSchema,
  renameCollectionSchema,
  type NamedResourceInput as RenameCollectionFormValues,
} from "@magic-vault/shared";
export type CreateCollectionFormValues = z.infer<typeof createCollectionSchema>;
