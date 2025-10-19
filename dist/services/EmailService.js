"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmailService = exports.EmailService = void 0;
class EmailService {
    constructor(config) {
        this.config = config;
        // Mock email service for development
        this.transporter = {
            sendMail: async (options) => {
                console.log('📧 Mock Email Sent:', {
                    to: options.to,
                    subject: options.subject,
                    from: options.from,
                });
                return { messageId: 'mock-message-id' };
            },
        };
    }
    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${process.env.BASE_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: this.config.from,
            to: user.email,
            subject: 'Password Reset Request - MockAuth',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.username},</p>
          <p>You have requested to reset your password. Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is a test email from MockAuth - a development authentication simulator.</p>
        </div>
      `,
        };
        try {
            await this.transporter.sendMail(mailOptions);
        }
        catch (error) {
            console.warn('Failed to send password reset email:', error.message);
            // In development, we might want to log the reset token instead
            console.log(`Password reset token for ${user.email}: ${resetToken}`);
        }
    }
    async sendWelcomeEmail(user) {
        const mailOptions = {
            from: this.config.from,
            to: user.email,
            subject: 'Welcome to MockAuth!',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to MockAuth!</h2>
          <p>Hello ${user.username},</p>
          <p>Your account has been successfully created. You can now use MockAuth for your development and testing needs.</p>
          <p>Account Details:</p>
          <ul>
            <li>Email: ${user.email}</li>
            <li>Username: ${user.username}</li>
            <li>Roles: ${user.roles.join(', ')}</li>
          </ul>
          <hr>
          <p style="color: #666; font-size: 12px;">This is a test email from MockAuth - a development authentication simulator.</p>
        </div>
      `,
        };
        try {
            await this.transporter.sendMail(mailOptions);
        }
        catch (error) {
            console.warn('Failed to send welcome email:', error.message);
        }
    }
    async sendMFAEnabledEmail(user) {
        const mailOptions = {
            from: this.config.from,
            to: user.email,
            subject: 'MFA Enabled - MockAuth',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Multi-Factor Authentication Enabled</h2>
          <p>Hello ${user.username},</p>
          <p>Multi-factor authentication has been successfully enabled for your account.</p>
          <p>You will now need to provide a verification code from your authenticator app when logging in.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is a test email from MockAuth - a development authentication simulator.</p>
        </div>
      `,
        };
        try {
            await this.transporter.sendMail(mailOptions);
        }
        catch (error) {
            console.warn('Failed to send MFA enabled email:', error.message);
        }
    }
    // For development/testing - create a mock email service
    static createMockEmailService() {
        return new EmailService({
            host: 'localhost',
            port: 1025,
            secure: false,
            auth: {
                user: 'test',
                pass: 'test',
            },
            from: 'noreply@mockauth.dev',
        });
    }
}
exports.EmailService = EmailService;
function createEmailService(config) {
    return new EmailService(config);
}
exports.createEmailService = createEmailService;
//# sourceMappingURL=EmailService.js.map