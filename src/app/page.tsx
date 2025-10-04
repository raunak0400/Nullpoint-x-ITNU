
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

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-card/50 backdrop-blur-sm border border-white/10 rounded-[2rem] p-6 ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex font-body">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <Header />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CurrentWeather />
            <Overview />
          </div>
          <div className="space-y-6">
            <InteractiveMap />
            <SmartTips />
            <Forecasts />
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
        <div className="text-primary font-bold text-2xl">g.</div>
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

function Header() {
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Hi, Nullpoint</h1>
        <p className="text-muted-foreground">Mon, 15 May, 2023</p>
      </div>
      <div className="flex items-center gap-2 md:gap-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input placeholder="Search city or postcode" className="bg-card/50 backdrop-blur-sm border-white/10 pl-10 w-48 md:w-64 rounded-full" />
        </div>
        <div className="flex items-center bg-card/50 backdrop-blur-sm border border-white/10 rounded-full">
            <Button variant={unit === 'C' ? "default" : "ghost"} className="rounded-full" onClick={() => setUnit('C')}>°C</Button>
            <Button variant={unit === 'F' ? "default" : "ghost"} className="rounded-full" onClick={() => setUnit('F')}>°F</Button>
        </div>
        <Avatar className="rounded-full">
          <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}


function CurrentWeather() {
    return (
        <Card className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <CloudSun size={64} className="text-primary" />
                    <div>
                        <h2 className="text-4xl font-bold">Berlin</h2>
                        <p className="text-muted-foreground">Germany</p>
                    </div>
                </div>
                <div className="flex gap-x-6 gap-y-2 mt-4 sm:mt-0 flex-wrap items-center">
                    <div className="flex items-center gap-2 text-green-400">
                        <Smile size={32} />
                        <div>
                            <p className="text-xl font-bold">Good</p>
                            <p className="text-xs">Air Mood</p>
                        </div>
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-2xl font-bold">+20°</p>
                        <p className="text-xs text-muted-foreground">Temperature</p>
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-2xl font-bold">24%</p>
                        <p className="text-xs text-muted-foreground">Humidity</p>
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-2xl font-bold">13<span className="text-base">km/h</span></p>
                        <p className="text-xs text-muted-foreground">Wind speed</p>
                    </div>
                </div>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent pointer-events-none z-10"></div>
              <div className="flex overflow-x-auto gap-2 pb-2 -mx-2 px-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {hourlyForecast.map((hour, i) => (
                      <div key={i} className="flex flex-col items-center justify-between p-3 rounded-3xl bg-background/50 backdrop-blur-sm border border-white/10 min-w-[60px] h-32">
                          <p className="text-sm text-muted-foreground">{hour.time}</p>
                          <div className="text-muted-foreground">{hour.icon}</div>
                          <p className="text-lg font-bold">{hour.temp}°</p>
                      </div>
                  ))}
              </div>
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none z-10"></div>
            </div>
        </Card>
    );
}

function Overview() {
  return (
    <Card>
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
      <div className="h-64">
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
    <Card className="relative h-64 p-0 overflow-hidden">
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
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Lightbulb className="text-primary" />
          Smart Tips
        </h3>
        <Button variant="ghost" size="sm" className="rounded-full">More</Button>
      </div>
      <div className="space-y-3">
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

function Forecasts() {
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Forecasts</h3>
        <div className="flex items-center gap-1 bg-card/50 backdrop-blur-sm border border-white/10 rounded-full p-1 text-sm">
          <Button variant="ghost" size="sm" className="rounded-full bg-primary text-primary-foreground h-8 px-4">3 days</Button>
          <Button variant="ghost" size="sm" className="rounded-full h-8 px-4">10 days</Button>
        </div>
      </div>
      <div className="space-y-3">
        {dailyForecasts.map((day, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-3">
              <div className="text-primary">{day.icon}</div>
              <p className="font-semibold">+{day.high}°<span className="text-muted-foreground">/{day.low}°</span></p>
            </div>
            <p className="text-muted-foreground">{day.date}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

    

    
