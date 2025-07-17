#!/usr/bin/env node

/**
 * CalmKaaj Production Optimization Testing Framework
 * Tests and verifies resource optimizations between development and production modes
 */

import { spawn, exec } from 'child_process';
import fs from 'fs';
import http from 'http';

class OptimizationTester {
  constructor() {
    this.results = {
      development: {},
      production: {},
      tests: {}
    };
  }

  // Test HTTP endpoints
  async testEndpoint(url, expectedStatus = 200) {
    return new Promise((resolve) => {
      const req = http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            size: data.length,
            success: res.statusCode === expectedStatus || (expectedStatus === 'any' && res.statusCode < 500)
          });
        });
      });
      req.on('error', () => resolve({ status: 0, size: 0, success: false }));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ status: 0, size: 0, success: false });
      });
    });
  }

  // Get process resource usage
  getProcessStats(processName) {
    return new Promise((resolve) => {
      exec(`ps aux | grep "${processName}" | grep -v grep`, (error, stdout) => {
        if (error || !stdout.trim()) {
          return resolve({ processes: 0, totalCPU: 0, totalMemory: 0, details: [] });
        }

        const lines = stdout.trim().split('\n');
        const processes = lines.map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            pid: parts[1],
            cpu: parseFloat(parts[2]),
            memory: parseFloat(parts[3]),
            memoryMB: parseInt(parts[5]) / 1024,
            command: parts.slice(10).join(' ')
          };
        });

        const totalCPU = processes.reduce((sum, p) => sum + p.cpu, 0);
        const totalMemory = processes.reduce((sum, p) => sum + p.memoryMB, 0);

        resolve({
          processes: processes.length,
          totalCPU,
          totalMemory,
          details: processes
        });
      });
    });
  }

  // Test production server
  async testProductionServer() {
    console.log('🚀 Testing Production Server...');
    
    // Start production server
    const prodProcess = spawn('node', ['dist/index.js'], {
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'pipe'
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get resource usage
    const prodStats = await this.getProcessStats('node.*dist/index.js');
    
    // Test endpoints
    const endpoints = [
      { url: 'http://localhost:5000/', expectedStatus: 200 },
      { url: 'http://localhost:5000/api/health', expectedStatus: 'any' },
      { url: 'http://localhost:5000/assets/index-KJKGv9FC.js', expectedStatus: 200 },
      { url: 'http://localhost:5000/manifest.json', expectedStatus: 200 }
    ];

    const endpointResults = {};
    for (const endpoint of endpoints) {
      const result = await this.testEndpoint(endpoint.url, endpoint.expectedStatus);
      endpointResults[endpoint.url] = result;
    }

    // Kill production server
    prodProcess.kill();

    this.results.production = {
      resourceUsage: prodStats,
      endpoints: endpointResults,
      serverType: 'Single Node.js process'
    };

    console.log('✅ Production server tested');
    return this.results.production;
  }

  // Test development server (for comparison)
  async testDevelopmentServer() {
    console.log('🔧 Testing Development Server...');
    
    // Start development server
    const devProcess = spawn('npm', ['run', 'dev'], {
      env: { ...process.env, NODE_ENV: 'development' },
      stdio: 'pipe'
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Get resource usage for all development processes
    const tsxStats = await this.getProcessStats('tsx.*server/index.ts');
    const esbuildStats = await this.getProcessStats('esbuild');
    const viteStats = await this.getProcessStats('vite');

    const totalDevStats = {
      processes: tsxStats.processes + esbuildStats.processes + viteStats.processes,
      totalCPU: tsxStats.totalCPU + esbuildStats.totalCPU + viteStats.totalCPU,
      totalMemory: tsxStats.totalMemory + esbuildStats.totalMemory + viteStats.totalMemory,
      details: {
        tsx: tsxStats,
        esbuild: esbuildStats,
        vite: viteStats
      }
    };

    // Test endpoints
    const endpoints = [
      { url: 'http://localhost:5000/', expectedStatus: 200 },
      { url: 'http://localhost:5000/api/health', expectedStatus: 'any' }
    ];

    const endpointResults = {};
    for (const endpoint of endpoints) {
      const result = await this.testEndpoint(endpoint.url, endpoint.expectedStatus);
      endpointResults[endpoint.url] = result;
    }

    // Kill development server
    devProcess.kill();

    this.results.development = {
      resourceUsage: totalDevStats,
      endpoints: endpointResults,
      serverType: 'Multiple processes (tsx, esbuild, vite)'
    };

    console.log('✅ Development server tested');
    return this.results.development;
  }

  // Calculate optimization metrics
  calculateOptimizations() {
    const dev = this.results.development.resourceUsage;
    const prod = this.results.production.resourceUsage;

    const cpuReduction = dev.totalCPU > 0 ? ((dev.totalCPU - prod.totalCPU) / dev.totalCPU * 100) : 0;
    const memoryReduction = dev.totalMemory > 0 ? ((dev.totalMemory - prod.totalMemory) / dev.totalMemory * 100) : 0;
    const processReduction = dev.processes > 0 ? ((dev.processes - prod.processes) / dev.processes * 100) : 0;

    return {
      cpuReduction: Math.round(cpuReduction * 100) / 100,
      memoryReduction: Math.round(memoryReduction * 100) / 100,
      processReduction: Math.round(processReduction * 100) / 100,
      estimatedComputeReduction: Math.round(((cpuReduction + memoryReduction) / 2) * 100) / 100
    };
  }

  // Generate comprehensive report
  generateReport() {
    const optimizations = this.calculateOptimizations();
    
    console.log('\n=== CALMKAAJ OPTIMIZATION VERIFICATION REPORT ===\n');
    
    console.log('📊 RESOURCE USAGE COMPARISON:');
    console.log('┌─────────────────┬─────────────────┬─────────────────┐');
    console.log('│     Metric      │   Development   │   Production    │');
    console.log('├─────────────────┼─────────────────┼─────────────────┤');
    console.log(`│ Process Count   │       ${this.results.development.resourceUsage.processes}         │       ${this.results.production.resourceUsage.processes}         │`);
    console.log(`│ CPU Usage       │    ${this.results.development.resourceUsage.totalCPU.toFixed(1)}%       │    ${this.results.production.resourceUsage.totalCPU.toFixed(1)}%       │`);
    console.log(`│ Memory Usage    │   ${this.results.development.resourceUsage.totalMemory.toFixed(1)}MB      │   ${this.results.production.resourceUsage.totalMemory.toFixed(1)}MB      │`);
    console.log('└─────────────────┴─────────────────┴─────────────────┘');
    
    console.log('\n🎯 OPTIMIZATION RESULTS:');
    console.log(`• CPU Reduction: ${optimizations.cpuReduction}%`);
    console.log(`• Memory Reduction: ${optimizations.memoryReduction}%`);
    console.log(`• Process Reduction: ${optimizations.processReduction}%`);
    console.log(`• Estimated Compute Reduction: ${optimizations.estimatedComputeReduction}%`);
    
    console.log('\n💰 COST IMPACT:');
    const weeklyBefore = 15;
    const weeklyAfter = weeklyBefore * (1 - optimizations.estimatedComputeReduction / 100);
    const annualSavings = (weeklyBefore - weeklyAfter) * 52;
    
    console.log(`• Weekly Cost Before: $${weeklyBefore}`);
    console.log(`• Weekly Cost After: $${weeklyAfter.toFixed(2)}`);
    console.log(`• Annual Savings: $${annualSavings.toFixed(2)}`);
    
    console.log('\n✅ FUNCTIONALITY TESTS:');
    const prodEndpoints = this.results.production.endpoints;
    Object.keys(prodEndpoints).forEach(url => {
      const result = prodEndpoints[url];
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`• ${url.replace('http://localhost:5000', '')}: ${status} (${result.status})`);
    });
    
    console.log('\n🚀 RECOMMENDATION:');
    if (optimizations.estimatedComputeReduction > 80) {
      console.log('✅ EXCELLENT: Production optimizations are working perfectly!');
      console.log('   Your app is now cost-efficient and suitable for company use.');
    } else if (optimizations.estimatedComputeReduction > 50) {
      console.log('⚠️  GOOD: Significant optimizations achieved, but room for improvement.');
    } else {
      console.log('❌ POOR: Optimizations not effective. Review configuration.');
    }
    
    return optimizations;
  }

  // Quick production-only test
  async quickProductionTest() {
    console.log('🔍 Quick Production Server Test...\n');
    
    // Check if production server is running
    const prodStats = await this.getProcessStats('node.*dist/index.js');
    
    if (prodStats.processes === 0) {
      console.log('❌ Production server not running. Starting...');
      // Start production server
      const prodProcess = spawn('node', ['dist/index.js'], {
        env: { ...process.env, NODE_ENV: 'production' },
        stdio: 'pipe',
        detached: true
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check again
      const newProdStats = await this.getProcessStats('node.*dist/index.js');
      if (newProdStats.processes === 0) {
        console.log('❌ Failed to start production server');
        return;
      }
    }
    
    // Get current stats
    const currentStats = await this.getProcessStats('node.*dist/index.js');
    const devProcesses = await this.getProcessStats('tsx.*server/index.ts');
    
    console.log('📊 CURRENT RESOURCE USAGE:');
    console.log(`• Production Processes: ${currentStats.processes}`);
    console.log(`• Production CPU: ${currentStats.totalCPU.toFixed(1)}%`);
    console.log(`• Production Memory: ${currentStats.totalMemory.toFixed(1)}MB`);
    console.log(`• Development Processes: ${devProcesses.processes}`);
    
    // Test endpoints
    const endpoints = [
      'http://localhost:5000/',
      'http://localhost:5000/api/health',
      'http://localhost:5000/assets/index-KJKGv9FC.js',
      'http://localhost:5000/manifest.json'
    ];
    
    console.log('\n🔗 ENDPOINT TESTS:');
    for (const url of endpoints) {
      const result = await this.testEndpoint(url, 'any');
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const path = url.replace('http://localhost:5000', '') || '/';
      console.log(`• ${path}: ${status} (${result.status})`);
    }
    
    // Resource efficiency check
    console.log('\n⚡ EFFICIENCY ANALYSIS:');
    if (currentStats.totalCPU < 1.0 && currentStats.totalMemory < 50) {
      console.log('✅ EXCELLENT: Low resource usage - optimizations working!');
    } else if (currentStats.totalCPU < 5.0 && currentStats.totalMemory < 100) {
      console.log('⚠️  GOOD: Moderate resource usage - acceptable for production.');
    } else {
      console.log('❌ HIGH: Resource usage is high - check for development processes.');
    }
    
    return currentStats;
  }
}

// CLI interface
const args = process.argv.slice(2);
const tester = new OptimizationTester();

async function main() {
  if (args.includes('--quick') || args.includes('-q')) {
    await tester.quickProductionTest();
  } else if (args.includes('--full') || args.includes('-f')) {
    await tester.testProductionServer();
    await tester.testDevelopmentServer();
    tester.generateReport();
  } else {
    console.log('CalmKaaj Optimization Testing Framework');
    console.log('Usage:');
    console.log('  node test-optimizations.js --quick    # Quick production test');
    console.log('  node test-optimizations.js --full     # Full comparison test');
  }
}

main().catch(console.error);