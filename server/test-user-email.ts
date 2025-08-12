// Test the exact user creation email flow
import { Resend } from 'resend';

async function testUserCreationEmail() {
  console.log('\n🔍 TESTING USER CREATION EMAIL FLOW\n');
  
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('❌ RESEND_API_KEY not found');
    return;
  }
  
  const resend = new Resend(apiKey);
  
  // Test the exact same email configuration as user creation
  const testEmail = 'sameershahidbmp@gmail.com';
  const firstName = 'Sameer';
  const tempPassword = 'password123';
  
  console.log('📧 From: CalmKaaj <noreply@mail.calmkaaj.org>');
  console.log('📧 To:', testEmail);
  console.log('📧 Subject: Welcome to CalmKaaj - Your Account is Ready!\n');
  
  try {
    const result = await resend.emails.send({
      from: 'CalmKaaj <noreply@mail.calmkaaj.org>',
      to: [testEmail],
      subject: 'Welcome to CalmKaaj - Your Account is Ready!',
      html: generateTestHTML(firstName, testEmail, tempPassword),
      text: generateTestText(firstName, testEmail, tempPassword),
    });
    
    if (result.error) {
      console.log('❌ User creation email test FAILED:');
      console.log('Error Code:', result.error.statusCode);
      console.log('Error Message:', result.error.message);
      console.log('Full Error:', JSON.stringify(result.error, null, 2));
    } else {
      console.log('✅ User creation email test SUCCESSFUL!');
      console.log('Email ID:', result.data?.id);
      console.log('\n🎉 The email system is working perfectly!');
    }
    
  } catch (error) {
    console.error('🚨 Test failed with exception:', error);
  }
}

function generateTestHTML(firstName: string, email: string, tempPassword: string): string {
  return `
    <h1>Welcome ${firstName}!</h1>
    <p>Your CalmKaaj account has been created.</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Temporary Password:</strong> ${tempPassword}</p>
    <p>Please log in and change your password.</p>
  `;
}

function generateTestText(firstName: string, email: string, tempPassword: string): string {
  return `Welcome ${firstName}! Your CalmKaaj account: Email: ${email}, Password: ${tempPassword}`;
}

// Run test
testUserCreationEmail();