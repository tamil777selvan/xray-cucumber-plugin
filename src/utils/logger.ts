/**
 * Colors used for log messages based on log levels.
 */
const logColors = {
    info: '\x1b[32m%s\x1b[0m', // Green color for info messages
    error: '\x1b[31m%s\x1b[0m', // Red color for error messages
    warn: '\x1b[33m%s\x1b[0m', // Yellow color for warning messages
    debug: '\x1b[36m%s\x1b[0m' // Cyan color for debug messages
};

/**
 * Logs a message with the specified log level and color.
 *
 * @param {string} level - The log level ('info', 'error', 'warn', or 'debug').
 * @param {any} msg - The message to log.
 */
const log = (level: string, msg: any) => {
    const color = logColors[level];
    /* eslint no-console: "off" */
    console.log(color, msg);
};

/**
 * Logger object with methods for different log levels.
 */
const logger = {
    /**
	 * Logs an informational message.
	 *
	 * @param {any} msg - The message to log.
	 */
    info: (msg: any) => log('info', msg),
    /**
	 * Logs an error message.
	 *
	 * @param {any} msg - The error message to log.
	 */
    error: (msg: any) => log('error', msg),
    /**
	 * Logs a warning message.
	 *
	 * @param {any} msg - The warning message to log.
	 */
    warn: (msg: any) => log('warn', msg),
    /**
	 * Logs a debug message if the 'XRAY_CUCUMBER_PLUGIN_DEBUG' environment variable is set.
	 *
	 * @param {any} msg - The debug message to log.
	 */
    debug: (msg: any) => {
        if (process.env.XRAY_CUCUMBER_PLUGIN_DEBUG) {
            log('debug', msg);
        }
    }
};

export default logger;
