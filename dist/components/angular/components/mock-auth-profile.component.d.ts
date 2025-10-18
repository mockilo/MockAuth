import { OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
export declare class MockAuthProfileComponent implements OnInit {
    private fb;
    user: any;
    editForm: FormGroup;
    isEditing: boolean;
    isLoading: boolean;
    constructor(fb: FormBuilder);
    ngOnInit(): void;
    startEdit(): void;
    cancelEdit(): void;
    saveProfile(): void;
    logout(): void;
}
//# sourceMappingURL=mock-auth-profile.component.d.ts.map