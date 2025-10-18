/**
 * Simple validation utilities to replace express-validator
 * No external dependencies, no vulnerabilities
 */
export interface ValidationError {
    field: string;
    message: string;
}
export declare class ValidationResult {
    private errors;
    addError(field: string, message: string): void;
    isEmpty(): boolean;
    array(): ValidationError[];
}
export declare class Validator {
    private result;
    private field;
    private value;
    constructor(result: ValidationResult, field: string, value: any);
    isEmail(): this;
    isLength(options: {
        min?: number;
        max?: number;
    }): this;
    optional(): this;
    isBoolean(): this;
    isString(): this;
    isArray(): this;
    normalizeEmail(): this;
}
export declare function validate(fields: {
    [key: string]: any;
}): {
    field: (name: string) => Validator;
    check: () => ValidationResult;
};
export declare function validationResult(req: any): ValidationResult;
export declare function body(field: string): {
    isEmail: () => {
        normalizeEmail: () => any;
    };
    isLength: (options: any) => any;
    optional: () => any;
    isBoolean: () => any;
    isString: () => any;
    isArray: () => any;
    normalizeEmail: () => any;
};
export declare function query(field: string): {
    isEmail: () => {
        normalizeEmail: () => any;
    };
    isLength: (options: any) => any;
    optional: () => any;
    isBoolean: () => any;
    isString: () => any;
    isArray: () => any;
    normalizeEmail: () => any;
};
//# sourceMappingURL=validation.d.ts.map