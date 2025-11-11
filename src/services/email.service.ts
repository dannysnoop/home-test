import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { env } from '../config/env';

export class EmailService {
    private transporter: Transporter | null = null;
    private isDev: boolean;

    constructor() {
        this.isDev = env.NODE_ENV === 'development';

        // Nếu có cấu hình SMTP thì tạo transporter thật
        if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
            this.transporter = nodemailer.createTransport({
                host: env.SMTP_HOST,
                port: Number(env.SMTP_PORT) || 587,
                secure: false, // true nếu dùng port 465
                auth: {
                    user: env.SMTP_USER,
                    pass: env.SMTP_PASS,
                },
            } as SMTPTransport.Options);
        }
    }


    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        try {
            if (this.isDev || !this.transporter) {
                console.log('📩 [DEV MODE EMAIL]');
                console.log('To:', to);
                console.log('Subject:', subject);
                console.log('HTML:', html);
                return;
            }

            const info = await this.transporter.sendMail({
                from: env.SMTP_FROM,
                to,
                subject,
                html,
            });

            console.log(`✅ Email sent to ${to}: ${info.messageId}`);
        } catch (err) {
            console.error('❌ Failed to send email:', err);
            throw new Error('Failed to send email');
        }
    }
     async sendPasswordResetEmail(to: string, link: string): Promise<void> {
        const subject = 'Reset your password';
        const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. Click below to proceed:</p>
        <a href="${link}" style="display:inline-block;background:#4F46E5;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Reset Password</a>
        <p style="margin-top:20px;">If you didn't request this, just ignore this email.</p>
      </div>
    `;
        await this.sendEmail(to, subject, html);
    }
}

// ✅ Export instance để tái sử dụng
export const emailService = new EmailService();
