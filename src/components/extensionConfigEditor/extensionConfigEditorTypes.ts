import { Extension } from "@/business/extension";

export interface ExtensionConfigEditorProps {
  extension: Extension;
  visible: boolean;
}

export interface ExtensionConfigEditorEmits {
  close: [];
  save: [config: Record<string, any>];
}
