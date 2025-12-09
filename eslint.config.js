// Basic ESLint config for GroveMonitor
// TypeScript linting will be handled by TypeScript compiler (tsc)
// This is a minimal config for scaffolding phase

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".svelte-kit/**",
      ".wrangler/**",
      "**/*.js.map",
      "**/*.ts", // Skip TS files - use tsc for type checking
      "**/*.tsx",
    ],
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off", // Allow console in Workers
    },
  },
];
