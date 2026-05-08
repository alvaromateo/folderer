/**
 * Tests for the save() validation logic in Content.svelte.
 *
 * The Svelte component cannot be rendered in this project's Vitest setup
 * (environment: "node", no jsdom, no Svelte runtime installed for tests).
 * Instead, the validation loop is reproduced here as a standalone pure
 * function that is kept structurally identical to the component's save().
 * Any change to the validation rules in Content.svelte must be reflected here.
 *
 * Validation order (mirrors Content.svelte save()):
 *   1. Rule name must not be blank.
 *   2. At least one action must exist.
 *   3. For every action, every required field must not be blank.
 */

import { describe, expect, it } from "vitest";
import type { ActionExecutor } from "../../src/engine/actions/executor";
import { HandlerRegistry } from "../../src/engine/registry";
import type { ActionData, RuleData } from "../../src/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal registry populated with a couple of action executors. */
function buildRegistry(executors: ActionExecutor[]): HandlerRegistry {
  const registry = new HandlerRegistry();
  for (const ex of executors) {
    registry.registerAction(ex);
  }
  return registry;
}

/** An ActionExecutor with zero fields (no required inputs). */
function mkExecutorNoFields(type: string): ActionExecutor {
  return {
    type,
    label: `Action ${type}`,
    fields: [],
    execute: async () => {},
  };
}

/** An ActionExecutor whose fields array mirrors appendTextExecutor. */
function mkExecutorOneTextField(type: string): ActionExecutor {
  return {
    type,
    label: `Action ${type}`,
    fields: [
      {
        key: "text",
        label: "Text",
        placeholder: "Enter text",
        fieldType: "text",
      },
    ],
    execute: async () => {},
  };
}

/** An ActionExecutor with two required text fields. */
function mkExecutorTwoFields(type: string): ActionExecutor {
  return {
    type,
    label: `Action ${type}`,
    fields: [
      {
        key: "alpha",
        label: "Alpha Label",
        placeholder: "alpha",
        fieldType: "text",
      },
      {
        key: "beta",
        label: "Beta Label",
        placeholder: "beta",
        fieldType: "text",
      },
    ],
    execute: async () => {},
  };
}

/**
 * Pure re-implementation of the validation section in Content.svelte save().
 *
 * Returns the first error message string, or null when validation passes.
 * (The component fires new Notice(msg) and returns early; this returns the
 * message instead so it is testable without an Obsidian environment.)
 */
function validateRule(
  rule: Pick<RuleData, "name" | "actions">,
  registry: HandlerRegistry,
): string | null {
  if (!rule.name.trim()) {
    return "Rule name cannot be empty.";
  }

  if (rule.actions.length === 0) {
    return "At least one action is required.";
  }

  for (const action of rule.actions) {
    const actionHandler = registry.getAction(action.type);
    if (!actionHandler) {
      return `Unknown action type "${action.type}". Please remove or replace it.`;
    }
    for (const field of actionHandler.fields) {
      if (!(action.params[field.key] ?? "").trim()) {
        return `${field.label} cannot be empty.`;
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const APPEND_EXECUTOR = mkExecutorOneTextField("append-text");

function validAction(
  params: Record<string, string> = { text: "hello" },
): ActionData {
  return { type: "append-text", params };
}

function ruleWith(
  overrides: Partial<Pick<RuleData, "name" | "actions">>,
): Pick<RuleData, "name" | "actions"> {
  return {
    name: "My rule",
    actions: [validAction()],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Name validation
// ---------------------------------------------------------------------------

describe("validateRule — name", () => {
  const registry = buildRegistry([APPEND_EXECUTOR]);

  it("should return an error when rule name is empty string", () => {
    expect(validateRule(ruleWith({ name: "" }), registry)).toBe(
      "Rule name cannot be empty.",
    );
  });

  it("should return an error when rule name is only whitespace", () => {
    expect(validateRule(ruleWith({ name: "   " }), registry)).toBe(
      "Rule name cannot be empty.",
    );
  });

  it("should return an error when rule name is a tab character", () => {
    expect(validateRule(ruleWith({ name: "\t" }), registry)).toBe(
      "Rule name cannot be empty.",
    );
  });

  it("should pass when rule name has at least one non-whitespace character", () => {
    expect(validateRule(ruleWith({ name: "a" }), registry)).toBeNull();
  });

  it("should pass when rule name has leading and trailing whitespace around content", () => {
    expect(
      validateRule(ruleWith({ name: "  My rule  " }), registry),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Actions array validation
// ---------------------------------------------------------------------------

describe("validateRule — actions array", () => {
  const registry = buildRegistry([APPEND_EXECUTOR]);

  it("should return an error when actions is an empty array", () => {
    expect(validateRule(ruleWith({ actions: [] }), registry)).toBe(
      "At least one action is required.",
    );
  });

  it("should not return the actions-array error when at least one action is present", () => {
    const result = validateRule(
      ruleWith({ actions: [validAction()] }),
      registry,
    );
    // Result may be null or a field-level error, but not the actions-count error
    expect(result).not.toBe("At least one action is required.");
  });
});

// ---------------------------------------------------------------------------
// Field-level validation — single action, one field
// ---------------------------------------------------------------------------

describe("validateRule — single action with one required field", () => {
  const registry = buildRegistry([APPEND_EXECUTOR]);

  it("should return a field error when the only required field is empty string", () => {
    expect(
      validateRule(
        ruleWith({ actions: [validAction({ text: "" })] }),
        registry,
      ),
    ).toBe("Text cannot be empty.");
  });

  it("should return a field error when the only required field is whitespace only", () => {
    expect(
      validateRule(
        ruleWith({ actions: [validAction({ text: "   " })] }),
        registry,
      ),
    ).toBe("Text cannot be empty.");
  });

  it("should return a field error when the field key is absent from params", () => {
    expect(
      validateRule(
        ruleWith({ actions: [{ type: "append-text", params: {} }] }),
        registry,
      ),
    ).toBe("Text cannot be empty.");
  });

  it("should pass when the required field has a non-blank value", () => {
    expect(
      validateRule(
        ruleWith({ actions: [validAction({ text: "folderer" })] }),
        registry,
      ),
    ).toBeNull();
  });

  it("should pass when the required field value is a single space surrounded by content", () => {
    expect(
      validateRule(
        ruleWith({ actions: [validAction({ text: "a b" })] }),
        registry,
      ),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Field-level validation — action with two required fields
// ---------------------------------------------------------------------------

describe("validateRule — action with two required fields", () => {
  const TWO_FIELD_EXECUTOR = mkExecutorTwoFields("two-field");
  const registry = buildRegistry([TWO_FIELD_EXECUTOR]);

  const action = (params: Record<string, string>): ActionData => ({
    type: "two-field",
    params,
  });

  it("should return an error for the first field when both fields are empty", () => {
    expect(
      validateRule(
        ruleWith({ actions: [action({ alpha: "", beta: "" })] }),
        registry,
      ),
    ).toBe("Alpha Label cannot be empty.");
  });

  it("should return an error for the second field when only the first field is filled", () => {
    expect(
      validateRule(
        ruleWith({ actions: [action({ alpha: "value", beta: "" })] }),
        registry,
      ),
    ).toBe("Beta Label cannot be empty.");
  });

  it("should return an error for the second field when only beta is absent from params", () => {
    expect(
      validateRule(
        ruleWith({ actions: [action({ alpha: "value" })] }),
        registry,
      ),
    ).toBe("Beta Label cannot be empty.");
  });

  it("should pass when all fields are filled", () => {
    expect(
      validateRule(
        ruleWith({ actions: [action({ alpha: "a", beta: "b" })] }),
        registry,
      ),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Field-level validation — multiple actions
// ---------------------------------------------------------------------------

describe("validateRule — multiple actions", () => {
  const APPEND = mkExecutorOneTextField("append-text");
  const NO_FIELD = mkExecutorNoFields("no-field");
  const registry = buildRegistry([APPEND, NO_FIELD]);

  it("should stop at the first failing action and report that field error", () => {
    const actions: ActionData[] = [
      { type: "append-text", params: { text: "" } }, // fails here
      { type: "append-text", params: { text: "ok" } },
    ];
    expect(validateRule(ruleWith({ actions }), registry)).toBe(
      "Text cannot be empty.",
    );
  });

  it("should catch a failing field in the second action when the first passes", () => {
    const actions: ActionData[] = [
      { type: "append-text", params: { text: "ok" } }, // passes
      { type: "append-text", params: { text: "" } }, // fails here
    ];
    expect(validateRule(ruleWith({ actions }), registry)).toBe(
      "Text cannot be empty.",
    );
  });

  it("should pass when every action has all required fields filled", () => {
    const actions: ActionData[] = [
      { type: "append-text", params: { text: "first" } },
      { type: "append-text", params: { text: "second" } },
    ];
    expect(validateRule(ruleWith({ actions }), registry)).toBeNull();
  });

  it("should skip field validation for an action whose handler has no fields", () => {
    const actions: ActionData[] = [
      { type: "no-field", params: {} }, // no fields to check
      { type: "append-text", params: { text: "hello" } },
    ];
    expect(validateRule(ruleWith({ actions }), registry)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Unknown action type (handler not registered)
// ---------------------------------------------------------------------------

describe("validateRule — unknown action type", () => {
  const registry = buildRegistry([APPEND_EXECUTOR]);

  it("should return an error when the action type has no registered handler", () => {
    const actions: ActionData[] = [{ type: "completely-unknown", params: {} }];
    expect(validateRule(ruleWith({ actions }), registry)).toBe(
      'Unknown action type "completely-unknown". Please remove or replace it.',
    );
  });
});

// ---------------------------------------------------------------------------
// Validation priority ordering
// ---------------------------------------------------------------------------

describe("validateRule — error priority ordering", () => {
  const registry = buildRegistry([APPEND_EXECUTOR]);

  it("should report name error before actions-array error", () => {
    expect(validateRule({ name: "", actions: [] }, registry)).toBe(
      "Rule name cannot be empty.",
    );
  });

  it("should report name error before field-level error", () => {
    expect(
      validateRule(
        { name: "", actions: [validAction({ text: "" })] },
        registry,
      ),
    ).toBe("Rule name cannot be empty.");
  });

  it("should report actions-array error before field-level error", () => {
    // With an empty actions array there are no fields to check anyway,
    // but the intent is to confirm the guard fires first.
    expect(validateRule({ name: "Valid name", actions: [] }, registry)).toBe(
      "At least one action is required.",
    );
  });

  it("should return null when all conditions are satisfied", () => {
    expect(
      validateRule(
        { name: "Valid rule", actions: [validAction({ text: "content" })] },
        registry,
      ),
    ).toBeNull();
  });
});
