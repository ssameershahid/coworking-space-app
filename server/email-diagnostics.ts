// Email Diagnostics - Run this to debug Resend domain status
import { Resend } from 'resend';

async function diagnoseDomainStatus() {
  console.log('\n🔍 RESEND EMAIL DIAGNOSTICS\n');
  
  // Check API Key
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('❌ RESEND_API_KEY not found');
    return;
  }
  
  console.log('✅ RESEND_API_KEY configured');
  console.log('📧 Current email config: noreply@mail.calmkaaj.org\n');
  
  const resend = new Resend(apiKey);
  
  try {
    // Test with internal domain (should work)
    console.log('🧪 Testing email to verified domain...');
    const testResult1 = await resend.emails.send({
      from: 'CalmKaaj <noreply@mail.calmkaaj.org>',
      to: ['noreply@mail.calmkaaj.org'], // Send to self
      subject: 'Test Email - Internal',
      text: 'This is a test email to our own domain'
    });
    
    if (testResult1.error) {
      console.log('❌ Internal test failed:', testResult1.error);
    } else {
      console.log('✅ Internal test successful:', testResult1.data?.id);
    }
    
    // Test with external domain (should fail if DNS not configured)
    console.log('\n🧪 Testing email to external domain...');
    const testResult2 = await resend.emails.send({
      from: 'CalmKaaj <noreply@mail.calmkaaj.org>',
      to: ['test@example.com'], // External email
      subject: 'Test Email - External',
      text: 'This is a test email to external domain'
    });
    
    if (testResult2.error) {
      console.log('❌ External test failed (expected if DNS not configured):', testResult2.error);
      console.log('\n📋 SOLUTION: Configure SPF, DKIM, and MX DNS records');
      console.log('📖 See RESEND_DNS_SETUP_GUIDE.md for detailed instructions');
    } else {
      console.log('✅ External test successful - DNS is properly configured!');
    }
    
  } catch (error) {
    console.error('🚨 Diagnostic failed:', error);
  }
}

// Run diagnostics
diagnoseDomainStatus();