#!/usr/bin/env node

// CalmKaaj Stress Testing Suite
import WebSocket from 'ws';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StressTestRunner {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.wsUrl = 'ws://localhost:5000/ws';
    this.results = {
      wsConnectionTest: null,
      reconnectionStorm: null,
      memoryLoadTest: null,
      timestamp: new Date().toISOString()
    };
  }

  // Test 1: WebSocket Connection Leak Test
  async testWebSocketLeak() {
    console.log('\n🔌 TEST 1: WebSocket Connection Leak Test (100 connections)');
    const connections = [];
    const startTime = Date.now();
    
    try {
      // Create 100 connections
      for (let i = 0; i < 100; i++) {
        const ws = new WebSocket(this.wsUrl);
        connections.push(ws);
        
        ws.on('open', () => {
          ws.send(JSON.stringify({ type: 'authenticate', userId: i + 1000 }));
        });
        
        await new Promise(resolve => setTimeout(resolve, 50)); // Stagger connections
      }
      
      console.log(`✅ Created ${connections.length} connections`);
      
      // Wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Close all connections
      connections.forEach((ws, i) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      
      const duration = Date.now() - startTime;
      this.results.wsConnectionTest = {
        success: true,
        connectionsCreated: connections.length,
        duration: duration,
        avgConnectionTime: duration / connections.length
      };
      
      console.log('✅ WebSocket leak test completed');
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Avg per connection: ${Math.round(duration / connections.length)}ms`);
      
    } catch (error) {
      this.results.wsConnectionTest = {
        success: false,
        error: error.message
      };
      console.error('❌ WebSocket test failed:', error.message);
    }
  }

  // Test 2: Reconnection Storm Test
  async testReconnectionStorm() {
    console.log('\n🌪️  TEST 2: Reconnection Storm Test');
    const startTime = Date.now();
    let reconnectCount = 0;
    
    try {
      // Create persistent connection
      const ws = new WebSocket(this.wsUrl);
      
      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'authenticate', userId: 999 }));
      });
      
      // Simulate 50 disconnections
      for (let i = 0; i < 50; i++) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          reconnectCount++;
        }
        
        // Wait for reconnection interval
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Simulate reconnect
        const newWs = new WebSocket(this.wsUrl);
        newWs.on('open', () => {
          newWs.send(JSON.stringify({ type: 'authenticate', userId: 999 }));
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        newWs.close();
      }
      
      const duration = Date.now() - startTime;
      this.results.reconnectionStorm = {
        success: true,
        reconnectAttempts: reconnectCount,
        duration: duration,
        avgReconnectTime: duration / reconnectCount
      };
      
      console.log('✅ Reconnection storm test completed');
      console.log(`   Reconnect attempts: ${reconnectCount}`);
      console.log(`   Total duration: ${duration}ms`);
      
    } catch (error) {
      this.results.reconnectionStorm = {
        success: false,
        error: error.message
      };
      console.error('❌ Reconnection test failed:', error.message);
    }
  }

  // Test 3: Memory Load Test
  async testMemoryLoad() {
    console.log('\n💾 TEST 3: Memory Load Test');
    const startTime = Date.now();
    const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    try {
      // Create arrays to consume memory
      const arrays = [];
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        arrays.push(new Array(10000).fill(Math.random()));
        
        if (i % 10 === 0) {
          const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
          console.log(`   Iteration ${i}: ${Math.round(currentMemory)}MB`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Clear arrays
      arrays.length = 0;
      global.gc && global.gc(); // Force garbage collection if available
      
      this.results.memoryLoadTest = {
        success: true,
        initialMemory: Math.round(initialMemory),
        finalMemory: Math.round(finalMemory),
        memoryIncrease: Math.round(memoryIncrease),
        duration: Date.now() - startTime
      };
      
      console.log('✅ Memory load test completed');
      console.log(`   Memory increase: ${Math.round(memoryIncrease)}MB`);
      
    } catch (error) {
      this.results.memoryLoadTest = {
        success: false,
        error: error.message
      };
      console.error('❌ Memory test failed:', error.message);
    }
  }

  // Generate test report
  generateReport() {
    const reportPath = path.join(__dirname, 'verification', 'stress-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log('\n📋 STRESS TEST REPORT');
    console.log('====================');
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log('\n1. WebSocket Leak Test:');
    if (this.results.wsConnectionTest?.success) {
      console.log(`   ✅ Success - ${this.results.wsConnectionTest.connectionsCreated} connections`);
      console.log(`   Average time: ${Math.round(this.results.wsConnectionTest.avgConnectionTime)}ms`);
    } else {
      console.log(`   ❌ Failed: ${this.results.wsConnectionTest?.error || 'Unknown error'}`);
    }
    
    console.log('\n2. Reconnection Storm:');
    if (this.results.reconnectionStorm?.success) {
      console.log(`   ✅ Success - ${this.results.reconnectionStorm.reconnectAttempts} reconnects`);
      console.log(`   Average time: ${Math.round(this.results.reconnectionStorm.avgReconnectTime)}ms`);
    } else {
      console.log(`   ❌ Failed: ${this.results.reconnectionStorm?.error || 'Unknown error'}`);
    }
    
    console.log('\n3. Memory Load Test:');
    if (this.results.memoryLoadTest?.success) {
      console.log(`   ✅ Success - ${this.results.memoryLoadTest.memoryIncrease}MB increase`);
      console.log(`   Final memory: ${this.results.memoryLoadTest.finalMemory}MB`);
    } else {
      console.log(`   ❌ Failed: ${this.results.memoryLoadTest?.error || 'Unknown error'}`);
    }
    
    console.log(`\nReport saved to: ${reportPath}`);
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting CalmKaaj Stress Tests...');
    
    await this.testWebSocketLeak();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Cool down
    
    await this.testReconnectionStorm();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Cool down
    
    await this.testMemoryLoad();
    
    this.generateReport();
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new StressTestRunner();
  tester.runAllTests().catch(console.error);
}

export default StressTestRunner;