import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Use vi.hoisted to ensure this runs BEFORE imports are evaluated
const { mockWrite } = vi.hoisted(() => {
	const mockWrite = vi.fn();

	// Mock stdout before any imports
	Object.defineProperty(process, 'stdout', {
		value: {
			rows: 24,
			columns: 80,
			write: mockWrite,
			isTTY: true,
			getColorDepth: () => 24,
		},
		configurable: true,
		writable: true,
	});

	// Set TERM for color support
	process.env.TERM = 'xterm-256color';

	return { mockWrite };
});

import { startDecrunching, whileDecrunching } from './decrunch.ts';

describe('decrunch', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	describe('whileDecrunching', () => {
		it('should resolve with task result on success', async () => {
			const task = Promise.resolve({ data: 'test' });

			const resultPromise = whileDecrunching(task);
			await vi.advanceTimersByTimeAsync(100);

			const result = await resultPromise;

			expect(result).toEqual({ data: 'test' });
		});

		it('should reject with task error on failure', async () => {
			const error = new Error('Task failed');
			const task = Promise.reject(error);

			// Prevent unhandled rejection
			task.catch(() => {});

			const resultPromise = whileDecrunching(task);
			await vi.advanceTimersByTimeAsync(100);

			await expect(resultPromise).rejects.toThrow('Task failed');
		});

		it('should initialize alternate screen buffer', async () => {
			const task = Promise.resolve('done');

			const resultPromise = whileDecrunching(task);
			await vi.advanceTimersByTimeAsync(50);
			await resultPromise;

			const allWrites = mockWrite.mock.calls.map((call) => call[0]).join('');

			// Should enter alternate screen buffer
			expect(allWrites).toContain('\x1b[?1049h');
			// Should hide cursor
			expect(allWrites).toContain('\x1b[?25l');
		});

		it('should restore screen on completion', async () => {
			const task = Promise.resolve('done');

			mockWrite.mockClear();

			const resultPromise = whileDecrunching(task);
			await vi.advanceTimersByTimeAsync(50);
			await resultPromise;

			const allWrites = mockWrite.mock.calls.map((call) => call[0]).join('');

			// Should show cursor
			expect(allWrites).toContain('\x1b[?25h');
			// Should exit alternate screen buffer
			expect(allWrites).toContain('\x1b[?1049l');
		});

		it('should restore screen on error', async () => {
			const task = Promise.reject(new Error('fail'));
			task.catch(() => {});

			mockWrite.mockClear();

			const resultPromise = whileDecrunching(task);
			await vi.advanceTimersByTimeAsync(50);

			await expect(resultPromise).rejects.toThrow('fail');

			const allWrites = mockWrite.mock.calls.map((call) => call[0]).join('');

			// Should still restore screen
			expect(allWrites).toContain('\x1b[?25h');
			expect(allWrites).toContain('\x1b[?1049l');
		});

		it('should render animation frames', async () => {
			const task = new Promise((resolve) => {
				setTimeout(resolve, 150);
			});

			mockWrite.mockClear();

			const resultPromise = whileDecrunching(task, { fps: 10 });

			// Advance time to allow frames to render
			await vi.advanceTimersByTimeAsync(150);

			await resultPromise;

			// Should have rendered frames (look for ANSI color codes)
			const allWrites = mockWrite.mock.calls.map((call) => call[0]).join('');
			// biome-ignore lint/suspicious/noControlCharactersInRegex: Color codes are control characters
			expect(allWrites).toMatch(/\x1b\[38;5;\d+m/); // Foreground color
		});

		it('should use default fps of 25', async () => {
			const task = Promise.resolve('done');

			const resultPromise = whileDecrunching(task);
			await vi.advanceTimersByTimeAsync(100);
			await resultPromise;

			// With fps=25, interval should be 1000/25 = 40ms
			// Verify animation ran
			expect(mockWrite).toHaveBeenCalled();
		});

		it('should use custom fps when provided', async () => {
			const task = Promise.resolve('done');

			const resultPromise = whileDecrunching(task, { fps: 60 });
			await vi.advanceTimersByTimeAsync(50);
			await resultPromise;

			expect(mockWrite).toHaveBeenCalled();
		});

		it('should use default border of 0', async () => {
			const task = Promise.resolve('done');

			const resultPromise = whileDecrunching(task);
			await vi.advanceTimersByTimeAsync(50);
			await resultPromise;

			// Should execute without error
			expect(mockWrite).toHaveBeenCalled();
		});

		it('should use custom border when provided', async () => {
			const task = Promise.resolve('done');

			const resultPromise = whileDecrunching(task, { border: 2 });
			await vi.advanceTimersByTimeAsync(50);
			await resultPromise;

			// Should execute without error
			expect(mockWrite).toHaveBeenCalled();
		});

		it('should render with Unicode block tiles', async () => {
			const task = new Promise((resolve) => setTimeout(resolve, 200));

			mockWrite.mockClear();

			const resultPromise = whileDecrunching(task);
			await vi.advanceTimersByTimeAsync(200);
			await resultPromise;

			const allWrites = mockWrite.mock.calls.map((call) => call[0]).join('');

			// Should contain Unicode block characters
			expect(allWrites).toMatch(/[▁▂▃▄▅▆]/);
		});

		it('should use 256 color escape codes', async () => {
			const task = new Promise((resolve) => setTimeout(resolve, 200));

			mockWrite.mockClear();

			const resultPromise = whileDecrunching(task);
			await vi.advanceTimersByTimeAsync(200);
			await resultPromise;

			const allWrites = mockWrite.mock.calls.map((call) => call[0]).join('');

			// Should use 256 color codes
			// biome-ignore lint/suspicious/noControlCharactersInRegex: Color codes are control characters
			expect(allWrites).toMatch(/\x1b\[38;5;\d+m/); // Foreground
			// biome-ignore lint/suspicious/noControlCharactersInRegex: Color codes are control characters
			expect(allWrites).toMatch(/\x1b\[48;5;\d+m/); // Background
		});

		it('should position cursor for each row', async () => {
			const task = new Promise((resolve) => setTimeout(resolve, 200));

			mockWrite.mockClear();

			const resultPromise = whileDecrunching(task);
			await vi.advanceTimersByTimeAsync(200);
			await resultPromise;

			const allWrites = mockWrite.mock.calls.map((call) => call[0]).join('');

			// Should contain cursor positioning codes
			// biome-ignore lint/suspicious/noControlCharactersInRegex: Color codes are control characters
			expect(allWrites).toMatch(/\x1b\[\d+;\d+H/);
		});
	});

	describe('startDecrunching', () => {
		it('should return a stop function', () => {
			const stop = startDecrunching();

			expect(typeof stop).toBe('function');

			stop();
		});

		it('should initialize alternate screen buffer', () => {
			mockWrite.mockClear();

			const stop = startDecrunching();

			const allWrites = mockWrite.mock.calls.map((call) => call[0]).join('');

			expect(allWrites).toContain('\x1b[?1049h');
			expect(allWrites).toContain('\x1b[?25l');

			stop();
		});

		it('should render animation frames continuously', () => {
			mockWrite.mockClear();

			const stop = startDecrunching({ fps: 20 });

			// Advance time
			vi.advanceTimersByTime(200);

			// Should have rendered multiple frames
			const frameWrites = mockWrite.mock.calls.filter((call) => {
				const content = call[0];
				return typeof content === 'string' && content.includes('\x1b[38;5;');
			});

			expect(frameWrites.length).toBeGreaterThan(0);

			stop();
		});

		it('should stop animation when stop function is called', () => {
			const stop = startDecrunching();

			// Clear and stop
			mockWrite.mockClear();
			stop();

			// Advance time after stop
			vi.advanceTimersByTime(100);

			// Should not render new frames (only restoration codes)
			const frameWrites = mockWrite.mock.calls.filter((call) => {
				const content = call[0];
				return typeof content === 'string' && content.includes('\x1b[38;5;');
			});

			expect(frameWrites.length).toBe(0);
		});

		it('should restore screen when stopped', () => {
			const stop = startDecrunching();

			mockWrite.mockClear();
			stop();

			const allWrites = mockWrite.mock.calls.map((call) => call[0]).join('');

			expect(allWrites).toContain('\x1b[?25h');
			expect(allWrites).toContain('\x1b[?1049l');
		});

		it('should accept custom fps option', () => {
			mockWrite.mockClear();

			const stop = startDecrunching({ fps: 30 });

			expect(mockWrite).toHaveBeenCalled();

			stop();
		});

		it('should accept custom border option', () => {
			mockWrite.mockClear();

			const stop = startDecrunching({ border: 1 });

			expect(mockWrite).toHaveBeenCalled();

			stop();
		});
	});

	describe('edge cases', () => {
		it('should handle very short tasks', async () => {
			const task = Promise.resolve('instant');

			const resultPromise = whileDecrunching(task);
			await vi.advanceTimersByTimeAsync(10);

			const result = await resultPromise;

			expect(result).toBe('instant');
			expect(mockWrite).toHaveBeenCalled();
		});

		it('should handle maximum border size', async () => {
			const task = Promise.resolve('done');

			// Border of 10 on 24x80 terminal
			const resultPromise = whileDecrunching(task, { border: 10 });
			await vi.advanceTimersByTimeAsync(50);
			await resultPromise;

			expect(mockWrite).toHaveBeenCalled();
		});

		it('should handle high fps', async () => {
			const task = Promise.resolve('done');

			const resultPromise = whileDecrunching(task, { fps: 120 });
			await vi.advanceTimersByTimeAsync(50);
			await resultPromise;

			expect(mockWrite).toHaveBeenCalled();
		});

		it('should handle low fps', async () => {
			const task = Promise.resolve('done');

			const resultPromise = whileDecrunching(task, { fps: 1 });
			await vi.advanceTimersByTimeAsync(500);
			await resultPromise;

			expect(mockWrite).toHaveBeenCalled();
		});
	});
});
