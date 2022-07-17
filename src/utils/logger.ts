const infoColor = '\x1b[32m%s\x1b[0m';
const errorColor = '\x1b[31m%s\x1b[0m';
const warnColor = '\x1b[33m%s\x1b[0m';
const debugColor = '\x1b[36m%s\x1b[0m';

/* eslint no-console: "off" */
const logger = {
    info: (msg: string) => console.log(infoColor, msg),
    error: (msg: string) => console.error(errorColor, msg),
    warn: (msg: string) => console.warn(warnColor, msg),
    debug: (msg: string) => process.env.XRAY_CUCUMBER_PLUGIN_DEBUG ? console.debug(debugColor, msg) : ''
}

export default logger;
