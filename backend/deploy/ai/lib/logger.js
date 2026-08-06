"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info(message, data) {
        console.log(JSON.stringify({ level: 'INFO', message, data, timestamp: new Date().toISOString() }));
    },
    warn(message, data) {
        console.warn(JSON.stringify({ level: 'WARN', message, data, timestamp: new Date().toISOString() }));
    },
    error(message, error) {
        console.error(JSON.stringify({
            level: 'ERROR',
            message,
            error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
            timestamp: new Date().toISOString(),
        }));
    },
};
//# sourceMappingURL=logger.js.map