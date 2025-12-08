import {
  makeStringProp,
  makeNumberProp,
  makeObjectProp,
} from "@/utils/vue-props";
import type { PropType } from "vue";
import { CollectAt } from "@/business/info-base/source";

// --- Types ---
export interface SourceData {
  id: number;
  nickname: string;
  type: string;
  config: Record<string, any>;
  collectAt: CollectAt | null;
}

// --- Props ---
export type SourceCardProps =
  | { source: SourceData; sourceId?: never }
  | { source?: never; sourceId: number };

// --- Emits ---
export const sourceCardEmits = {
  edit: (id: number) => true,
  delete: (id: number) => true,
  run: (id: number) => true,
  editConfig: (id: number) => true,
} as const;
