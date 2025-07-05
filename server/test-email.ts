// Test script to verify email configuration
import { emailService } from './email-service';

async function testEmailSetup() {
  console.log('🧪 Testing email configuration...');
  
  try {
    // Test connection
    const connectionTest = await emailService.testConnection();
    if (!connectionTest) {
      console.error('❌ Email service connection failed');
      return;
    }
    
    console.log('✅ Email service connection successful');
    
    // Test sending email (replace with your email for testing)
    const testEmail = 'your-test-email@example.com';
    const emailSent = await emailService.sendWelcomeEmail(
      testEmail,
      'Test User',
      'test123'
    );
    
    if (emailSent) {
      console.log(`✅ Test email sent successfully to ${testEmail}`);
    } else {
      console.error('❌ Failed to send test email');
    }
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEmailSetup();
}

export { testEmailSetup };