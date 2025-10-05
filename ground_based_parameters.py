import requests
import json

def fetch_openaq_data(city="Delhi"):
    """
    Fetch ground-level air quality data from OpenAQ
    """
    try:
        url = "https://api.openaq.org/v2/latest"
        params = {
            "city": city,
            "limit": 10,
            "sort": "desc"
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        # Simplify output
        readings = []
        for result in data.get("results", []):
            location = result.get("location")
            for measurement in result.get("measurements", []):
                readings.append({
                    "city": city,
                    "location": location,
                    "parameter": measurement.get("parameter"),
                    "value": measurement.get("value"),
                    "unit": measurement.get("unit"),
                    "lastUpdated": measurement.get("lastUpdated")
                })

        print("✅ OpenAQ ground data fetched successfully!")
        return readings

    except Exception as e:
        print("❌ Error fetching OpenAQ data:", e)
        return []


# Example: Delhi
ground_data = fetch_openaq_data("Delhi")
print(json.dumps(ground_data[:5], indent=2))  # show first 5 readings