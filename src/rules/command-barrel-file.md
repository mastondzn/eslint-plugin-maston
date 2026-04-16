# command-barrel-file

Enforces that all local files are exported in a barrel file marked with `// @barrel-file`.

## Rule Details

When a file contains the `// @barrel-file` comment, this rule ensures that all TypeScript files in the same directory are exported from the barrel file. This helps maintain complete barrel files that don't accidentally omit exports.

The rule:

- Exports all `.ts` and `.tsx` files (excluding `index.ts`)
- Exports all subdirectories
- Ignores test files (`*.test.ts`, `*.spec.ts`)
- Supports both `export * from './file'` and `export { Named } from './file'` syntax

## Examples

### Invalid

```tree
src/
├── index.ts          // @barrel-file
├── Button.ts
└── Modal.ts          ❌ Missing export
```

```ts
// @barrel-file
export * from './Button';
// Missing: Modal.ts
```

### Valid

```tree
src/
├── index.ts          // @barrel-file
├── Button.ts
├── Input.ts
└── utils/
```

```ts
// @barrel-file
export * from './Button';
export * from './Input';
export * from './utils'; // subdirectory
```

<!--  -->

```tree
src/
├── index.ts          // @barrel-file
├── Button.ts
└── Input.ts
```

```ts
// @barrel-file
export { Button } from './Button';
export { Input } from './Input';
```

```tree
src/
├── index.ts          // @barrel-file
├── Button.ts
└── Input.ts
```

```ts
// @barrel-file
export * from './Button';
export { Input } from './Input';
```

## Fix

The rule automatically adds star exports for the missing files.
