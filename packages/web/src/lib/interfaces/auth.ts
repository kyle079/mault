import type {
  ImpersonationOrgSummary,
  LocalAuthResult,
} from "@magic-vault/shared";

export interface ImpersonationState {
  token: string;
  expiresAt: string;
  user: LocalAuthResult["user"];
  orgs: ImpersonationOrgSummary[];
  activeOrgId: string | null;
}

export type {
  LocalAuthResult,
  LocalOrg,
  LocalSessionUser,
} from "@magic-vault/shared";

export type AuthSession = {
  token?: string;
  activeOrganizationId?: string | null;
};
