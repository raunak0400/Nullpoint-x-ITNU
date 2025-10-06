
'use client';
import * as React from 'react';
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
  Satellite,
  Baseline,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTheme } from '@/components/theme-provider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { explainForecastFactors } from '@/ai/flows/explain-forecast-factors';
import { useSharedState, Location } from '@/components/layout/sidebar';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Map } from '@/components/map';
import { Checkbox } from '@/components/ui/checkbox';
import { MockOverview } from '@/components/mock-overview';
import { MockSmartTips } from '@/components/mock-smart-tips';
import { QuickStartBanner } from '@/components/quick-start-banner';


const emptyData = {
    'NO₂': { data: [], unit: 'µg/m³', average: 0, color: "hsl(var(--chart-1))", label: 'Nitrogen dioxide' },
    'CH₂O': { data: [], unit: 'µg/m³', average: 0, color: "hsl(var(--chart-3))", label: 'Formaldehyde' },
    'Aerosol': { data: [], unit: 'index', average: 0, color: "hsl(var(--chart-4))", label: 'Aerosol Index' },
    'PM': { data: [], unit: 'µg/m³', average: 0, color: "hsl(var(--chart-5))", label: 'Particulate matter' },
  };

type OverviewMetric = keyof typeof emptyData;

type TempUnit = 'C' | 'F';

const MotionCard = motion(React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div ref={ref} {...props} />
)));


export default function Home() {
  return (
    <PageWrapper>
      <div className="space-y-6">
        <QuickStartBanner />
        <DashboardContent />
      </div>
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
           <MockSmartTips />
        </div>
        <div className="lg:col-span-2 row-span-1">
          <MockOverview />
        </div>
      </div>
  );
}

function CurrentWeather({ unit, is24Hour, location }: { unit: TempUnit; is24Hour: boolean, location: Location | null }) {
    const [hourlyForecast, setHourlyForecast] = useState<any[]>([]);
    
    const celsiusToFahrenheit = (c: number) => (c * 9/5) + 32;

    useEffect(() => {
        if (location) {
          // API call to fetch hourly forecast would go here
          setHourlyForecast([]); // Initially empty
        }
    }, [is24Hour, location]);

    if (!location) {
        return (
            <div className="p-6 h-full flex flex-col justify-center items-center relative overflow-hidden bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem]">
                <p className="text-muted-foreground">Please select a location to see the weather.</p>
            </div>
        )
    }

    const currentTemp = 0;
    const displayTemp = unit === 'C' ? currentTemp : celsiusToFahrenheit(currentTemp);

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
                            <p className="font-semibold text-sm">--</p>
                            <p className="text-xs text-muted-foreground">Air Mood</p>
                        </div>
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-sm">--°</p>
                        <p className="text-xs text-muted-foreground">Temp</p>
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-sm">--%</p>
                        <p className="text-xs text-muted-foreground">Humidity</p>
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-sm">--<span className="text-xs">km/h</span></p>
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
                {hourlyForecast.length > 0 ? (
                  <div className="flex gap-2 pb-2">
                    {hourlyForecast.map((hour, i) => (
                        <div key={i} className="flex flex-col items-center justify-between p-3 rounded-2xl bg-background/30 backdrop-blur-lg border border-white/10 min-w-[70px] h-32">
                            <p className="text-sm text-muted-foreground">{hour.time}</p>
                            <div className="text-muted-foreground">{hour.icon}</div>
                            <p className="text-lg font-bold">{Math.round(unit === 'C' ? hour.temp : celsiusToFahrenheit(hour.temp))}°</p>
                        </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">Loading hourly forecast...</div>
                )}
              </div>
            </div>
        </div>
      </Link>
    );
}

function Overview() {
  const { dataSources, setDataSources } = useSharedState();
  const [overviewDataSets, setOverviewDataSets] = useState(emptyData);

  const [activeMetric, setActiveMetric] = useState<OverviewMetric>('NO₂');
  const [currentHour, setCurrentHour] = useState<number | null>(null);

  useEffect(() => {
    // API call to fetch overview data would go here, based on dataSources
    // e.g., fetchOverview({ satellite: dataSources.satellite, ground: dataSources.ground })
    setOverviewDataSets(emptyData);
  }, [dataSources]);

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
    const dataPoint = d as any;
    const hour = parseInt(dataPoint.hour.split(':')[0]);
    if (currentHour === null || hour > currentHour) {
      return { hour: dataPoint.hour, value: dataPoint.value, future: dataPoint.value, past: 0 };
    } else if (hour < currentHour) {
      return { hour: dataPoint.hour, value: dataPoint.value, past: dataPoint.value, future: 0 };
    } else {
      return { hour: dataPoint.hour, value: dataPoint.value, past: dataPoint.value, future: dataPoint.value };
    }
  });

  const currentHourX = currentHour !== null ? `${currentHour}:00` : undefined;
  const currentHourData = currentHourX ? processedData.find(d => (d as any).hour === currentHourX) : undefined;
  const currentHourY = (currentHourData as any)?.past;
  
  const transition = { duration: 0.8, ease: "easeInOut" };

  return (
    <MotionCard 
        className="h-full flex flex-col p-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem]"
        animate={{ borderColor: activeDataSet.color, transition }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-x-6">
          <h3 className="text-xl font-semibold">Overview</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="satellite" checked={dataSources.satellite} onCheckedChange={(checked) => setDataSources({ ...dataSources, satellite: !!checked })} />
              <Label htmlFor="satellite" className="flex items-center gap-2 text-sm"><Satellite size={16} /> Satellite</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="ground" checked={dataSources.ground} onCheckedChange={(checked) => setDataSources({ ...dataSources, ground: !!checked })}/>
              <Label htmlFor="ground" className="flex items-center gap-2 text-sm"><Baseline size={16} /> Ground</Label>
            </div>
          </div>
        </div>

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
            animate={{ backgroundColor: activeDataSet.color }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              width: `${100/tabs.length}%`,
              left: `${tabs.indexOf(activeMetric) * (100/tabs.length)}%`,
            }}
          />
        </div>
      </div>
      <div className="flex-1 h-full relative">
        <motion.div 
            className="absolute top-0 right-0 z-10"
            animate={{ opacity: overviewDataSets[activeMetric].data.length > 0 ? 1 : 0}}
        >
            <motion.span 
              className="text-sm py-1 px-3 rounded-full text-primary-foreground"
              animate={{ backgroundColor: activeDataSet.color }}
              transition={transition}
            >
              Average {activeDataSet.average}{activeDataSet.unit}
            </motion.span>
        </motion.div>
        {overviewDataSets[activeMetric].data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                Select a data source to view overview.
            </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <motion.linearGradient id="colorPast" x1="0" y1="0" x2="0" y2="1">
                <motion.stop offset="5%" stopOpacity={0.3} animate={{ stopColor: activeDataSet.color }} transition={transition} />
                <motion.stop offset="95%" stopOpacity={0} animate={{ stopColor: activeDataSet.color }} transition={transition} />
              </motion.linearGradient>
              <motion.linearGradient id="colorFuture" x1="0" y1="0" x2="0" y2="1">
                <motion.stop offset="5%" stopOpacity={0.1} animate={{ stopColor: activeDataSet.color }} transition={transition} />
                <motion.stop offset="95%" stopOpacity={0} animate={{ stopColor: activeDataSet.color }} transition={transition} />
              </motion.linearGradient>
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
              formatter={(value: number, name: string, props: any) => [`${value}${(props.payload as any).unit}`, props.dataKey === 'past' ? activeDataSet.label : `${activeDataSet.label} (Future)`]}
            />
            <Area
              type="monotone"
              dataKey="past"
              name={activeDataSet.label}
              strokeWidth={2}
              fill="url(#colorPast)"
              stroke={activeDataSet.color}
            />
            <Area
              type="monotone"
              dataKey="future"
              name={activeDataSet.label}
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="url(#colorFuture)"
              stroke={activeDataSet.color}
            />
            {currentHourX && currentHourY !== undefined && (
              <ReferenceDot
                x={currentHourX}
                y={currentHourY}
                ifOverflow="extendDomain"
                shape={<PulsatingDot color={activeDataSet.color} />}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </MotionCard>
  );
}

const PulsatingDot = ({ cx, cy, color }: { cx?: number, cy?: number, color: string }) => {
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
        <motion.circle cx={cx} cy={cy} r="6" stroke="white" strokeWidth="2" animate={{ fill: color }} transition={{ duration: 0.8, ease: "easeInOut" }} />
        <motion.circle
          className="ripple-circle"
          cx={cx}
          cy={cy}
          r="6"
          fill="transparent"
          strokeWidth="2"
          animate={{ stroke: color }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </g>
    );
  };

function MapView() {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-card/80 backdrop-blur-lg z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              layoutId="map-card-layout"
              className="w-[calc(100%-4rem)] h-[calc(100%-4rem)] rounded-[2rem] overflow-hidden"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Map showFilters={true} />
            </motion.div>
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-xl z-50"
              onClick={toggleExpand}
            >
              <X size={20} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layoutId="map-card-layout"
        className="relative h-full"
        style={{ borderRadius: '2rem', overflow: 'hidden', visibility: isExpanded ? 'hidden' : 'visible' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] w-full h-full" style={{ overflow: 'hidden' }}>
          <Map />
        </div>
        {!isExpanded && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-xl z-10"
            onClick={toggleExpand}
          >
            <Expand size={20} />
          </Button>
        )}
      </motion.div>
    </>
  );
}


function SmartTips({ location }: { location: Location | null }) {
  const [tips, setTips] = useState({ explanation: 'Loading...', recommendations: 'Loading...' });
  const [loading, setLoading] = useState(true);
  const { dataSources } = useSharedState();

  const overviewDataSets = emptyData;


  useEffect(() => {
    const getTips = async () => {
      if (!location) return;
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

    if (location && overviewDataSets['NO₂'].average > 0) { // Only fetch if there's data
        getTips();
    } else if (!location) {
        setTips({ explanation: 'Please select a location to get smart tips.', recommendations: '' });
        setLoading(false);
    } else {
        setTips({ explanation: 'Select data sources to get tips.', recommendations: '' });
        setLoading(false);
    }
  }, [location, dataSources, overviewDataSets]);

  return (
    <div className="h-full flex flex-col p-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem]">
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
          {tips.recommendations && (
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            {tips.recommendations.split('- ').filter(r => r.trim()).map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
          )}
        </div>
      )}
    </div>
  );
}
