import requests
import requests
import os
from typing import Dict, Any
# Optional: import pandas as pd  # For CSV to DataFrame conversion

# Replace with your actual OpenAQ API key (get from https://openaq.org/developers)
API_KEY = '0b385d955d1fea5e8f82ecd2dceba0db5d610eae3a6a459d6237b0a895d45abc'


def fetch_locations(api_key: str, endpoint: str = "https://api.twitter.com/1.1/geo/reverse_geocode.json") -> Dict[str, Any]:
    """
    Fetches location data from the Twitter/X API (example using reverse geocoding endpoint).
    
    Args:
        api_key (str): Your valid API key or Bearer token.
        endpoint (str): The API endpoint URL (customize as needed, e.g., for places or trends).
    
    Returns:
        Dict[str, Any]: The JSON response from the API.
    
    Raises:
        requests.exceptions.RequestException: If the request fails.
    """
    # Note: For Twitter/X API v1.1, use OAuth or Bearer token in Authorization header.
    # If it's a custom API using X-API-Key, adjust the headers accordingly.
    headers = {
        "Authorization": f"Bearer {api_key}",  # Use this for most X API endpoints (Bearer token).
        # Alternative for legacy/custom: "X-API-Key": api_key
    }
    
    params = {
        # Example params for reverse geocoding (lat, long, accuracy, etc.).
        # Customize based on your needs, e.g., for places: lat=37.781157&long=-122.398720&granularity=city
        "lat": 37.781157,
        "long": -122.398720,
        "granularity": "city"
    }
    
    try:
        response = requests.get(endpoint, headers=headers, params=params)
        response.raise_for_status()  # Raises an HTTPError for bad responses (e.g., 401)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"API Error {response.status_code}: {response.text}")
            return {}
            
    except requests.exceptions.HTTPError as e:
        if response.status_code == 401:
            print("Unauthorized: Check your API key. It might be invalid, expired, or missing.")
        else:
            print(f"HTTP Error: {e}")
        return {}
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return {}

# Usage example
if __name__ == "__main__":
    # Securely load API key from environment variable (recommended)
    api_key = '478665200c729e9207c258ba2c2559d3c6eb9581223f39915f415bd018f6850d'
    
    if not api_key:
        print("Error: API key not found. Set the 'X_API_KEY' environment variable.")
    else:
        # For Twitter/X, get your Bearer Token from developer.x.com (not the consumer key).
        # If using a custom API with X-API-Key, swap the headers as noted.
        locations_data = fetch_locations(api_key)
        if locations_data:
            print("Locations fetched successfully:")
            print(locations_data)
        else:
            print("Failed to fetch locations.")
