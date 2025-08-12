# Resend DNS Configuration Guide for CalmKaaj

## URGENT: Required DNS Records for Email Sending

Your domain `mail.calmkaaj.org` is verified but lacks the required authentication records.

### Step 1: Go to Resend Dashboard
1. Visit https://resend.com/domains
2. Click on your `mail.calmkaaj.org` domain
3. Look for "DNS Records" or "Authentication" section
4. Copy the exact values provided

### Step 2: Required DNS Records (Add to Your Domain Registrar)

You need to add these 3 types of records:

#### 1. SPF Record
```
Type: TXT
Name: mail.calmkaaj.org (or @ if for root domain)
Value: v=spf1 include:_spf.resend.com ~all
```

#### 2. DKIM Record  
```
Type: TXT
Name: resend._domainkey.mail.calmkaaj.org
Value: [Unique key from Resend dashboard - copy exactly]
```

#### 3. MX Record
```
Type: MX
Name: mail.calmkaaj.org
Value: [MX value from Resend dashboard]
Priority: [Priority from Resend dashboard]
```

### Step 3: DNS Propagation
- Changes take 24-48 hours to propagate
- Use https://dns.google.com to check if records are live
- Status in Resend will change from "Verified" to "Authenticated"

### Step 4: Test Email Sending
Once DNS records propagate, external emails will work automatically.

## Alternative: Root Domain Verification

If subdomain setup is complex, consider verifying `calmkaaj.org` instead:
1. Add domain `calmkaaj.org` in Resend
2. Configure DNS records for root domain  
3. Use `noreply@calmkaaj.org` in email service

## Current Status Check
Check your Resend domain dashboard - you should see:
- ✅ Domain Verified
- ✅ SPF Record Found  
- ✅ DKIM Record Found
- ✅ MX Record Found

All must be ✅ for external email sending.