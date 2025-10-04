
'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, HeatmapLayer } from '@react-google-maps/api';
import Link from 'next/link';
import { ArrowLeft, Layers, Thermometer, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 52.52,
  lng: 13.40,
};

const mapStyles = [
    {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8ec3b9"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1a3646"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#4b6878"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#64779e"
      }
    ]
  },
  {
    "featureType": "administrative.province",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#4b6878"
      }
    ]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#334e87"
      }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#023e58"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#283d6a"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#6f9ba5"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#023e58"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3C7680"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#304a7d"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#98a5be"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#2c6675"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#255763"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#b0d5ce"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#023e58"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#98a5be"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#283d6a"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3a4762"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#0e1626"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#4e6d70"
      }
    ]
  }
];

const generateHeatmapData = (intensity: number) => {
  const data = [];
  for (let i = 0; i < 100; i++) {
    const lat = 52.52 + (Math.random() - 0.5) * 0.5;
    const lng = 13.40 + (Math.random() - 0.5) * 1.0;
    data.push({ location: new google.maps.LatLng(lat, lng), weight: Math.random() * intensity });
  }
  return data;
};

let pollutionData: any[] = [];
let tempData: any[] = [];
let windData: any[] = [];


export default function MapViewPage() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-full',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['visualization']
  });

  if (isLoaded && pollutionData.length === 0) {
    pollutionData = generateHeatmapData(1.5);
    tempData = generateHeatmapData(0.8);
    windData = generateHeatmapData(0.5);
  }

  const [map, setMap] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [activeLayers, setActiveLayers] = useState({
    pollution: true,
    temperature: false,
    wind: false,
  });

  const onLoad = useCallback(function callback(map: any) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: any) {
    setMap(null);
  }, []);

  const handleLayerChange = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };
  
  const getGradient = (layer: keyof typeof activeLayers) => {
    if (layer === 'pollution') return ['rgba(0, 255, 255, 0)', 'rgba(0, 255, 255, 1)', 'rgba(0, 127, 255, 1)', 'rgba(0, 0, 255, 1)', 'rgba(0, 0, 127, 1)', 'rgba(255, 0, 0, 1)'];
    if (layer === 'temperature') return ['rgba(0, 255, 0, 0)', 'rgba(255, 255, 0, 1)', 'rgba(255, 0, 0, 1)'];
    return ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.5)', 'rgba(200, 200, 200, 1)'];
  }


  return (
    <div className="h-screen w-screen flex flex-col">
       <header className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-background/80 to-transparent">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="bg-card/50 backdrop-blur-sm">
              <ArrowLeft />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Easy Map View</h1>
            <p className="text-sm text-muted-foreground">
              Interactive data layers for Berlin
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="bg-card/50 backdrop-blur-sm" onClick={() => setShowFilters(!showFilters)}>
          <Layers />
        </Button>
      </header>

      <div className="flex-1 relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={11}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{ styles: mapStyles, disableDefaultUI: true, zoomControl: true, streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
          >
            {activeLayers.pollution && <HeatmapLayer data={pollutionData} options={{ gradient: getGradient('pollution'), radius: 40 }} />}
            {activeLayers.temperature && <HeatmapLayer data={tempData} options={{ gradient: getGradient('temperature'), radius: 50 }} />}
            {activeLayers.wind && <HeatmapLayer data={windData} options={{ gradient: getGradient('wind'), radius: 30 }} />}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-background">
            Loading Map...
          </div>
        )}

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="absolute top-20 right-4 bg-card/70 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-64 z-10"
            >
              <h3 className="font-semibold mb-4">Map Layers</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="pollution" checked={activeLayers.pollution} onCheckedChange={() => handleLayerChange('pollution')} />
                  <Label htmlFor="pollution" className="flex items-center gap-2"><Layers size={16} className="text-primary"/> Air Pollution</Label>
                </div>
                 <div className="flex items-center space-x-2">
                  <Checkbox id="temperature" checked={activeLayers.temperature} onCheckedChange={() => handleLayerChange('temperature')} />
                  <Label htmlFor="temperature" className="flex items-center gap-2"><Thermometer size={16} className="text-red-400"/> Temperature</Label>
                </div>
                 <div className="flex items-center space-x-2">
                  <Checkbox id="wind" checked={activeLayers.wind} onCheckedChange={() => handleLayerChange('wind')} />
                  <Label htmlFor="wind" className="flex items-center gap-2"><Wind size={16} className="text-blue-300"/> Wind Speed</Label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loadError && <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 text-white">Error loading map. Please check your API key and network connection.</div>}
    </div>
  );
}
