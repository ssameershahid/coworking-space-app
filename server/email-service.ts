import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private resend: Resend;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendWelcomeEmail(userEmail: string, firstName: string, tempPassword: string): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'CalmKaaj <onboarding@resend.dev>',
        to: [userEmail],
        subject: 'Welcome to CalmKaaj - Your Account is Ready!',
        html: this.generateWelcomeEmailHTML(firstName, userEmail, tempPassword),
        text: this.generateWelcomeEmailText(firstName, userEmail, tempPassword),
      });

      if (error) {
        console.error('Error sending welcome email:', error);
        return false;
      }

      console.log(`Welcome email sent successfully to ${userEmail}, ID: ${data?.id}`);
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
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 0; 
            background-color: #f8fafc;
          }
          .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
          .header { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .credentials { 
            background: #f0f9ff; 
            padding: 24px; 
            border-radius: 8px; 
            margin: 24px 0; 
            border-left: 4px solid #0ea5e9; 
          }
          .credentials h3 { margin: 0 0 16px; color: #0f172a; font-size: 18px; }
          .credential-item { 
            margin: 12px 0; 
            padding: 8px 12px; 
            background: white; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0;
          }
          .credential-label { font-weight: 600; color: #475569; font-size: 14px; }
          .credential-value { font-family: Monaco, 'Cascadia Code', monospace; color: #0f172a; font-size: 14px; margin-top: 4px; }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
          }
          .features { margin: 32px 0; }
          .feature-list { list-style: none; padding: 0; }
          .feature-list li { 
            margin: 16px 0; 
            padding: 16px; 
            background: #f8fafc; 
            border-radius: 8px; 
            border-left: 3px solid #10b981;
          }
          .feature-icon { font-size: 20px; margin-right: 12px; }
          .warning { 
            background: #fef3c7; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #f59e0b; 
            margin: 24px 0; 
          }
          .warning-title { font-weight: 700; color: #92400e; margin: 0 0 8px; }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            color: #64748b; 
            font-size: 14px; 
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
          }
          .btn-center { text-align: center; margin: 32px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to CalmKaaj!</h1>
            <p>Your coworking space management account is ready</p>
          </div>
          
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>Your CalmKaaj account has been successfully created by our team. You can now access our comprehensive coworking space management system.</p>
            
            <div class="features">
              <h3>What you can do with CalmKaaj:</h3>
              <ul class="feature-list">
                <li><span class="feature-icon">☕</span> <strong>Café Orders:</strong> Order food and beverages from our café menu</li>
                <li><span class="feature-icon">🏢</span> <strong>Room Booking:</strong> Reserve meeting rooms and workspaces</li>
                <li><span class="feature-icon">💳</span> <strong>Credit Management:</strong> Track your credits and billing</li>
                <li><span class="feature-icon">👥</span> <strong>Community:</strong> Connect with other members</li>
              </ul>
            </div>

            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <div class="credential-item">
                <div class="credential-label">Email Address</div>
                <div class="credential-value">${email}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Temporary Password</div>
                <div class="credential-value">${tempPassword}</div>
              </div>
            </div>

            <div class="warning">
              <div class="warning-title">🔐 Important Security Notice</div>
              <p>Please change your password immediately after your first login for security purposes. You can do this from your Profile page after logging in.</p>
            </div>

            <div class="btn-center">
              <a href="${process.env.REPL_URL || 'https://your-domain.replit.app'}" class="button">Login to CalmKaaj</a>
            </div>

            <h3>Need Help?</h3>
            <p>If you have any questions or need assistance getting started, please don't hesitate to contact our support team. We're here to help you make the most of your CalmKaaj experience.</p>
          </div>

          <div class="footer">
            <p>© 2025 CalmKaaj. All rights reserved.</p>
            <p>This is an automated message, please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailText(firstName: string, email: string, tempPassword: string): string {
    return `
Welcome to CalmKaaj, ${firstName}!

Your coworking space management account has been successfully created by our team.

Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

IMPORTANT SECURITY NOTICE:
Please change your password immediately after your first login for security purposes. You can do this from your Profile page after logging in.

Access CalmKaaj at: ${process.env.REPL_URL || 'https://your-domain.replit.app'}

What you can do with CalmKaaj:
• Café Orders: Order food and beverages from our café menu
• Room Booking: Reserve meeting rooms and workspaces  
• Credit Management: Track your credits and billing
• Community: Connect with other members

Need Help?
If you have any questions or need assistance getting started, please contact our support team. We're here to help you make the most of your CalmKaaj experience.

© 2025 CalmKaaj. All rights reserved.
This is an automated message, please do not reply directly to this email.
    `.trim();
  }

  async testConnection(): Promise<boolean> {
    try {
      // Resend doesn't have a direct verify method, but we can test with a simple API call
      const { data, error } = await this.resend.apiKeys.list();
      
      if (error) {
        console.error('Resend API connection failed:', error);
        return false;
      }

      console.log('Resend API connection verified successfully');
      return true;
    } catch (error) {
      console.error('Resend API connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();