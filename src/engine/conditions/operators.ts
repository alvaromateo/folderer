import type { FieldDescriptor } from "../field-descriptor";

export type OperatorType =
  | "exists"
  | "contains"
  | "starts"
  | "ends"
  | "matches";

export interface OperatorDescriptor extends FieldDescriptor {
  key: OperatorType;
}

export const StringValueOperators: OperatorDescriptor[] = [
  {
    key: "exists",
    label: "exists",
    description: "Check if the left-hand value exists",
    fieldType: "none",
  },
  {
    key: "contains",
    label: "contains",
    description: "",
    placeholder: "",
    fieldType: "text",
  },
  {
    key: "starts",
    label: "starts with",
    description: "",
    placeholder: "",
    fieldType: "text",
  },
  {
    key: "ends",
    label: "ends with",
    description: "",
    placeholder: "",
    fieldType: "text",
  },
  {
    key: "matches",
    label: "matches regex",
    description: "",
    placeholder: "",
    fieldType: "text",
  },
] as const;

export class StringValueOperator {
  public op: OperatorDescriptor;

  constructor(operator: string) {
    this.op = this.parse(operator);
  }

  public parse(value: string): OperatorDescriptor {
    const result = StringValueOperators.find((fd) => fd.key === value);
    if (!result) {
      throw Error(`Operator ${value} not valid.`);
    }
    return result;
  }

  public evaluate(key?: string, value?: string): boolean {
    let result: boolean;
    switch (this.op.key) {
      case "exists":
        result = key !== undefined;
        break;
      case "contains":
        result =
          key !== undefined && value !== undefined && key.includes(value);
        break;
      case "starts":
        result =
          key !== undefined && value !== undefined && key.startsWith(value);
        break;
      case "ends":
        result =
          key !== undefined && value !== undefined && key.endsWith(value);
        break;
      case "matches":
        if (value === undefined) {
          throw Error("Missing regex for operation");
        }
        if (key === undefined) {
          throw Error("Missing property for operation");
        }
        try {
          const regex = new RegExp(value);
          result = regex.test(key);
        } catch (exc) {
          console.error(exc);
          throw Error(`Regex [${value}] invalid`);
        }
        break;
      default:
        throw new Error(`Unknown operator: ${this.op.key}`);
    }
    return result;
  }
}
