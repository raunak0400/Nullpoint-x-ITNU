'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Satellite, 
  Radio, 
  Zap, 
  MapPin, 
  Settings,
  Info,
  TrendingUp,
  Activity,
  Globe,
  RefreshCw
} from 'lucide-react';

import { MockOverview } from '@/components/mock-overview';
import { MockSmartTips } from '@/components/mock-smart-tips';
// import { useAirQualityState, useHealthStatus } from '@/hooks/useAirQuality';
// import { Location, PollutantType } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function AirQualityPage() {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedPollutants, setSelectedPollutants] = useState<string[]>(['NO2', 'O3', 'PM2.5']);
  
  // Mock state for demo
  const state = {
    selectedLocation: { lat: 40.7128, lon: -74.0060, name: 'New York City' }
  };

  // Mock health status for demo
  const health = { api: false, fusion: false, threeTypes: false };

  const handleLocationChange = (location: any) => {
    // Mock function for demo
    setShowLocationPicker(false);
  };

  const handlePollutantToggle = (pollutant: string) => {
    const newPollutants = selectedPollutants.includes(pollutant)
      ? selectedPollutants.filter(p => p !== pollutant)
      : [...selectedPollutants, pollutant];
    
    setSelectedPollutants(newPollutants);
  };

  const availablePollutants: string[] = ['NO2', 'O3', 'PM2.5', 'PM10', 'HCHO', 'SO2', 'CO'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="relative">
        {/* Header */}
        <div className="border-b border-gray-700/50 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">NASA Air Quality Monitor</h1>
                <p className="text-gray-300 mt-1">
                  Real-time TEMPO satellite data, ground sensors, and intelligent fusion
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* System Health Indicators */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    health.api ? "bg-green-400" : "bg-red-400"
                  )} />
                  <span className="text-sm text-gray-300">API</span>
                  
                  <div className={cn(
                    "w-2 h-2 rounded-full ml-3",
                    health.fusion ? "bg-green-400" : "bg-red-400"
                  )} />
                  <span className="text-sm text-gray-300">Fusion</span>
                  
                  <div className={cn(
                    "w-2 h-2 rounded-full ml-3",
                    health.threeTypes ? "bg-green-400" : "bg-red-400"
                  )} />
                  <span className="text-sm text-gray-300">Data</span>
                </div>
                
                <Button
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                  variant="outline"
                  size="sm"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Location
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Location Picker */}
          {showLocationPicker && (
            <div className="mb-6">
              <Card className="bg-black/20 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Select Location
                  </CardTitle>
                  <CardDescription>
                    Choose a location to monitor air quality data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-gray-300">Demo Mode: Location set to New York City</p>
                    <p className="text-sm text-gray-400 mt-2">Lat: 40.7128, Lon: -74.0060</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pollutant Selection */}
          <div className="mb-6">
            <Card className="bg-black/20 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Pollutant Selection
                </CardTitle>
                <CardDescription>
                  Select which air pollutants to monitor and analyze
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {availablePollutants.map((pollutant) => (
                    <Button
                      key={pollutant}
                      onClick={() => handlePollutantToggle(pollutant)}
                      variant={selectedPollutants.includes(pollutant) ? "default" : "outline"}
                      size="sm"
                      className="transition-all"
                    >
                      {pollutant}
                      {selectedPollutants.includes(pollutant) && (
                        <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                          ✓
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
                
                {selectedPollutants.length === 0 && (
                  <Alert className="mt-4 border-yellow-500/50 bg-yellow-500/10">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-yellow-200">
                      Please select at least one pollutant to monitor.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Data Source Information */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <Satellite className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Satellite Data</h3>
                      <p className="text-blue-200 text-sm">NASA TEMPO • Wide Coverage</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-2 rounded-lg">
                      <Radio className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Ground Sensors</h3>
                      <p className="text-green-200 text-sm">OpenAQ • High Precision</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <Zap className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Fused Data</h3>
                      <p className="text-purple-200 text-sm">AI Enhanced • Best Accuracy</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Dashboard */}
          {state.selectedLocation && selectedPollutants.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <MockOverview />
              </div>
              <div>
                <MockSmartTips />
              </div>
            </div>
          ) : (
            <Card className="bg-black/20 border-gray-700">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="max-w-md mx-auto">
                  <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Ready to Monitor Air Quality
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Select a location and pollutants to start monitoring real-time air quality data 
                    from NASA TEMPO satellite, ground sensors, and our intelligent fusion system.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => setShowLocationPicker(true)}
                      className="flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Choose Location
                    </Button>
                    {selectedPollutants.length === 0 && (
                      <Button
                        onClick={() => setSelectedPollutants(['NO2', 'O3', 'PM2.5'])}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Activity className="h-4 w-4" />
                        Select Pollutants
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer Information */}
          <div className="mt-8">
            <Card className="bg-black/10 border-gray-700/50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Satellite className="h-4 w-4" />
                      NASA TEMPO
                    </h4>
                    <p className="text-gray-400">
                      Geostationary satellite providing hourly air quality observations 
                      across North America with 2-5km spatial resolution.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Radio className="h-4 w-4" />
                      Ground Networks
                    </h4>
                    <p className="text-gray-400">
                      High-precision measurements from thousands of monitoring stations 
                      worldwide, including EPA AirNow and OpenAQ networks.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Data Fusion
                    </h4>
                    <p className="text-gray-400">
                      Advanced algorithms combine satellite coverage with ground precision, 
                      providing uncertainty bounds and quality assessment.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-700/50">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>NASA Space Apps Challenge 2024</span>
                      <span>•</span>
                      <span>Real-time Air Quality Monitoring</span>
                      <span>•</span>
                      <span>NULL POINT Team</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                        Live Data
                      </Badge>
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        API v1.0
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
