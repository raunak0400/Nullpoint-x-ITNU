
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { addDays, format } from 'date-fns';
import { ArrowLeft, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card as UICard,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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

const generateHistoricalData = (dateRange: DateRange | undefined) => {
  const data = [];
  const start = dateRange?.from || addDays(new Date(), -7);
  const end = dateRange?.to || new Date();
  
  for (let d = start; d <= end; d = addDays(d, 1)) {
    data.push({
      date: format(d, 'MMM dd'),
      PM25: Math.floor(Math.random() * 50) + 10,
      O3: Math.floor(Math.random() * 80) + 20,
      NO2: Math.floor(Math.random() * 40) + 5,
    });
  }
  return data;
};

type VisiblePollutants = {
  PM25: boolean;
  O3: boolean;
  NO2: boolean;
};

export default function PastAirDataPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  const [data, setData] = useState(() => generateHistoricalData(date));
  const [visiblePollutants, setVisiblePollutants] = useState<VisiblePollutants>({
    PM25: true,
    O3: true,
    NO2: true,
  });

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    setData(generateHistoricalData(newDate));
  }

  const handlePollutantVisibilityChange = (pollutant: keyof VisiblePollutants) => {
    setVisiblePollutants(prev => ({
      ...prev,
      [pollutant]: !prev[pollutant]
    }));
  }

  const pollutantConfig = {
    PM25: { name: 'PM2.5', color: 'hsl(var(--chart-1))', fill: 'url(#colorPM25)' },
    O3: { name: 'Ozone', color: 'hsl(var(--chart-2))', fill: 'url(#colorO3)' },
    NO2: { name: 'Nitrogen Dioxide', color: 'hsl(var(--chart-3))', fill: 'url(#colorNO2)' },
  };

  return (
    <PageWrapper>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle>Pollutant Concentration</CardTitle>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-4">
                  {(Object.keys(visiblePollutants) as Array<keyof VisiblePollutants>).map(key => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={visiblePollutants[key]}
                        onCheckedChange={() => handlePollutantVisibilityChange(key)}
                        style={{borderColor: pollutantConfig[key].color, backgroundColor: visiblePollutants[key] ? pollutantConfig[key].color : 'transparent'}}
                      />
                      <Label htmlFor={key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {pollutantConfig[key].name}
                      </Label>
                    </div>
                  ))}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-[300px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={handleDateChange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                   <defs>
                    <linearGradient id="colorPM25" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                     <linearGradient id="colorO3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                     <linearGradient id="colorNO2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', fill: 'hsl(var(--foreground))' }} />
                  <Tooltip
                     contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '1rem',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                  
                  {visiblePollutants.PM25 && <Area type="monotone" dataKey="PM25" name="PM2.5" stroke={pollutantConfig.PM25.color} fillOpacity={1} fill={pollutantConfig.PM25.fill} />}
                  {visiblePollutants.O3 && <Area type="monotone" dataKey="O3" name="Ozone" stroke={pollutantConfig.O3.color} fillOpacity={1} fill={pollutantConfig.O3.fill} />}
                  {visiblePollutants.NO2 && <Area type="monotone" dataKey="NO2" name="Nitrogen Dioxide" stroke={pollutantConfig.NO2.color} fillOpacity={1} fill={pollutantConfig.NO2.fill} />}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </PageWrapper>
  );
}
