'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { Location } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
  currentLocation?: Location | null;
  onLocationChange: (location: Location) => void;
  className?: string;
}

// Predefined locations for quick selection
const PRESET_LOCATIONS = [
  { name: 'New York City', lat: 40.7128, lon: -74.0060, country: 'USA' },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, country: 'USA' },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298, country: 'USA' },
  { name: 'Houston', lat: 29.7604, lon: -95.3698, country: 'USA' },
  { name: 'Phoenix', lat: 33.4484, lon: -112.0740, country: 'USA' },
  { name: 'Philadelphia', lat: 39.9526, lon: -75.1652, country: 'USA' },
  { name: 'San Antonio', lat: 29.4241, lon: -98.4936, country: 'USA' },
  { name: 'San Diego', lat: 32.7157, lon: -117.1611, country: 'USA' },
  { name: 'Dallas', lat: 32.7767, lon: -96.7970, country: 'USA' },
  { name: 'San Jose', lat: 37.3382, lon: -121.8863, country: 'USA' },
  { name: 'Austin', lat: 30.2672, lon: -97.7431, country: 'USA' },
  { name: 'Jacksonville', lat: 30.3322, lon: -81.6557, country: 'USA' },
  { name: 'Fort Worth', lat: 32.7555, lon: -97.3308, country: 'USA' },
  { name: 'Columbus', lat: 39.9612, lon: -82.9988, country: 'USA' },
  { name: 'Charlotte', lat: 35.2271, lon: -80.8431, country: 'USA' },
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194, country: 'USA' },
  { name: 'Indianapolis', lat: 39.7684, lon: -86.1581, country: 'USA' },
  { name: 'Seattle', lat: 47.6062, lon: -122.3321, country: 'USA' },
  { name: 'Denver', lat: 39.7392, lon: -104.9903, country: 'USA' },
  { name: 'Boston', lat: 42.3601, lon: -71.0589, country: 'USA' },
  { name: 'El Paso', lat: 31.7619, lon: -106.4850, country: 'USA' },
  { name: 'Detroit', lat: 42.3314, lon: -83.0458, country: 'USA' },
  { name: 'Nashville', lat: 36.1627, lon: -86.7816, country: 'USA' },
  { name: 'Portland', lat: 45.5152, lon: -122.6784, country: 'USA' },
  { name: 'Memphis', lat: 35.1495, lon: -90.0490, country: 'USA' },
  { name: 'Oklahoma City', lat: 35.4676, lon: -97.5164, country: 'USA' },
  { name: 'Las Vegas', lat: 36.1699, lon: -115.1398, country: 'USA' },
  { name: 'Louisville', lat: 38.2527, lon: -85.7585, country: 'USA' },
  { name: 'Baltimore', lat: 39.2904, lon: -76.6122, country: 'USA' },
  { name: 'Milwaukee', lat: 43.0389, lon: -87.9065, country: 'USA' },
  { name: 'Albuquerque', lat: 35.0844, lon: -106.6504, country: 'USA' },
  { name: 'Tucson', lat: 32.2226, lon: -110.9747, country: 'USA' },
  { name: 'Fresno', lat: 36.7378, lon: -119.7871, country: 'USA' },
  { name: 'Sacramento', lat: 38.5816, lon: -121.4944, country: 'USA' },
  { name: 'Kansas City', lat: 39.0997, lon: -94.5786, country: 'USA' },
  { name: 'Mesa', lat: 33.4152, lon: -111.8315, country: 'USA' },
  { name: 'Atlanta', lat: 33.7490, lon: -84.3880, country: 'USA' },
  { name: 'Colorado Springs', lat: 38.8339, lon: -104.8214, country: 'USA' },
  { name: 'Raleigh', lat: 35.7796, lon: -78.6382, country: 'USA' },
  { name: 'Omaha', lat: 41.2565, lon: -95.9345, country: 'USA' },
  { name: 'Miami', lat: 25.7617, lon: -80.1918, country: 'USA' },
  { name: 'Long Beach', lat: 33.7701, lon: -118.1937, country: 'USA' },
  { name: 'Virginia Beach', lat: 36.8529, lon: -75.9780, country: 'USA' },
  { name: 'Oakland', lat: 37.8044, lon: -122.2711, country: 'USA' },
  { name: 'Minneapolis', lat: 44.9778, lon: -93.2650, country: 'USA' },
  { name: 'Tulsa', lat: 36.1540, lon: -95.9928, country: 'USA' },
  { name: 'Arlington', lat: 32.7357, lon: -97.1081, country: 'USA' },
  { name: 'Tampa', lat: 27.9506, lon: -82.4572, country: 'USA' },
  { name: 'New Orleans', lat: 29.9511, lon: -90.0715, country: 'USA' },
  { name: 'Wichita', lat: 37.6872, lon: -97.3301, country: 'USA' },
  { name: 'Cleveland', lat: 41.4993, lon: -81.6944, country: 'USA' }
];

export const LocationPicker: React.FC<LocationPickerProps> = ({
  currentLocation,
  onLocationChange,
  className
}) => {
  const [manualLat, setManualLat] = useState(currentLocation?.lat?.toString() || '');
  const [manualLon, setManualLon] = useState(currentLocation?.lon?.toString() || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Filter preset locations based on search
  const filteredLocations = PRESET_LOCATIONS.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle preset location selection
  const handlePresetLocation = (location: { lat: number; lon: number; name: string }) => {
    onLocationChange({ lat: location.lat, lon: location.lon });
    setManualLat(location.lat.toString());
    setManualLon(location.lon.toString());
  };

  // Handle manual coordinate entry
  const handleManualLocation = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    if (isNaN(lat) || isNaN(lon)) {
      alert('Please enter valid latitude and longitude values');
      return;
    }

    if (lat < -90 || lat > 90) {
      alert('Latitude must be between -90 and 90');
      return;
    }

    if (lon < -180 || lon > 180) {
      alert('Longitude must be between -180 and 180');
      return;
    }

    onLocationChange({ lat, lon });
  };

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        
        onLocationChange(location);
        setManualLat(location.lat.toString());
        setManualLon(location.lon.toString());
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location. Please enter coordinates manually.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [onLocationChange]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Current Location Display */}
      {currentLocation && (
        <Card className="bg-black/20 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">Current Location</p>
                <p className="text-gray-300 text-sm">
                  {currentLocation.lat.toFixed(4)}, {currentLocation.lon.toFixed(4)}
                </p>
              </div>
              <Badge variant="outline" className="ml-auto">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Input Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Manual Coordinates */}
        <Card className="bg-black/20 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Manual Coordinates
            </CardTitle>
            <CardDescription>
              Enter precise latitude and longitude coordinates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude" className="text-gray-300">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="40.7128"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="bg-black/20 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">-90 to 90</p>
              </div>
              <div>
                <Label htmlFor="longitude" className="text-gray-300">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="-74.0060"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  className="bg-black/20 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">-180 to 180</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleManualLocation}
                className="flex-1"
                disabled={!manualLat || !manualLon}
              >
                Set Location
              </Button>
              <Button
                onClick={getCurrentLocation}
                variant="outline"
                disabled={isGettingLocation}
              >
                <Navigation className={cn("h-4 w-4", isGettingLocation && "animate-spin")} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preset Locations */}
        <Card className="bg-black/20 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="h-5 w-5" />
              Quick Select
            </CardTitle>
            <CardDescription>
              Choose from major cities in North America
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              placeholder="Search cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/20 border-gray-600 text-white"
            />
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredLocations.slice(0, 10).map((location, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-3 hover:bg-white/10"
                  onClick={() => handlePresetLocation(location)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{location.name}</p>
                      <p className="text-gray-400 text-sm">
                        {location.lat.toFixed(2)}, {location.lon.toFixed(2)} • {location.country}
                      </p>
                    </div>
                    {currentLocation && 
                     Math.abs(currentLocation.lat - location.lat) < 0.01 && 
                     Math.abs(currentLocation.lon - location.lon) < 0.01 && (
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </Button>
              ))}
              
              {filteredLocations.length === 0 && searchTerm && (
                <div className="text-center py-4 text-gray-400">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No cities found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TEMPO Coverage Info */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Globe className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">NASA TEMPO Coverage</h3>
              <p className="text-blue-200 text-sm mb-2">
                TEMPO satellite provides optimal coverage for North America (18°N to 70°N, 140°W to 40°W)
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-blue-300 border-blue-400">
                  Hourly Updates
                </Badge>
                <Badge variant="outline" className="text-blue-300 border-blue-400">
                  2-5km Resolution
                </Badge>
                <Badge variant="outline" className="text-blue-300 border-blue-400">
                  Daylight Hours
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationPicker;
