
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
} from 'recharts';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTheme } from '@/components/theme-provider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { explainForecastFactors } from '@/ai/flows/explain-forecast-factors';

const overviewDataSets = {
  Humidity: {
    data: [
      { month: 'Jan', value: 20 }, { month: 'Feb', value: 30 }, { month: 'Mar', value: 45 },
      { month: 'Apr', value: 40 }, { month: 'May', value: 60 }, { month: 'Jun', value: 80 },
      { month: 'Jul', value: 75 }, { month: 'Aug', value: 70 }, { month: 'Sep', value: 55 },
      { month: 'Oct', value: 45 }, { month: 'Nov', value: 30 }, { month: 'Dec', value: 25 },
    ],
    unit: '%',
    average: 52
  },
  'UV Index': {
    data: [
      { month: 'Jan', value: 1 }, { month: 'Feb', value: 2 }, { month: 'Mar', value: 3 },
      { month: 'Apr', value: 5 }, { month: 'May', value: 7 }, { month: 'Jun', value: 9 },
      { month: 'Jul', value: 8 }, { month: 'Aug', value: 7 }, { month: 'Sep', value: 5 },
      { month: 'Oct', value: 3 }, { month: 'Nov', value: 2 }, { month: 'Dec', value: 1 },
    ],
    unit: '',
    average: 4
  },
  Rainfall: {
    data: [
      { month: 'Jan', value: 40 }, { month: 'Feb', value: 35 }, { month: 'Mar', value: 50 },
      { month: 'Apr', value: 60 }, { month: 'May', value: 55 }, { month: 'Jun', value: 70 },
      { month: 'Jul', value: 80 }, { month: 'Aug', value: 75 }, { month: 'Sep', value: 65 },
      { month: 'Oct', value: 50 }, { month: 'Nov', value: 45 }, { month: 'Dec', value: 40 },
    ],
    unit: 'mm',
    average: 55
  },
  Pressure: {
    data: [
      { month: 'Jan', value: 1012 }, { month: 'Feb', value: 1010 }, { month: 'Mar', value: 1008 },
      { month: 'Apr', value: 1006 }, { month: 'May', value: 1004 }, { month: 'Jun', value: 1002 },
      { month: 'Jul', value: 1000 }, { month: 'Aug', value: 1002 }, { month: 'Sep', value: 1004 },
      { month: 'Oct', value: 1006 }, { month: 'Nov', value: 1008 }, { month: 'Dec', value: 1010 },
    ],
    unit: 'hPa',
    average: 1006
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
    const now = new Date();
    const currentHour = now.getHours();
    const forecast = [];
  
    for (let i = currentHour; i <= 23; i++) {
        const time = format(new Date().setHours(i), is24Hour ? 'HH:00' : 'ha').toLowerCase();
        const temp = Math.floor(Math.random() * 10) + 15; // Random temp between 15-25
        const icon = getIconForHour(i);
        forecast.push({ time, temp, icon });
    }
  
    return forecast;
};

const locations = [
  { name: 'Berlin', country: 'Germany' },
  { name: 'New York', country: 'USA' },
  { name: 'Tokyo', country: 'Japan' },
  { name: 'London', country: 'UK' },
  { name: 'Paris', country: 'France' },
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
  const [is24Hour, setIs24Hour] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);

  return (
    <div className="h-screen flex font-body overflow-hidden">
      <Sidebar is24Hour={is24Hour} setIs24Hour={setIs24Hour} />
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 gap-6">
        <Header unit={unit} setUnit={setUnit} is24Hour={is24Hour} selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />
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
      </main>
    </div>
  );
}

function Sidebar({ is24Hour, setIs24Hour }: { is24Hour: boolean; setIs24Hour: (is24Hour: boolean) => void; }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const pathname = usePathname();
  
  const navItems = [
    { icon: <Gauge />, label: 'Live Air Quality', href: '/' },
    { icon: <CloudSun />, label: 'Weather Info', href: '/weather-info' },
    { icon: <Brain />, label: 'Future Air Prediction', href: '/future-air-prediction' },
    { icon: <Siren />, label: 'Air Alerts', href: '/air-alerts' },
    { icon: <MapIcon />, label: 'Easy Map View', href: '/map-view' },
    { icon: <History />, label: 'Past Air Data', href: '/past-air-data' },
  ];

  const bottomNavItems = [
    { icon: <HelpCircle />, label: 'Help', action: () => {} },
    { icon: <Settings />, label: 'Settings', action: () => setIsSettingsOpen(true) },
    { icon: <AppWindow />, label: 'App', action: () => {} },
  ];

  return (
    <>
      <aside className="w-20 bg-card/50 backdrop-blur-sm border-r border-white/10 p-4 flex flex-col items-center justify-between rounded-r-[2rem]">
        <div className="space-y-8">
          
          <nav className="space-y-6">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} passHref>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground data-[active=true]:text-foreground data-[active=true]:bg-primary/10 w-12 h-12 rounded-2xl" data-active={pathname === item.href} title={item.label}>
                  {item.icon}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
        <div className="space-y-6">
            {bottomNavItems.map((item, index) => (
              <Button key={index} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground w-12 h-12 rounded-2xl" title={item.label} onClick={item.action}>
                {item.icon}
              </Button>
            ))}
        </div>
      </aside>
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} is24Hour={is24Hour} setIs24Hour={setIs24Hour} />
    </>
  );
}

function SettingsDialog({ open, onOpenChange, is24Hour, setIs24Hour }: { open: boolean, onOpenChange: (open: boolean) => void, is24Hour: boolean, setIs24Hour: (is24Hour: boolean) => void }) {
  const { theme, setTheme } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your experience.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div>
            <Label className="text-base">Appearance</Label>
            <RadioGroup
              defaultValue={theme}
              onValueChange={setTheme}
              className="grid max-w-md grid-cols-3 gap-8 pt-2"
            >
              <Label className="[&:has([data-state=checked])>div]:border-primary">
                <RadioGroupItem value="light" className="sr-only" />
                <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                  <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                    <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  Light
                </span>
              </Label>
              <Label className="[&:has([data-state=checked])>div]:border-primary">
                <RadioGroupItem value="dark" className="sr-only" />
                <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent">
                  <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                    <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  Dark
                </span>
              </Label>
               <Label className="[&:has([data-state=checked])>div]:border-primary">
                <RadioGroupItem value="default" className="sr-only" />
                <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent">
                  <div className="space-y-2 rounded-sm bg-[#0D0F13] p-2">
                    <div className="space-y-2 rounded-md bg-[#212326] p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-muted" />
                      <div className="h-2 w-[100px] rounded-lg bg-muted" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-[#212326] p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-muted" />
                      <div className="h-2 w-[100px] rounded-lg bg-muted" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-[#212326] p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-muted" />
                      <div className="h-2 w-[100px] rounded-lg bg-muted" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  Default
                </span>
              </Label>
            </RadioGroup>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="time-format" className="flex flex-col gap-1">
              <span>24-Hour Time</span>
              <span className="font-normal text-muted-foreground">
                Display time in 24-hour format.
              </span>
            </Label>
            <Switch
              id="time-format"
              checked={is24Hour}
              onCheckedChange={setIs24Hour}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
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


function Header({ unit, setUnit, is24Hour, selectedLocation, setSelectedLocation }: { unit: TempUnit; setUnit: (unit: TempUnit) => void; is24Hour: boolean, selectedLocation: any, setSelectedLocation: (location: any) => void }) {
  const [now, setNow] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      setIsSearchOpen(true);
      setSearchResults(locations.filter(loc => loc.name.toLowerCase().includes(searchQuery.toLowerCase())));
    } else {
      setIsSearchOpen(false);
      setSearchResults([]);
    }
  }, [searchQuery]);
  
  if (!now) {
    return (
     <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Hi, Nullpoint</h1>
          <p className="text-muted-foreground flex items-center">
            <span>Loading...</span>
          </p>
        </div>
     </header>
    );
  }

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
    hour12: !is24Hour,
    timeZone: 'Asia/Kolkata',
  }).format(now);

  const [timePart, ampmPart] = formattedTime.split(' ');
  const [hours, minutes] = timePart.split(':');

  const handleSelectLocation = (location: any) => {
    setSelectedLocation(location);
    setSearchQuery('');
    setIsSearchOpen(false);
  }

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
          {ampmPart && <span className='ml-1'>{ampmPart}</span>}
        </p>
      </div>
      <div className="flex items-center gap-2 md:gap-4 flex-wrap">
        <div className="relative flex items-center">
          <Search className="absolute left-3 text-foreground/50" size={20} />
          <Input 
            placeholder="Search city or postcode" 
            className="bg-card/50 backdrop-blur-sm border-white/10 pl-10 w-48 md:w-64 rounded-full" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearchOpen && searchResults.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 w-full bg-card/80 backdrop-blur-sm border border-white/10 rounded-2xl z-20 overflow-hidden"
            >
              <ul>
                {searchResults.map(loc => (
                  <li key={loc.name}>
                    <button onClick={() => handleSelectLocation(loc)} className="w-full text-left px-4 py-2 hover:bg-primary/10">
                      {loc.name}, {loc.country}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
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


function CurrentWeather({ unit, is24Hour, location }: { unit: TempUnit; is24Hour: boolean, location: { name: string, country: string } }) {
    const [hourlyForecast, setHourlyForecast] = useState<ReturnType<typeof generateHourlyForecast> | null>(null);

    useEffect(() => {
        setHourlyForecast(generateHourlyForecast(is24Hour));
    }, [is24Hour]);


    const currentTemp = 20;
    const displayTemp = unit === 'C' ? currentTemp : celsiusToFahrenheit(currentTemp);

    if (!hourlyForecast) {
        return (
            <Card className="p-6 h-full flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-center h-full">Loading forecast...</div>
            </Card>
        );
    }

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
                        <div key={i} className="flex flex-col items-center justify-between p-3 rounded-2xl bg-background/30 backdrop-blur-sm border border-white/10 min-w-[70px] h-32">
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
  const [activeMetric, setActiveMetric] = useState<OverviewMetric>('Humidity');
  const activeDataSet = overviewDataSets[activeMetric];

  return (
    <Card className="h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Overview</h3>
        <div className="flex items-center gap-1 bg-card/50 backdrop-blur-sm border border-white/10 rounded-full p-1 text-sm">
          {(Object.keys(overviewDataSets) as OverviewMetric[]).map((metric) => (
            <Button 
              key={metric}
              variant="ghost" 
              size="sm" 
              className="rounded-full h-8 px-4 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
              data-active={activeMetric === metric}
              onClick={() => setActiveMetric(metric)}
            >
              {metric}
            </Button>
          ))}
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
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
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

    

    