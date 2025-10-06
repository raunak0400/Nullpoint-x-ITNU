

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Siren,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card as UICard,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { useState, useEffect } from 'react';
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

const alerts: any[] = [];

const severityConfig = {
  High: {
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    badge: 'destructive',
    color: 'border-red-500/50',
  },
  Moderate: {
    icon: <Siren className="h-5 w-5 text-orange-400" />,
    badge: 'secondary',
    color: 'border-orange-400/50',
  },
  Low: {
    icon: <Info className="h-5 w-5 text-yellow-400" />,
    badge: 'outline',
    color: 'border-yellow-400/50',
  },
  Info: {
    icon: <CheckCircle2 className="h-5 w-5 text-green-400" />,
    badge: 'default',
    color: 'border-green-400/50',
  },
};

export default function AirAlertsPage() {
  const [currentAlerts, setCurrentAlerts] = useState<any[]>([]);
  const { selectedLocation } = useSharedState();

  useEffect(() => {
    if (selectedLocation) {
      // API call to fetch alerts for selectedLocation would go here
      setCurrentAlerts(alerts);
    } else {
      setCurrentAlerts([]);
    }
  }, [selectedLocation]);

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto space-y-6">
        {!selectedLocation ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Please select a location to see air alerts.</p>
            </CardContent>
          </Card>
        ) : currentAlerts.length > 0 ? (
          currentAlerts.map((alert, index) => {
            const config =
              severityConfig[alert.severity as keyof typeof severityConfig];
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className={cn('overflow-hidden border-l-4', config.color)}>
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <div className="mt-1">{config.icon}</div>
                    <div className="flex-1">
                      <CardTitle className="flex justify-between items-center">
                        <span>{alert.title}</span>
                        <Badge variant={config.badge as any}>{alert.severity}</Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground pt-1">{alert.time}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{alert.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No active air alerts for {selectedLocation.name}.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
