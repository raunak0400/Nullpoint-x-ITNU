import requests
import datetime

def get_air_quality_open_meteo(lat, lon):
    """
    Fetches air quality forecast data (free, no API key) from Open-Meteo.
    """
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide",
        "timezone": "auto"
    }

    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()

    print(f"\n📍 Location: ({lat}, {lon})")
    print(f"🕓 Hours Available: {len(data['hourly']['time'])}")
    print(f"🕓 Latest Timestamp: {data['hourly']['time'][0]}")

    print("\n💨 Latest Air Quality Data:")
    for pollutant in ["pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "ozone", "sulphur_dioxide"]:
        value = data["hourly"][pollutant][0]
        print(f"  • {pollutant.replace('_', ' ').title():<20}: {value}")

if __name__ == "__main__":
    # Example: Mumbai, India
    LAT, LON = 19.0760, 72.8777
    get_air_quality_open_meteo(LAT, LON)