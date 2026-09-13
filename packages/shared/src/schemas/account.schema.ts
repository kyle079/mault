import { z } from "zod";

export const emailSchema = z.string().email();
export const newPasswordSchema = z.string().min(8);
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
export const signUpInputSchema = signInSchema.extend({
  password: newPasswordSchema,
  name: z.string().min(1).optional(),
});
export const signUpSchema = signUpInputSchema.required({ name: true });
export const forgotPasswordSchema = signInSchema.pick({ email: true });
export const tokenInputSchema = z.object({ token: z.string().min(1) });
export const resetPasswordSchema = tokenInputSchema.extend({
  newPassword: newPasswordSchema,
});
export const createApiKeySchema = z.object({ name: z.string().min(1) });
export const createApiKeyInputSchema = createApiKeySchema.extend({
  expiresAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")
    .optional(),
});
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeyInputSchema>;
