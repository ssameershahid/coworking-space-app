import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure SMTP - supports multiple providers
    if (process.env.EMAIL_SERVICE) {
      // Use predefined service (gmail, yahoo, hotmail, etc.)
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    } else {
      // Use custom SMTP settings (for providers like Namecheap, etc.)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
  }

  async sendWelcomeEmail(userEmail: string, firstName: string, tempPassword: string): Promise<boolean> {
    const emailOptions: EmailOptions = {
      to: userEmail,
      subject: 'Welcome to CalmKaaj - Your Account is Ready!',
      html: this.generateWelcomeEmailHTML(firstName, userEmail, tempPassword),
      text: this.generateWelcomeEmailText(firstName, userEmail, tempPassword),
    };

    try {
      await this.transporter.sendMail({
        from: `"CalmKaaj Team" <${process.env.EMAIL_USER}>`,
        ...emailOptions,
      });
      console.log(`Welcome email sent successfully to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  private generateWelcomeEmailHTML(firstName: string, email: string, tempPassword: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CalmKaaj</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to CalmKaaj!</h1>
          <p>Your coworking space management account is ready</p>
        </div>
        
        <div class="content">
          <h2>Hello ${firstName}!</h2>
          <p>Your CalmKaaj account has been successfully created. You can now access our coworking space management system to:</p>
          
          <ul>
            <li>📱 Order food and beverages from our café</li>
            <li>🏢 Book meeting rooms and workspaces</li>
            <li>💳 Manage your credits and billing</li>
            <li>👥 Connect with our community</li>
          </ul>

          <div class="credentials">
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
          </div>

          <div class="warning">
            <strong>⚠️ Important Security Notice:</strong>
            <p>Please change your password immediately after your first login for security purposes.</p>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.APP_URL || 'http://localhost:5000'}" class="button">Login to CalmKaaj</a>
          </div>

          <h3>Need Help?</h3>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        </div>

        <div class="footer">
          <p>© 2025 CalmKaaj. All rights reserved.</p>
          <p>This is an automated message, please do not reply directly to this email.</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailText(firstName: string, email: string, tempPassword: string): string {
    return `
Welcome to CalmKaaj, ${firstName}!

Your coworking space management account has been successfully created.

Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

IMPORTANT: Please change your password immediately after your first login for security.

You can access CalmKaaj at: ${process.env.APP_URL || 'http://localhost:5000'}

With your account, you can:
- Order food and beverages from our café
- Book meeting rooms and workspaces  
- Manage your credits and billing
- Connect with our community

If you need help, please contact our support team.

© 2025 CalmKaaj. All rights reserved.
    `.trim();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();