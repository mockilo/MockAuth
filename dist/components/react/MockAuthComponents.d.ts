import React from 'react';
export declare const MockAuthLoginForm: React.FC<{
    onSuccess?: () => void;
}>;
export declare const MockAuthRegisterForm: React.FC<{
    onSuccess?: () => void;
}>;
export declare const MockAuthUserProfile: React.FC;
export declare const MockAuthProtectedRoute: React.FC<{
    children: React.ReactNode;
    requiredRoles?: string[];
    requiredPermissions?: string[];
    fallback?: React.ReactNode;
}>;
export declare const MockAuthStatus: React.FC;
export declare const MockAuthStyles: React.FC;
//# sourceMappingURL=MockAuthComponents.d.ts.map