'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Satellite, 
  Radio, 
  Zap, 
  MapPin, 
  ArrowRight, 
  CheckCircle, 
  Info,
  X
} from 'lucide-react';

// import { useHealthStatus } from '@/hooks/useAirQuality'; // Commented out for demo mode
import { useSharedState } from '@/components/layout/sidebar';

export function QuickStartBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [backendStatus, setBackendStatus] = useState({ available: false, checking: true });
  const { selectedLocation } = useSharedState();

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/health');
        if (response.ok) {
          const health = await response.json();
          setBackendStatus({ 
            available: health.status === 'healthy', 
            checking: false 
          });
        } else {
          setBackendStatus({ available: false, checking: false });
        }
      } catch (error) {
        setBackendStatus({ available: false, checking: false });
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const allServicesHealthy = backendStatus.available;
  const hasLocation = selectedLocation !== null;

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 border-blue-500/30">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Satellite className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  NASA TEMPO Integration {allServicesHealthy ? '- Live!' : '- Demo Mode!'}
                </h3>
                <p className="text-blue-200 text-sm">
                  {allServicesHealthy 
                    ? 'Real-time NASA TEMPO satellite data, ground sensors, and AI fusion are now active'
                    : 'Showcasing NASA TEMPO satellite data integration with mock data visualization'
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Service Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${allServicesHealthy ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-sm text-gray-300">
                  Backend Services: {backendStatus.checking ? 'Checking...' : (allServicesHealthy ? 'All Online' : 'Offline')}
                </span>
              </div>

              {/* Location Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${hasLocation ? 'bg-green-400' : 'bg-orange-400'}`} />
                <span className="text-sm text-gray-300">
                  Location: {hasLocation ? selectedLocation.name : 'Not Selected'}
                </span>
              </div>

              {/* Data Types */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm text-gray-300">3 Data Types Ready</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="text-blue-300 border-blue-400">
                <Satellite className="h-3 w-3 mr-1" />
                NASA TEMPO Satellite
              </Badge>
              <Badge variant="outline" className="text-green-300 border-green-400">
                <Radio className="h-3 w-3 mr-1" />
                Ground Sensors
              </Badge>
              <Badge variant="outline" className="text-purple-300 border-purple-400">
                <Zap className="h-3 w-3 mr-1" />
                AI Data Fusion
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {!hasLocation && (
                <Alert className="border-orange-500/50 bg-orange-500/10 flex-1">
                  <MapPin className="h-4 w-4" />
                  <AlertDescription className="text-orange-200">
                    Location automatically set to New York City for demo
                  </AlertDescription>
                </Alert>
              )}

              {hasLocation && (
                <Alert className={`${allServicesHealthy ? 'border-green-500/50 bg-green-500/10' : 'border-blue-500/50 bg-blue-500/10'} flex-1`}>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className={allServicesHealthy ? 'text-green-200' : 'text-blue-200'}>
                    {allServicesHealthy 
                      ? 'All systems ready! Your dashboard is now showing live NASA TEMPO data'
                      : 'Demo mode active! Showing NASA TEMPO integration with mock data'
                    }
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.open('/air-quality', '_blank')}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Full Dashboard
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsVisible(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-xs text-gray-400">Data Sources</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">5+</p>
              <p className="text-xs text-gray-400">Pollutants</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Demo</p>
              <p className="text-xs text-gray-400">Mode</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Ready</p>
              <p className="text-xs text-gray-400">For NASA</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
