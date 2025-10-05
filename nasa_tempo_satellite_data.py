import requests
import json

def fetch_nasa_tempo_data(lat, lon):
    """
    Fetch TEMPO satellite data (example: NO2 column density)
    """
    try:
        # NASA GES DISC OPeNDAP / WMS style endpoint
        base_url = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"

        # Example parameters
        params = {
            "service": "WMS",
            "version": "1.3.0",
            "request": "GetFeatureInfo",
            "layers": "TEMPO_NO2_Total_Column",  # Example Layer
            "query_layers": "TEMPO_NO2_Total_Column",
            "crs": "EPSG:4326",
            "bbox": f"{lat-0.1},{lon-0.1},{lat+0.1},{lon+0.1}",
            "width": 256,
            "height": 256,
            "info_format": "application/json",
            "i": 128,
            "j": 128,
        }

        response = requests.get(base_url, params=params, timeout=20)
        response.raise_for_status()

        data = response.json()
        print("✅ NASA TEMPO data fetched successfully!")
        return data

    except Exception as e:
        print("❌ Error fetching NASA TEMPO data:", e)
        return None


# Example: Delhi
nasa_data = fetch_nasa_tempo_data(28.6139, 77.2090)
print(json.dumps(nasa_data, indent=2))