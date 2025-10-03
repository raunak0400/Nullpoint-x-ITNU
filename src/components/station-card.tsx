"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { forecastData, type City } from '@/lib/data';
import { DataSourceIcons } from '@/components/data-source-icons';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface StationCardProps {
  city: City;
  onClose: () => void;
  time: number;
}

const getAqiColor = (aqi: number) => {
  if (aqi <= 50) return 'text-green-400';
  if (aqi <= 100) return 'text-yellow-400';
  if (aqi <= 150) return 'text-orange-400';
  if (aqi <= 200) return 'text-red-400';
  if (aqi <= 300) return 'text-purple-400';
  return 'text-maroon-400';
};

export default function StationCard({ city, onClose, time }: StationCardProps) {
  const data = forecastData[city.id] || [];
  const currentAqi = data.find(d => d.hour === time)?.predicted || city.aqi;

  return (
    <Card className="glass-card relative">
      <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-8 w-8" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
      <CardHeader className="flex-row items-center gap-4 space-y-0 pb-2">
        <div className="flex-grow">
          <CardDescription>Real-time & Forecasted Air Quality</CardDescription>
          <CardTitle className="font-headline">{city.name}</CardTitle>
        </div>
        <div className="text-right">
          <div className={cn('text-5xl font-bold font-headline', getAqiColor(currentAqi))}>
            {currentAqi}
          </div>
          <div className="text-sm text-muted-foreground">AQI</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorObserved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `+${value}h`} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background) / 0.8)',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                labelClassName="font-bold"
              />
              <Area type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPredicted)" />
              <Area type="monotone" dataKey="observed" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorObserved)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" />Predicted</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent" />Observed</div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              {city.dataSource.map((source) => {
                const Icon = DataSourceIcons[source];
                return (
                  <UiTooltip key={source}>
                    <TooltipTrigger asChild>
                      <div className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors">
                        <Icon />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="capitalize">{source} Data</p>
                    </TooltipContent>
                  </UiTooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
