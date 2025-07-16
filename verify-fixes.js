#!/usr/bin/env node

// CalmKaaj Fix Verification Script
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FixVerifier {
  constructor() {
    this.verificationResults = {
      wsCleanup: false,
      reconnectionThrottle: false,
      logReduction: false,
      memoryLimits: false,
      pollingDisabled: false,
      timestamp: new Date().toISOString()
    };
  }

  // Verify WebSocket cleanup mechanism
  verifyWsCleanup() {
    console.log('\n🔍 Verifying WebSocket Cleanup Mechanism...');
    
    try {
      const routesContent = fs.readFileSync(path.join(__dirname, 'server', 'routes.ts'), 'utf8');
      
      // Check for MAX_CLIENTS limit
      const hasMaxClients = routesContent.includes('MAX_CLIENTS = 500');
      
      // Check for efficient cleanup
      const hasEfficientCleanup = routesContent.includes('for (const [userId, client] of clients)') &&
                                  !routesContent.includes('Array.from(clients.entries())');
      
      // Check for connection limit enforcement
      const hasLimitEnforcement = routesContent.includes('if (clients.size >= MAX_CLIENTS)');
      
      this.verificationResults.wsCleanup = hasMaxClients && hasEfficientCleanup && hasLimitEnforcement;
      
      console.log(`   MAX_CLIENTS limit: ${hasMaxClients ? '✅' : '❌'}`);
      console.log(`   Efficient cleanup: ${hasEfficientCleanup ? '✅' : '❌'}`);
      console.log(`   Limit enforcement: ${hasLimitEnforcement ? '✅' : '❌'}`);
      console.log(`   Overall: ${this.verificationResults.wsCleanup ? '✅ PASS' : '❌ FAIL'}`);
      
    } catch (error) {
      console.error('   ❌ Error verifying WebSocket cleanup:', error.message);
      this.verificationResults.wsCleanup = false;
    }
  }

  // Verify reconnection throttle
  verifyReconnectionThrottle() {
    console.log('\n🔍 Verifying Reconnection Throttle...');
    
    try {
      const wsHookContent = fs.readFileSync(path.join(__dirname, 'client', 'src', 'hooks', 'use-websocket.tsx'), 'utf8');
      
      // Check for 10 second interval
      const has10SecondInterval = wsHookContent.includes('reconnectInterval = 10000');
      
      // Check for reduced attempts
      const hasReducedAttempts = wsHookContent.includes('reconnectAttempts = 3');
      
      this.verificationResults.reconnectionThrottle = has10SecondInterval && hasReducedAttempts;
      
      console.log(`   10s reconnect interval: ${has10SecondInterval ? '✅' : '❌'}`);
      console.log(`   3 max attempts: ${hasReducedAttempts ? '✅' : '❌'}`);
      console.log(`   Overall: ${this.verificationResults.reconnectionThrottle ? '✅ PASS' : '❌ FAIL'}`);
      
    } catch (error) {
      console.error('   ❌ Error verifying reconnection throttle:', error.message);
      this.verificationResults.reconnectionThrottle = false;
    }
  }

  // Verify log reduction
  verifyLogReduction() {
    console.log('\n🔍 Verifying Log Reduction...');
    
    try {
      // Count console.log occurrences
      const serverFiles = execSync('find server -name "*.ts" -type f', { encoding: 'utf8' }).split('\n').filter(f => f);
      let totalLogs = 0;
      
      for (const file of serverFiles) {
        if (file) {
          const content = fs.readFileSync(file, 'utf8');
          const logCount = (content.match(/console\.log/g) || []).length;
          totalLogs += logCount;
        }
      }
      
      // Check if session debugging is removed
      const routesContent = fs.readFileSync(path.join(__dirname, 'server', 'routes.ts'), 'utf8');
      const hasNoSessionDebug = !routesContent.includes('Session debug - Path:');
      
      this.verificationResults.logReduction = totalLogs < 50 && hasNoSessionDebug;
      
      console.log(`   Total console.log calls: ${totalLogs} (target: <50)`);
      console.log(`   Session debugging removed: ${hasNoSessionDebug ? '✅' : '❌'}`);
      console.log(`   Overall: ${this.verificationResults.logReduction ? '✅ PASS' : '❌ FAIL'}`);
      
    } catch (error) {
      console.error('   ❌ Error verifying log reduction:', error.message);
      this.verificationResults.logReduction = false;
    }
  }

  // Verify memory limits
  verifyMemoryLimits() {
    console.log('\n🔍 Verifying Memory Limits...');
    
    try {
      const routesContent = fs.readFileSync(path.join(__dirname, 'server', 'routes.ts'), 'utf8');
      
      // Check for push subscription limit
      const hasPushLimit = routesContent.includes('MAX_PUSH_SUBSCRIPTIONS = 1000');
      
      // Check for cleanup function
      const hasCleanupFunction = routesContent.includes('cleanupPushSubscriptions');
      
      this.verificationResults.memoryLimits = hasPushLimit && hasCleanupFunction;
      
      console.log(`   Push subscription limit: ${hasPushLimit ? '✅' : '❌'}`);
      console.log(`   Cleanup function: ${hasCleanupFunction ? '✅' : '❌'}`);
      console.log(`   Overall: ${this.verificationResults.memoryLimits ? '✅ PASS' : '❌ FAIL'}`);
      
    } catch (error) {
      console.error('   ❌ Error verifying memory limits:', error.message);
      this.verificationResults.memoryLimits = false;
    }
  }

  // Verify polling is disabled
  verifyPollingDisabled() {
    console.log('\n🔍 Verifying Polling Disabled...');
    
    try {
      // Check impersonation banner
      const impersonationContent = fs.readFileSync(
        path.join(__dirname, 'client', 'src', 'components', 'admin', 'impersonation-banner.tsx'), 
        'utf8'
      );
      const impersonationDisabled = impersonationContent.includes('refetchInterval: false');
      
      // Check room components
      const roomContent = fs.readFileSync(
        path.join(__dirname, 'client', 'src', 'components', 'room-card-calendar.tsx'), 
        'utf8'
      );
      const roomPollingDisabled = roomContent.includes('refetchInterval: false');
      
      this.verificationResults.pollingDisabled = impersonationDisabled && roomPollingDisabled;
      
      console.log(`   Impersonation polling disabled: ${impersonationDisabled ? '✅' : '❌'}`);
      console.log(`   Room polling disabled: ${roomPollingDisabled ? '✅' : '❌'}`);
      console.log(`   Overall: ${this.verificationResults.pollingDisabled ? '✅ PASS' : '❌ FAIL'}`);
      
    } catch (error) {
      console.error('   ❌ Error verifying polling:', error.message);
      this.verificationResults.pollingDisabled = false;
    }
  }

  // Generate verification report
  generateReport() {
    const reportPath = path.join(__dirname, 'verification', 'fix-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.verificationResults, null, 2));
    
    console.log('\n📋 FIX VERIFICATION REPORT');
    console.log('=========================');
    
    const allPassed = Object.values(this.verificationResults)
      .filter(v => typeof v === 'boolean')
      .every(v => v === true);
    
    console.log(`\nStatus: ${allPassed ? '✅ ALL FIXES VERIFIED' : '❌ SOME FIXES MISSING'}`);
    console.log(`Report saved to: ${reportPath}`);
    
    if (!allPassed) {
      console.log('\n🚨 ACTION REQUIRED:');
      if (!this.verificationResults.wsCleanup) {
        console.log('   • Implement WebSocket cleanup mechanism in routes.ts');
      }
      if (!this.verificationResults.reconnectionThrottle) {
        console.log('   • Set reconnectInterval to 10000ms in use-websocket.tsx');
      }
      if (!this.verificationResults.logReduction) {
        console.log('   • Remove excessive console.log statements');
      }
      if (!this.verificationResults.memoryLimits) {
        console.log('   • Add memory limits for push subscriptions');
      }
      if (!this.verificationResults.pollingDisabled) {
        console.log('   • Disable polling in component queries');
      }
    }
  }

  // Run all verifications
  async runVerification() {
    console.log('🔍 Starting CalmKaaj Fix Verification...');
    
    this.verifyWsCleanup();
    this.verifyReconnectionThrottle();
    this.verifyLogReduction();
    this.verifyMemoryLimits();
    this.verifyPollingDisabled();
    
    this.generateReport();
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new FixVerifier();
  verifier.runVerification().catch(console.error);
}

export default FixVerifier;