import { vi, describe, it, expect, beforeEach, afterEach, SpyInstance } from 'vitest';

import logger, { logColors } from '../../src/utils/logger.js';

let consoleLogMock: SpyInstance<[message?: any, ...optionalParams: any[]], void>;

describe('logger', () => {
	beforeEach(() => {
		consoleLogMock = vi.spyOn(console, 'log');
	});

	afterEach(() => {
		consoleLogMock.mockRestore();
		vi.resetAllMocks();
	});

	it('logger.info should log an informational message in green', () => {
		logger.info('Information message');
		expect(consoleLogMock).toHaveBeenCalledWith(logColors.info, 'Information message');
	});

	it('logger.error should log an error message in red', () => {
		logger.error('Error message');
		expect(consoleLogMock).toHaveBeenCalledWith(logColors.error, 'Error message');
	});

	it('logger.warn should log a warning message in yellow', () => {
		logger.warn('Warning message');
		expect(consoleLogMock).toHaveBeenCalledWith(logColors.warn, 'Warning message');
	});

	it('logger.debug should log a debug message if XRAY_CUCUMBER_PLUGIN_DEBUG is set', () => {
		process.env.XRAY_CUCUMBER_PLUGIN_DEBUG = 'true';
		logger.debug('Debug message');
		expect(consoleLogMock).toHaveBeenCalledWith(logColors.debug, 'Debug message');
	});

	it('logger.debug should not log a debug message if XRAY_CUCUMBER_PLUGIN_DEBUG is not set', () => {
		delete process.env.XRAY_CUCUMBER_PLUGIN_DEBUG;
		logger.debug('Debug message');
		expect(consoleLogMock).not.toHaveBeenCalled();
	});
});
