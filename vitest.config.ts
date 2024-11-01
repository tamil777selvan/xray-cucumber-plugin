import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        dangerouslyIgnoreUnhandledErrors: true,
        include: ['tests/**/*.test.ts'],
        /**
         * not to ESM ported packages
         */
        exclude: ['dist', '.idea', '.git', '.cache', '**/node_modules/**'],
        coverage: {
            enabled: true,
            provider: 'v8',
            exclude: ['**/*.test.ts'],
            all: false,
            thresholds: {
                lines: 96.29,
                functions: 97.22,
                statements: 96.29,
                branches: 90.14
            },
            reportsDirectory: 'reports/coverage'
        },
        poolOptions: {
            threads: {
                singleThread: true
            }
        }
    }
});
