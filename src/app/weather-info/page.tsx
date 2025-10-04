
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Wind,
  Droplets,
  Sun,
  Eye,
  Thermometer,
  Gauge,
  Cloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card as UICard,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <UICard
    className={`bg-card/50 backdrop-blur-sm border border-white/10 rounded-[2rem] ${className}`}
  >
    {children}
  </UICard>
);

const weatherData = {
  berlin: {
    temperature: {
      value: 22,
      unit: '°C',
      feelsLike: 25,
    },
    aqi: {
      value: 45,
      quality: 'Good',
    },
    uvIndex: {
      value: 5,
      level: 'Moderate',
    },
    wind: {
      speed: 15,
      unit: 'km/h',
      direction: 'NW',
    },
    humidity: {
      value: 60,
      unit: '%',
    },
    visibility: {
      value: 10,
      unit: 'km',
    },
    pressure: {
      value: 1012,
      unit: 'hPa',
    },
    precipitation: {
      value: 2,
      unit: 'mm',
      description: 'in last 24h',
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function WeatherInfoPage() {
  const data = weatherData.berlin;

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'text-green-400';
    if (aqi <= 100) return 'text-yellow-400';
    if (aqi <= 150) return 'text-orange-400';
    return 'text-red-500';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 text-foreground min-h-screen">
      <header className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Weather Info</h1>
          <p className="text-muted-foreground">Detailed view for Berlin, Germany</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold">
                {data.temperature.value}
                {data.temperature.unit}
              </div>
              <p className="text-xs text-muted-foreground">
                Feels like {data.temperature.feelsLike}°C
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Air Quality (AQI)</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-5xl font-bold ${getAQIColor(data.aqi.value)}`}>
                {data.aqi.value}
              </div>
              <p className="text-xs text-muted-foreground">{data.aqi.quality}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">UV Index</CardTitle>
              <Sun className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold">{data.uvIndex.value}</div>
              <p className="text-xs text-muted-foreground">{data.uvIndex.level}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Wind</CardTitle>
              <Wind className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.wind.speed}
                <span className="text-xl ml-1">{data.wind.unit}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Direction: {data.wind.direction}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Humidity</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold">
                {data.humidity.value}
                <span className="text-3xl">{data.humidity.unit}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                The dew point is 15°C right now.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Visibility</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold">
                {data.visibility.value}
                <span className="text-3xl ml-1">{data.visibility.unit}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                It’s perfectly clear right now.
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pressure</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.pressure.value}
                <span className="text-xl ml-1">{data.pressure.unit}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Trending steady.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.8 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Precipitation</CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.precipitation.value}
                <span className="text-xl ml-1">{data.precipitation.unit}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {data.precipitation.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
