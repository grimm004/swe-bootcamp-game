import globals from "globals";
import pluginJs from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";


/** @type {import('eslint').Linter.Config[]} */
export default [
    {ignores: ["public/lib/"]},
    {files: ["**/*.js"], languageOptions: {sourceType: "module"}},
    {languageOptions: {globals: globals.browser}},
    pluginJs.configs.recommended,
    {plugins: stylistic},
];