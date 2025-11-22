export interface NavLink {
  to: string;
  label: string;
  external?: boolean;
}

export interface InkHeaderProps {
  mode?: "default" | "page" | "section";
  title?: string;
  navLinks?: NavLink[];
}

export type InkHeaderMode = "default" | "page" | "section";
