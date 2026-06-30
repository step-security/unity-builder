import { afterEach, beforeEach } from 'vitest';

const original = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  assert: console.assert,
};

const fail = (level: 'log' | 'warn' | 'error' | 'assert', args: unknown[]) => {
  throw new Error(
    `console.${level} was called with: ${args.map(String).join(' ')}\n` +
      `Tests must use vi.spyOn(console, '${level}') if console output is expected.`,
  );
};

beforeEach(() => {
  console.log = (...args: unknown[]) => fail('log', args);
  console.warn = (...args: unknown[]) => fail('warn', args);
  console.error = (...args: unknown[]) => fail('error', args);
  console.assert = ((...args: unknown[]) => fail('assert', args)) as typeof console.assert;
});

afterEach(() => {
  Object.assign(console, original);
});
