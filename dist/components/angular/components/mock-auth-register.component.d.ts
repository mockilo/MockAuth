import { EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
export declare class MockAuthRegisterComponent {
    private fb;
    registerSuccess: EventEmitter<void>;
    registerForm: FormGroup;
    errorMessage: string;
    isLoading: boolean;
    constructor(fb: FormBuilder);
    onSubmit(): void;
}
//# sourceMappingURL=mock-auth-register.component.d.ts.map