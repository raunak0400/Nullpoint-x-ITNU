
'use client';

import { useState, useEffect } from 'react';
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
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card as UICard,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { WindCompass } from '@/components/wind-compass';
import { useSharedState } from '@/components/layout/sidebar';


const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <UICard
    className={cn(`bg-card/50 backdrop-blur-sm border border-white/10 rounded-[2rem]`, className)}
  >
    {children}
  </UICard>
);

const emptyWeatherData = {
    temperature: {
      value: 0,
      unit: '°C',
      feelsLike: 0,
    },
    aqi: {
      value: 0,
      quality: 'Unknown',
    },
    uvIndex: {
      value: 0,
      level: 'Unknown',
    },
    wind: {
      speed: 0,
      unit: 'km/h',
      direction: 'N',
    },
    humidity: {
      value: 0,
      unit: '%',
    },
    visibility: {
      value: 0,
      unit: 'km',
    },
    pressure: {
      value: 0,
      unit: 'hPa',
    },
    precipitation: {
      value: 0,
      unit: 'mm',
      description: 'in last 24h',
    },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const celsiusToFahrenheit = (c: number) => (c * 9/5) + 32;

export default function WeatherInfoPage() {
    return (
        <PageWrapper>
            <WeatherInfoDashboard />
        </PageWrapper>
    )
}

function WeatherInfoDashboard() {
  const { unit, selectedLocation } = useSharedState();
  const [data, setData] = useState(emptyWeatherData);

  useEffect(() => {
    if (selectedLocation) {
      // API call to fetch weather data for selectedLocation would go here
      // const fetchedData = await fetchWeatherFor(selectedLocation);
      // setData(fetchedData);
      setData(emptyWeatherData);
    }
  }, [selectedLocation]);

  if (!selectedLocation) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="max-w-md w-full">
            <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Please select a location to view detailed weather information.</p>
            </CardContent>
        </Card>
      </div>
    )
  }

  const displayTemp = unit === 'C' ? data.temperature.value : Math.round(celsiusToFahrenheit(data.temperature.value));
  const displayFeelsLike = unit === 'C' ? data.temperature.feelsLike : Math.round(celsiusToFahrenheit(data.temperature.feelsLike));

  const getWindInsight = (speedKmh: number) => {
    if (speedKmh < 5) return 'Calm';
    if (speedKmh < 20) return 'Light breeze';
    if (speedKmh < 40) return 'Moderate wind';
    if (speedKmh < 60) return 'Strong wind';
    return 'Very strong wind';
  };

  const getAqiConfig = (aqi: number) => {
    if (aqi <= 0) return { color: 'text-muted-foreground', bgColor: 'bg-muted' };
    if (aqi <= 50) return { color: 'text-green-400', bgColor: 'bg-green-400' };
    if (aqi <= 100) return { color: 'text-yellow-400', bgColor: 'bg-yellow-400' };
    if (aqi <= 150) return { color: 'text-orange-400', bgColor: 'bg-orange-400' };
    if (aqi <= 200) return { color: 'text-red-500', bgColor: 'bg-red-500' };
    if (aqi <= 300) return { color: 'text-purple-500', bgColor: 'bg-purple-500' };
    return { color: 'text-maroon-500', bgColor: 'bg-maroon-500' }; // For very unhealthy
  };

  const aqiConfig = getAqiConfig(data.aqi.value);
  const aqiPercentage = (data.aqi.value / 300) * 100;
  const hoverEffect = {
    scale: 1.03,
    y: -5,
    transition: { duration: 0.2, delay: 0 },
  };

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }} whileHover={hoverEffect}>
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center">
              <div className="text-8xl font-bold">
                {displayTemp}
                °{unit}
              </div>
              <p className="text-xs text-muted-foreground">
                Feels like {displayFeelsLike}°{unit}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }} whileHover={hoverEffect}>
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Air Quality (AQI)</CardTitle>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center">
                <div className={cn("text-8xl font-bold", aqiConfig.color)}>
                  {data.aqi.value}
                </div>
                <p className="text-lg text-muted-foreground mb-4">{data.aqi.quality}</p>
                <div className="w-full px-4">
                  <div className="h-2 w-full rounded-full bg-muted/50">
                    <div
                      className={cn("h-full rounded-full", aqiConfig.bgColor)}
                      style={{ width: `${aqiPercentage}%`}}
                    />
                  </div>
                </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }} whileHover={hoverEffect} className="flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">UV Index</CardTitle>
              <Sun className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-center items-center pt-6">
              <div className="text-5xl font-bold">{data.uvIndex.value}</div>
              <p className="text-xs text-muted-foreground mb-2">{data.uvIndex.level}</p>
              <Progress value={data.uvIndex.value} max={11} indicatorClassName="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500" className="w-full" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }} whileHover={hoverEffect} className="flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium"><Wind className="h-4 w-4 text-muted-foreground" />Wind</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-row items-center justify-center gap-4">
              <WindCompass
                speed={data.wind.speed}
                unit={data.wind.unit}
                direction={data.wind.direction}
              />
              <div className="text-left">
                <p className="font-bold">{getWindInsight(data.wind.speed)}</p>
                <p className="text-sm text-muted-foreground">
                  {data.wind.speed} {data.wind.unit} {data.wind.direction}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.5 }} whileHover={hoverEffect}>
            <Card className="aspect-square flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Humidity</CardTitle>
                <Droplets className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold">
                    {data.humidity.value}
                    <span className="text-3xl">{data.humidity.unit}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                    The dew point is --°C right now.
                </p>
                </CardContent>
            </Card>
            </motion.div>

            <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.6 }} whileHover={hoverEffect}>
            <Card className="aspect-square flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Visibility</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold">
                    {data.visibility.value}
                    <span className="text-3xl ml-1">{data.visibility.unit}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                    --
                </p>
                </CardContent>
            </Card>
            </motion.div>
        
            <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.7 }} whileHover={hoverEffect}>
            <Card className="aspect-square flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pressure</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold">
                    {data.pressure.value}
                    <span className="text-xl ml-1">{data.pressure.unit}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                    Trending steady.
                </p>
                </CardContent>
            </Card>
            </motion.div>

            <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.8 }} whileHover={hoverEffect}>
            <Card className="aspect-square flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Precipitation</CardTitle>
                <Cloud className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold">
                    {data.precipitation.value}
                    <span className="text-xl ml-1">{data.precipitation.unit}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                    {data.precipitation.description}
                </p>
                </CardContent>
            </Card>
            </motion.div>
        </div>
      </div>
  );
}
