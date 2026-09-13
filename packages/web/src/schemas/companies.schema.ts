import { organizationNameSchema, orgInviteSchema } from "@magic-vault/shared";
import { z } from "zod";
export { organizationNameSchema, orgInviteSchema };
export type OrganizationNameFormValues = z.infer<typeof organizationNameSchema>;
export type OrgInviteFormValues = z.infer<typeof orgInviteSchema>;
