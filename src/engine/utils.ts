export function getFrontMatterString(
  fm: Record<string, unknown>,
  key: string
): string | undefined {
  if (!fm) return;
  // string
  if (typeof fm[key] === "string") { 
    return fm[key]
  }
  // number
  else if (typeof fm[key] === "number") {
    return fm[key].toString();
  }
  // boolean
  else if (typeof fm[key] === "boolean") {
    return fm[key] ? "true" : "false";
  }
  // null
  else {
    return undefined;
  }
}
