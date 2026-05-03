export type FieldType = "text" | "textarea" | "folder-path";

export interface FieldDescriptor {
  key: string;
  label: string;
  description?: string;
  placeholder?: string;
  fieldType: FieldType;
}
