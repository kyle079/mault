import { createApiKeySchema } from "@magic-vault/shared";
import type { z } from "zod";
export { createApiKeySchema };
export type CreateApiKeyFormValues = z.infer<typeof createApiKeySchema>;
