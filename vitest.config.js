import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            reporter: ['text-summary', 'json', 'json-summary'],
            reportOnFailure: true,
        },
        setupFiles: ['./src/tests/setup.ts'],
    },
});
