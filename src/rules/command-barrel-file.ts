import * as fs from 'node:fs';
import path from 'node:path';

import { type TSESTree, AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../utils';

export const commandBarrelFile = createRule({
    name: 'command-barrel-file',
    meta: {
        type: 'problem',
        docs: { description: 'Enforce all local files are exported in a @barrel-file' },
        fixable: 'code',
        schema: [],
        messages: {
            missingExport: "Barrel file is missing export for '{{name}}'",
        },
    },
    defaultOptions: [],
    create(context) {
        const sourceCode = context.sourceCode;
        const hasBarrelComment = context.sourceCode.getAllComments().some((c) => c.value.trim() === '@barrel-file');
        if (!hasBarrelComment) return {};

        const exportedPaths = new Set<string>();
        function recordExportSource(source: TSESTree.Literal | null | undefined) {
            if (source?.type === AST_NODE_TYPES.Literal && typeof source.value === 'string') {
                const raw = source.value.replace(/\.(?:ts|tsx)$/, '');
                exportedPaths.add(raw);
            }
        }

        return {
            ExportNamedDeclaration: (node) => recordExportSource(node.source),
            ExportAllDeclaration: (node) => recordExportSource(node.source),
            'Program:exit': (node) => {
                const dir = path.dirname(context.filename);
                const entries = fs.readdirSync(dir, { withFileTypes: true });

                const expected = entries
                    .filter((e) => {
                        if (e.isDirectory()) return true; // subdir → expect ./dir
                        if (!e.isFile()) return false;
                        const { name, ext } = path.parse(e.name);
                        if (!['.ts', '.tsx'].includes(ext)) return false;
                        if (name === 'index') return false; // skip the barrel itself
                        if (/(?:test|spec)\.(?:j|t)sx?$/.test(e.name)) return false; // skip test/spec files
                        return true;
                    })
                    .map((e) => (e.isDirectory() ? `./${e.name}` : `./${path.parse(e.name).name}`));

                const missing = expected.filter((e) => !exportedPaths.has(e)).toSorted();

                if (missing.length === 0) return;
                const displayNames = missing.map((m) => m.replace(/^\.\//, '')).toSorted();

                context.report({
                    node,
                    messageId: 'missingExport',
                    data: { name: displayNames.join(', ') },
                    fix(fixer) {
                        const lines = missing.map((m) => `export * from '${m}';`).join('\n');
                        const lastToken = sourceCode.getLastToken(node);
                        if (lastToken) {
                            return fixer.insertTextAfter(lastToken, `\n${lines}`);
                        }
                        const barrelComment = sourceCode
                            .getAllComments()
                            .find((c) => c.value.trim() === '@barrel-file');
                        if (barrelComment) {
                            return fixer.insertTextAfter(barrelComment, `\n${lines}`);
                        }
                        return fixer.insertTextAfterRange([0, 0], `${lines}\n`);
                    },
                });
            },
        };
    },
});
