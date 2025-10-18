"use strict";
/**
 * Simple validation utilities to replace express-validator
 * No external dependencies, no vulnerabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.body = exports.validationResult = exports.validate = exports.Validator = exports.ValidationResult = void 0;
class ValidationResult {
    constructor() {
        this.errors = [];
    }
    addError(field, message) {
        this.errors.push({ field, message });
    }
    isEmpty() {
        return this.errors.length === 0;
    }
    array() {
        return this.errors;
    }
}
exports.ValidationResult = ValidationResult;
class Validator {
    constructor(result, field, value) {
        this.result = result;
        this.field = field;
        this.value = value;
    }
    isEmail() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.value)) {
            this.result.addError(this.field, `${this.field} must be a valid email`);
        }
        return this;
    }
    isLength(options) {
        var _a;
        const length = ((_a = this.value) === null || _a === void 0 ? void 0 : _a.length) || 0;
        if (options.min !== undefined && length < options.min) {
            this.result.addError(this.field, `${this.field} must be at least ${options.min} characters`);
        }
        if (options.max !== undefined && length > options.max) {
            this.result.addError(this.field, `${this.field} must be at most ${options.max} characters`);
        }
        return this;
    }
    optional() {
        // If value is undefined or null, skip validation
        return this;
    }
    isBoolean() {
        if (typeof this.value !== 'boolean' && this.value !== undefined) {
            this.result.addError(this.field, `${this.field} must be a boolean`);
        }
        return this;
    }
    isString() {
        if (typeof this.value !== 'string' && this.value !== undefined) {
            this.result.addError(this.field, `${this.field} must be a string`);
        }
        return this;
    }
    isArray() {
        if (!Array.isArray(this.value) && this.value !== undefined) {
            this.result.addError(this.field, `${this.field} must be an array`);
        }
        return this;
    }
    normalizeEmail() {
        if (typeof this.value === 'string') {
            this.value = this.value.toLowerCase().trim();
        }
        return this;
    }
}
exports.Validator = Validator;
function validate(fields) {
    const result = new ValidationResult();
    return {
        field: (name) => new Validator(result, name, fields[name]),
        check: () => result
    };
}
exports.validate = validate;
// Express middleware compatible function
function validationResult(req) {
    return req.validationResult || new ValidationResult();
}
exports.validationResult = validationResult;
function body(field) {
    return {
        isEmail: () => ({ normalizeEmail: () => body(field) }),
        isLength: (options) => body(field),
        optional: () => body(field),
        isBoolean: () => body(field),
        isString: () => body(field),
        isArray: () => body(field),
        normalizeEmail: () => body(field),
    };
}
exports.body = body;
function query(field) {
    return body(field);
}
exports.query = query;
//# sourceMappingURL=validation.js.map