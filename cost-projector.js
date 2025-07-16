#!/usr/bin/env node

// CalmKaaj Cost Projection Calculator
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CostProjector {
  constructor() {
    this.metricsPath = path.join(__dirname, 'verification', 'metrics.log');
    this.costRates = {
      wsConnection: 0.00001,    // Per connection hour
      apiCall: 0.000005,        // Per API call
      memoryMB: 0.0002,         // Per MB-hour
      cpuMs: 0.0000001,         // Per CPU ms
      logEntry: 0.00001         // Per log entry
    };
  }

  // Parse metrics from log file
  parseMetrics() {
    if (!fs.existsSync(this.metricsPath)) {
      console.error('❌ No metrics log found. Run the app for at least 30 minutes first.');
      return null;
    }

    const content = fs.readFileSync(this.metricsPath, 'utf8');
    const lines = content.trim().split('\n');
    
    if (lines.length < 2) {
      console.error('❌ Insufficient metrics data. Need at least 2 data points.');
      return null;
    }

    const metrics = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(m => m !== null);

    return metrics;
  }

  // Calculate hourly costs from metrics
  calculateHourlyCosts(metrics) {
    if (!metrics || metrics.length === 0) return null;

    // Get average values
    const avgWsConnections = metrics.reduce((sum, m) => sum + m.wsConnections, 0) / metrics.length;
    const avgMemory = metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length;
    const avgCpu = metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length;
    
    // Get rate of API calls (calls per data point)
    const firstMetric = metrics[0];
    const lastMetric = metrics[metrics.length - 1];
    const timeDiff = (new Date(lastMetric.timestamp) - new Date(firstMetric.timestamp)) / 1000 / 60 / 60; // hours
    const apiCallRate = timeDiff > 0 ? (lastMetric.apiCalls - firstMetric.apiCalls) / timeDiff : 0;

    // Calculate costs
    const costs = {
      wsConnections: avgWsConnections * this.costRates.wsConnection,
      apiCalls: apiCallRate * this.costRates.apiCall,
      memory: avgMemory * this.costRates.memoryMB,
      cpu: avgCpu * this.costRates.cpuMs * 3600, // Convert to hourly
      logs: 50 * this.costRates.logEntry // Estimated 50 logs/hour after optimization
    };

    costs.total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    
    return {
      averages: {
        wsConnections: Math.round(avgWsConnections * 100) / 100,
        memory: Math.round(avgMemory * 100) / 100,
        cpu: Math.round(avgCpu * 100) / 100,
        apiCallsPerHour: Math.round(apiCallRate * 100) / 100
      },
      hourlyCosts: costs,
      projections: {
        daily: costs.total * 24,
        weekly: costs.total * 24 * 7,
        monthly: costs.total * 24 * 30
      }
    };
  }

  // Generate cost projection report
  generateProjection() {
    console.log('\n💰 CalmKaaj Cost Projection Analysis');
    console.log('====================================');
    
    const metrics = this.parseMetrics();
    if (!metrics) return;

    const analysis = this.calculateHourlyCosts(metrics);
    if (!analysis) {
      console.error('❌ Failed to analyze metrics');
      return;
    }

    console.log('\n📊 Average Resource Usage:');
    console.log(`   WebSocket Connections: ${analysis.averages.wsConnections}`);
    console.log(`   Memory Usage: ${analysis.averages.memory} MB`);
    console.log(`   CPU Usage: ${analysis.averages.cpu} ms`);
    console.log(`   API Calls/hour: ${analysis.averages.apiCallsPerHour}`);

    console.log('\n💸 Hourly Cost Breakdown:');
    console.log(`   WebSocket: $${analysis.hourlyCosts.wsConnections.toFixed(6)}`);
    console.log(`   API Calls: $${analysis.hourlyCosts.apiCalls.toFixed(6)}`);
    console.log(`   Memory: $${analysis.hourlyCosts.memory.toFixed(6)}`);
    console.log(`   CPU: $${analysis.hourlyCosts.cpu.toFixed(6)}`);
    console.log(`   Logs: $${analysis.hourlyCosts.logs.toFixed(6)}`);
    console.log(`   TOTAL: $${analysis.hourlyCosts.total.toFixed(6)}/hour`);

    console.log('\n📅 Cost Projections:');
    console.log(`   Daily: $${analysis.projections.daily.toFixed(2)}`);
    console.log(`   Weekly: $${analysis.projections.weekly.toFixed(2)}`);
    console.log(`   Monthly: $${analysis.projections.monthly.toFixed(2)}`);

    // Alert if exceeding target
    const weeklyTarget = 5.00;
    if (analysis.projections.weekly > weeklyTarget) {
      console.log(`\n🚨 ALERT: Weekly cost ($${analysis.projections.weekly.toFixed(2)}) exceeds target ($${weeklyTarget})!`);
      console.log('   Recommended actions:');
      console.log('   • Reduce WebSocket reconnection frequency');
      console.log('   • Implement more aggressive caching');
      console.log('   • Review and optimize API call patterns');
    } else {
      console.log(`\n✅ SUCCESS: Weekly cost ($${analysis.projections.weekly.toFixed(2)}) is under target ($${weeklyTarget})`);
    }

    // Save projection
    const projectionPath = path.join(__dirname, 'verification', 'cost-projection.json');
    fs.writeFileSync(projectionPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      dataPoints: metrics.length,
      ...analysis
    }, null, 2));

    console.log(`\nProjection saved to: ${projectionPath}`);
  }

  // Run 24-hour simulation (for demo, we'll use available data)
  async runSimulation() {
    console.log('🚀 Starting Cost Projection Analysis...');
    console.log('   Using available metrics data...\n');
    
    this.generateProjection();
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const projector = new CostProjector();
  projector.runSimulation().catch(console.error);
}

export default CostProjector;