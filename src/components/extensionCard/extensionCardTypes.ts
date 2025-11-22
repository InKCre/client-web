import { Extension } from "@/business/extension";

export interface ExtensionCardProps {
  extension: Extension;
  showConfig?: boolean;
}

export interface ExtensionCardEmits {
  "update-config": [config: Record<string, any>];
  "toggle-enabled": [enabled: boolean];
  "edit-config": [extension: Extension];
}
