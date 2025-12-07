import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from './log.ts';

describe('logger', () => {
	beforeEach(() => {
		console.debug = vi.fn();
		console.error = vi.fn();
		console.info = vi.fn();
		console.log = vi.fn();
		console.warn = vi.fn();
	});

	const testMessages = [
		{ description: 'string', value: 'test message' },
		{ description: 'number', value: 42 },
		{ description: 'boolean', value: true },
		{ description: 'object', value: { key: 'value' } },
		{ description: 'array', value: [1, 2, 3] },
		{ description: 'undefined', value: undefined },
		{ description: 'null', value: null },
		{ description: 'Error', value: new Error('test error') },
	];

	describe('debug', () => {
		it.each(testMessages)('should handle $description messages', ({ value }) => {
			logger.debug(value);

			expect(console.debug).toHaveBeenCalledTimes(1);
			expect(console.debug).toHaveBeenCalledWith(value);
		});
	});

	describe('error', () => {
		it.each(testMessages)('should handle $description messages with symbol', ({ value }) => {
			logger.error(value);

			expect(console.error).toHaveBeenCalledTimes(1);
			expect(console.error).toHaveBeenCalledWith(expect.any(String), value);
		});
	});

	describe('info', () => {
		it.each(testMessages)('should handle $description messages with symbol', ({ value }) => {
			logger.info(value);

			expect(console.info).toHaveBeenCalledTimes(1);
			expect(console.info).toHaveBeenCalledWith(expect.any(String), value);
		});
	});

	describe('warn', () => {
		it.each(testMessages)('should handle $description messages with symbol', ({ value }) => {
			logger.warn(value);

			expect(console.warn).toHaveBeenCalledTimes(1);
			expect(console.warn).toHaveBeenCalledWith(expect.any(String), value);
		});
	});

	describe('success', () => {
		it.each(testMessages)('should handle $description messages with symbol', ({ value }) => {
			logger.success(value);

			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith(expect.any(String), value);
		});
	});

	describe('log', () => {
		it.each(testMessages)('should handle $description messages without prefix', ({ value }) => {
			logger.log(value);

			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith(value);

			const callArgs = vi.mocked(console.log).mock.calls[0];
			expect(callArgs).toHaveLength(1);
		});
	});

	describe('multiple arguments', () => {
		it('should pass multiple arguments to debug', () => {
			logger.debug('arg1', 'arg2', 'arg3');

			expect(console.debug).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
		});

		it('should pass symbol and multiple arguments to error', () => {
			logger.error('arg1', 'arg2');

			expect(console.error).toHaveBeenCalledWith(expect.any(String), 'arg1', 'arg2');
		});

		it('should pass symbol and multiple arguments to info', () => {
			logger.info('arg1', 'arg2');

			expect(console.info).toHaveBeenCalledWith(expect.any(String), 'arg1', 'arg2');
		});

		it('should pass symbol and multiple arguments to warn', () => {
			logger.warn('arg1', 'arg2');

			expect(console.warn).toHaveBeenCalledWith(expect.any(String), 'arg1', 'arg2');
		});

		it('should pass symbol and multiple arguments to success', () => {
			logger.success('arg1', 'arg2');

			expect(console.log).toHaveBeenCalledWith(expect.any(String), 'arg1', 'arg2');
		});

		it('should pass multiple arguments to log', () => {
			logger.log('arg1', 'arg2', 'arg3');

			expect(console.log).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
		});
	});
});
