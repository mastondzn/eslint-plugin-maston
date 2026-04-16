import { ESLintUtils } from '@typescript-eslint/utils';

export const createRule = ESLintUtils.RuleCreator(
    (name) => `https://github.com/mastondzn/eslint-plugin-maston/tree/main/src/rules/${name}.md`,
);
