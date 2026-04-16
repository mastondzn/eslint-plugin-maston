import { maston } from '@mastondzn/eslint';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);
const plugin = await jiti.import('./src', { default: true });

// if you wish to see what this config adds
// you can run `pnpm eslint --inspect-config`
export default maston(
    {
        typescript: {
            projectService: true,
            tsconfigRootDir: import.meta.dirname,
        },
    },
    {
        rules: {
            'ts/no-non-null-assertion': 'warn',
            'unicorn/template-indent': ['warn', { indent: 4 }],
        },
    },
    {
        plugins: {
            maston: plugin,
        },
        rules: {
            'maston/command-barrel-file': 'warn',
        },
    },
);
