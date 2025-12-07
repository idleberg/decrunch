import logSymbols from 'log-symbols';

const { error, info, success, warning: warn } = logSymbols;

/**
 * Styles logging messages with colored prefixes.
 * @internal
 */
export const logger = {
	debug: (...args: unknown[]) => console.debug(...args),
	error: (...args: unknown[]) => console.error(error, ...args),
	info: (...args: unknown[]) => console.info(info, ...args),
	warn: (...args: unknown[]) => console.warn(warn, ...args),
	log: (...args: unknown[]) => console.log(...args),
	success: (...args: unknown[]) => console.log(success, ...args),
};
