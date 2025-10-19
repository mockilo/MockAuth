"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
function requestLogger(req, res, next) {
    const start = Date.now();
    // Log request
    console.log(`${req.method} ${req.path} - ${req.ip} - ${req.get('User-Agent')}`);
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        return originalEnd.call(this, chunk, encoding);
    };
    next();
}
//# sourceMappingURL=requestLogger.js.map