
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
} from 'recharts';

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
  for (let i = 0; i < 24; i++) {
    const time = new Date(now.getTime() + i * 60 * 60 * 1000);
    data.push({
      time: time.getHours() + ':00',
      aqi: Math.floor(Math.random() * (80 - 20 + 1)) + 20, // AQI between 20 and 80
    });
  }
  return data;
};

export default function FutureAirPredictionPage() {
  const [predictionData, setPredictionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePredict = () => {
    setLoading(true);
    setTimeout(() => {
      setPredictionData(generatePredictionData());
      setLoading(false);
    }, 1500); // Simulate AI thinking time
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
          <h1 className="text-3xl font-bold">Future Air Prediction</h1>
          <p className="text-muted-foreground">AI-powered 24-hour AQI forecast</p>
        </div>
      </header>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="text-primary" />
            <span>AQI Prediction for Berlin</span>
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
                  <Line type="monotone" dataKey="aqi" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorAqi)" />
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
    </div>
  );
}
