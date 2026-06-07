import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Arrow functions defined after useEffect is a common React pattern
      "@typescript-eslint/no-use-before-define": ["error", { functions: false, classes: false, variables: true }],
      "no-use-before-define": "off",
      // Setting state synchronously in effects is fine for loading states
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
