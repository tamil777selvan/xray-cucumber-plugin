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
			lines: 96,
			functions: 91,
			statements: 96,
			branches: 91,
			reportsDirectory: 'reports/coverage'
		},
		singleThread: true
	}
});
