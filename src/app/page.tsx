
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
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
import { Map } from '@/components/map';

const overviewDataSets = {
  'NO₂': {
    data: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, value: Math.floor(Math.random() * 30) + 5 })),
    unit: 'µg/m³',
    average: 20,
    color: "hsl(var(--chart-1))",
    label: 'Nitrogen dioxide'
  },
  'CH₂O': {
    data: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, value: Math.floor(Math.random() * 15) + 2 })),
    unit: 'µg/m³',
    average: 8,
    color: "hsl(var(--chart-3))",
    label: 'Formaldehyde'
  },
  'Aerosol': {
    data: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, value: Math.floor(Math.random() * 10) / 10 })),
    unit: 'index',
    average: 0.5,
    color: "hsl(var(--chart-4))",
    label: 'Aerosol Index'
  },
  'PM': {
    data: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, value: Math.floor(Math.random() * 50) + 10 })),
    unit: 'µg/m³',
    average: 25,
    color: "hsl(var(--chart-5))",
    label: 'Particulate matter'
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
    <div className={cn('bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem]', className)}>
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
          <MapView />
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
            <div className="p-6 h-full flex flex-col relative overflow-hidden bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem]">
                <div className="flex items-center justify-center h-full">Loading forecast...</div>
            </div>
        );
    }

    return (
      <Link href="/weather-info" className="block h-full group">
        <div className="p-6 h-full flex flex-col relative overflow-hidden bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] group-hover:border-white/20 transition-all duration-300">
            <Image
                src="https://images.unsplash.com/photo-1500740516770-92bd004b996e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxjbG91ZHl8ZW58MHx8fHwxNzU5NjA0OTc3fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Weather background"
                fill
                className="object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                data-ai-hint="India gate"
            />
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <CloudSun size={64} className="text-primary" />
                    <div>
                        <h2 className="text-4xl font-bold">{location.country}</h2>
                        <p className="text-muted-foreground">{location.name}</p>
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
  const [activeMetric, setActiveMetric] = useState<OverviewMetric>('NO₂');
  const [currentHour, setCurrentHour] = useState<number | null>(null);

  useEffect(() => {
    const updateHour = () => {
      const date = new Date();
      setCurrentHour(date.getHours());
    };

    updateHour();
    const timer = setInterval(updateHour, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const handleSetMetric = (metric: OverviewMetric) => {
    setActiveMetric(metric);
  };

  const activeDataSet = overviewDataSets[activeMetric];
  const tabs = (Object.keys(overviewDataSets) as OverviewMetric[]);
  
  const processedData = activeDataSet.data.map(d => {
    const hour = parseInt(d.hour.split(':')[0]);
    if (currentHour === null || hour > currentHour) {
      return { ...d, future: d.value };
    } else if (hour < currentHour) {
      return { ...d, past: d.value };
    } else {
      return { ...d, past: d.value, future: d.value };
    }
  });

  const currentHourX = currentHour !== null ? `${currentHour}:00` : undefined;
  const currentHourData = currentHourX ? processedData.find(d => d.hour === currentHourX) : undefined;
  const currentHourY = currentHourData?.past;

  const PulsatingDot = ({ cx, cy }: { cx?: number, cy?: number }) => {
    if (cx === undefined || cy === undefined) return null;
    const color = activeDataSet.color;
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
        <circle cx={cx} cy={cy} r="6" fill={color} stroke="white" strokeWidth="2" />
        <circle
          className="ripple-circle"
          cx={cx}
          cy={cy}
          r="6"
          fill="transparent"
          stroke={color}
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
            className="absolute h-8 rounded-full z-0"
            style={{
              width: `${100/tabs.length}%`,
              left: `${tabs.indexOf(activeMetric) * (100/tabs.length)}%`,
              backgroundColor: activeDataSet.color,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>
      <div className="text-right mb-2">
        <span 
          className="text-sm py-1 px-3 rounded-full text-primary-foreground"
          style={{ backgroundColor: activeDataSet.color }}
        >
          Average {activeDataSet.average}{activeDataSet.unit}
        </span>
      </div>
      <div className="flex-1 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeDataSet.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={activeDataSet.color} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFuture" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeDataSet.color} stopOpacity={0.1} />
                <stop offset="95%" stopColor={activeDataSet.color} stopOpacity={0} />
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
              formatter={(value: number, name: string, props) => [`${value}${activeDataSet.unit}`, props.dataKey === 'past' ? activeDataSet.label : `${activeDataSet.label} (Future)`]}
            />
            <Area
              type="monotone"
              dataKey="past"
              name={activeDataSet.label}
              stroke={activeDataSet.color}
              strokeWidth={2}
              fill="url(#colorPast)"
            />
            <Area
              type="monotone"
              dataKey="future"
              name={activeDataSet.label}
              stroke={activeDataSet.color}
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="url(#colorFuture)"
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

function ExpandedMap({ setIsExpanded }: { setIsExpanded: (isExpanded: boolean) => void }) {
  return (
    <motion.div
      layoutId="map-card"
      className="fixed inset-0 bg-card/80 backdrop-blur-lg z-50"
      initial={{ borderRadius: "2rem" }}
      animate={{ borderRadius: 0 }}
      exit={{ borderRadius: "2rem" }}
      style={{ overflow: 'hidden' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-full h-full">
        <Map showFilters={true}/>
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

function MapView() {
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
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] w-full h-full" style={{overflow: 'hidden'}}>
          <Map />
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
          no2: overviewDataSets['NO₂'].average,
          ch2o: overviewDataSets['CH₂O'].average,
          aerosol: overviewDataSets['Aerosol'].average,
          pm: overviewDataSets['PM'].average,
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
          <div className="h-4 bg-muted/50 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-muted/50 rounded w-full animate-pulse" />
          <div className="h-4 bg-muted/50 rounded w-4/6 animate-pulse" />
          <div className="h-4 bg-muted/50 rounded w-1/2 mt-4 animate-pulse" />
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

    

    

    
