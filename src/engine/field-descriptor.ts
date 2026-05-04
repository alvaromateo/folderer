export type FieldType = "text" | "textarea" | "folder-path" | "none";

export interface FieldDescriptor {
  key: string;
  label: string;
  description?: string;
  placeholder?: string;
  fieldType: FieldType;
}
