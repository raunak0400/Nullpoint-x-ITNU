
'use client';

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, HeatmapLayer, useJsApiLoader } from '@react-google-maps/api';
import { Layers, Beaker, CloudCog, Sigma, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/theme-provider';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 52.52,
  lng: 13.40,
};

const defaultDarkMapStyles = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8ec3b9" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1a3646" }]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#4b6878" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#64779e" }]
  },
  {
    "featureType": "administrative.province",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#4b6878" }]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#334e87" }]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#283d6a" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#6f9ba5" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#3C7680" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#304a7d" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#98a5be" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#2c6675" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#255763" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#b0d5ce" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#98a5be" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#283d6a" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#3a4762" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#0e1626" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#4e6d70" }]
  }
];

const lightMapStyles = [
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#e9e9e9"
            },
            {
                "lightness": 17
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#f5f5f5"
            },
            {
                "lightness": 20
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "lightness": 17
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "lightness": 29
            },
            {
                "weight": 0.2
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "lightness": 18
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "lightness": 16
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#f5f5f5"
            },
            {
                "lightness": 21
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#dedede"
            },
            {
                "lightness": 21
            }
        ]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "color": "#ffffff"
            },
            {
                "lightness": 16
            }
        ]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "saturation": 36
            },
            {
                "color": "#333333"
            },
            {
                "lightness": 40
            }
        ]
    },
    {
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#f2f2f2"
            },
            {
                "lightness": 19
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#fefefe"
            },
            {
                "lightness": 20
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#fefefe"
            },
            {
                "lightness": 17
            },
            {
                "weight": 1.2
            }
        ]
    }
];

const ultraDarkMapStyles = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];

const generateHeatmapData = (intensity: number) => {
  const data = [];
  if (typeof window === 'undefined' || typeof window.google === 'undefined' || !window.google.maps.LatLng) return data;
  for (let i = 0; i < 100; i++) {
    const lat = 52.52 + (Math.random() - 0.5) * 0.5;
    const lng = 13.40 + (Math.random() - 0.5) * 1.0;
    data.push({ location: new window.google.maps.LatLng(lat, lng), weight: Math.random() * intensity });
  }
  return data;
};

const heatmapData: { [key: string]: any[] } = {
  no2: [],
  ch2o: [],
  aerosol: [],
  pm: [],
  o3: [],
};

const libraries = ['visualization'] as const;

type LayerName = keyof typeof heatmapData;

export function Map({ showFilters: initialShowFilters = false }: { showFilters?: boolean }) {
  const { theme } = useTheme();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries
  });

  const [map, setMap] = useState(null);
  const [showFilters, setShowFilters] = useState(initialShowFilters);
  const [activeLayers, setActiveLayers] = useState({
    no2: true,
    ch2o: false,
    aerosol: false,
    pm: false,
    o3: false,
  });

  useEffect(() => {
    if (isLoaded) {
      heatmapData.no2 = generateHeatmapData(1.5);
      heatmapData.ch2o = generateHeatmapData(1.2);
      heatmapData.aerosol = generateHeatmapData(2.0);
      heatmapData.pm = generateHeatmapData(1.8);
      heatmapData.o3 = generateHeatmapData(1.0);
    }
  }, [isLoaded]);

  const onLoad = useCallback(function callback(map: any) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: any) {
    setMap(null);
  }, []);

  const handleLayerChange = (layer: LayerName) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };
  
  const getGradient = (layer: LayerName) => {
    switch(layer) {
      case 'no2': return ['rgba(255, 255, 0, 0)', 'rgba(255, 165, 0, 1)', 'rgba(255, 0, 0, 1)'];
      case 'ch2o': return ['rgba(173, 216, 230, 0)', 'rgba(0, 191, 255, 1)', 'rgba(0, 0, 255, 1)'];
      case 'aerosol': return ['rgba(211, 211, 211, 0)', 'rgba(128, 128, 128, 1)', 'rgba(0, 0, 0, 1)'];
      case 'pm': return ['rgba(255, 250, 205, 0)', 'rgba(255, 215, 0, 1)', 'rgba(184, 134, 11, 1)'];
      case 'o3': return ['rgba(144, 238, 144, 0)', 'rgba(0, 255, 0, 1)', 'rgba(0, 100, 0, 1)'];
      default: return [];
    }
  }
  
  const layerConfig: { id: LayerName; label: string; icon: React.ReactNode; colorClass: string; }[] = [
    { id: 'no2', label: 'NO₂', icon: <Beaker size={16} />, colorClass: 'text-yellow-400'},
    { id: 'ch2o', label: 'CH₂O', icon: <CloudCog size={16} />, colorClass: 'text-blue-300' },
    { id: 'aerosol', label: 'Aerosol Index', icon: <Sigma size={16} />, colorClass: 'text-gray-400' },
    { id: 'pm', label: 'Particulate Matter', icon: <Layers size={16} />, colorClass: 'text-orange-300' },
    { id: 'o3', label: 'Ozone', icon: <Waves size={16} />, colorClass: 'text-green-400' },
  ];

  const getMapStyle = () => {
    if (theme === 'light') {
      return lightMapStyles;
    }
    if (theme === 'dark') {
      return ultraDarkMapStyles;
    }
    return defaultDarkMapStyles;
  }

  const mapOptions = {
    styles: getMapStyle(),
    disableDefaultUI: true,
    zoomControl: false,
  };

  return (
    <div className="h-full w-full flex flex-col relative bg-background">
      {initialShowFilters && (
        <div className="absolute top-4 right-4 z-10">
          <Button variant="ghost" size="icon" className="bg-card/50 backdrop-blur-sm" onClick={() => setShowFilters(!showFilters)}>
            <Layers />
          </Button>
        </div>
      )}

      <div className="flex-1 relative">
        {loadError && apiKey && <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 text-white p-4 text-center">Error loading map. Please check your API key and network connection.</div>}
        {!apiKey && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20 text-center p-4">
            <div>
              <p>Google Maps API key is missing.</p>
              <p className="text-xs text-muted-foreground">Please add <code className="bg-muted/50 p-1 rounded-sm">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your <code className="bg-muted/50 p-1 rounded-sm">.env.local</code> file.</p>
            </div>
          </div>
        )}
        {isLoaded && apiKey ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            mapContainerClassName="custom-map-container"
            center={center}
            zoom={11}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={mapOptions}
          >
            {Object.keys(activeLayers).map((key) => {
                const layerKey = key as LayerName;
                if (activeLayers[layerKey] && heatmapData[layerKey].length > 0) {
                    return <HeatmapLayer key={layerKey} data={heatmapData[layerKey]} options={{ gradient: getGradient(layerKey), radius: 40 }} />
                }
                return null;
            })}
          </GoogleMap>
        ) : apiKey ? (
          <div className="w-full h-full flex items-center justify-center">
            Loading Map...
          </div>
        ) : null}

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="absolute top-20 right-4 bg-card/70 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-64 z-10"
            >
              <h3 className="font-semibold mb-4">Satellite Data Layers</h3>
              <div className="space-y-4">
                {layerConfig.map(({ id, label, icon, colorClass }) => (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox id={id} checked={activeLayers[id]} onCheckedChange={() => handleLayerChange(id)} />
                    <Label htmlFor={id} className={`flex items-center gap-2 ${colorClass}`}>{icon} {label}</Label>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

    