import { Command } from 'commander';
import { logger } from './log.ts';
import { getVersion } from './utils.ts';

/**
 * Handles parsing of CLI arguments.
 * @internal
 */
export async function handleCli() {
	const program = new Command('loadenv');

	program
		.version(await getVersion())
		.configureOutput({
			writeOut: (message: string) => logger.log(message),
			writeErr: (message: string) => logger.error(message),
		})
		.arguments('<command> [args...]')
		.option('--border <characters>', 'border width in characters')
		.option('--fps <number>', 'frames per second for the loading animation')

		// This is required to pass on unknown options to the spawned process.
		.allowUnknownOption(true);

	program.parse();

	const [command, ...args] = program.args;
	const options = program.opts();

	return {
		command,
		args,
		options,
	};
}
