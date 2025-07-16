#!/usr/bin/env node

// CalmKaaj Performance Monitor - Lightweight monitoring without external dependencies
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PerformanceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      memoryUsage: [],
      cpuUsage: [],
      webSocketConnections: 0,
      apiCalls: 0,
      authFailures: 0,
      timestamp: new Date().toISOString()
    };
    this.logFile = path.join(__dirname, 'performance.log');
  }

  // Monitor memory usage
  collectMemoryMetrics() {
    const memUsage = process.memoryUsage();
    const memMetrics = {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      timestamp: new Date().toISOString()
    };
    
    this.metrics.memoryUsage.push(memMetrics);
    return memMetrics;
  }

  // Monitor system resources
  collectSystemMetrics() {
    try {
      // Get system memory info
      const memInfo = execSync('free -m', { encoding: 'utf8' });
      const memLines = memInfo.split('\n')[1].split(/\s+/);
      
      const systemMetrics = {
        totalSystemMem: parseInt(memLines[1]),
        usedSystemMem: parseInt(memLines[2]),
        freeSystemMem: parseInt(memLines[3]),
        timestamp: new Date().toISOString()
      };
      
      return systemMetrics;
    } catch (error) {
      console.error('Error collecting system metrics:', error.message);
      return null;
    }
  }

  // Monitor WebSocket connections (simulate by checking log patterns)
  analyzeLogPatterns() {
    try {
      // Count recent auth failures from logs
      const recentLogs = execSync('tail -100 /tmp/app.log 2>/dev/null || echo "No logs found"', { encoding: 'utf8' });
      const authFailures = (recentLogs.match(/Auth failed for:/g) || []).length;
      
      this.metrics.authFailures = authFailures;
      
      return {
        authFailures,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { authFailures: 0, timestamp: new Date().toISOString() };
    }
  }

  // Generate performance report
  generateReport() {
    const memMetrics = this.collectMemoryMetrics();
    const systemMetrics = this.collectSystemMetrics();
    const logMetrics = this.analyzeLogPatterns();
    
    const report = {
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      process: {
        pid: process.pid,
        memory: memMetrics,
        cpu: process.cpuUsage()
      },
      system: systemMetrics,
      logs: logMetrics,
      performance: {
        memoryTrend: this.getMemoryTrend(),
        healthStatus: this.getHealthStatus(memMetrics, systemMetrics)
      }
    };
    
    return report;
  }

  // Analyze memory trend
  getMemoryTrend() {
    if (this.metrics.memoryUsage.length < 2) return 'insufficient_data';
    
    const recent = this.metrics.memoryUsage.slice(-5);
    const avgRecent = recent.reduce((sum, m) => sum + m.heapUsed, 0) / recent.length;
    const older = this.metrics.memoryUsage.slice(-10, -5);
    
    if (older.length === 0) return 'increasing';
    
    const avgOlder = older.reduce((sum, m) => sum + m.heapUsed, 0) / older.length;
    
    if (avgRecent > avgOlder * 1.1) return 'increasing';
    if (avgRecent < avgOlder * 0.9) return 'decreasing';
    return 'stable';
  }

  // Determine health status
  getHealthStatus(memMetrics, systemMetrics) {
    const criticalMemory = memMetrics.heapUsed > 500; // 500MB threshold
    const systemMemoryHigh = systemMetrics ? (systemMetrics.usedSystemMem / systemMetrics.totalSystemMem) > 0.85 : false;
    const highAuthFailures = this.metrics.authFailures > 50;
    
    if (criticalMemory || systemMemoryHigh) return 'critical';
    if (highAuthFailures) return 'warning';
    return 'healthy';
  }

  // Log to file
  logMetrics(report) {
    const logEntry = `${report.timestamp} | Memory: ${report.process.memory.heapUsed}MB | System: ${report.system ? report.system.usedSystemMem : 'unknown'}MB | Auth Failures: ${report.logs.authFailures} | Status: ${report.performance.healthStatus}\n`;
    fs.appendFileSync(this.logFile, logEntry);
  }

  // Start monitoring
  start(intervalMs = 10000) {
    console.log('🔍 CalmKaaj Performance Monitor Started');
    console.log('📊 Monitoring memory usage, system resources, and performance metrics...');
    
    const monitor = () => {
      const report = this.generateReport();
      this.logMetrics(report);
      
      console.log(`\n📈 Performance Report (${report.timestamp})`);
      console.log(`⏱️  Uptime: ${report.uptime}s`);
      console.log(`💾 Memory: ${report.process.memory.heapUsed}MB (${report.performance.memoryTrend})`);
      console.log(`🖥️  System: ${report.system ? `${report.system.usedSystemMem}/${report.system.totalSystemMem}MB` : 'unknown'}`);
      console.log(`🔐 Auth Failures: ${report.logs.authFailures}`);
      console.log(`🏥 Health: ${report.performance.healthStatus.toUpperCase()}`);
      
      if (report.performance.healthStatus === 'critical') {
        console.log('🚨 CRITICAL: High memory usage detected!');
      }
    };
    
    monitor(); // Initial run
    const interval = setInterval(monitor, intervalMs);
    
    // Cleanup on exit
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('\n🔴 Performance monitoring stopped');
      process.exit(0);
    });
    
    return interval;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new PerformanceMonitor();
  const interval = parseInt(process.argv[2]) || 10000;
  monitor.start(interval);
}

export default PerformanceMonitor;