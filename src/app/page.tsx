'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

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
} from 'recharts';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const overviewData = [
  { month: 'Jan', value: 20 },
  { month: 'Feb', value: 30 },
  { month: 'Mar', value: 45 },
  { month: 'Apr', value: 40 },
  { month: 'May', value: 60 },
  { month: 'Jun', value: 80 },
  { month: 'Jul', value: 75 },
  { month: 'Aug', value: 70 },
  { month: 'Sep', value: 55 },
  { month: 'Oct', value: 45 },
  { month: 'Nov', value: 30 },
  { month: 'Dec', value: 25 },
];

const hourlyForecast = [
  { time: '09 am', temp: 17, icon: <CloudSun size={24} /> },
  { time: '10 am', temp: 21, icon: <Sun size={24} /> },
  { time: '11 am', temp: 21, icon: <Sun size={24} /> },
  { time: '12 pm', temp: 24, icon: <Sun size={24} /> },
  { time: '01 pm', temp: 24, icon: <Sun size={24} /> },
  { time: '02 pm', temp: 26, icon: <Sun size={24} /> },
  { time: '03 pm', temp: 24, icon: <CloudSun size={24} /> },
  { time: '04 pm', temp: 22, icon: <Cloud size={24} /> },
  { time: '05 pm', temp: 21, icon: <Cloud size={24} /> },
  { time: '06 pm', temp: 21, icon: <Moon size={24} /> },
  { time: '07 pm', temp: 19, icon: <Moon size={24} /> },
];

const dailyForecasts = [
  { day: 'Tue', date: '16 May', high: 22, low: 17, icon: <CloudSun size={20} /> },
  { day: 'Wed', date: '17 May', high: 20, low: 18, icon: <Cloud size={20} /> },
  { day: 'Thu', date: '18 May', high: 25, low: 19, icon: <Sun size={20} /> },
];

type TempUnit = 'C' | 'F';

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn('bg-card/50 backdrop-blur-sm border border-white/10 rounded-[2rem]', className)}>
      {children}
    </div>
  );
}

const celsiusToFahrenheit = (c: number) => (c * 9/5) + 32;

export default function Home() {
  const [unit, setUnit] = useState<TempUnit>('C');

  return (
    <div className="h-screen flex font-body overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 gap-6">
        <Header unit={unit} setUnit={setUnit} />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 grid-rows-3 lg:grid-rows-2 gap-6">
          <div className="lg:col-span-2 row-span-1">
            <CurrentWeather unit={unit} />
          </div>
          <div className="row-span-1">
            <InteractiveMap />
          </div>
          <div className="lg:col-span-1 row-span-1">
             <SmartTips />
          </div>
          <div className="lg:col-span-2 row-span-1">
            <Overview />
          </div>
        </div>
      </main>
    </div>
  );
}

function Sidebar() {
  const navItems = [
    { icon: <Gauge />, label: 'Live Air Quality' },
    { icon: <CloudSun />, label: 'Weather Info' },
    { icon: <Brain />, label: 'Future Air Prediction' },
    { icon: <Siren />, label: 'Air Alerts' },
    { icon: <MapIcon />, label: 'Easy Map View' },
    { icon: <History />, label: 'Past Air Data' },
  ];

  const bottomNavItems = [
    { icon: <HelpCircle />, label: 'Help' },
    { icon: <Settings />, label: 'Settings' },
    { icon: <AppWindow />, label: 'App' },
  ];

  return (
    <aside className="w-20 bg-card/50 backdrop-blur-sm border-r border-white/10 p-4 flex flex-col items-center justify-between rounded-r-[2rem]">
      <div className="space-y-8">
        
        <nav className="space-y-6">
          {navItems.map((item, index) => (
            <Button key={index} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground data-[active=true]:text-foreground data-[active=true]:bg-primary/10 w-12 h-12 rounded-2xl" data-active={index === 0} title={item.label}>
              {item.icon}
            </Button>
          ))}
        </nav>
      </div>
      <div className="space-y-6">
          {bottomNavItems.map((item, index) => (
            <Button key={index} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground w-12 h-12 rounded-2xl" title={item.label}>
              {item.icon}
            </Button>
          ))}
      </div>
    </aside>
  );
}

const TemperatureSwitch = ({ unit, setUnit }: { unit: TempUnit; setUnit: (unit: TempUnit) => void }) => {
  return (
    <div className="relative flex w-[72px] h-10 cursor-pointer items-center rounded-full bg-card/50 p-1 backdrop-blur-sm border border-white/10">
      <div
        className={cn(
          'absolute h-8 w-8 rounded-full bg-primary transition-transform duration-300 ease-in-out',
          unit === 'C' ? 'translate-x-[2px]' : 'translate-x-[34px]'
        )}
      />
      <button
        onClick={() => setUnit('C')}
        className={cn(
          'z-10 flex-1 h-8 text-center font-medium transition-colors',
          unit === 'C' ? 'text-primary-foreground' : 'text-muted-foreground'
        )}
      >
        °C
      </button>
      <button
        onClick={() => setUnit('F')}
        className={cn(
          'z-10 flex-1 h-8 text-center font-medium transition-colors',
          unit === 'F' ? 'text-primary-foreground' : 'text-muted-foreground'
        )}
      >
        °F
      </button>
    </div>
  );
};


function Header({ unit, setUnit }: { unit: TempUnit; setUnit: (unit: TempUnit) => void }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(now);
  
  const formattedTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }).format(now);

  const [hours, minutes] = formattedTime.split(':');

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Hi, Nullpoint</h1>
        <p className="text-muted-foreground flex items-center" suppressHydrationWarning>
          <span>{formattedDate}</span>
          <span className="mx-2">|</span>
          <span>
            {hours}
            <span className="animate-pulse duration-1000 ease-in-out">:</span>
            {minutes}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2 md:gap-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input placeholder="Search city or postcode" className="bg-card/50 backdrop-blur-sm border-white/10 pl-10 w-48 md:w-64 rounded-full" />
        </div>
        <TemperatureSwitch unit={unit} setUnit={setUnit} />
        <Avatar className="rounded-full">
          <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}


function CurrentWeather({ unit }: { unit: TempUnit }) {
    const currentTemp = 20;
    const displayTemp = unit === 'C' ? currentTemp : celsiusToFahrenheit(currentTemp);

    return (
        <Card className="p-6 h-full flex flex-col relative overflow-hidden">
            <Image
                src="https://picsum.photos/seed/weather/1200/400"
                alt="Weather background"
                fill
                className="object-cover opacity-20"
                data-ai-hint="weather condition"
            />
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <CloudSun size={64} className="text-primary" />
                    <div>
                        <h2 className="text-4xl font-bold">Berlin</h2>
                        <p className="text-muted-foreground">Germany</p>
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
                        <div key={i} className="flex flex-col items-center justify-between p-3 rounded-2xl bg-background/30 backdrop-blur-sm border border-white/10 min-w-[60px] h-32">
                            <p className="text-sm text-muted-foreground">{hour.time}</p>
                            <div className="text-muted-foreground">{hour.icon}</div>
                            <p className="text-lg font-bold">{Math.round(unit === 'C' ? hour.temp : celsiusToFahrenheit(hour.temp))}°</p>
                        </div>
                    ))}
                  </div>
              </div>
            </div>
        </Card>
    );
}

function Overview() {
  return (
    <Card className="h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Overview</h3>
        <div className="flex items-center gap-1 bg-card/50 backdrop-blur-sm border border-white/10 rounded-full p-1 text-sm">
          <Button variant="ghost" size="sm" className="rounded-full bg-primary text-primary-foreground h-8 px-4">Humidity</Button>
          <Button variant="ghost" size="sm" className="rounded-full h-8 px-4">UV Index</Button>
          <Button variant="ghost" size="sm" className="rounded-full h-8 px-4">Rainfall</Button>
          <Button variant="ghost" size="sm" className="rounded-full h-8 px-4">Pressure</Button>
        </div>
      </div>
      <div className="text-right mb-2">
        <span className="text-sm bg-primary/10 text-primary py-1 px-3 rounded-full">Average 65%</span>
      </div>
      <div className="flex-1 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={overviewData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
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
              formatter={(value: number) => [`${value}%`, 'Humidity']}
            />
            <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '2rem',
};

const center = {
  lat: 52.52,
  lng: 13.40,
};

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];


function MapView({ isExpanded }: { isExpanded: boolean }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  });

  const [map, setMap] = useState(null);

  const onLoad = useCallback(function callback(map: any) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: any) {
    setMap(null);
  }, []);

  if (loadError) {
    return <p className='text-red-500'>Error loading map</p>;
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={{
        width: '100%',
        height: '100%',
        borderRadius: isExpanded ? '0' : '2rem',
      }}
      center={center}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      {/* Child components, such as markers, info windows, etc. */}
    </GoogleMap>
  ) : (
    <div className='flex items-center justify-center h-full'>Loading Map...</div>
  );
}

function InteractiveMap() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="relative h-full p-0 overflow-hidden">
      <MapView isExpanded={false} />
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost" className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-xl">
            <Expand size={20} />
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 border-0 max-w-none w-screen h-screen">
          <MapView isExpanded={true} />
          <DialogClose asChild>
            <Button size="icon" variant="ghost" className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-xl">
              <X size={20}/>
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SmartTips() {
  return (
    <Card className="h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Lightbulb className="text-primary" />
          Smart Tips
        </h3>
        <Button variant="ghost" size="sm" className="rounded-full">More</Button>
      </div>
      <div className="space-y-3 flex-1">
        <p className="text-muted-foreground">
          Air quality is poor. It's recommended to stay indoors and use an air purifier if available.
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>Avoid outdoor exercise.</li>
          <li>Keep windows closed.</li>
          <li>Wear a mask if you go outside.</li>
        </ul>
      </div>
    </Card>
  );
}
