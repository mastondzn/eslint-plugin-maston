import * as parser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { fs, vol } from 'memfs';
import { dedent } from 'ts-dedent';
import { afterAll, afterEach, describe, it, vi } from 'vitest';

import { commandBarrelFile } from './command-barrel-file';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

vi.mock('node:fs', () => fs);
afterEach(() => vol.reset());

function mockDir(entries: { name: string; isFile: boolean; isDirectory: boolean }[]) {
    const root = '/project/src';
    fs.mkdirSync(root, { recursive: true });
    for (const e of entries) {
        const p = `${root}/${e.name}`;
        if (e.isDirectory) {
            fs.mkdirSync(p, { recursive: true });
        } else {
            fs.writeFileSync(p, '');
        }
    }
}

const tester = new RuleTester({ languageOptions: { parser } });

tester.run('command-barrel-file', commandBarrelFile, {
    valid: [
        {
            name: 'no barrel comment → skip',
            filename: '/project/src/index.ts',
            code: `export * from './Button';`,
            before() {
                mockDir([{ name: 'Button.ts', isFile: true, isDirectory: false }]);
            },
        },
        {
            name: 'all files exported',
            filename: '/project/src/index.ts',
            code: dedent /* ts */ `
                // @barrel-file
                export * from './Button';
                export * from './Input';
            `,
            before() {
                mockDir([
                    { name: 'Button.ts', isFile: true, isDirectory: false },
                    { name: 'Input.ts', isFile: true, isDirectory: false },
                    { name: 'index.ts', isFile: true, isDirectory: false },
                ]);
            },
        },
        {
            name: 'subdir with export * from',
            filename: '/project/src/index.ts',
            code: dedent /* ts */ `
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
            code: dedent /* ts */ `
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
        {
            name: 'named exports work',
            filename: '/project/src/index.ts',
            code: dedent /* ts */ `
                // @barrel-file
                export { Button } from './Button';
                export { Input } from './Input';
            `,
            before() {
                mockDir([
                    { name: 'Button.ts', isFile: true, isDirectory: false },
                    { name: 'Input.ts', isFile: true, isDirectory: false },
                ]);
            },
        },
        {
            name: 'mixed named and star exports',
            filename: '/project/src/index.ts',
            code: dedent /* ts */ `
                // @barrel-file
                export * from './Button';
                export { Input } from './Input';
            `,
            before() {
                mockDir([
                    { name: 'Button.ts', isFile: true, isDirectory: false },
                    { name: 'Input.ts', isFile: true, isDirectory: false },
                ]);
            },
        },
    ],

    invalid: [
        {
            name: 'missing one file export',
            filename: '/project/src/index.ts',
            code: dedent /* ts */ `
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
            output: dedent /* ts */ `
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
            output: dedent /* ts */ `
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
            output: dedent /* ts */ `
                // @barrel-file
                export * from './Bar';
                export * from './Foo';
            `,
        },
        {
            name: 'missing export with named export',
            filename: '/project/src/index.ts',
            code: dedent /* ts */ `
                // @barrel-file
                export { Button } from './Button';
            `,
            before() {
                mockDir([
                    { name: 'Button.ts', isFile: true, isDirectory: false },
                    { name: 'Modal.ts', isFile: true, isDirectory: false },
                ]);
            },
            errors: [{ messageId: 'missingExport', data: { name: 'Modal' } }],
            output: dedent /* ts */ `
                // @barrel-file
                export { Button } from './Button';
                export * from './Modal';
            `,
        },
    ],
});
