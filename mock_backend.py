from flask import Flask, request, jsonify
import requests
import json

app = Flask(__name__)

# --------- NASA TEMPO Satellite Data ----------
def fetch_nasa_tempo_data(lat, lon):
    """
    Fetch NASA TEMPO NO2 data (example)
    """
    try:
        base_url = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"
        params = {
            "service": "WMS",
            "version": "1.3.0",
            "request": "GetFeatureInfo",
            "layers": "TEMPO_NO2_Total_Column",
            "query_layers": "TEMPO_NO2_Total_Column",
            "crs": "EPSG:4326",
            "bbox": f"{lat-0.1},{lon-0.1},{lat+0.1},{lon+0.1}",
            "width": 256,
            "height": 256,
            "info_format": "application/json",
            "i": 128,
            "j": 128,
        }

        response = requests.get(base_url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()

        return {
            "source": "NASA TEMPO",
            "data": data
        }
    except Exception as e:
        return {"error": str(e)}

# --------- Ground Data (OpenAQ) ----------
def fetch_openaq_data(city):
    """
    Fetch ground-level air quality data from OpenAQ
    """
    try:
        url = "https://api.openaq.org/v2/latest"
        params = {"city": city, "limit": 10, "sort": "desc"}
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        ground_data = []
        for result in data.get("results", []):
            for m in result.get("measurements", []):
                ground_data.append({
                    "parameter": m.get("parameter"),
                    "value": m.get("value"),
                    "unit": m.get("unit"),
                    "lastUpdated": m.get("lastUpdated")
                })
        return ground_data
    except Exception as e:
        return {"error": str(e)}

# --------- Weather Data (OpenWeatherMap) ----------
def fetch_weather_data(city, api_key):
    """
    Fetch weather details (temp, humidity, wind)
    """
    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"q": city, "appid": api_key, "units": "metric"}
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        return {
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "wind_speed": data["wind"]["speed"],
            "condition": data["weather"][0]["description"]
        }
    except Exception as e:
        return {"error": str(e)}

# --------- Simple AQI Calculation ----------
def calculate_aqi(ground_data):
    """
    Simple average of PM2.5 + NO2 (mock AQI)
    """
    pm25_values = [d["value"] for d in ground_data if d["parameter"] == "pm25"]
    no2_values = [d["value"] for d in ground_data if d["parameter"] == "no2"]

    avg_pm25 = sum(pm25_values)/len(pm25_values) if pm25_values else 0
    avg_no2 = sum(no2_values)/len(no2_values) if no2_values else 0

    aqi = (avg_pm25 + avg_no2) / 2
    return round(aqi, 2)

# --------- Health Advice & Alerts ----------
def get_health_advice(aqi):
    if aqi <= 50:
        return {"level": "Good", "color": "🟢", "advice": "Air is clean. Enjoy outdoor activities!"}
    elif aqi <= 100:
        return {"level": "Moderate", "color": "🟡", "advice": "Air is okay. Sensitive people should be careful."}
    elif aqi <= 200:
        return {"level": "Unhealthy for Sensitive Groups", "color": "🟠", "advice": "Limit outdoor playtime for kids."}
    elif aqi <= 300:
        return {"level": "Unhealthy", "color": "🔴", "advice": "Avoid going outside, wear a mask."}
    else:
        return {"level": "Hazardous", "color": "🟣", "advice": "Stay indoors, use air purifiers."}

# --------- API Endpoint ----------
@app.route('/api/airquality', methods=['GET'])
def get_air_quality():
    city = request.args.get("city", "Delhi")
    lat = float(request.args.get("lat", 28.6139))
    lon = float(request.args.get("lon", 77.2090))

    WEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY"

    nasa = fetch_nasa_tempo_data(lat, lon)
    ground = fetch_openaq_data(city)
    weather = fetch_weather_data(city, WEATHER_API_KEY)

    if isinstance(ground, list) and ground:
        aqi = calculate_aqi(ground)
        advice = get_health_advice(aqi)
    else:
        aqi = 0
        advice = {"level": "Unknown", "advice": "No data available"}

    result = {
        "city": city,
        "coordinates": {"lat": lat, "lon": lon},
        "nasa_tempo_data": nasa,
        "ground_data": ground[:5],
        "weather": weather,
        "aqi_estimate": aqi,
        "advice": advice
    }

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)