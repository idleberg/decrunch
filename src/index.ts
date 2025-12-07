#! /usr/bin/env node

import { handleCli } from './cli.ts';
import { whileDecrunching } from './decrunch.ts';
import { logger } from './log.ts';
import { spawnProcess } from './utils.ts';

async function main() {
	const { command, args, options } = await handleCli();

	try {
		const result = await whileDecrunching(spawnProcess(command as string, args), {
			border: options.border ? Number.parseInt(options.border, 10) : 0,
			fps: options.fps ? Number.parseInt(options.fps, 10) : 25,
		});

		setImmediate(() => process.exit(result.exitCode));
	} catch (error) {
		logger.error('Error:', error);
		setImmediate(() => process.exit(1));
	}
}

await main();
