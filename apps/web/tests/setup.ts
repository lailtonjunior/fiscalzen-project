import { vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        href: '',
        assign: vi.fn(),
        replace: vi.fn(),
    },
    writable: true,
});

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
});
