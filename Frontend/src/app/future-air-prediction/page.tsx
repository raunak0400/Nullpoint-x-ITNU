
'use client';

import { useState, useEffect } from 'react';
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

function FutureAirPredictionDashboard() {
  const [predictionData, setPredictionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { selectedLocation } = useSharedState();

  const handlePredict = () => {
    if (!selectedLocation) return;
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // API call to fetch prediction data would go here
      // const data = await fetchPredictionFor(selectedLocation);
      // setPredictionData(data);
      setPredictionData([]); // Initially empty
      setLoading(false);
    }, 1500);
  };
  
  useEffect(() => {
    // Or fetch initial data on load
    // if (selectedLocation) handlePredict();
    setPredictionData([]);
  }, [selectedLocation]);

  return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="text-primary" />
            <span>AQI Prediction {selectedLocation ? `for ${selectedLocation.name}` : ''}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedLocation ? (
            <>
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
            </>
          ) : (
            <div className="text-center text-muted-foreground py-16">
              Please select a location to generate a future air prediction.
            </div>
          )}
        </CardContent>
      </Card>
  );
}

export default function FutureAirPredictionPage() {
  return (
    <PageWrapper>
      <FutureAirPredictionDashboard />
    </PageWrapper>
  );
}
