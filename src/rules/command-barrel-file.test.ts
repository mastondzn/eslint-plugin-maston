import * as fs from 'node:fs';

import { RuleTester } from '@typescript-eslint/rule-tester';
import dedent from 'ts-dedent';
import { afterAll, describe, it, vi } from 'vitest';

import { commandBarrelFile } from './command-barrel-file';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

vi.mock('fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return {
        ...actual,
        readdirSync: vi.fn(),
    };
});

function mockDir(entries: { name: string; isFile: boolean; isDirectory: boolean }[]) {
    vi.mocked(fs.readdirSync).mockReturnValue(
        entries.map((e) =>
            Object.assign(new (fs.Dirent as any)(), {
                name: e.name,
                isFile: () => e.isFile,
                isDirectory: () => e.isDirectory,
                isBlockDevice: () => false,
                isCharacterDevice: () => false,
                isSymbolicLink: () => false,
                isFIFO: () => false,
                isSocket: () => false,
            }),
        ) as any,
    );
}

const tester = new RuleTester();

tester.run('enforce-barrel-exports', commandBarrelFile, {
    valid: [
        {
            // Not a barrel file — rule ignores it entirely
            name: 'no barrel comment → skip',
            filename: '/project/src/index.ts',
            code: `export * from './Button';`,
            before() {
                mockDir([{ name: 'Button.ts', isFile: true, isDirectory: false }]);
            },
        },
        {
            // All present — no error
            name: 'all files exported',
            filename: '/project/src/index.ts',
            code: dedent`
                // @barrel-file
                export * from './Button';
                export * from './Input';
            `,
            before() {
                mockDir([
                    { name: 'Button.ts', isFile: true, isDirectory: false },
                    { name: 'Input.ts', isFile: true, isDirectory: false },
                    { name: 'index.ts', isFile: true, isDirectory: false }, // self, ignored
                ]);
            },
        },
        {
            // Subdirectory exported
            name: 'subdir with export * from',
            filename: '/project/src/index.ts',
            code: dedent`
                // @barrel-file
                export * from './utils';
            `,
            before() {
                mockDir([{ name: 'utils', isFile: false, isDirectory: true }]);
            },
        },
        {
            name: 'test files get ignored',
            filename: '/project/src/index.ts',
            code: dedent`
                // @barrel-file
                export * from './Button';
            `,
            before() {
                mockDir([
                    { name: 'Button.ts', isFile: true, isDirectory: false },
                    { name: 'Button.test.ts', isFile: true, isDirectory: false },
                ]);
            },
        },
    ],

    invalid: [
        {
            name: 'missing one file export',
            filename: '/project/src/index.ts',
            code: dedent`
                // @barrel-file
                export * from './Button';
            `,
            before() {
                mockDir([
                    { name: 'Button.ts', isFile: true, isDirectory: false },
                    { name: 'Modal.ts', isFile: true, isDirectory: false },
                ]);
            },
            errors: [{ messageId: 'missingExport', data: { name: 'Modal' } }],
            // Verify the autofix appends the missing line
            output: dedent`
                // @barrel-file
                export * from './Button';
                export * from './Modal';
            `,
        },
        {
            name: 'missing subdir export',
            filename: '/project/src/index.ts',
            code: `// @barrel-file`,
            before() {
                mockDir([{ name: 'hooks', isFile: false, isDirectory: true }]);
            },
            errors: [{ messageId: 'missingExport', data: { name: 'hooks' } }],
            output: dedent`
                // @barrel-file
                export * from './hooks';
            `,
        },
        {
            name: 'empty barrel with multiple missing',
            filename: '/project/src/index.ts',
            code: `// @barrel-file`,
            before() {
                mockDir([
                    { name: 'Foo.ts', isFile: true, isDirectory: false },
                    { name: 'Bar.ts', isFile: true, isDirectory: false },
                ]);
            },
            errors: [{ messageId: 'missingExport', data: { name: 'Bar, Foo' } }],
            output: dedent`
                // @barrel-file
                export * from './Bar';
                export * from './Foo';
            `,
        },
    ],
});
