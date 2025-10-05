import requests
import datetime

def get_air_quality(lat, lon, api_key):
    """
    Fetches real-time air quality data from OpenWeather's Air Pollution API.
    
    Args:
        lat (float): Latitude
        lon (float): Longitude
        api_key (str): OpenWeather API key

    Returns:
        dict: Parsed air quality data
    """
    url = "https://api.openweathermap.org/data/2.5/air_pollution"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": api_key
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return None

    data = response.json()
    air_data = data.get("list", [{}])[0]
    main = air_data.get("main", {})
    components = air_data.get("components", {})
    timestamp = air_data.get("dt")

    # Convert UNIX timestamp to human-readable format
    if timestamp:
        readable_time = datetime.datetime.utcfromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
    else:
        readable_time = "N/A"

    # AQI levels meaning
    aqi_scale = {
        1: "Good 😊",
        2: "Fair 🙂",
        3: "Moderate 😐",
        4: "Poor 😷",
        5: "Very Poor ☠️"
    }

    print("\n🌍 Air Quality Data")
    print(f"📍 Coordinates: ({lat}, {lon})")
    print(f"🕓 Time (UTC): {readable_time}")

    aqi = main.get("aqi", "N/A")
    print(f"\n🔹 Air Quality Index (AQI): {aqi} ({aqi_scale.get(aqi, 'Unknown')})")

    print("\n💨 Pollutant Concentrations (μg/m³):")
    for gas, value in components.items():
        print(f"  • {gas.upper():<6}: {value}")

    return {
        "coordinates": (lat, lon),
        "time": readable_time,
        "aqi": aqi,
        "aqi_description": aqi_scale.get(aqi, "Unknown"),
        "pollutants": components
    }

if __name__ == "__main__":
    # Example: New Delhi, India
    LAT = 28.6139
    LON = 77.2090
    API_KEY = "YOUR_API_KEY"  # 🔑 Replace with your OpenWeather API key

    get_air_quality(LAT, LON, API_KEY)