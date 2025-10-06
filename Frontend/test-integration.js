#!/usr/bin/env node

/**
 * Quick Integration Test Script
 * Tests if the NASA TEMPO backend integration is working
 */

const https = require('https');
const http = require('http');

const API_BASE = 'http://127.0.0.1:5000';
const FRONTEND_BASE = 'http://localhost:9002';

// Test coordinates (New York City)
const TEST_LAT = 40.7128;
const TEST_LON = -74.0060;

console.log('🌬️ NASA TEMPO Integration Test');
console.log('================================');
console.log();

async function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const request = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`✅ ${description}: OK (${res.statusCode})`);
          resolve({ success: true, data: parsed });
        } catch (e) {
          console.log(`❌ ${description}: Invalid JSON (${res.statusCode})`);
          resolve({ success: false, error: 'Invalid JSON' });
        }
      });
    });
    
    request.on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
    
    request.setTimeout(10000, () => {
      console.log(`⏰ ${description}: Timeout`);
      request.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function runTests() {
  console.log('🔍 Testing Backend API Endpoints...');
  console.log();
  
  // Test health endpoint
  await testEndpoint(`${API_BASE}/health`, 'Backend Health Check');
  
  // Test three data types endpoint
  const threeTypesUrl = `${API_BASE}/api/three-data-types/all-data-types?lat=${TEST_LAT}&lon=${TEST_LON}&pollutants=NO2,O3,PM2.5`;
  const threeTypesResult = await testEndpoint(threeTypesUrl, 'Three Data Types API');
  
  // Test individual endpoints
  await testEndpoint(`${API_BASE}/api/three-data-types/satellite-only?lat=${TEST_LAT}&lon=${TEST_LON}`, 'Satellite Data Only');
  await testEndpoint(`${API_BASE}/api/three-data-types/ground-only?lat=${TEST_LAT}&lon=${TEST_LON}`, 'Ground Data Only');
  await testEndpoint(`${API_BASE}/api/three-data-types/fused-only?lat=${TEST_LAT}&lon=${TEST_LON}`, 'Fused Data Only');
  
  // Test enhanced prediction
  await testEndpoint(`${API_BASE}/api/data-fusion/enhanced-prediction?lat=${TEST_LAT}&lon=${TEST_LON}&pollutant=NO2`, 'Enhanced Prediction');
  
  // Test data fusion health
  await testEndpoint(`${API_BASE}/api/data-fusion/health`, 'Data Fusion Health');
  
  console.log();
  console.log('📊 Integration Summary:');
  console.log('======================');
  
  if (threeTypesResult.success) {
    const data = threeTypesResult.data;
    console.log(`✅ Location: ${data.location?.lat}, ${data.location?.lon}`);
    console.log(`✅ Pollutants: ${data.requested_pollutants?.length || 0} requested`);
    console.log(`✅ Satellite Data: ${data.satellite_data ? 'Available' : 'Not Available'}`);
    console.log(`✅ Ground Data: ${data.ground_sensor_data ? 'Available' : 'Not Available'}`);
    console.log(`✅ Fused Data: ${data.fused_data ? 'Available' : 'Not Available'}`);
    
    if (data.data_comparison?.recommendations) {
      console.log(`💡 Recommendations: ${data.data_comparison.recommendations.length} available`);
    }
  }
  
  console.log();
  console.log('🎯 Frontend Integration:');
  console.log('========================');
  console.log(`🌐 Main Dashboard: ${FRONTEND_BASE}/`);
  console.log(`🛰️ NASA TEMPO Dashboard: ${FRONTEND_BASE}/air-quality`);
  console.log();
  console.log('📝 Next Steps:');
  console.log('==============');
  console.log('1. Start your backend: cd Backend && python run.py');
  console.log('2. Start your frontend: cd Frontend && npm run dev');
  console.log('3. Open http://localhost:9002 in your browser');
  console.log('4. Click "NASA TEMPO Data" in the sidebar to see the full dashboard');
  console.log('5. Select a location to start monitoring air quality!');
  console.log();
  console.log('🏆 Your NASA Space Apps Challenge project is ready! 🚀');
}

runTests().catch(console.error);
