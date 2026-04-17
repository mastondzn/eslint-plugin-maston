import { fs, vol } from 'memfs';
import { afterEach, vi } from 'vitest';

vi.mock('node:fs', () => fs);
afterEach(() => vol.reset());
