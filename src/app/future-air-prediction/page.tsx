
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, BrainCircuit, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card as UICard,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { useSharedState } from '@/components/layout/sidebar';

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

const generatePredictionData = () => {
  const data = [];
  const now = new Date();
  const currentHour = now.getHours();
  
  // Generate 4 hours of past "actual" data and 20 hours of future "predicted" data
  for (let i = -4; i < 20; i++) {
    const hour = (currentHour + i + 24) % 24;
    const time = hour + ':00';
    const baseAqi = Math.floor(Math.random() * (50 - 30 + 1)) + 30;
    
    if (i < 0) {
      // Past data
      data.push({
        time: time,
        actual: baseAqi + Math.floor(Math.random() * 5),
      });
    } else if (i === 0) {
      // Current hour, connect the lines
      const actualValue = baseAqi + Math.floor(Math.random() * 5);
       data.push({
        time: time,
        actual: actualValue,
        predicted: actualValue,
      });
    }
    else {
      // Future data
      data.push({
        time: time,
        predicted: baseAqi + Math.floor(Math.random() * 10 - 5),
      });
    }
  }

  // Ensure data is sorted by time for recharts
  const sortedData = data.sort((a, b) => {
    const hourA = parseInt(a.time.split(':')[0]);
    const hourB = parseInt(b.time.split(':')[0]);
    if (hourA < (currentHour-4+24)%24 && hourB >= (currentHour-4+24)%24) return 1;
    if (hourA >= (currentHour-4+24)%24 && hourB < (currentHour-4+24)%24) return -1;
    return hourA - hourB;
  });

  return sortedData;
};

export default function FutureAirPredictionPage() {
  const [predictionData, setPredictionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { selectedLocation } = useSharedState();

  const handlePredict = () => {
    setLoading(true);
    setTimeout(() => {
      setPredictionData(generatePredictionData());
      setLoading(false);
    }, 1500); // Simulate AI thinking time
  };

  return (
    <PageWrapper>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="text-primary" />
            <span>AQI Prediction for {selectedLocation.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            <Button onClick={handlePredict} disabled={loading} size="lg" className="rounded-full">
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate 24-Hour Prediction'
              )}
            </Button>
          </div>

          {predictionData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="h-96"
            >
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={predictionData}>
                  <defs>
                    <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: 'AQI', angle: -90, position: 'insideLeft', fill: 'hsl(var(--foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '1rem',
                    }}
                  />
                  <Legend />
                  <Line name="Actual" type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line name="Predicted" type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {!loading && predictionData.length === 0 && (
             <div className="text-center text-muted-foreground py-16">
              Click the button to generate an AI-powered prediction of air quality for the next 24 hours.
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
