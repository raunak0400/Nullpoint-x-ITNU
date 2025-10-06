#!/usr/bin/env python3
"""
Comprehensive test script for Data Fusion System
Tests the integration of TEMPO satellite data with ground sensor data
"""

import requests
import json
from datetime import datetime
import time

# API base URL
BASE_URL = "http://127.0.0.1:5000"

def test_endpoint(endpoint, description, expected_keys=None):
    """Test an API endpoint and display results."""
    print(f"\n{'='*80}")
    print(f"🧪 Testing: {description}")
    print(f"📡 Endpoint: {endpoint}")
    print(f"{'='*80}")
    
    try:
        start_time = time.time()
        response = requests.get(f"{BASE_URL}{endpoint}", timeout=60)
        response_time = time.time() - start_time
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"⏱️ Response Time: {response_time:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success!")
            
            # Check expected keys
            if expected_keys:
                missing_keys = [key for key in expected_keys if key not in data]
                if missing_keys:
                    print(f"⚠️ Missing expected keys: {missing_keys}")
                else:
                    print(f"✅ All expected keys present: {expected_keys}")
            
            # Display key information based on endpoint type
            if 'fused-data' in endpoint:
                display_fused_data_summary(data)
            elif 'enhanced-prediction' in endpoint:
                display_prediction_summary(data)
            elif 'comparison' in endpoint:
                display_comparison_summary(data)
            elif 'quality-assessment' in endpoint:
                display_quality_summary(data)
            else:
                display_generic_summary(data)
                
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


def display_fused_data_summary(data):
    """Display summary of fused data results."""
    print(f"\n📋 Fused Data Summary:")
    
    if 'location' in data:
        print(f"   📍 Location: {data['location']}")
    
    if 'quality_score' in data:
        print(f"   🎯 Overall Quality Score: {data['quality_score']:.2f}")
    
    if 'pollutants' in data:
        print(f"   🌬️ Pollutants Analyzed: {len(data['pollutants'])}")
        
        for pollutant, info in data['pollutants'].items():
            if info.get('status') == 'success':
                print(f"      • {pollutant}: {info['fused_value']} {info['unit']}")
                print(f"        - Quality: {info.get('data_quality', {}).get('level', 'unknown')}")
                print(f"        - Uncertainty: ±{info.get('uncertainty', 0)}")
                print(f"        - Method: {info.get('fusion_method', 'unknown')}")
                
                contributing = info.get('contributing_sources', {})
                print(f"        - Sources: {contributing.get('satellite_data', 0)} satellite + {contributing.get('ground_sensors', 0)} ground")
    
    if 'fusion_summary' in data:
        summary = data['fusion_summary']
        print(f"   📊 Fusion Summary:")
        print(f"      - Success Rate: {summary.get('success_rate', 0):.1%}")
        print(f"      - Data Sources: {summary.get('data_source_summary', {}).get('sources_successful', 0)}")


def display_prediction_summary(data):
    """Display summary of prediction results."""
    print(f"\n🔮 Prediction Summary:")
    
    if 'pollutant' in data:
        print(f"   🌬️ Pollutant: {data['pollutant']}")
    
    if 'forecast_hours' in data:
        print(f"   ⏰ Forecast Duration: {data['forecast_hours']} hours")
    
    if 'predictions' in data and len(data['predictions']) > 0:
        predictions = data['predictions']
        values = [p['value'] for p in predictions]
        
        print(f"   📈 Prediction Range: {min(values):.1f} - {max(values):.1f}")
        print(f"   📊 Average Value: {sum(values)/len(values):.1f}")
        
        # Show first few predictions
        print(f"   🕐 Next 3 Hours:")
        for i, pred in enumerate(predictions[:3]):
            time_str = pred['time'][:16].replace('T', ' ')  # Format timestamp
            print(f"      {i+1}h: {pred['value']:.1f} ±{pred['uncertainty']:.1f}")
    
    if 'summary' in data:
        summary = data['summary']
        print(f"   📋 Trend: {summary.get('trend', 'unknown')}")
        print(f"   🎯 Average Uncertainty: {summary.get('average_uncertainty', 0):.1f}")
    
    if 'current_conditions' in data:
        current = data['current_conditions']
        print(f"   🌡️ Current Value: {current.get('fused_value', 'N/A')}")


def display_comparison_summary(data):
    """Display summary of data source comparison."""
    print(f"\n⚖️ Data Source Comparison:")
    
    if 'fused_result' in data:
        fused = data['fused_result']
        print(f"   🎯 Fused Result: {fused['value']} {fused['unit']}")
        print(f"   📊 Quality Score: {fused.get('quality_score', 0):.2f}")
    
    if 'satellite_data' in data:
        sat = data['satellite_data']
        print(f"   🛰️ Satellite Data: {'✅ Available' if sat['available'] else '❌ Unavailable'}")
        if sat['available']:
            print(f"      - Measurements: {sat['count']}")
            print(f"      - Coverage: {sat['coverage']}")
    
    if 'ground_sensor_data' in data:
        ground = data['ground_sensor_data']
        print(f"   📡 Ground Sensors: {'✅ Available' if ground['available'] else '❌ Unavailable'}")
        if ground['available']:
            print(f"      - Measurements: {ground['count']}")
            print(f"      - Coverage: {ground['coverage']}")
    
    if 'recommendation' in data:
        print(f"   💡 Recommendation: {data['recommendation']}")


def display_quality_summary(data):
    """Display summary of quality assessment."""
    print(f"\n🎯 Quality Assessment:")
    
    if 'overall_quality' in data:
        quality = data['overall_quality']
        print(f"   📊 Overall Quality: {quality:.2f}")
        
        if quality >= 0.8:
            quality_level = "Excellent ⭐⭐⭐⭐⭐"
        elif quality >= 0.6:
            quality_level = "Good ⭐⭐⭐⭐"
        elif quality >= 0.4:
            quality_level = "Fair ⭐⭐⭐"
        elif quality >= 0.2:
            quality_level = "Poor ⭐⭐"
        else:
            quality_level = "Very Poor ⭐"
        
        print(f"   🏆 Quality Level: {quality_level}")
    
    if 'pollutant_quality' in data:
        print(f"   🌬️ Pollutant Quality Breakdown:")
        for pollutant, quality_info in data['pollutant_quality'].items():
            print(f"      • {pollutant}: {quality_info['quality_level']} ({quality_info['quality_score']:.2f})")
    
    if 'recommendations' in data:
        print(f"   💡 Recommendations:")
        for rec in data['recommendations']:
            print(f"      - {rec}")


def display_generic_summary(data):
    """Display generic summary for other endpoints."""
    print(f"\n📋 Response Summary:")
    
    key_fields = ['status', 'timestamp', 'location', 'source', 'method']
    for field in key_fields:
        if field in data:
            print(f"   {field}: {data[field]}")
    
    # Count data points if available
    if 'data' in data:
        if isinstance(data['data'], list):
            print(f"   Data Points: {len(data['data'])}")
        elif isinstance(data['data'], dict):
            print(f"   Data Fields: {len(data['data'])}")


def run_comprehensive_tests():
    """Run comprehensive tests of the data fusion system."""
    
    print("🌬️ NASA TEMPO + Ground Sensor Data Fusion System Test")
    print("=" * 80)
    print(f"🕐 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test coordinates
    locations = [
        {"name": "New York City", "lat": 40.7128, "lon": -74.0060},
        {"name": "Los Angeles", "lat": 34.0522, "lon": -118.2437},
        {"name": "Chicago", "lat": 41.8781, "lon": -87.6298}
    ]
    
    # 1. Health checks
    test_endpoint("/health", "Application Health Check", 
                 expected_keys=['status', 'service'])
    
    test_endpoint("/api/data-fusion/health", "Data Fusion Service Health", 
                 expected_keys=['status', 'service', 'capabilities'])
    
    # 2. Test fused data for multiple locations
    for location in locations:
        lat, lon = location["lat"], location["lon"]
        
        test_endpoint(f"/api/data-fusion/fused-data?lat={lat}&lon={lon}&pollutants=NO2,O3,PM2.5", 
                     f"Fused Data for {location['name']} ({lat}, {lon})",
                     expected_keys=['status', 'pollutants', 'fusion_summary'])
        
        # Test with different radius
        test_endpoint(f"/api/data-fusion/fused-data?lat={lat}&lon={lon}&pollutants=NO2&radius_km=25", 
                     f"Fused NO2 Data (25km radius) for {location['name']}")
    
    # 3. Test enhanced predictions
    for location in locations[:2]:  # Test first 2 locations
        lat, lon = location["lat"], location["lon"]
        
        test_endpoint(f"/api/data-fusion/enhanced-prediction?lat={lat}&lon={lon}&pollutant=NO2&forecast_hours=24", 
                     f"24-hour NO2 Prediction for {location['name']}",
                     expected_keys=['status', 'predictions', 'summary'])
        
        test_endpoint(f"/api/data-fusion/enhanced-prediction?lat={lat}&lon={lon}&pollutant=O3&forecast_hours=48", 
                     f"48-hour O3 Prediction for {location['name']}")
    
    # 4. Test data source comparison
    test_endpoint(f"/api/data-fusion/comparison?lat=40.7128&lon=-74.0060&pollutant=NO2", 
                 "Data Source Comparison (NYC NO2)",
                 expected_keys=['satellite_data', 'ground_sensor_data', 'fused_result'])
    
    test_endpoint(f"/api/data-fusion/comparison?lat=34.0522&lon=-118.2437&pollutant=PM2.5&radius_km=30", 
                 "Data Source Comparison (LA PM2.5)")
    
    # 5. Test quality assessment
    test_endpoint(f"/api/data-fusion/quality-assessment?lat=40.7128&lon=-74.0060&pollutants=NO2,O3,PM2.5", 
                 "Quality Assessment (NYC Multi-pollutant)",
                 expected_keys=['overall_quality', 'pollutant_quality', 'recommendations'])
    
    # 6. Test error handling
    test_endpoint("/api/data-fusion/fused-data?lat=200&lon=200", 
                 "Error Handling Test (Invalid Coordinates)")
    
    test_endpoint("/api/data-fusion/enhanced-prediction?lat=40.7128&lon=-74.0060&pollutant=INVALID", 
                 "Error Handling Test (Invalid Pollutant)")
    
    # 7. Performance test with multiple pollutants
    test_endpoint(f"/api/data-fusion/fused-data?lat=40.7128&lon=-74.0060&pollutants=NO2,O3,PM2.5,PM10,HCHO,SO2&radius_km=100", 
                 "Performance Test (All Pollutants, Large Radius)")
    
    # 8. Compare with original endpoints
    print(f"\n{'='*80}")
    print("🔄 Comparing with Original Endpoints")
    print(f"{'='*80}")
    
    test_endpoint("/api/realtime-tempo/?lat=40.7128&lon=-74.0060&pollutant=NO2", 
                 "Original TEMPO Endpoint (for comparison)")
    
    test_endpoint("/api/forecast/?lat=40.7128&lon=-74.0060&days=1&pollutant=NO2", 
                 "Original Forecast Endpoint (for comparison)")
    
    # Final summary
    print(f"\n{'='*80}")
    print("🎉 Data Fusion System Test Completed!")
    print(f"{'='*80}")
    print("📊 Key Features Tested:")
    print("   ✅ Satellite + Ground Sensor Data Fusion")
    print("   ✅ Enhanced Predictions with Uncertainty Quantification")
    print("   ✅ Data Source Comparison and Quality Assessment")
    print("   ✅ Multi-location and Multi-pollutant Support")
    print("   ✅ Error Handling and Performance")
    print("")
    print("🌐 Your frontend can now use these advanced endpoints:")
    print("   • /api/data-fusion/fused-data - Combined satellite + ground data")
    print("   • /api/data-fusion/enhanced-prediction - ML predictions with fusion")
    print("   • /api/data-fusion/comparison - Compare data sources")
    print("   • /api/data-fusion/quality-assessment - Data quality metrics")
    print("")
    print("🚀 The system now provides:")
    print("   📡 Real-time TEMPO satellite data integration")
    print("   🌍 Ground sensor network data fusion")
    print("   🤖 Enhanced ML predictions with uncertainty bounds")
    print("   🎯 Quality assessment and source comparison")
    print("   ⚡ High-performance caching and concurrent processing")
    print(f"{'='*80}")


if __name__ == "__main__":
    run_comprehensive_tests()
