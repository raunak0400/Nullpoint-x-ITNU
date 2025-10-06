# 🌬️ Three Data Types for Frontend Display

## 🎯 **Perfect for Your Frontend!**

Your backend now provides **three distinct types of air quality data** that you can display separately on your frontend:

1. **🛰️ Satellite Data** - Wide coverage from NASA TEMPO
2. **📡 Ground Sensor Data** - Precise local measurements  
3. **🔬 Fused Data** - Intelligently combined satellite + ground data

## 📡 **Main API Endpoint**

### **Get All Three Data Types**: `GET /api/three-data-types/all-data-types`

**Parameters**:
- `lat`, `lon` (required): Coordinates
- `pollutants` (optional): Comma-separated list (default: NO2,O3,PM2.5)
- `radius_km` (optional): Ground sensor search radius (default: 50km)

**Example Request**:
```javascript
const response = await fetch(
  'http://127.0.0.1:5000/api/three-data-types/all-data-types?lat=40.7128&lon=-74.0060&pollutants=NO2,O3,PM2.5'
);
const data = await response.json();
```

## 📊 **Response Structure**

```json
{
  "status": "success",
  "location": {"lat": 40.7128, "lon": -74.0060},
  "timestamp": "2025-10-05T10:45:00Z",
  "requested_pollutants": ["NO2", "O3", "PM2.5"],
  
  "satellite_data": {
    "type": "satellite",
    "source": "NASA TEMPO Satellite",
    "description": "Wide coverage satellite observations from geostationary orbit",
    "characteristics": {
      "coverage": "Regional (North America)",
      "spatial_resolution": "2-5 km pixels",
      "strengths": ["Wide coverage", "Consistent sampling"],
      "limitations": ["Lower spatial resolution", "Daylight hours only"]
    },
    "data": {
      "status": "success",
      "pollutants": {
        "NO2": {
          "value": 28.5,
          "unit": "molecules/cm²",
          "quality": "good",
          "measurement_time": "2025-10-05T10:30:00Z",
          "source": "NASA_TEMPO",
          "coordinates": {"lat": 40.713, "lon": -74.006}
        }
      }
    }
  },
  
  "ground_sensor_data": {
    "type": "ground_sensors", 
    "source": "Ground Monitoring Networks (OpenAQ, AirNow)",
    "description": "High-precision point measurements from ground-based monitoring stations",
    "characteristics": {
      "coverage": "Point measurements within 50km radius",
      "spatial_resolution": "Exact location (GPS coordinates)",
      "strengths": ["High precision", "Continuous monitoring"],
      "limitations": ["Limited spatial coverage", "Infrastructure dependent"]
    },
    "data": {
      "status": "success",
      "pollutants": {
        "NO2": {
          "measurements": [
            {
              "value": 32.1,
              "unit": "µg/m³",
              "station_name": "Manhattan Center",
              "distance_km": 2.3,
              "coordinates": {"lat": 40.715, "lon": -74.008},
              "timestamp": "2025-10-05T10:00:00Z"
            }
          ],
          "closest_station": {
            "value": 32.1,
            "unit": "µg/m³",
            "station_name": "Manhattan Center",
            "distance_km": 2.3
          },
          "station_count": 3,
          "average_value": 29.7
        }
      }
    }
  },
  
  "fused_data": {
    "type": "data_fusion",
    "source": "Intelligent Fusion of Satellite + Ground Data", 
    "description": "Optimally combined satellite and ground measurements",
    "characteristics": {
      "coverage": "Best of both: Wide satellite coverage enhanced by ground precision",
      "strengths": ["Combines advantages of both", "Uncertainty quantification"],
      "limitations": ["Computational complexity"]
    },
    "data": {
      "status": "success",
      "pollutants": {
        "NO2": {
          "fused_value": 30.2,
          "unit": "µg/m³",
          "uncertainty": 2.8,
          "confidence_intervals": {
            "68_percent": {"lower": 27.4, "upper": 33.0},
            "95_percent": {"lower": 24.6, "upper": 35.8}
          },
          "quality_score": 0.85,
          "quality_level": "excellent",
          "fusion_method": "satellite_ground_spatial_fusion",
          "data_sources_used": {
            "satellite": true,
            "ground_sensors": true
          }
        }
      }
    }
  },
  
  "data_comparison": {
    "pollutant_comparison": {
      "NO2": {
        "satellite": {"available": true, "value": 28.5, "quality": "good"},
        "ground_sensors": {"available": true, "value": 32.1, "station_count": 3},
        "fused": {"available": true, "value": 30.2, "uncertainty": 2.8}
      }
    },
    "recommendations": ["Use fused data for best accuracy and coverage"]
  }
}
```

## 🎨 **Frontend Display Components**

### **React Component Example**:

```jsx
import React, { useState, useEffect } from 'react';

const ThreeDataTypesDisplay = ({ lat, lon }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchAllDataTypes();
  }, [lat, lon]);

  const fetchAllDataTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://127.0.0.1:5000/api/three-data-types/all-data-types?lat=${lat}&lon=${lon}&pollutants=NO2,O3,PM2.5`
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>🔄 Loading all data types...</div>;
  if (!data) return <div>❌ No data available</div>;

  return (
    <div className="three-data-types-container">
      <h2>🌬️ Air Quality Data - Three Sources</h2>
      
      {/* Data Type Selector */}
      <div className="data-type-selector">
        <button 
          className={selectedType === 'all' ? 'active' : ''}
          onClick={() => setSelectedType('all')}
        >
          📊 All Three Types
        </button>
        <button 
          className={selectedType === 'satellite' ? 'active' : ''}
          onClick={() => setSelectedType('satellite')}
        >
          🛰️ Satellite Only
        </button>
        <button 
          className={selectedType === 'ground' ? 'active' : ''}
          onClick={() => setSelectedType('ground')}
        >
          📡 Ground Sensors Only
        </button>
        <button 
          className={selectedType === 'fused' ? 'active' : ''}
          onClick={() => setSelectedType('fused')}
        >
          🔬 Fused Data Only
        </button>
      </div>

      {/* Display Based on Selection */}
      {selectedType === 'all' && <AllDataTypesView data={data} />}
      {selectedType === 'satellite' && <SatelliteDataView data={data.satellite_data} />}
      {selectedType === 'ground' && <GroundDataView data={data.ground_sensor_data} />}
      {selectedType === 'fused' && <FusedDataView data={data.fused_data} />}
      
      {/* Data Comparison */}
      <DataComparisonView comparison={data.data_comparison} />
    </div>
  );
};

const AllDataTypesView = ({ data }) => (
  <div className="all-data-types">
    <div className="data-type-grid">
      <DataTypeCard 
        title="🛰️ Satellite Data"
        data={data.satellite_data}
        color="#4A90E2"
      />
      <DataTypeCard 
        title="📡 Ground Sensors"
        data={data.ground_sensor_data}
        color="#7ED321"
      />
      <DataTypeCard 
        title="🔬 Fused Data"
        data={data.fused_data}
        color="#F5A623"
      />
    </div>
  </div>
);

const DataTypeCard = ({ title, data, color }) => (
  <div className="data-type-card" style={{ borderLeft: `4px solid ${color}` }}>
    <h3>{title}</h3>
    <p className="description">{data.description}</p>
    
    <div className="characteristics">
      <h4>📋 Characteristics:</h4>
      <ul>
        <li><strong>Coverage:</strong> {data.characteristics.coverage}</li>
        <li><strong>Resolution:</strong> {data.characteristics.spatial_resolution}</li>
      </ul>
    </div>
    
    <div className="strengths-limitations">
      <div className="strengths">
        <h4>✅ Strengths:</h4>
        <ul>
          {data.characteristics.strengths.map((strength, idx) => (
            <li key={idx}>{strength}</li>
          ))}
        </ul>
      </div>
      <div className="limitations">
        <h4>⚠️ Limitations:</h4>
        <ul>
          {data.characteristics.limitations.map((limitation, idx) => (
            <li key={idx}>{limitation}</li>
          ))}
        </ul>
      </div>
    </div>
    
    <PollutantDataDisplay pollutants={data.data.pollutants} />
  </div>
);

const PollutantDataDisplay = ({ pollutants }) => (
  <div className="pollutant-data">
    <h4>🌬️ Pollutant Values:</h4>
    {Object.entries(pollutants).map(([pollutant, info]) => (
      <div key={pollutant} className="pollutant-item">
        <span className="pollutant-name">{pollutant}:</span>
        {info.value !== undefined ? (
          <span className="pollutant-value">
            {info.value} {info.unit}
          </span>
        ) : info.fused_value !== undefined ? (
          <span className="pollutant-value">
            {info.fused_value} ±{info.uncertainty} {info.unit}
          </span>
        ) : info.closest_station ? (
          <span className="pollutant-value">
            {info.closest_station.value} {info.closest_station.unit}
            <small> (from {info.station_count} stations)</small>
          </span>
        ) : (
          <span className="unavailable">Not available</span>
        )}
      </div>
    ))}
  </div>
);

const DataComparisonView = ({ comparison }) => (
  <div className="data-comparison">
    <h3>⚖️ Data Source Comparison</h3>
    {Object.entries(comparison.pollutant_comparison).map(([pollutant, comp]) => (
      <div key={pollutant} className="pollutant-comparison">
        <h4>{pollutant}</h4>
        <div className="comparison-grid">
          <div className="comparison-item">
            <strong>🛰️ Satellite:</strong> 
            {comp.satellite.available ? `${comp.satellite.value}` : 'N/A'}
          </div>
          <div className="comparison-item">
            <strong>📡 Ground:</strong> 
            {comp.ground_sensors.available ? `${comp.ground_sensors.value}` : 'N/A'}
          </div>
          <div className="comparison-item">
            <strong>🔬 Fused:</strong> 
            {comp.fused.available ? `${comp.fused.value} ±${comp.fused.uncertainty}` : 'N/A'}
          </div>
        </div>
      </div>
    ))}
    
    <div className="recommendations">
      <h4>💡 Recommendations:</h4>
      {comparison.recommendations.map((rec, idx) => (
        <p key={idx}>{rec}</p>
      ))}
    </div>
  </div>
);

export default ThreeDataTypesDisplay;
```

## 🎨 **CSS Styling**:

```css
.three-data-types-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.data-type-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.data-type-selector button {
  padding: 12px 20px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.data-type-selector button.active {
  background: #4A90E2;
  color: white;
  border-color: #4A90E2;
}

.data-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.data-type-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-left: 4px solid #4A90E2;
}

.data-type-card h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.description {
  color: #666;
  font-style: italic;
  margin-bottom: 15px;
}

.characteristics h4 {
  color: #555;
  margin: 15px 0 8px 0;
  font-size: 0.9em;
}

.strengths-limitations {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin: 15px 0;
}

.strengths ul, .limitations ul {
  margin: 5px 0;
  padding-left: 20px;
}

.strengths li {
  color: #27AE60;
}

.limitations li {
  color: #E74C3C;
}

.pollutant-data {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.pollutant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.pollutant-name {
  font-weight: bold;
  color: #333;
}

.pollutant-value {
  color: #4A90E2;
  font-weight: bold;
}

.unavailable {
  color: #999;
  font-style: italic;
}

.data-comparison {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-top: 30px;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin: 10px 0;
}

.comparison-item {
  background: white;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
}

.recommendations {
  margin-top: 20px;
  padding: 15px;
  background: #e8f4fd;
  border-radius: 8px;
}
```

## 🚀 **Individual Endpoints**

If you want to fetch each data type separately:

```javascript
// Satellite data only
const satellite = await fetch('/api/three-data-types/satellite-only?lat=40.7128&lon=-74.0060');

// Ground sensor data only  
const ground = await fetch('/api/three-data-types/ground-only?lat=40.7128&lon=-74.0060');

// Fused data only
const fused = await fetch('/api/three-data-types/fused-only?lat=40.7128&lon=-74.0060');
```

## 🎯 **Perfect for Your Frontend!**

This gives you **complete flexibility** to:

1. **📊 Show all three side-by-side** for comparison
2. **🔄 Toggle between data types** with buttons/tabs
3. **📈 Display characteristics** of each data source
4. **⚖️ Compare values** across sources
5. **💡 Show recommendations** based on data availability

Your frontend can now provide users with **complete transparency** about data sources and let them choose their preferred data type or see how they compare!

**🌬️ Perfect for your NASA Space Apps Challenge submission! 🚀**
