/**
 * Logger utility for structured logging with context
 */

const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};

const LOG_PREFIX = '[AudioEqualizer]';

/**
 * Format log message with context
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @returns {string} Formatted log message
 */
const formatMessage = (level, message, context = {}) => {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 
        ? ` | Context: ${JSON.stringify(context)}` 
        : '';
    return `${LOG_PREFIX} [${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
};

/**
 * Log error message
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or error details
 * @param {Object} context - Additional context
 */
export const logError = (message, error = null, context = {}) => {
    const errorContext = {
        ...context,
        ...(error && {
            errorMessage: error.message || error,
            errorStack: error.stack,
            errorName: error.name
        })
    };
    
    const formattedMessage = formatMessage(LOG_LEVELS.ERROR, message, errorContext);
    console.error(formattedMessage, error || '');
};

/**
 * Log warning message
 * @param {string} message - Warning message
 * @param {Object} context - Additional context
 */
export const logWarn = (message, context = {}) => {
    const formattedMessage = formatMessage(LOG_LEVELS.WARN, message, context);
    console.warn(formattedMessage);
};

/**
 * Log info message
 * @param {string} message - Info message
 * @param {Object} context - Additional context
 */
export const logInfo = (message, context = {}) => {
    const formattedMessage = formatMessage(LOG_LEVELS.INFO, message, context);
    console.log(formattedMessage);
};

/**
 * Log debug message (only in development)
 * @param {string} message - Debug message
 * @param {Object} context - Additional context
 */
export const logDebug = (message, context = {}) => {
    if (process.env.NODE_ENV === 'development') {
        const formattedMessage = formatMessage(LOG_LEVELS.DEBUG, message, context);
        console.log(formattedMessage);
    }
};

/**
 * Log Chrome storage operation
 * @param {string} operation - Operation name (get, set, remove)
 * @param {string} status - Status (success, error)
 * @param {Object} details - Operation details
 */
export const logStorageOperation = (operation, status, details = {}) => {
    const context = {
        operation,
        status,
        ...details
    };
    
    if (status === 'error') {
        logError(`Chrome storage ${operation} failed`, null, context);
    } else {
        logInfo(`Chrome storage ${operation} ${status}`, context);
    }
};

export default {
    error: logError,
    warn: logWarn,
    info: logInfo,
    debug: logDebug,
    storage: logStorageOperation
};
