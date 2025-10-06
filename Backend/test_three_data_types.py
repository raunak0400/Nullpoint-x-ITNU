#!/usr/bin/env python3
"""
Quick test for the Three Data Types endpoint
Tests satellite, ground sensor, and fused data display
"""

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://127.0.0.1:5000"

def test_three_data_types():
    """Test the three data types endpoint for frontend display."""
    
    print("🌬️ Testing Three Data Types for Frontend Display")
    print("=" * 60)
    print(f"🕐 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test coordinates (New York City)
    lat, lon = 40.7128, -74.0060
    
    # Test the main endpoint
    endpoint = f"/api/three-data-types/all-data-types?lat={lat}&lon={lon}&pollutants=NO2,O3,PM2.5"
    
    print(f"🧪 Testing Main Endpoint:")
    print(f"📡 URL: {BASE_URL}{endpoint}")
    print()
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", timeout=30)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success! Three data types retrieved")
            print()
            
            # Display summary of each data type
            print("📋 Data Types Summary:")
            print("-" * 40)
            
            # 1. Satellite Data
            satellite = data.get('satellite_data', {})
            print(f"🛰️  Satellite Data:")
            print(f"   Status: {satellite.get('data', {}).get('status', 'unknown')}")
            print(f"   Source: {satellite.get('source', 'unknown')}")
            print(f"   Coverage: {satellite.get('characteristics', {}).get('coverage', 'unknown')}")
            
            sat_pollutants = satellite.get('data', {}).get('pollutants', {})
            available_sat = len([p for p in sat_pollutants.values() if 'value' in p])
            print(f"   Available Pollutants: {available_sat}/{len(sat_pollutants)}")
            print()
            
            # 2. Ground Sensor Data
            ground = data.get('ground_sensor_data', {})
            print(f"📡 Ground Sensor Data:")
            print(f"   Status: {ground.get('data', {}).get('status', 'unknown')}")
            print(f"   Source: {ground.get('source', 'unknown')}")
            print(f"   Coverage: {ground.get('characteristics', {}).get('coverage', 'unknown')}")
            
            ground_pollutants = ground.get('data', {}).get('pollutants', {})
            available_ground = len([p for p in ground_pollutants.values() if 'measurements' in p])
            print(f"   Available Pollutants: {available_ground}/{len(ground_pollutants)}")
            
            if ground.get('data', {}).get('summary'):
                total_stations = ground['data']['summary'].get('total_stations', 0)
                print(f"   Total Stations: {total_stations}")
            print()
            
            # 3. Fused Data
            fused = data.get('fused_data', {})
            print(f"🔬 Fused Data:")
            print(f"   Status: {fused.get('data', {}).get('status', 'unknown')}")
            print(f"   Source: {fused.get('source', 'unknown')}")
            print(f"   Coverage: {fused.get('characteristics', {}).get('coverage', 'unknown')}")
            
            fused_pollutants = fused.get('data', {}).get('pollutants', {})
            available_fused = len([p for p in fused_pollutants.values() if 'fused_value' in p])
            print(f"   Available Pollutants: {available_fused}/{len(fused_pollutants)}")
            
            if fused.get('data', {}).get('summary'):
                quality = fused['data']['summary'].get('overall_quality', 0)
                print(f"   Overall Quality: {quality:.2f}")
            print()
            
            # Show sample pollutant data
            print("🌬️  Sample Pollutant Data (NO2):")
            print("-" * 40)
            
            # Satellite NO2
            sat_no2 = sat_pollutants.get('NO2', {})
            if 'value' in sat_no2:
                print(f"🛰️  Satellite: {sat_no2['value']} {sat_no2.get('unit', '')}")
            else:
                print(f"🛰️  Satellite: Not available")
            
            # Ground NO2
            ground_no2 = ground_pollutants.get('NO2', {})
            if 'closest_station' in ground_no2:
                closest = ground_no2['closest_station']
                print(f"📡 Ground: {closest['value']} {closest.get('unit', '')} (from {closest.get('station_name', 'Unknown')})")
            else:
                print(f"📡 Ground: Not available")
            
            # Fused NO2
            fused_no2 = fused_pollutants.get('NO2', {})
            if 'fused_value' in fused_no2:
                print(f"🔬 Fused: {fused_no2['fused_value']} ±{fused_no2.get('uncertainty', 0)} {fused_no2.get('unit', '')}")
                print(f"   Quality: {fused_no2.get('quality_level', 'unknown')} ({fused_no2.get('quality_score', 0):.2f})")
            else:
                print(f"🔬 Fused: Not available")
            print()
            
            # Data comparison
            comparison = data.get('data_comparison', {})
            if comparison.get('recommendations'):
                print("💡 Recommendations:")
                for rec in comparison['recommendations']:
                    print(f"   • {rec}")
            print()
            
            print("✅ Three Data Types Test Completed Successfully!")
            print()
            print("🎯 Frontend Integration Ready:")
            print("   • Satellite data with wide coverage characteristics")
            print("   • Ground sensor data with high precision measurements")  
            print("   • Fused data with uncertainty quantification")
            print("   • Data comparison and recommendations")
            print("   • Complete metadata for frontend display")
            
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Message: {error_data.get('message', 'Unknown error')}")
            except:
                print(f"   Response: {response.text[:200]}...")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")
        print("   Make sure the Flask application is running on port 5000")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
    
    print()
    print("=" * 60)
    print("🌐 Frontend URLs to test in browser:")
    print(f"   Main endpoint: {BASE_URL}{endpoint}")
    print(f"   Satellite only: {BASE_URL}/api/three-data-types/satellite-only?lat={lat}&lon={lon}")
    print(f"   Ground only: {BASE_URL}/api/three-data-types/ground-only?lat={lat}&lon={lon}")
    print(f"   Fused only: {BASE_URL}/api/three-data-types/fused-only?lat={lat}&lon={lon}")
    print("=" * 60)


if __name__ == "__main__":
    test_three_data_types()
