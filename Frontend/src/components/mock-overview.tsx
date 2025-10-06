'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Satellite,
  Radio,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { useSharedState } from '@/components/layout/sidebar';

const MotionCard = motion.div;

// Mock data for demonstration
const mockData = {
  'NO₂': { 
    data: Array.from({length: 24}, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      value: Math.sin(i * 0.3) * 15 + 25 + Math.random() * 5
    })), 
    unit: 'µg/m³', 
    average: 25.4, 
    color: "#3b82f6", 
    label: 'Nitrogen dioxide' 
  },
  'HCHO': { 
    data: Array.from({length: 24}, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      value: Math.sin(i * 0.2) * 8 + 12 + Math.random() * 3
    })), 
    unit: 'µg/m³', 
    average: 12.8, 
    color: "#10b981", 
    label: 'Formaldehyde' 
  },
  'PM2.5': { 
    data: Array.from({length: 24}, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      value: Math.sin(i * 0.4) * 12 + 28 + Math.random() * 6
    })), 
    unit: 'µg/m³', 
    average: 28.6, 
    color: "#f59e0b", 
    label: 'Particulate matter' 
  },
  'O₃': { 
    data: Array.from({length: 24}, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      value: Math.sin(i * 0.25) * 30 + 90 + Math.random() * 10
    })), 
    unit: 'µg/m³', 
    average: 90.0, 
    color: "#ef4444", 
    label: 'Ozone' 
  },
};

type OverviewMetric = keyof typeof mockData;

const PulsatingDot = ({ color }: { color: string }) => (
  <g>
    <circle
      r="4"
      fill={color}
      opacity="0.8"
    />
    <motion.circle
      r="4"
      fill="none"
      stroke={color}
      strokeWidth="2"
      initial={{ r: 4, opacity: 0.8 }}
      animate={{ r: 8, opacity: 0 }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeOut"
      }}
    />
  </g>
);

export function MockOverview() {
  const { selectedLocation } = useSharedState();
  const [activeMetric, setActiveMetric] = useState<OverviewMetric>('NO₂');
  const [currentHour, setCurrentHour] = useState<number | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const [realData, setRealData] = useState<any>(null);

  useEffect(() => {
    const updateHour = () => {
      const date = new Date();
      setCurrentHour(date.getHours());
    };

    updateHour();
    const timer = setInterval(updateHour, 60000);
    return () => clearInterval(timer);
  }, []);

  // Check backend availability and fetch real data
  useEffect(() => {
    const checkBackendAndFetchData = async () => {
      try {
        // Try to fetch health status first
        const healthResponse = await fetch('http://127.0.0.1:5000/health');
        if (healthResponse.ok) {
          setIsBackendAvailable(true);
          
          // If backend is available and we have a location, fetch real data
          if (selectedLocation) {
            const dataResponse = await fetch(
              `http://127.0.0.1:5000/api/three-data-types/all-data-types?lat=${selectedLocation.lat}&lon=${selectedLocation.lng}&pollutants=NO2,HCHO,PM2.5,O3&radius_km=50`
            );
            if (dataResponse.ok) {
              const data = await dataResponse.json();
              setRealData(data);
            }
          }
        }
      } catch (error) {
        console.log('Backend not available, using mock data');
        setIsBackendAvailable(false);
      }
    };

    checkBackendAndFetchData();
  }, [selectedLocation]);

  const handleSetMetric = (metric: OverviewMetric) => {
    setActiveMetric(metric);
  };

  // Use real data if available, otherwise use mock data
  const getDataForMetric = (metric: OverviewMetric) => {
    if (isBackendAvailable && realData) {
      // Try to extract real data based on metric
      const pollutantMap = {
        'NO₂': 'NO2',
        'HCHO': 'HCHO', 
        'PM2.5': 'PM2.5',
        'O₃': 'O3'
      };
      
      const pollutantKey = pollutantMap[metric];
      if (realData.fused_data?.data?.pollutants?.[pollutantKey]) {
        const pollutantData = realData.fused_data.data.pollutants[pollutantKey];
        const value = pollutantData.fused_value || pollutantData.value || 0;
        
        // Generate hourly data based on real value
        return {
          data: Array.from({length: 24}, (_, i) => ({
            hour: `${i.toString().padStart(2, '0')}:00`,
            value: value + (Math.random() - 0.5) * value * 0.3 // Add some variation
          })),
          unit: pollutantData.unit || mockData[metric].unit,
          average: value,
          color: mockData[metric].color,
          label: mockData[metric].label
        };
      }
    }
    return mockData[metric];
  };

  const activeDataSet = getDataForMetric(activeMetric);
  const tabs = (Object.keys(mockData) as OverviewMetric[]);
  
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

  const currentHourX = currentHour !== null ? `${currentHour.toString().padStart(2, '0')}:00` : undefined;
  const currentHourData = currentHourX ? processedData.find(d => d.hour === currentHourX) : undefined;
  const currentHourY = currentHourData?.past;

  const transition = { duration: 0.8, ease: "easeInOut" };

  // Calculate average
  const average = activeDataSet.data.length > 0 ? 
    activeDataSet.data.reduce((sum, d) => sum + d.value, 0) / activeDataSet.data.length : 0;

  return (
    <MotionCard 
      className="h-full flex flex-col p-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem]"
      animate={{ borderColor: activeDataSet.color, transition }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-x-6">
          <h3 className="text-xl font-semibold">NASA TEMPO Overview</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={isBackendAvailable ? "text-green-300 border-green-400" : "text-blue-300 border-blue-400"}>
              <Satellite className="h-3 w-3 mr-1" />
              {isBackendAvailable ? 'Live Data' : 'Demo Mode'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: activeDataSet.color }}>
              {average.toFixed(1)}{activeDataSet.unit}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedLocation?.name || 'Select Location'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-4 p-1 bg-muted/50 rounded-lg">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeMetric === tab ? "default" : "ghost"}
            size="sm"
            onClick={() => handleSetMetric(tab)}
            className={`flex-1 text-xs transition-all duration-200 ${
              activeMetric === tab 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-muted'
            }`}
          >
            {tab}
          </Button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
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
            <XAxis 
              dataKey="hour" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
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
              formatter={(value: number, name: string, props: any) => [
                `${value.toFixed(1)}${activeDataSet.unit}`, 
                props.dataKey === 'past' ? `${activeDataSet.label} (Current)` : `${activeDataSet.label} (Predicted)`
              ]}
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
      </div>

      {/* Data Source Info */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Demo Data Sources:</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Satellite className="h-3 w-3 mr-1" />
                NASA TEMPO
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Radio className="h-3 w-3 mr-1" />
                Ground Sensors
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                AI Fusion
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </MotionCard>
  );
}
