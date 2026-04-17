import * as fs from 'node:fs';

import * as parser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

export const tester = new RuleTester({ languageOptions: { parser } });

export function mockDir(entries: { name: string; isFile: boolean; isDirectory: boolean }[]) {
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
