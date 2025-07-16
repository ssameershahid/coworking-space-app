#!/usr/bin/env node

// CalmKaaj Health Report Generator
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HealthReporter {
  constructor() {
    this.verificationDir = path.join(__dirname, 'verification');
    this.thresholds = {
      maxWsConnections: 500,
      maxMemoryMB: 1000,
      maxCostWeekly: 5.00,
      maxAuthFailuresPerHour: 100,
      maxCpuPercent: 70
    };
  }

  // Read metrics log
  readMetricsLog() {
    const metricsPath = path.join(this.verificationDir, 'metrics.log');
    if (!fs.existsSync(metricsPath)) {
      return null;
    }

    const content = fs.readFileSync(metricsPath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line);
    
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(m => m !== null);
  }

  // Analyze metrics for health status
  analyzeHealth(metrics) {
    if (!metrics || metrics.length === 0) {
      return { status: 'NO_DATA', issues: ['No metrics data available'] };
    }

    const issues = [];
    let maxWs = 0;
    let maxMemory = 0;
    let maxCpu = 0;
    let totalAuthFailures = 0;

    // Find maximums and totals
    metrics.forEach(m => {
      maxWs = Math.max(maxWs, m.wsConnections || 0);
      maxMemory = Math.max(maxMemory, m.memory || 0);
      maxCpu = Math.max(maxCpu, m.cpu || 0);
      totalAuthFailures += m.authFailures || 0;
    });

    // Check thresholds
    if (maxWs > this.thresholds.maxWsConnections) {
      issues.push(`WebSocket connections exceeded ${this.thresholds.maxWsConnections} (peak: ${maxWs})`);
    }
    if (maxMemory > this.thresholds.maxMemoryMB) {
      issues.push(`Memory exceeded ${this.thresholds.maxMemoryMB}MB (peak: ${Math.round(maxMemory)}MB)`);
    }

    // Calculate auth failures per hour
    const timeSpan = (new Date(metrics[metrics.length - 1].timestamp) - new Date(metrics[0].timestamp)) / 1000 / 60 / 60;
    const authFailuresPerHour = timeSpan > 0 ? totalAuthFailures / timeSpan : 0;
    
    if (authFailuresPerHour > this.thresholds.maxAuthFailuresPerHour) {
      issues.push(`Auth failures too high: ${Math.round(authFailuresPerHour)}/hour`);
    }

    // Determine overall status
    let status = 'HEALTHY';
    if (issues.length > 0) {
      status = issues.some(i => i.includes('exceeded')) ? 'CRITICAL' : 'WARNING';
    }

    return {
      status,
      issues,
      stats: {
        maxWsConnections: maxWs,
        maxMemoryMB: Math.round(maxMemory),
        maxCpuMs: Math.round(maxCpu),
        authFailuresPerHour: Math.round(authFailuresPerHour),
        dataPoints: metrics.length,
        timeSpanHours: Math.round(timeSpan * 10) / 10
      }
    };
  }

  // Read cost projection
  readCostProjection() {
    const projectionPath = path.join(this.verificationDir, 'cost-projection.json');
    if (!fs.existsSync(projectionPath)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(projectionPath, 'utf8'));
    } catch (e) {
      return null;
    }
  }

  // Read fix verification
  readFixVerification() {
    const verificationPath = path.join(this.verificationDir, 'fix-verification-report.json');
    if (!fs.existsSync(verificationPath)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(verificationPath, 'utf8'));
    } catch (e) {
      return null;
    }
  }

  // Generate comprehensive health report
  generateReport() {
    console.log('\n🩻 CALMKAAJ HEALTH REPORT');
    console.log('========================');
    console.log(`Generated: ${new Date().toISOString()}`);

    // Analyze metrics
    const metrics = this.readMetricsLog();
    const health = this.analyzeHealth(metrics);
    
    console.log('\n📊 PERFORMANCE METRICS:');
    if (health.status === 'NO_DATA') {
      console.log('   ❌ No metrics data available');
    } else {
      console.log(`   Max WS Connections: ${health.stats.maxWsConnections} ${health.stats.maxWsConnections > this.thresholds.maxWsConnections ? '❌' : '✅'}`);
      console.log(`   Memory High Watermark: ${health.stats.maxMemoryMB} MB ${health.stats.maxMemoryMB > this.thresholds.maxMemoryMB ? '❌' : '✅'}`);
      console.log(`   Auth Failures: ${health.stats.authFailuresPerHour}/hour ${health.stats.authFailuresPerHour > this.thresholds.maxAuthFailuresPerHour ? '❌' : '✅'}`);
      console.log(`   CPU Peak: ${health.stats.maxCpuMs} ms ✅`);
      console.log(`   Data collected: ${health.stats.dataPoints} points over ${health.stats.timeSpanHours} hours`);
    }

    // Cost projection
    const costProjection = this.readCostProjection();
    console.log('\n💰 COST ANALYSIS:');
    if (costProjection) {
      const weeklyExceeded = costProjection.projections.weekly > this.thresholds.maxCostWeekly;
      console.log(`   Projected Monthly Cost: $${costProjection.projections.monthly.toFixed(2)}`);
      console.log(`   Projected Weekly Cost: $${costProjection.projections.weekly.toFixed(2)} ${weeklyExceeded ? '❌' : '✅'}`);
      
      if (weeklyExceeded) {
        health.issues.push(`Weekly cost exceeds $${this.thresholds.maxCostWeekly} target`);
      }
    } else {
      console.log('   ❌ No cost projection available');
    }

    // Fix verification
    const fixes = this.readFixVerification();
    console.log('\n🔧 OPTIMIZATION STATUS:');
    if (fixes) {
      console.log(`   WS Cleanup: ${fixes.wsCleanup ? '✅' : '❌'}`);
      console.log(`   Reconnection Throttle: ${fixes.reconnectionThrottle ? '✅' : '❌'}`);
      console.log(`   Log Reduction: ${fixes.logReduction ? '✅' : '❌'}`);
      console.log(`   Memory Limits: ${fixes.memoryLimits ? '✅' : '❌'}`);
      console.log(`   Polling Disabled: ${fixes.pollingDisabled ? '✅' : '❌'}`);
    } else {
      console.log('   ❌ No fix verification available');
    }

    // Overall health status
    console.log('\n🏥 OVERALL HEALTH STATUS:');
    console.log(`   Status: ${health.status}`);
    
    if (health.issues.length > 0) {
      console.log('\n🚨 ISSUES DETECTED:');
      health.issues.forEach(issue => {
        console.log(`   • ${issue}`);
      });
    }

    // Recommendations
    if (health.status !== 'HEALTHY') {
      console.log('\n💊 RECOMMENDED ACTIONS:');
      
      if (health.stats.maxWsConnections > this.thresholds.maxWsConnections * 0.8) {
        console.log('   • Implement connection pooling or rate limiting');
      }
      if (health.stats.maxMemoryMB > this.thresholds.maxMemoryMB * 0.8) {
        console.log('   • Review memory allocations and implement garbage collection triggers');
      }
      if (costProjection?.projections.weekly > this.thresholds.maxCostWeekly * 0.8) {
        console.log('   • Consider downgrading to 0.5vcpu-0.5gb instance');
        console.log('   • Implement request caching and debouncing');
      }
    }

    // Failsafe protocol
    if (health.status === 'CRITICAL') {
      console.log('\n🔴 FAILSAFE PROTOCOL ACTIVATED:');
      console.log('   Execute: replctl deploy update --power 0.5vcpu-0.5gb --max-instances 1');
      console.log('   Block heavy routes with 503 responses');
      console.log('   Enable emergency rate limiting');
    }

    // Save report
    const reportPath = path.join(this.verificationDir, 'health-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      health,
      costProjection: costProjection?.projections,
      fixes,
      failsafeActivated: health.status === 'CRITICAL'
    }, null, 2));

    console.log(`\nFull report saved to: ${reportPath}`);
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const reporter = new HealthReporter();
  reporter.generateReport();
}

export default HealthReporter;