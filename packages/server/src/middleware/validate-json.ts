import { validator } from "hono/validator";
import type { z } from "zod";

export function validateJson<T extends z.ZodType>(schema: T) {
  return validator("json", (value, c) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid request.",
          issues: result.error.issues,
        },
        400,
      );
    }
    return result.data as z.output<T>;
  });
}
