import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'client/',
        'drizzle/',
      ],
      lines: 70,
      functions: 70,
      branches: 65,
      statements: 70,
      all: true,
      skipFull: false,
    },
  },
});
