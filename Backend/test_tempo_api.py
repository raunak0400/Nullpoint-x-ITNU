#!/usr/bin/env python3
"""
Test script for Real-time TEMPO API endpoints
Demonstrates fetching NASA TEMPO satellite data for air quality monitoring
"""

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://127.0.0.1:5000"

def test_endpoint(endpoint, description):
    """Test an API endpoint and display results."""
    print(f"\n{'='*60}")
    print(f"🧪 Testing: {description}")
    print(f"📡 Endpoint: {endpoint}")
    print(f"{'='*60}")
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", timeout=30)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success!")
            
            # Pretty print key information
            if 'data' in data:
                print(f"\n📋 Data Summary:")
                if isinstance(data['data'], dict):
                    for key, value in data['data'].items():
                        if key in ['pollutant', 'value', 'unit', 'source', 'measurement_time']:
                            print(f"   {key}: {value}")
                elif isinstance(data['data'], list) and len(data['data']) > 0:
                    print(f"   Records: {len(data['data'])}")
                    print(f"   Sample: {data['data'][0]}")
            
            if 'source' in data:
                print(f"\n🛰️ Data Source: {data['source']}")
            
            if 'location' in data:
                print(f"📍 Location: {data['location']}")
                
            if 'timestamp' in data:
                print(f"⏰ Timestamp: {data['timestamp']}")
                
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Message: {error_data.get('message', 'Unknown error')}")
            except:
                print(f"   Response: {response.text[:200]}...")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")


def main():
    """Run comprehensive tests of the TEMPO API."""
    
    print("🌬️ NASA TEMPO Real-time Air Quality Data API Test")
    print("=" * 60)
    print(f"🕐 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test coordinates (New York City)
    lat, lon = 40.7128, -74.0060
    
    # 1. Health check
    test_endpoint("/health", "Application Health Check")
    
    # 2. TEMPO service health
    test_endpoint("/api/realtime-tempo/health", "TEMPO Service Health Check")
    
    # 3. TEMPO service status
    test_endpoint("/api/realtime-tempo/status", "TEMPO Data Sources Status")
    
    # 4. TEMPO coverage information
    test_endpoint("/api/realtime-tempo/coverage", "TEMPO Satellite Coverage Info")
    
    # 5. Single pollutant data (NO2)
    test_endpoint(f"/api/realtime-tempo/?lat={lat}&lon={lon}&pollutant=NO2", 
                 f"Real-time NO2 data for NYC ({lat}, {lon})")
    
    # 6. Single pollutant data (O3)
    test_endpoint(f"/api/realtime-tempo/?lat={lat}&lon={lon}&pollutant=O3", 
                 f"Real-time O3 data for NYC ({lat}, {lon})")
    
    # 7. Multiple pollutants
    test_endpoint(f"/api/realtime-tempo/multiple?lat={lat}&lon={lon}&pollutants=NO2,O3,HCHO", 
                 f"Multiple pollutants (NO2,O3,HCHO) for NYC")
    
    # 8. All pollutants
    test_endpoint(f"/api/realtime-tempo/multiple?lat={lat}&lon={lon}", 
                 f"All available pollutants for NYC")
    
    # 9. Test different location (Los Angeles)
    la_lat, la_lon = 34.0522, -118.2437
    test_endpoint(f"/api/realtime-tempo/?lat={la_lat}&lon={la_lon}&pollutant=PM", 
                 f"Real-time PM data for Los Angeles ({la_lat}, {la_lon})")
    
    # 10. Test ML forecasting integration
    test_endpoint(f"/api/forecast/?lat={lat}&lon={lon}&days=7&pollutant=NO2", 
                 f"ML Forecast for NO2 in NYC (7 days)")
    
    # 11. Test merged data from all sources
    test_endpoint(f"/api/forecast/merged?lat={lat}&lon={lon}", 
                 f"Merged data from all sources for NYC")
    
    print(f"\n{'='*60}")
    print("🎉 Test completed!")
    print("📊 Check the results above to verify TEMPO data integration")
    print("🌐 Your frontend can now use these endpoints for real-time air quality data")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
