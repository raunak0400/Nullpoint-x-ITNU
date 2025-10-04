from flask import Flask, request, jsonify
import random
from datetime import datetime, timedelta

app = Flask(__name__)

def generate_random_data(num_points=10):
    """Generate random air quality or related data points."""
    data = []
    start_time = datetime.now() - timedelta(days=1)
    for i in range(num_points):
        timestamp = start_time + timedelta(minutes=i * 6)  # Every 6 minutes
        value = round(random.uniform(0, 100), 2)
        data.append({
            "timestamp": timestamp.isoformat(),
            "value": value,
            "unit": "ppb"  # Placeholder unit
        })
    return data

def generate_variables_data():
    """Specific data for /tempo/variables endpoint."""
    return ["no2", "hcho", "o3", "cloud", "aerosol", "coverage"]

def generate_weather_data(is_forecast=False, hours_ahead=0):
    """Generate random weather data."""
    if is_forecast:
        data = []
        for i in range(hours_ahead or 24):
            timestamp = datetime.now() + timedelta(hours=i+1)
            data.append({
                "timestamp": timestamp.isoformat(),
                "temperature": round(random.uniform(-10, 40), 1),
                "humidity": round(random.uniform(0, 100), 1),
                "wind_speed": round(random.uniform(0, 20), 1),
                "unit": {"temperature": "C", "humidity": "%", "wind_speed": "m/s"}
            })
        return data
    else:
        return {
            "timestamp": datetime.now().isoformat(),
            "temperature": round(random.uniform(-10, 40), 1),
            "humidity": round(random.uniform(0, 100), 1),
            "wind_speed": round(random.uniform(0, 20), 1),
            "unit": {"temperature": "C", "humidity": "%", "wind_speed": "m/s"}
        }

def generate_forecast_data(hours_ahead=24):
    """Generate random AQI forecast data."""
    data = []
    for i in range(hours_ahead or 24):
        timestamp = datetime.now() + timedelta(hours=i+1)
        data.append({
            "timestamp": timestamp.isoformat(),
            "aqi": random.randint(0, 500),
            "category": random.choice(["Good", "Moderate", "Unhealthy", "Very Unhealthy", "Hazardous"])
        })
    return data

def generate_trend_data(days=7):
    """Generate random trend data."""
    data = []
    for i in range(days or 7):
        timestamp = datetime.now() - timedelta(days=i)
        data.append({
            "date": timestamp.date().isoformat(),
            "value": round(random.uniform(0, 100), 2),
            "trend": random.choice(["increasing", "decreasing", "stable"])
        })
    return data

def generate_alerts_data():
    """Generate random alerts data."""
    num_alerts = random.randint(0, 5)
    alerts = []
    for i in range(num_alerts):
        alerts.append({
            "type": random.choice(["High NO2", "Ozone Alert", "PM2.5 Warning"]),
            "severity": random.choice(["Low", "Medium", "High"]),
            "timestamp": datetime.now().isoformat()
        })
    return alerts

def generate_fusion_data():
    """Generate random fused air quality data."""
    return {
        "timestamp": datetime.now().isoformat(),
        "aqi": random.randint(0, 500),
        "components": {
            "no2": round(random.uniform(0, 100), 2),
            "o3": round(random.uniform(0, 100), 2),
            "pm25": round(random.uniform(0, 100), 2)
        },
        "source": "fused_satellite_ground_weather"
    }

# TEMPO Satellite Data Endpoints
@app.route('/tempo/no2', methods=['GET'])
def tempo_no2():
    params = dict(request.args)
    data = generate_random_data()
    return jsonify({"endpoint": "/tempo/no2", "parameters": params, "data": data})

@app.route('/tempo/hcho', methods=['GET'])
def tempo_hcho():
    params = dict(request.args)
    data = generate_random_data()
    return jsonify({"endpoint": "/tempo/hcho", "parameters": params, "data": data})

@app.route('/tempo/o3', methods=['GET'])
def tempo_o3():
    params = dict(request.args)
    data = generate_random_data()
    return jsonify({"endpoint": "/tempo/o3", "parameters": params, "data": data})

@app.route('/tempo/cloud', methods=['GET'])
def tempo_cloud():
    params = dict(request.args)
    data = [{"timestamp": datetime.now().isoformat(), "cloud_cover": round(random.uniform(0, 100), 2), "unit": "%"}]
    return jsonify({"endpoint": "/tempo/cloud", "parameters": params, "data": data})

@app.route('/tempo/aerosol', methods=['GET'])
def tempo_aerosol():
    params = dict(request.args)
    data = generate_random_data()
    return jsonify({"endpoint": "/tempo/aerosol", "parameters": params, "data": data})

@app.route('/tempo/coverage', methods=['GET'])
def tempo_coverage():
    params = dict(request.args)
    coverage = round(random.uniform(0, 100), 2)
    data = {"coverage_percentage": coverage, "unit": "%", "timestamp": datetime.now().isoformat()}
    return jsonify({"endpoint": "/tempo/coverage", "parameters": params, "data": data})

@app.route('/tempo/variables', methods=['GET'])
def tempo_variables():
    params = dict(request.args)
    data = generate_variables_data()
    return jsonify({"endpoint": "/tempo/variables", "parameters": params, "data": data})

# Ground Measurements
@app.route('/ground/measurements', methods=['GET'])
def ground_measurements():
    params = dict(request.args)
    data = generate_random_data()
    return jsonify({"endpoint": "/ground/measurements", "parameters": params, "data": data})

# Weather Data
@app.route('/weather/current', methods=['GET'])
def weather_current():
    params = dict(request.args)
    data = generate_weather_data()
    return jsonify({"endpoint": "/weather/current", "parameters": params, "data": data})

@app.route('/weather/forecast', methods=['GET'])
def weather_forecast():
    params = dict(request.args)
    hours_ahead = int(params.get('hours_ahead', 24))
    data = generate_weather_data(is_forecast=True, hours_ahead=hours_ahead)
    return jsonify({"endpoint": "/weather/forecast", "parameters": params, "data": data})

# Forecast & Trends
@app.route('/forecast/aqi', methods=['GET'])
def forecast_aqi():
    params = dict(request.args)
    hours_ahead = int(params.get('hours_ahead', 24))
    data = generate_forecast_data(hours_ahead)
    return jsonify({"endpoint": "/forecast/aqi", "parameters": params, "data": data})

@app.route('/forecast/trend', methods=['GET'])
def forecast_trend():
    params = dict(request.args)
    days = int(params.get('days', 7))
    data = generate_trend_data(days)
    return jsonify({"endpoint": "/forecast/trend", "parameters": params, "data": data})

# Alerts
@app.route('/alerts', methods=['GET'])
def alerts():
    params = dict(request.args)
    data = generate_alerts_data()
    return jsonify({"endpoint": "/alerts", "parameters": params, "data": data})

# Fusion
@app.route('/fusion/airquality', methods=['GET'])
def fusion_airquality():
    params = dict(request.args)
    data = generate_fusion_data()
    return jsonify({"endpoint": "/fusion/airquality", "parameters": params, "data": data})

if __name__ == '__main__':
    app.run(debug=True)
