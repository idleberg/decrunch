import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from './log.ts';

vi.mock('./log.ts', () => ({
	logger: {
		log: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock('./utils.ts', () => ({
	getVersion: vi.fn().mockResolvedValue('1.0.0'),
}));

describe('handleCli', () => {
	const originalArgv = process.argv;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		process.argv = ['node', 'decrunch'];
	});

	afterEach(() => {
		process.argv = originalArgv;
		vi.restoreAllMocks();
	});

	it('should parse command and arguments', async () => {
		process.argv = ['node', 'decrunch', 'npm', 'run', 'build'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.command).toBe('npm');
		expect(result.args).toEqual(['run', 'build']);
	});

	it('should parse border option', async () => {
		process.argv = ['node', 'decrunch', '--border', '5', 'echo', 'hello'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.options.border).toBe('5');
		expect(result.command).toBe('echo');
		expect(result.args).toEqual(['hello']);
	});

	it('should parse fps option', async () => {
		process.argv = ['node', 'decrunch', '--fps', '60', 'npm', 'test'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.options.fps).toBe('60');
		expect(result.command).toBe('npm');
		expect(result.args).toEqual(['test']);
	});

	it('should parse both border and fps options', async () => {
		process.argv = ['node', 'decrunch', '--border', '3', '--fps', '30', 'node', 'script.js'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.options.border).toBe('3');
		expect(result.options.fps).toBe('30');
		expect(result.command).toBe('node');
		expect(result.args).toEqual(['script.js']);
	});

	it('should handle command without arguments', async () => {
		process.argv = ['node', 'decrunch', 'node'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.command).toBe('node');
		expect(result.args).toEqual([]);
	});

	it('should allow unknown options to be passed through', async () => {
		process.argv = ['node', 'decrunch', 'echo', '--unknown-flag', 'value'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.command).toBe('echo');
		expect(result.args).toContain('--unknown-flag');
		expect(result.args).toContain('value');
	});

	it('should use logger.log for help output', async () => {
		process.argv = ['node', 'decrunch', '--help'];
		const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

		const { handleCli } = await import('./cli.ts');

		try {
			await handleCli();
		} catch {
			// Commander calls process.exit after --help
		}

		expect(logger.log).toHaveBeenCalled();
		expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
		exitSpy.mockRestore();
	});

	it('should use logger.error for error messages', async () => {
		process.argv = ['node', 'decrunch']; // Missing required command
		const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

		const { handleCli } = await import('./cli.ts');

		try {
			await handleCli();
		} catch {
			// Commander calls process.exit on error
		}

		expect(logger.error).toHaveBeenCalled();
		exitSpy.mockRestore();
	});
});
