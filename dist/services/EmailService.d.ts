import { User } from '../types';
export interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: string;
}
export declare class EmailService {
    private transporter;
    private config;
    constructor(config: EmailConfig);
    sendPasswordResetEmail(user: User, resetToken: string): Promise<void>;
    sendWelcomeEmail(user: User): Promise<void>;
    sendMFAEnabledEmail(user: User): Promise<void>;
    static createMockEmailService(): EmailService;
}
export declare function createEmailService(config: EmailConfig): EmailService;
//# sourceMappingURL=EmailService.d.ts.map