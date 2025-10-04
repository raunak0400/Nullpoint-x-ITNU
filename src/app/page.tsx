
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

import {
  AppWindow,
  ArrowRight,
  Brain,
  Cloud,
  CloudSun,
  Globe as GlobeIcon,
  HelpCircle,
  History,
  Lightbulb,
  Map as MapIcon,
  Moon,
  Search,
  Settings,
  Siren,
  Smile,
  Sun,
  Gauge,
  Expand,
  X,
  ChevronDown,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceDot,
} from 'recharts';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTheme } from '@/components/theme-provider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { explainForecastFactors } from '@/ai/flows/explain-forecast-factors';
import { useSharedState } from '@/components/layout/sidebar';
import { PageWrapper } from '@/components/layout/page-wrapper';

const overviewDataSets = {
  Humidity: {
    data: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, value: Math.floor(Math.random() * 40) + 30 })),
    unit: '%',
    average: 52
  },
  'UV Index': {
    data: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, value: Math.max(0, Math.round(5 * Math.sin((i / 24) * Math.PI * 2 - Math.PI / 2) + 1)) })),
    unit: '',
    average: 2
  },
  Rainfall: {
    data: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, value: Math.max(0, Math.floor(Math.random() * 5) - 3) })),
    unit: 'mm',
    average: 1
  },
  Pressure: {
    data: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, value: 1012 + Math.floor(Math.random() * 10) - 5 })),
    unit: 'hPa',
    average: 1012
  },
};

type OverviewMetric = keyof typeof overviewDataSets;

const getIconForHour = (hour: number) => {
    if (hour >= 6 && hour < 12) return <CloudSun size={24} />;
    if (hour >= 12 && hour < 18) return <Sun size={24} />;
    if (hour >= 18 && hour < 20) return <Cloud size={24} />;
    return <Moon size={24} />;
};
  
const generateHourlyForecast = (is24Hour: boolean) => {
    const forecast = [];
    const now = new Date();
    const currentHour = now.getHours();
  
    for (let i = 0; i < 24; i++) {
        const hour = (currentHour + i) % 24;
        const timeDate = new Date();
        timeDate.setHours(hour);
        const time = format(timeDate, is24Hour ? 'HH:00' : 'ha').toLowerCase();
        const temp = Math.floor(Math.random() * 10) + 15; // Random temp between 15-25
        const icon = getIconForHour(hour);
        forecast.push({ time, temp, icon });
    }
  
    return forecast;
};

type TempUnit = 'C' | 'F';

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn('bg-card/50 backdrop-blur-lg border border-white/10 rounded-[2rem]', className)}>
      {children}
    </div>
  );
}

const celsiusToFahrenheit = (c: number) => (c * 9/5) + 32;

export default function Home() {
  return (
    <PageWrapper>
      <DashboardContent />
    </PageWrapper>
  );
}

function DashboardContent() {
  const { unit, is24Hour, selectedLocation } = useSharedState();

  return (
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 grid-rows-3 lg:grid-rows-2 gap-6">
        <div className="lg:col-span-2 row-span-1">
          <CurrentWeather unit={unit} is24Hour={is24Hour} location={selectedLocation} />
        </div>
        <div className="row-span-1">
          <InteractiveMap />
        </div>
        <div className="lg:col-span-1 row-span-1">
           <SmartTips location={selectedLocation} />
        </div>
        <div className="lg:col-span-2 row-span-1">
          <Overview />
        </div>
      </div>
  );
}

function CurrentWeather({ unit, is24Hour, location }: { unit: TempUnit; is24Hour: boolean, location: { name: string, country: string } }) {
    const [hourlyForecast, setHourlyForecast] = useState<any[]>([]);

    useEffect(() => {
        setHourlyForecast(generateHourlyForecast(is24Hour));
    }, [is24Hour]);


    const currentTemp = 20;
    const displayTemp = unit === 'C' ? currentTemp : celsiusToFahrenheit(currentTemp);

    if (hourlyForecast.length === 0) {
        return (
            <div className="p-6 h-full flex flex-col relative overflow-hidden bg-card/50 backdrop-blur-lg border border-white/10 rounded-[2rem]">
                <div className="flex items-center justify-center h-full">Loading forecast...</div>
            </div>
        );
    }

    return (
      <Link href="/weather-info" className="block h-full group">
        <div className="p-6 h-full flex flex-col relative overflow-hidden bg-card/50 backdrop-blur-lg border border-white/10 rounded-[2rem] group-hover:border-white/20 transition-all duration-300">
            <Image
                src="https://picsum.photos/seed/weather/1200/400"
                alt="Weather background"
                fill
                className="object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                data-ai-hint="weather condition"
            />
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <CloudSun size={64} className="text-primary" />
                    <div>
                        <h2 className="text-4xl font-bold">{location.name}</h2>
                        <p className="text-muted-foreground">{location.country}</p>
                    </div>
                </div>
                <div className="flex gap-x-4 gap-y-2 mt-4 sm:mt-0 flex-wrap items-center">
                    <div className="flex items-center gap-2 text-green-400">
                        <Smile size={20} />
                        <div>
                            <p className="font-semibold text-sm">Good</p>
                            <p className="text-xs text-muted-foreground">Air Mood</p>
                        </div>
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-sm">+{Math.round(displayTemp)}°</p>
                        <p className="text-xs text-muted-foreground">Temp</p>
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-sm">24%</p>
                        <p className="text-xs text-muted-foreground">Humidity</p>
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-sm">13<span className="text-xs">km/h</span></p>
                        <p className="text-xs text-muted-foreground">Wind</p>
                    </div>
                </div>
            </div>
            <div className="relative mt-auto z-10">
              <div className="overflow-x-auto -mx-6 px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{
                  maskImage: 'linear-gradient(to right, transparent, hsl(var(--card)) 5%, hsl(var(--card)) 95%, transparent)'
                }}
              >
                  <div className="flex gap-2 pb-2">
                    {hourlyForecast.map((hour, i) => (
                        <div key={i} className="flex flex-col items-center justify-between p-3 rounded-2xl bg-background/30 backdrop-blur-lg border border-white/10 min-w-[70px] h-32">
                            <p className="text-sm text-muted-foreground">{hour.time}</p>
                            <div className="text-muted-foreground">{hour.icon}</div>
                            <p className="text-lg font-bold">{Math.round(unit === 'C' ? hour.temp : celsiusToFahrenheit(hour.temp))}°</p>
                        </div>
                    ))}
                  </div>
              </div>
            </div>
        </div>
      </Link>
    );
}

function Overview() {
  const [activeMetric, setActiveMetric] = useState<OverviewMetric>('Humidity');
  const [currentHour, setCurrentHour] = useState<number | null>(null);

  useEffect(() => {
    const date = new Date();
    setCurrentHour(date.getHours());
  }, []);

  const handleSetMetric = (metric: OverviewMetric) => {
    setActiveMetric(metric);
  };
  
  const activeDataSet = overviewDataSets[activeMetric];
  const tabs = (Object.keys(overviewDataSets) as OverviewMetric[]);
  const currentHourX = currentHour !== null ? `${currentHour}:00` : undefined;
  const currentHourData = currentHourX ? activeDataSet.data.find(d => d.hour === currentHourX) : undefined;
  const currentHourY = currentHourData?.value;


  const PulsatingDot = ({ cx, cy }: { cx?: number, cy?: number }) => {
    if (cx === undefined || cy === undefined) return null;
    return (
      <g>
        <style>
          {`
            @keyframes ripple {
              0% {
                transform: scale(1);
                opacity: 1;
              }
              100% {
                transform: scale(3.5);
                opacity: 0;
              }
            }
            .ripple-circle {
              animation: ripple 1.5s infinite;
              transform-origin: center;
              transform-box: fill-box;
            }
          `}
        </style>
        <circle cx={cx} cy={cy} r="6" fill="hsl(var(--primary))" stroke="white" strokeWidth="2" />
        <circle
          className="ripple-circle"
          cx={cx}
          cy={cy}
          r="6"
          fill="transparent"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
      </g>
    );
  };


  return (
    <Card className="h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Overview</h3>
        <div className="relative flex items-center gap-1 bg-card/50 backdrop-blur-sm border border-white/10 rounded-full p-1 text-sm">
          {tabs.map((metric) => (
            <button
              key={metric}
              onClick={() => handleSetMetric(metric)}
              className={cn(
                "relative rounded-full h-8 px-4 z-10 transition-colors",
                activeMetric === metric ? "text-primary-foreground" : "text-foreground"
              )}
            >
              {metric}
            </button>
          ))}
           <motion.span
            layoutId="overview-active-tab"
            className="absolute h-8 rounded-full bg-primary z-0"
            style={{
              width: `${100/tabs.length}%`,
              left: `${tabs.indexOf(activeMetric) * (100/tabs.length)}%`
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>
      <div className="text-right mb-2">
        <span className="text-sm bg-primary/10 text-primary py-1 px-3 rounded-full">Average {activeDataSet.average}{activeDataSet.unit}</span>
      </div>
      <div className="flex-1 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activeDataSet.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}${activeDataSet.unit}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '1rem',
                background: 'hsla(var(--card), 0.5)',
                backdropFilter: 'blur(4px)',
                border: '1px solid hsla(0, 0%, 100%, 0.1)'
              }}
              labelClassName="font-bold"
              formatter={(value: number) => [`${value}${activeDataSet.unit}`, activeMetric]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorValue)"
            />
            {currentHourX && currentHourY !== undefined && (
               <ReferenceDot
                x={currentHourX}
                y={currentHourY}
                ifOverflow="extendDomain"
                shape={<PulsatingDot />}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: 'inherit',
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

const libraries = ['maps', 'visualization'] as const;

function MapView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [map, setMap] = useState(null);
  
  const onLoad = useCallback(function callback(map: any) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: any) {
    setMap(null);
  }, []);

  if (!apiKey) {
     return (
      <div className="flex items-center justify-center h-full text-center text-muted-foreground p-4">
        <div>
          <p>Google Maps API key is missing.</p>
          <p className="text-xs">Please add <code className="bg-muted/50 p-1 rounded-sm">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your <code className="bg-muted/50 p-1 rounded-sm">.env.local</code> file.</p>
        </div>
      </div>
     );
  }

  if (loadError) {
    return <p className='flex items-center justify-center h-full text-red-500'>Error loading map. Check the API key.</p>;
  }
  
  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: mapStyles,
        disableDefaultUI: true,
      }}
    >
      {/* Child components, such as markers, info windows, etc. */}
    </GoogleMap>
  ) : (
    <div className='flex items-center justify-center h-full'>Loading Map...</div>
  );
}

function ExpandedMap({ setIsExpanded }: { setIsExpanded: (isExpanded: boolean) => void }) {
  return (
    <motion.div
      layoutId="map-card"
      className="fixed inset-0 bg-card/80 backdrop-blur-lg z-50"
      style={{ borderRadius: '2rem', overflow: 'hidden' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-full h-full" style={{ borderRadius: 'inherit', overflow: 'hidden' }}>
        <MapView />
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-xl z-50"
        onClick={() => setIsExpanded(false)}
      >
        <X size={20} />
      </Button>
    </motion.div>
  );
}

function InteractiveMap() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isExpanded && <ExpandedMap setIsExpanded={setIsExpanded} />}
      </AnimatePresence>
      
      <motion.div
        layoutId="map-card"
        className="relative h-full"
        style={{ borderRadius: '2rem', overflow: 'hidden' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="bg-card/50 backdrop-blur-lg border border-white/10 rounded-[2rem] w-full h-full" style={{overflow: 'hidden'}}>
          <MapView />
        </div>
        {!isExpanded && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-xl z-10"
            onClick={() => setIsExpanded(true)}
          >
            <Expand size={20} />
          </Button>
        )}
      </motion.div>
    </>
  );
}


function SmartTips({ location }: { location: { name: string }}) {
  const [tips, setTips] = useState({ explanation: 'Loading...', recommendations: 'Loading...' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTips = async () => {
      setLoading(true);
      try {
        const result = await explainForecastFactors({
          city: location.name,
          dateTime: new Date().toISOString(),
        });
        setTips(result);
      } catch (error) {
        console.error("Error fetching smart tips:", error);
        setTips({
          explanation: 'Could not load tips at this time.',
          recommendations: 'Please try again later.'
        });
      }
      setLoading(false);
    };
    getTips();
  }, [location]);

  return (
    <Card className="h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Lightbulb className="text-primary" />
          Smart Tips
        </h3>
        <Button variant="ghost" size="sm" className="rounded-full">More</Button>
      </div>
      {loading ? (
        <div className="space-y-4">
          <div className="h-4 bg-muted/50 rounded w-5/6" />
          <div className="h-4 bg-muted/50 rounded w-full" />
          <div className="h-4 bg-muted/50 rounded w-4/6" />
          <div className="h-4 bg-muted/50 rounded w-1/2 mt-4" />
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          <p className="text-muted-foreground">{tips.explanation}</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            {tips.recommendations.split('- ').filter(r => r.trim()).map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

    