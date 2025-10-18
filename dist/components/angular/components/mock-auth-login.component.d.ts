import { EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MockAuthService } from '../mock-auth.service';
export declare class MockAuthLoginComponent {
    private fb;
    private mockAuthService;
    loginSuccess: EventEmitter<void>;
    loginForm: FormGroup;
    errorMessage: string;
    isLoading: boolean;
    constructor(fb: FormBuilder, mockAuthService: MockAuthService);
    onSubmit(): void;
}
//# sourceMappingURL=mock-auth-login.component.d.ts.map