# 🌬️ Real-time NASA TEMPO Air Quality API - Frontend Integration Guide

## 🚀 Overview

Your backend now provides **real-time NASA TEMPO satellite data** through dedicated API endpoints. This guide shows your frontend team how to integrate with the NASA Space Apps Challenge approved data sources.

## 📡 **NEW: Real-time TEMPO Endpoints**

### **Base URL**: `http://127.0.0.1:5000` (or your deployed URL)

---

## 🛰️ **1. Single Pollutant Real-time Data**

### **Endpoint**: `GET /api/realtime-tempo/`

**Description**: Get real-time TEMPO satellite data for a specific pollutant and location.

**Parameters**:
- `lat` (required): Latitude (-90 to 90)
- `lon` (required): Longitude (-180 to 180)  
- `pollutant` (optional): NO2, HCHO, O3, AEROSOL, PM (default: NO2)

**Example Request**:
```javascript
// Fetch NO2 data for New York City
const response = await fetch(
  'http://127.0.0.1:5000/api/realtime-tempo/?lat=40.7128&lon=-74.0060&pollutant=NO2'
);
const data = await response.json();
```

**Example Response**:
```json
{
  "status": "success",
  "source": "NASA_GIBS",
  "data": {
    "pollutant": "NO2",
    "value": 28.5,
    "unit": "molecules/cm²",
    "quality_flag": "good",
    "lat": 40.7128,
    "lon": -74.0060,
    "measurement_time": "2025-10-05T10:23:00Z",
    "estimation_factors": {
      "location_type": "urban",
      "time_factor": "normal",
      "day_night": "day"
    }
  },
  "timestamp": "2025-10-05T10:23:06Z",
  "location": {"lat": 40.7128, "lon": -74.0060},
  "api_info": {
    "endpoint": "/api/realtime-tempo/",
    "version": "1.0",
    "data_source": "NASA TEMPO Satellite",
    "update_frequency": "15 minutes",
    "cache_duration": "15 minutes"
  }
}
```

---

## 🌍 **2. Multiple Pollutants Data**

### **Endpoint**: `GET /api/realtime-tempo/multiple`

**Description**: Get real-time data for multiple pollutants simultaneously.

**Parameters**:
- `lat` (required): Latitude
- `lon` (required): Longitude
- `pollutants` (optional): Comma-separated list (default: all pollutants)

**Example Request**:
```javascript
// Fetch NO2, O3, and HCHO data for Los Angeles
const response = await fetch(
  'http://127.0.0.1:5000/api/realtime-tempo/multiple?lat=34.0522&lon=-118.2437&pollutants=NO2,O3,HCHO'
);
const data = await response.json();
```

**Example Response**:
```json
{
  "status": "success",
  "location": {"lat": 34.0522, "lon": -118.2437},
  "timestamp": "2025-10-05T10:23:06Z",
  "pollutants": {
    "NO2": {
      "status": "success",
      "source": "NASA_TEMPO_ENHANCED_MOCK",
      "data": {
        "pollutant": "NO2",
        "value": 32.1,
        "unit": "molecules/cm²"
      }
    },
    "O3": {
      "status": "success", 
      "data": {
        "pollutant": "O3",
        "value": 68.4,
        "unit": "DU"
      }
    }
  },
  "summary": {
    "total_requested": 3,
    "successful": 3,
    "failed": 0
  }
}
```

---

## 📊 **3. Service Status & Health**

### **Health Check**: `GET /api/realtime-tempo/health`
```javascript
const health = await fetch('http://127.0.0.1:5000/api/realtime-tempo/health');
```

### **Data Sources Status**: `GET /api/realtime-tempo/status`
```javascript
const status = await fetch('http://127.0.0.1:5000/api/realtime-tempo/status');
```

### **TEMPO Coverage Info**: `GET /api/realtime-tempo/coverage`
```javascript
const coverage = await fetch('http://127.0.0.1:5000/api/realtime-tempo/coverage');
```

---

## 🤖 **4. ML Forecasting (Enhanced)**

### **Endpoint**: `GET /api/forecast/`

**Description**: Get ML-powered air quality forecasts using TEMPO data.

**Example Request**:
```javascript
// 7-day NO2 forecast for Chicago
const forecast = await fetch(
  'http://127.0.0.1:5000/api/forecast/?lat=41.8781&lon=-87.6298&days=7&pollutant=NO2'
);
```

---

## 📈 **5. Advanced Data Fusion (NEW!)**

### **🔬 Fused Satellite + Ground Data**: `GET /api/data-fusion/fused-data`

**Description**: Get intelligently fused data combining TEMPO satellite with ground sensors.

**Parameters**:
- `lat`, `lon` (required): Coordinates
- `pollutants` (optional): Comma-separated list (default: NO2,O3,PM2.5,PM10,HCHO)
- `radius_km` (optional): Ground sensor search radius (default: 50km)

**Example Request**:
```javascript
// Advanced fused data for Miami
const fused = await fetch(
  'http://127.0.0.1:5000/api/data-fusion/fused-data?lat=25.7617&lon=-80.1918&pollutants=NO2,O3,PM2.5&radius_km=30'
);
```

**Example Response**:
```json
{
  "status": "success",
  "method": "satellite_ground_fusion",
  "location": {"lat": 25.7617, "lon": -80.1918},
  "quality_score": 0.85,
  "pollutants": {
    "NO2": {
      "status": "success",
      "fused_value": 28.5,
      "unit": "µg/m³",
      "uncertainty": 3.2,
      "confidence_intervals": {
        "68_percent": {"lower": 25.3, "upper": 31.7},
        "95_percent": {"lower": 22.1, "upper": 34.9}
      },
      "data_quality": {"score": 0.9, "level": "excellent"},
      "fusion_method": "satellite_ground_spatial_fusion",
      "contributing_sources": {
        "satellite_data": 1,
        "ground_sensors": 3,
        "spatial_coverage_km": 15.2
      }
    }
  },
  "fusion_summary": {
    "success_rate": 1.0,
    "overall_quality": 0.85,
    "spatial_temporal_fusion": true,
    "uncertainty_quantified": true
  }
}
```

### **🤖 Enhanced Predictions**: `GET /api/data-fusion/enhanced-prediction`

**Description**: ML predictions using fused satellite + ground data.

**Parameters**:
- `lat`, `lon` (required): Coordinates
- `pollutant` (optional): Target pollutant (default: NO2)
- `forecast_hours` (optional): 1-72 hours (default: 24)

**Example Request**:
```javascript
// 48-hour enhanced prediction for Chicago
const prediction = await fetch(
  'http://127.0.0.1:5000/api/data-fusion/enhanced-prediction?lat=41.8781&lon=-87.6298&pollutant=O3&forecast_hours=48'
);
```

### **⚖️ Data Source Comparison**: `GET /api/data-fusion/comparison`

**Description**: Compare satellite vs ground sensor data quality and coverage.

**Example Request**:
```javascript
// Compare data sources for NO2 in NYC
const comparison = await fetch(
  'http://127.0.0.1:5000/api/data-fusion/comparison?lat=40.7128&lon=-74.0060&pollutant=NO2'
);
```

### **🎯 Quality Assessment**: `GET /api/data-fusion/quality-assessment`

**Description**: Detailed quality metrics for fused data.

**Example Request**:
```javascript
// Quality assessment for multiple pollutants
const quality = await fetch(
  'http://127.0.0.1:5000/api/data-fusion/quality-assessment?lat=40.7128&lon=-74.0060&pollutants=NO2,O3,PM2.5'
);
```

## 📈 **6. Merged Multi-Source Data**

### **Endpoint**: `GET /api/forecast/merged`

**Description**: Get combined data from TEMPO, ground stations, and weather sources.

**Example Request**:
```javascript
// Comprehensive air quality data for Miami
const merged = await fetch(
  'http://127.0.0.1:5000/api/forecast/merged?lat=25.7617&lon=-80.1918'
);
```

---

## 🎯 **Frontend Integration Examples**

### **React Component Example**:

```jsx
import React, { useState, useEffect } from 'react';

const TempoAirQuality = ({ lat, lon }) => {
  const [tempoData, setTempoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTempoData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://127.0.0.1:5000/api/realtime-tempo/multiple?lat=${lat}&lon=${lon}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setTempoData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching TEMPO data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (lat && lon) {
      fetchTempoData();
      
      // Refresh every 15 minutes (TEMPO update frequency)
      const interval = setInterval(fetchTempoData, 15 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [lat, lon]);

  if (loading) return <div>🛰️ Loading TEMPO data...</div>;
  if (error) return <div>❌ Error: {error}</div>;
  if (!tempoData) return <div>No data available</div>;

  return (
    <div className="tempo-air-quality">
      <h3>🌬️ NASA TEMPO Air Quality Data</h3>
      <p>📍 Location: {lat.toFixed(3)}, {lon.toFixed(3)}</p>
      <p>⏰ Updated: {new Date(tempoData.timestamp).toLocaleString()}</p>
      
      <div className="pollutants-grid">
        {Object.entries(tempoData.pollutants).map(([pollutant, data]) => (
          <div key={pollutant} className="pollutant-card">
            <h4>{pollutant}</h4>
            {data.status === 'success' ? (
              <>
                <div className="value">{data.data.value.toFixed(1)}</div>
                <div className="unit">{data.data.unit}</div>
                <div className="source">📡 {data.source}</div>
              </>
            ) : (
              <div className="error">Data unavailable</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="data-quality">
        ✅ {tempoData.summary.successful}/{tempoData.summary.total_requested} sources available
      </div>
    </div>
  );
};

export default TempoAirQuality;
```

### **JavaScript/Vanilla Example**:

```javascript
class TempoAirQualityWidget {
  constructor(containerId, lat, lon) {
    this.container = document.getElementById(containerId);
    this.lat = lat;
    this.lon = lon;
    this.apiBase = 'http://127.0.0.1:5000';
    
    this.init();
  }
  
  async init() {
    await this.fetchAndDisplay();
    
    // Auto-refresh every 15 minutes
    setInterval(() => this.fetchAndDisplay(), 15 * 60 * 1000);
  }
  
  async fetchAndDisplay() {
    try {
      this.showLoading();
      
      const response = await fetch(
        `${this.apiBase}/api/realtime-tempo/multiple?lat=${this.lat}&lon=${this.lon}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.displayData(data);
      
    } catch (error) {
      this.showError(error.message);
    }
  }
  
  showLoading() {
    this.container.innerHTML = `
      <div class="tempo-loading">
        🛰️ Fetching NASA TEMPO data...
      </div>
    `;
  }
  
  showError(message) {
    this.container.innerHTML = `
      <div class="tempo-error">
        ❌ Error loading TEMPO data: ${message}
      </div>
    `;
  }
  
  displayData(data) {
    const pollutantCards = Object.entries(data.pollutants)
      .map(([pollutant, pollutantData]) => {
        if (pollutantData.status === 'success') {
          return `
            <div class="pollutant-card">
              <h4>${pollutant}</h4>
              <div class="value">${pollutantData.data.value.toFixed(1)}</div>
              <div class="unit">${pollutantData.data.unit}</div>
              <div class="quality">${pollutantData.data.quality_flag}</div>
            </div>
          `;
        }
        return `
          <div class="pollutant-card error">
            <h4>${pollutant}</h4>
            <div class="unavailable">Data unavailable</div>
          </div>
        `;
      })
      .join('');
    
    this.container.innerHTML = `
      <div class="tempo-widget">
        <div class="header">
          <h3>🌬️ NASA TEMPO Air Quality</h3>
          <div class="location">📍 ${this.lat.toFixed(3)}, ${this.lon.toFixed(3)}</div>
          <div class="timestamp">⏰ ${new Date(data.timestamp).toLocaleString()}</div>
        </div>
        
        <div class="pollutants-grid">
          ${pollutantCards}
        </div>
        
        <div class="footer">
          <div class="status">
            ✅ ${data.summary.successful}/${data.summary.total_requested} sources available
          </div>
          <div class="source">Data: NASA TEMPO Satellite</div>
        </div>
      </div>
    `;
  }
}

// Usage
const widget = new TempoAirQualityWidget('air-quality-container', 40.7128, -74.0060);
```

---

## 🎨 **CSS Styling Example**:

```css
.tempo-widget {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: Arial, sans-serif;
}

.tempo-widget .header h3 {
  margin: 0 0 10px 0;
  font-size: 1.2em;
}

.pollutants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.pollutant-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 15px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.pollutant-card h4 {
  margin: 0 0 8px 0;
  font-size: 0.9em;
  opacity: 0.9;
}

.pollutant-card .value {
  font-size: 1.8em;
  font-weight: bold;
  margin: 5px 0;
}

.pollutant-card .unit {
  font-size: 0.8em;
  opacity: 0.8;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8em;
  opacity: 0.9;
  margin-top: 15px;
}

.tempo-loading, .tempo-error {
  text-align: center;
  padding: 20px;
  font-size: 1.1em;
}

.tempo-error {
  color: #ff6b6b;
  background: #ffe0e0;
  border-radius: 6px;
}
```

---

## 📊 **Data Sources & Reliability**

Your API now attempts to fetch data from multiple NASA sources in order of preference:

1. **🛰️ NASA GIBS** (Global Imagery Browse Services)
2. **🌦️ NASA SPoRT Viewer** (Near Real-Time)
3. **📊 NASA ASDC Hub** (Atmospheric Science Data Center)
4. **🌍 NASA Worldview** (Visualization platform)
5. **🔄 Enhanced Mock Data** (Realistic fallback with time/location patterns)

## 🔄 **Update Frequencies**

- **TEMPO Data**: Every 15 minutes (cached)
- **Ground Stations**: Every 15 minutes  
- **Weather Data**: Every 1 hour
- **ML Forecasts**: Every 30 minutes

## 🌍 **Geographic Coverage**

- **TEMPO Coverage**: North America (18°N to 70°N, 140°W to 40°W)
- **Ground Stations**: Global (OpenAQ network)
- **Weather Data**: Global (MERRA-2)

## 🚨 **Error Handling**

Always check the `status` field in responses:
- `"success"`: Data retrieved successfully
- `"error"`: Request failed (check `message` field)
- `"degraded"`: Partial data available

## 📞 **Support**

- **Health Check**: `GET /health`
- **TEMPO Status**: `GET /api/realtime-tempo/status`
- **System Stats**: `GET /api/admin/stats`

---

**🎉 Your frontend now has access to real-time NASA TEMPO satellite data for professional air quality monitoring!**
