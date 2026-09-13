import type { FieldMeta } from "@magic-vault/shared";

export type { GameInput } from "@magic-vault/shared";

export type { SampleCard } from "@magic-vault/shared";

export type PickedField = Pick<FieldMeta, "field" | "label" | "type" | "path">;
