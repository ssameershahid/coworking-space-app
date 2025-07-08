import nodemailer from 'nodemailer';

export interface EmailProvider {
  name: string;
  setup: string;
  transporter: nodemailer.Transporter;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Try different free email providers in order of preference
    if (process.env.EMAIL_PROVIDER === 'gmail') {
      this.transporter = this.setupGmail();
    } else if (process.env.EMAIL_PROVIDER === 'outlook') {
      this.transporter = this.setupOutlook();
    } else if (process.env.EMAIL_PROVIDER === 'yahoo') {
      this.transporter = this.setupYahoo();
    } else {
      // Default to Gmail if no provider specified
      this.transporter = this.setupGmail();
    }
  }

  private setupGmail(): nodemailer.Transporter {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // your-email@gmail.com
        pass: process.env.EMAIL_APP_PASSWORD, // App password (not regular password)
      },
    });
  }

  private setupOutlook(): nodemailer.Transporter {
    return nodemailer.createTransporter({
      service: 'hotmail',
      auth: {
        user: process.env.EMAIL_USER, // your-email@outlook.com
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
  }

  private setupYahoo(): nodemailer.Transporter {
    return nodemailer.createTransporter({
      service: 'yahoo',
      auth: {
        user: process.env.EMAIL_USER, // your-email@yahoo.com
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
  }

  async sendWelcomeEmail(userEmail: string, firstName: string, loginLink: string): Promise<boolean> {
    const emailOptions = {
      to: userEmail,
      subject: 'Welcome to CalmKaaj - Your Account is Ready!',
      html: this.generateWelcomeHTML(firstName, userEmail, loginLink),
      text: this.generateWelcomeText(firstName, userEmail, loginLink),
    };

    try {
      await this.transporter.sendMail({
        from: `"CalmKaaj Team" <${process.env.EMAIL_USER}>`,
        ...emailOptions,
      });
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(userEmail: string, firstName: string, resetLink: string): Promise<boolean> {
    const emailOptions = {
      to: userEmail,
      subject: 'CalmKaaj - Password Reset Request',
      html: this.generatePasswordResetHTML(firstName, resetLink),
      text: this.generatePasswordResetText(firstName, resetLink),
    };

    try {
      await this.transporter.sendMail({
        from: `"CalmKaaj Team" <${process.env.EMAIL_USER}>`,
        ...emailOptions,
      });
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  private generateWelcomeHTML(firstName: string, email: string, loginLink: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to CalmKaaj</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to CalmKaaj!</h1>
                <p>Your coworking space management account is ready</p>
            </div>
            <div class="content">
                <p>Hi ${firstName},</p>
                <p>Welcome to CalmKaaj! Your account has been created and you can now access our coworking space management system.</p>
                
                <p><strong>Your account details:</strong></p>
                <ul>
                    <li>Email: ${email}</li>
                    <li>You can set your password on first login</li>
                </ul>
                
                <p>Click the button below to access your account:</p>
                <a href="${loginLink}" class="button">Access CalmKaaj Portal</a>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>${loginLink}</p>
                
                <p>If you have any questions, please contact our support team.</p>
                <p>Best regards,<br>The CalmKaaj Team</p>
            </div>
            <div class="footer">
                <p>© 2025 CalmKaaj. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generateWelcomeText(firstName: string, email: string, loginLink: string): string {
    return `
Welcome to CalmKaaj!

Hi ${firstName},

Welcome to CalmKaaj! Your account has been created and you can now access our coworking space management system.

Your account details:
- Email: ${email}
- You can set your password on first login

Access your account here: ${loginLink}

If you have any questions, please contact our support team.

Best regards,
The CalmKaaj Team

© 2025 CalmKaaj. All rights reserved.
    `;
  }

  private generatePasswordResetHTML(firstName: string, resetLink: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Password Reset - CalmKaaj</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset</h1>
                <p>Reset your CalmKaaj password</p>
            </div>
            <div class="content">
                <p>Hi ${firstName},</p>
                <p>We received a request to reset your CalmKaaj password. Click the button below to set a new password:</p>
                
                <a href="${resetLink}" class="button">Reset Password</a>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>${resetLink}</p>
                
                <p><strong>This link will expire in 1 hour.</strong></p>
                
                <p>If you didn't request this password reset, please ignore this email.</p>
                <p>Best regards,<br>The CalmKaaj Team</p>
            </div>
            <div class="footer">
                <p>© 2025 CalmKaaj. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generatePasswordResetText(firstName: string, resetLink: string): string {
    return `
Password Reset - CalmKaaj

Hi ${firstName},

We received a request to reset your CalmKaaj password. Click the link below to set a new password:

${resetLink}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
The CalmKaaj Team

© 2025 CalmKaaj. All rights reserved.
    `;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();