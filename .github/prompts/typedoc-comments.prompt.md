---
description: "Add consistent TypeDoc comments to a TypeScript file. Use when documenting functions, classes, interfaces, types, enums, or any TypeScript symbol."
argument-hint: "path/to/file.ts (optional, defaults to active file)"
agent: "agent"
---

Add TypeDoc-compatible JSDoc comments to the following file: `$ARGUMENTS`

If no file is specified, document the currently active file in the editor.

## File-Level Comment

Add a module-level doc comment at the very top of the file (before imports) using the `@module` tag. TypeDoc renders this as the description for the module's page in the generated documentation.

```ts
/**
 * [One or two sentences describing what this file contains and why it exists.
 *  Mention the domain area it belongs to — e.g. MQTT communication, calorie calculation, auth.]
 *
 * @module
 */
```

- Keep it brief — this is an overview, not a full explanation of every export.
- If the file imports `server-only`, note that here too (e.g. "Server-only module. Must not be imported from client components.").
- Use `@packageDocumentation` instead of `@module` only for the main package entry point (e.g. `src/index.ts`).

## What to Document

Comment **every** symbol in the file, including:

- Exported and non-exported functions (including private helper functions)
- Async functions and arrow functions assigned to `const`
- Classes — including all methods (public and private)
- Interfaces — including every property
- Type aliases (explain what the type represents in domain terms)
- Enums — including every member
- Module-level exported constants

## Tag Order

Use this structure, including only the tags that apply:

```ts
/**
 * [One or two descriptive sentences: what does this do, and why does it exist?
 *  Mention domain context where relevant — e.g. ACSM formulas, MQTT topics, ADC mapping.]
 *
 * @remarks [Non-obvious behaviour, edge cases, limitations, or domain knowledge needed
 *   to reason correctly about this code. Omit if the description is sufficient.
 *   Always include if the file imports 'server-only'.]
 *
 * @param name - [What this value represents, valid range, constraints, or defaults.]
 *
 * @returns [What the return value represents. For Promises, describe the resolved value.]
 *
 * @throws {ErrorType} [Conditions that cause this to throw. Only include if applicable.]
 *
 * @example
 * // Include only when usage is non-obvious or parameters/return shape benefit from illustration.
 * // Show a realistic input and what the output looks like.
 * const result = exampleFunction(input);
 * // result => { value: 42, unit: 'kg' }
 */
```

## Writing Style

- Write **full descriptive sentences** in the present tense ("Calculates…", "Returns…", "Sends…").
- The first sentence should explain *what it does and why it matters* — not just restate the name.
- Mention meaningful domain context briefly (hardware constants, formulas, protocol details).
- Do **not** repeat type information from the signature in `@param` or `@returns` — TypeDoc reads types from TypeScript. Describe what the value *means*, not its type.

## Rules

1. **Rewrite all comments for consistency** — existing comments should be rewritten to match the style and tag structure defined in this prompt, even if they are accurate. Consistency across the codebase takes priority over preserving original wording.
2. **Skip `@example`** for trivially named functions where usage is self-evident (e.g. `getUser(id)`).
3. **Interface and type properties** — add an inline `/** ... */` doc comment above each property.
4. **Enum members** — add an inline `/** ... */` doc comment above each member.
5. **Dependency bag types** (e.g. `type FooDependencies = { ... }`) — document each field explaining what it does and why it is injectable/mockable.
6. **`server-only` imports** — note in `@remarks` that the function runs on the server only and must not be called from client components.
7. Write comments that help both **human developers** and **AI agents** reason correctly about the code — prefer explaining *intent* over *mechanics*.

## Reference

[calorieCalculator.ts](../../src/lib/calorieCalculator.ts) is a well-commented example already in this codebase. Use it as a quality benchmark.

## Output

Rewrite the full file with all comments added in-place. Do not summarise or explain the changes.
