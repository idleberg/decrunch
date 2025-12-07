import { spawn } from 'node:child_process';
import process from 'node:process';
import type { OptionValues } from 'commander';
import { logger } from './log.ts';

/**
 * Loads version from package manifest.
 * @internal
 */
export async function getVersion(): Promise<string> {
	const module = await import('../package.json', {
		with: { type: 'json' },
	});

	return module.default.version ?? 'development';
}

export interface ProcessResult {
	exitCode: number;
	stdout: string;
	stderr: string;
}

/**
 * Spawns a process with environment variables loaded by `loadEnv`.
 * @internal
 */
export function spawnProcess(command: string, args: string[] = [], options: OptionValues = {}): Promise<ProcessResult> {
	return new Promise((resolve, reject) => {
		if (options.dryRun) {
			const fullCommand = args.length ? `${command} ${args.join(' ')}` : command;
			logger.info(`Dry run, not executing "${fullCommand}"`);
			resolve({ exitCode: 0, stdout: '', stderr: '' });
			return;
		}

		// Buffer output with a reasonable limit (10MB) to prevent memory issues
		const MAX_BUFFER_SIZE = 10 * 1024 * 1024; // 10MB
		const stdoutChunks: Buffer[] = [];
		const stderrChunks: Buffer[] = [];
		let stdoutSize = 0;
		let stderrSize = 0;
		let stdoutTruncated = false;
		let stderrTruncated = false;

		const child = spawn(command, args, { stdio: 'pipe' });

		// Capture output with size limit
		child.stdout?.on('data', (data: Buffer) => {
			if (stdoutSize + data.length <= MAX_BUFFER_SIZE) {
				stdoutChunks.push(data);
				stdoutSize += data.length;
			} else if (!stdoutTruncated) {
				stdoutTruncated = true;
				const truncMsg = Buffer.from('\n[... output truncated due to size limit ...]\n');
				stdoutChunks.push(truncMsg);
				stdoutSize += truncMsg.length;
			}
		});

		child.stderr?.on('data', (data: Buffer) => {
			if (stderrSize + data.length <= MAX_BUFFER_SIZE) {
				stderrChunks.push(data);
				stderrSize += data.length;
			} else if (!stderrTruncated) {
				stderrTruncated = true;
				const truncMsg = Buffer.from('\n[... output truncated due to size limit ...]\n');
				stderrChunks.push(truncMsg);
				stderrSize += truncMsg.length;
			}
		});

		// Store signal handlers so we can remove them later
		const signalHandlers = new Map<NodeJS.Signals, () => void>();

		const cleanup = () => {
			// Remove all signal handlers
			for (const [sig, h] of signalHandlers) {
				process.off(sig, h);
			}
		};

		child.on('exit', (exitCode, signal: NodeJS.Signals) => {
			cleanup();

			// Convert buffered chunks to strings
			const stdoutResult = stdoutChunks.length > 0 ? Buffer.concat(stdoutChunks).toString('utf-8') : '';
			const stderrResult = stderrChunks.length > 0 ? Buffer.concat(stderrChunks).toString('utf-8') : '';

			if (typeof exitCode === 'number') {
				if (options.debug) {
					logger.debug('Exit code', exitCode);
				}

				resolve({ exitCode, stdout: stdoutResult, stderr: stderrResult });
				return;
			}

			logger.info(`Process terminated with ${signal}`);
			resolve({ exitCode: 130, stdout: stdoutResult, stderr: stderrResult }); // 130 is conventional for SIGINT
		});

		child.on('error', (error) => {
			cleanup();
			logger.error(error.message);
			reject(error);
		});

		// Forward termination signals to child process
		// Only handle signals that should terminate the process
		for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as NodeJS.Signals[]) {
			const handler = () => {
				// Kill child and let the exit handler resolve the promise
				child.kill(signal);
			};
			signalHandlers.set(signal, handler);
			process.on(signal, handler);
		}
	});
}
