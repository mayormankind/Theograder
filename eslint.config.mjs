import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;

// import { defineConfig, globalIgnores } from "eslint/config";
// import nextVitals from "eslint-config-next/core-web-vitals";
// import nextTs from "eslint-config-next/typescript";

// const eslintConfig = defineConfig([
//   ...nextVitals,
//   ...nextTs,

  // {
  //   rules: {
  //     "@typescript-eslint/no-explicit-any": "off",
  //     "react/no-unescaped-entities": "off",
  //   },
  // },

//   globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
// ]);

// export default eslintConfig;
