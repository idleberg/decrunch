import { spawn } from 'node:child_process';
import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from './log.ts';
import { getVersion, spawnProcess } from './utils.ts';

vi.mock('node:child_process');
vi.mock('./log.ts', () => ({
	logger: {
		log: vi.fn(),
		info: vi.fn(),
		debug: vi.fn(),
		error: vi.fn(),
	},
}));

describe('getVersion', () => {
	it('should return version from package.json', async () => {
		const version = await getVersion();

		expect(version).toMatch(/^\d+\.\d+\.\d+/);
	});
});

describe('spawnProcess', () => {
	let mockChild: any;
	let exitHandler: any;
	let errorHandler: any;
	let signalHandlers: Map<string, () => void>;

	beforeEach(() => {
		vi.resetAllMocks();

		// Create a mock child process
		mockChild = {
			on: vi.fn((event: string, handler: any) => {
				if (event === 'exit') {
					exitHandler = handler;
				} else if (event === 'error') {
					errorHandler = handler;
				}
			}),
			kill: vi.fn(),
		};

		vi.mocked(spawn).mockReturnValue(mockChild as any);

		// Mock process.on to capture signal handlers
		signalHandlers = new Map();
		const originalProcessOn = process.on;
		process.on = vi.fn((signal: any, handler: any) => {
			signalHandlers.set(signal, handler);
			return process;
		}) as any;

		process.off = vi.fn() as any;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should spawn process with correct arguments', () => {
		spawnProcess('echo', ['hello']);

		expect(spawn).toHaveBeenCalledWith('echo', ['hello'], { stdio: 'inherit' });
	});

	it('should not spawn process in dry-run mode', async () => {
		const promise = spawnProcess('echo', ['hello'], { dryRun: true });

		expect(spawn).not.toHaveBeenCalled();
		expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('echo hello'));

		const result = await promise;
		expect(result).toEqual({ exitCode: 0, stdout: '', stderr: '' });
	});

	it('should log command in dry-run mode', async () => {
		await spawnProcess('echo', ['hello', 'world'], { dryRun: true });

		expect(logger.info).toHaveBeenCalledWith('Dry run, not executing "echo hello world"');
	});

	it('should log exit code in debug mode', async () => {
		const promise = spawnProcess('echo', [], { debug: true });

		// Simulate process exit
		exitHandler(0, null);

		await promise;

		expect(logger.debug).toHaveBeenCalledWith('Exit code', 0);
	});

	it('should setup exit handler for child process', () => {
		spawnProcess('echo', []);

		expect(mockChild.on).toHaveBeenCalledWith('exit', expect.any(Function));
	});

	it('should setup error handler for child process', () => {
		spawnProcess('echo', []);

		expect(mockChild.on).toHaveBeenCalledWith('error', expect.any(Function));
	});

	it('should forward signals to child process', () => {
		spawnProcess('echo', []);

		expect(signalHandlers.has('SIGINT')).toBe(true);
		expect(signalHandlers.has('SIGTERM')).toBe(true);
		expect(signalHandlers.has('SIGHUP')).toBe(true);

		// Test that signal handler kills child
		const sigintHandler = signalHandlers.get('SIGINT');
		if (sigintHandler) {
			sigintHandler();
			expect(mockChild.kill).toHaveBeenCalledWith('SIGINT');
		}
	});

	it('should handle child process exit with code', async () => {
		const promise = spawnProcess('echo', []);

		// Simulate process exit with code 0
		exitHandler(0, null);

		const result = await promise;
		expect(result.exitCode).toBe(0);
		expect(result.stdout).toBe('');
		expect(result.stderr).toBe('');
	});

	it('should handle child process exit with non-zero code', async () => {
		const promise = spawnProcess('echo', []);

		// Simulate process exit with code 1
		exitHandler(1, null);

		const result = await promise;
		expect(result.exitCode).toBe(1);
	});

	it('should handle child process exit with signal', async () => {
		const promise = spawnProcess('echo', []);

		// Simulate process exit with signal
		exitHandler(null, 'SIGTERM');

		const result = await promise;

		expect(logger.info).toHaveBeenCalledWith('Process terminated with SIGTERM');
		expect(result.exitCode).toBe(130);
	});

	it('should handle child process error', async () => {
		const promise = spawnProcess('echo', []);

		// Simulate process error
		const testError = new Error('Test error');
		errorHandler(testError);

		await expect(promise).rejects.toThrow('Test error');
		expect(logger.error).toHaveBeenCalledWith('Test error');
	});

	it('should handle command without arguments', () => {
		spawnProcess('node', []);

		expect(spawn).toHaveBeenCalledWith('node', [], { stdio: 'inherit' });
	});

	it('should handle command with dry-run and no arguments', async () => {
		const result = await spawnProcess('node', [], { dryRun: true });

		expect(logger.info).toHaveBeenCalledWith('Dry run, not executing "node"');
		expect(result.exitCode).toBe(0);
	});
});
