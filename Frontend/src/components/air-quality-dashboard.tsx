'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Satellite, 
  Radio, 
  Zap, 
  RefreshCw, 
  MapPin, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  BarChart3,
  Activity
} from 'lucide-react';

import { useThreeDataTypes, useEnhancedPrediction, useAirQualityState } from '@/hooks/useAirQuality';
import { Location, PollutantType, ThreeDataTypesResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AirQualityDashboardProps {
  initialLocation?: Location;
  className?: string;
}

export const AirQualityDashboard: React.FC<AirQualityDashboardProps> = ({
  initialLocation = { lat: 40.7128, lon: -74.0060 }, // Default to NYC
  className
}) => {
  const { state, updateLocation, updateDataType, updatePollutants } = useAirQualityState(
    initialLocation,
    ['NO2', 'O3', 'PM2.5']
  );

  const {
    data: threeDataTypes,
    loading: threeDataLoading,
    error: threeDataError,
    refresh: refreshThreeData,
    lastUpdated
  } = useThreeDataTypes(
    state.selectedLocation,
    state.selectedPollutants,
    state.radiusKm,
    true, // Auto refresh
    600000 // 10 minutes
  );

  const {
    prediction,
    loading: predictionLoading,
    error: predictionError,
    refresh: refreshPrediction
  } = useEnhancedPrediction(
    state.selectedLocation,
    'NO2',
    state.forecastHours
  );

  const handleRefreshAll = () => {
    refreshThreeData();
    refreshPrediction();
  };

  const getQualityColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    if (score >= 0.2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getQualityBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'outline';
      case 'poor': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className={cn("w-full max-w-7xl mx-auto p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Air Quality Dashboard</h1>
          <p className="text-gray-300 mt-1">
            Real-time NASA TEMPO satellite data, ground sensors, and intelligent fusion
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefreshAll}
            disabled={threeDataLoading || predictionLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", (threeDataLoading || predictionLoading) && "animate-spin")} />
            Refresh
          </Button>
          
          {lastUpdated && (
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="h-4 w-4 mr-1" />
              {new Date(lastUpdated).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Location Info */}
      {state.selectedLocation && (
        <Card className="bg-black/20 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-white">
              <MapPin className="h-5 w-5" />
              <span className="font-medium">
                Location: {state.selectedLocation.lat.toFixed(4)}, {state.selectedLocation.lon.toFixed(4)}
              </span>
              <Badge variant="outline" className="ml-auto">
                {state.selectedPollutants.length} pollutants
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {(threeDataError || predictionError) && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-200">
            {threeDataError || predictionError}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-black/20">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="satellite">🛰️ Satellite</TabsTrigger>
          <TabsTrigger value="ground">📡 Ground</TabsTrigger>
          <TabsTrigger value="fused">🔬 Fused</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {threeDataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-black/20 border-gray-700">
                  <CardContent className="pt-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                      <div className="h-8 bg-gray-600 rounded"></div>
                      <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : threeDataTypes ? (
            <ThreeDataTypesOverview data={threeDataTypes} />
          ) : (
            <Card className="bg-black/20 border-gray-700">
              <CardContent className="pt-6 text-center text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No air quality data available</p>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Prediction Section */}
          {prediction && (
            <Card className="bg-black/20 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Enhanced Prediction (24 hours)
                </CardTitle>
                <CardDescription>
                  ML-powered forecast using fused satellite and ground data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedPredictionDisplay prediction={prediction} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Individual Data Type Tabs */}
        <TabsContent value="satellite">
          {threeDataTypes?.satellite_data && (
            <DataTypeDetailView 
              dataType="satellite"
              data={threeDataTypes.satellite_data}
              icon={<Satellite className="h-5 w-5" />}
              color="text-blue-400"
            />
          )}
        </TabsContent>

        <TabsContent value="ground">
          {threeDataTypes?.ground_sensor_data && (
            <DataTypeDetailView 
              dataType="ground"
              data={threeDataTypes.ground_sensor_data}
              icon={<Radio className="h-5 w-5" />}
              color="text-green-400"
            />
          )}
        </TabsContent>

        <TabsContent value="fused">
          {threeDataTypes?.fused_data && (
            <DataTypeDetailView 
              dataType="fused"
              data={threeDataTypes.fused_data}
              icon={<Zap className="h-5 w-5" />}
              color="text-purple-400"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Three Data Types Overview Component
const ThreeDataTypesOverview: React.FC<{ data: ThreeDataTypesResponse }> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Satellite Data Card */}
      <Card className="bg-black/20 border-gray-700 hover:bg-black/30 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Satellite className="h-5 w-5 text-blue-400" />
            Satellite Data
          </CardTitle>
          <CardDescription className="text-sm">
            {data.satellite_data.characteristics.coverage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataSourceSummary 
            data={data.satellite_data.data}
            characteristics={data.satellite_data.characteristics}
          />
        </CardContent>
      </Card>

      {/* Ground Sensor Data Card */}
      <Card className="bg-black/20 border-gray-700 hover:bg-black/30 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Radio className="h-5 w-5 text-green-400" />
            Ground Sensors
          </CardTitle>
          <CardDescription className="text-sm">
            {data.ground_sensor_data.characteristics.coverage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataSourceSummary 
            data={data.ground_sensor_data.data}
            characteristics={data.ground_sensor_data.characteristics}
          />
        </CardContent>
      </Card>

      {/* Fused Data Card */}
      <Card className="bg-black/20 border-gray-700 hover:bg-black/30 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-purple-400" />
            Fused Data
          </CardTitle>
          <CardDescription className="text-sm">
            {data.fused_data.characteristics.coverage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataSourceSummary 
            data={data.fused_data.data}
            characteristics={data.fused_data.characteristics}
          />
        </CardContent>
      </Card>
    </div>
  );
};

// Data Source Summary Component
const DataSourceSummary: React.FC<{ 
  data: any; 
  characteristics: any;
}> = ({ data, characteristics }) => {
  const successfulPollutants = Object.values(data.pollutants || {}).filter(
    (p: any) => p.value !== undefined || p.fused_value !== undefined || p.closest_station !== undefined
  ).length;
  
  const totalPollutants = Object.keys(data.pollutants || {}).length;
  const successRate = totalPollutants > 0 ? (successfulPollutants / totalPollutants) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Success Rate */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-300">Data Availability</span>
          <span className="text-white">{successfulPollutants}/{totalPollutants}</span>
        </div>
        <Progress value={successRate} className="h-2" />
      </div>

      {/* Strengths */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Strengths</h4>
        <div className="flex flex-wrap gap-1">
          {characteristics.strengths?.slice(0, 2).map((strength: string, idx: number) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {strength}
            </Badge>
          ))}
        </div>
      </div>

      {/* Sample Pollutant */}
      {data.pollutants && Object.keys(data.pollutants).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Sample Data</h4>
          <PollutantSample pollutants={data.pollutants} />
        </div>
      )}
    </div>
  );
};

// Pollutant Sample Component
const PollutantSample: React.FC<{ pollutants: any }> = ({ pollutants }) => {
  const firstPollutant = Object.entries(pollutants)[0];
  if (!firstPollutant) return null;
  
  const [name, data] = firstPollutant as [string, any];
  
  let value, unit;
  if (data.value !== undefined) {
    value = data.value;
    unit = data.unit;
  } else if (data.fused_value !== undefined) {
    value = data.fused_value;
    unit = data.unit;
  } else if (data.closest_station) {
    value = data.closest_station.value;
    unit = data.closest_station.unit;
  } else {
    return <span className="text-gray-400 text-sm">No data available</span>;
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">{name}</span>
      <span className="text-sm font-medium text-white">
        {typeof value === 'number' ? value.toFixed(1) : value} {unit}
      </span>
    </div>
  );
};

// Enhanced Prediction Display Component
const EnhancedPredictionDisplay: React.FC<{ prediction: any }> = ({ prediction }) => {
  if (!prediction.predictions || prediction.predictions.length === 0) {
    return <p className="text-gray-400">No prediction data available</p>;
  }

  const nextFewHours = prediction.predictions.slice(0, 6); // Show next 6 hours

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-400">Average</p>
          <p className="text-lg font-semibold text-white">
            {prediction.summary.average_value.toFixed(1)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Trend</p>
          <Badge variant={prediction.summary.trend === 'increasing' ? 'destructive' : 'default'}>
            {prediction.summary.trend}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-gray-400">Uncertainty</p>
          <p className="text-lg font-semibold text-white">
            ±{prediction.summary.average_uncertainty.toFixed(1)}
          </p>
        </div>
      </div>

      <Separator className="bg-gray-600" />

      {/* Hourly Predictions */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300">Next 6 Hours</h4>
        {nextFewHours.map((pred: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-400">
              +{idx + 1}h
            </span>
            <div className="text-right">
              <span className="text-sm font-medium text-white">
                {pred.value.toFixed(1)} ±{pred.uncertainty.toFixed(1)}
              </span>
              <div className="text-xs text-gray-400">
                {pred.confidence_interval.lower.toFixed(1)} - {pred.confidence_interval.upper.toFixed(1)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Data Type Detail View Component
const DataTypeDetailView: React.FC<{
  dataType: string;
  data: any;
  icon: React.ReactNode;
  color: string;
}> = ({ dataType, data, icon, color }) => {
  return (
    <div className="space-y-6">
      <Card className="bg-black/20 border-gray-700">
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", color)}>
            {icon}
            {data.source}
          </CardTitle>
          <CardDescription>{data.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Characteristics */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Characteristics</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-400">Coverage:</span>
                  <p className="text-white">{data.characteristics.coverage}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Resolution:</span>
                  <p className="text-white">{data.characteristics.spatial_resolution}</p>
                </div>
                {data.characteristics.temporal_resolution && (
                  <div>
                    <span className="text-sm text-gray-400">Temporal:</span>
                    <p className="text-white">{data.characteristics.temporal_resolution}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Strengths & Limitations */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Pros & Cons</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-green-400 font-medium">Strengths:</span>
                  <ul className="mt-1 space-y-1">
                    {data.characteristics.strengths?.map((strength: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-sm text-orange-400 font-medium">Limitations:</span>
                  <ul className="mt-1 space-y-1">
                    {data.characteristics.limitations?.map((limitation: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-orange-400" />
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Pollutant Data */}
          {data.data?.pollutants && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Pollutant Data</h3>
              <PollutantDataGrid pollutants={data.data.pollutants} dataType={dataType} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Pollutant Data Grid Component
const PollutantDataGrid: React.FC<{ 
  pollutants: any; 
  dataType: string;
}> = ({ pollutants, dataType }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(pollutants).map(([name, data]: [string, any]) => (
        <Card key={name} className="bg-black/10 border-gray-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">{name}</CardTitle>
          </CardHeader>
          <CardContent>
            <PollutantDataDisplay pollutantData={data} dataType={dataType} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Individual Pollutant Data Display
const PollutantDataDisplay: React.FC<{ 
  pollutantData: any; 
  dataType: string;
}> = ({ pollutantData, dataType }) => {
  if (pollutantData.status && pollutantData.status !== 'success') {
    return (
      <div className="text-center py-4">
        <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">
          {pollutantData.message || 'Data not available'}
        </p>
      </div>
    );
  }

  // Handle different data types
  if (dataType === 'satellite' && pollutantData.value !== undefined) {
    return (
      <div className="space-y-2">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            {pollutantData.value.toFixed(1)}
          </p>
          <p className="text-sm text-gray-400">{pollutantData.unit}</p>
        </div>
        <div className="text-xs text-gray-400 space-y-1">
          <p>Quality: {pollutantData.quality || 'Unknown'}</p>
          <p>Source: {pollutantData.source || 'TEMPO'}</p>
        </div>
      </div>
    );
  }

  if (dataType === 'ground' && pollutantData.closest_station) {
    return (
      <div className="space-y-2">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            {pollutantData.closest_station.value.toFixed(1)}
          </p>
          <p className="text-sm text-gray-400">{pollutantData.closest_station.unit}</p>
        </div>
        <div className="text-xs text-gray-400 space-y-1">
          <p>Station: {pollutantData.closest_station.station_name}</p>
          <p>Distance: {pollutantData.closest_station.distance_km.toFixed(1)} km</p>
          <p>Stations: {pollutantData.station_count}</p>
        </div>
      </div>
    );
  }

  if (dataType === 'fused' && pollutantData.fused_value !== undefined) {
    return (
      <div className="space-y-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            {pollutantData.fused_value.toFixed(1)}
          </p>
          <p className="text-sm text-gray-400">{pollutantData.unit}</p>
          <p className="text-xs text-gray-400">
            ±{pollutantData.uncertainty.toFixed(1)}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Quality:</span>
            <Badge variant={getQualityBadgeVariant(pollutantData.quality_level)}>
              {pollutantData.quality_level}
            </Badge>
          </div>
          
          <div className="text-xs text-gray-400">
            <p>Method: {pollutantData.fusion_method}</p>
            <p>
              Sources: {pollutantData.contributing_sources.satellite_data} sat + {' '}
              {pollutantData.contributing_sources.ground_sensors} ground
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-4 text-gray-400">
      <p className="text-sm">No data available</p>
    </div>
  );
};

// Helper function for badge variants
const getQualityBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (level) {
    case 'excellent': return 'default';
    case 'good': return 'secondary';
    case 'fair': return 'outline';
    case 'poor': return 'destructive';
    default: return 'outline';
  }
};

export default AirQualityDashboard;
