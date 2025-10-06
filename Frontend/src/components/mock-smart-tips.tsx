'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Activity,
  Satellite,
  Radio,
  Zap
} from 'lucide-react';

import { useSharedState } from '@/components/layout/sidebar';

export function MockSmartTips() {
  const { selectedLocation } = useSharedState();
  const [loading, setLoading] = useState(true);
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const [tips, setTips] = useState({ 
    explanation: '', 
    recommendations: '' 
  });

  useEffect(() => {
    const fetchSmartTips = async () => {
      setLoading(true);
      
      try {
        // Check if backend is available
        const healthResponse = await fetch('http://127.0.0.1:5000/health');
        if (healthResponse.ok) {
          setIsBackendAvailable(true);
          
          // Try to get real air quality data first
          if (selectedLocation) {
            const dataResponse = await fetch(
              `http://127.0.0.1:5000/api/three-data-types/all-data-types?lat=${selectedLocation.lat}&lon=${selectedLocation.lng}&pollutants=NO2,HCHO,PM2.5,O3&radius_km=50`
            );
            
            if (dataResponse.ok) {
              const data = await dataResponse.json();
              
              // Extract real values for AI analysis
              const pollutants = data.fused_data?.data?.pollutants || {};
              const no2Value = pollutants.NO2?.fused_value || pollutants.NO2?.value || 25;
              const hchoValue = pollutants.HCHO?.fused_value || pollutants.HCHO?.value || 12;
              const pmValue = pollutants['PM2.5']?.fused_value || pollutants['PM2.5']?.value || 28;
              const o3Value = pollutants.O3?.fused_value || pollutants.O3?.value || 90;
              
              // Use real data for analysis
              setTips({
                explanation: `Live air quality data for ${selectedLocation.name}: NO₂ levels at ${no2Value.toFixed(1)} µg/m³, PM2.5 at ${pmValue.toFixed(1)} µg/m³, and O₃ at ${o3Value.toFixed(1)} µg/m³. Data sourced from NASA TEMPO satellite and ground monitoring stations with AI fusion processing providing enhanced accuracy and uncertainty quantification.`,
                recommendations: 'Monitor air quality regularly during peak traffic hours - Consider outdoor activities in the morning when pollution levels are typically lower - Use air purifiers indoors during high pollution days - Check real-time updates before planning outdoor exercise - Current data shows ' + (no2Value > 40 ? 'elevated NO₂ levels' : 'acceptable NO₂ levels') + ' and ' + (pmValue > 35 ? 'high PM2.5 concentrations' : 'moderate PM2.5 levels')
              });
            } else {
              throw new Error('Data endpoint not available');
            }
          }
        } else {
          throw new Error('Backend not available');
        }
      } catch (error) {
        // Fallback to mock data
        setIsBackendAvailable(false);
        if (selectedLocation) {
          setTips({
            explanation: `Air quality analysis for ${selectedLocation.name} shows moderate pollution levels. NASA TEMPO satellite data indicates elevated NO₂ concentrations typical for urban areas, while ground sensor networks confirm particulate matter levels within acceptable ranges. The AI fusion model combines both data sources to provide enhanced accuracy with 85% confidence.`,
            recommendations: 'Monitor air quality regularly during peak traffic hours - Consider outdoor activities in the morning when pollution levels are typically lower - Use air purifiers indoors during high pollution days - Check real-time updates before planning outdoor exercise - Stay hydrated and limit strenuous outdoor activities when AQI exceeds 100'
          });
        } else {
          setTips({
            explanation: 'Please select a location to get personalized air quality analysis and recommendations.',
            recommendations: ''
          });
        }
      }
      
      setLoading(false);
    };

    fetchSmartTips();
  }, [selectedLocation]);

  // Mock air quality status
  const getAirQualityStatus = () => {
    if (!selectedLocation) return null;
    
    // Generate a mock status based on location
    const statuses = [
      { level: 'Good', color: 'text-green-400', icon: CheckCircle },
      { level: 'Moderate', color: 'text-blue-400', icon: TrendingUp },
      { level: 'Fair', color: 'text-yellow-400', icon: Activity },
    ];
    
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const airQualityStatus = getAirQualityStatus();

  return (
    <div className="h-full flex flex-col p-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Lightbulb className="text-primary" />
          Smart Tips
          {loading && <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />}
        </h3>
        
        <div className="flex items-center gap-2">
          {airQualityStatus && (
            <Badge variant="outline" className={`flex items-center gap-1 ${airQualityStatus.color}`}>
              <airQualityStatus.icon className="h-3 w-3" />
              {airQualityStatus.level}
            </Badge>
          )}
          <Badge variant="outline" className={isBackendAvailable ? "text-green-300 border-green-400" : "text-blue-300 border-blue-400"}>
            <Satellite className="h-3 w-3 mr-1" />
            {isBackendAvailable ? 'Live' : 'Demo'}
          </Badge>
          <Button variant="ghost" size="sm" className="rounded-full">More</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-4 bg-muted/50 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-muted/50 rounded w-full animate-pulse" />
          <div className="h-4 bg-muted/50 rounded w-4/6 animate-pulse" />
          <div className="h-4 bg-muted/50 rounded w-1/2 mt-4 animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">AI Analysis</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">{tips.explanation}</p>
          </div>
          
          {tips.recommendations && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Recommendations</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                {tips.recommendations.split('- ').filter(r => r.trim()).map((rec, i) => (
                  <li key={i} className="leading-relaxed">{rec.trim()}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Mock Data Quality Indicators */}
          {selectedLocation && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Data Quality</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Satellite Coverage</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-green-400">85%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Ground Sensors</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="w-3/5 h-full bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="text-blue-400">72%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Fusion Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="w-5/6 h-full bg-purple-500 rounded-full"></div>
                    </div>
                    <span className="text-purple-400">91%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Source Info */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Demo Data Sources:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Satellite className="h-3 w-3 mr-1" />
                    NASA TEMPO
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Radio className="h-3 w-3 mr-1" />
                    Ground Sensors
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    AI Fusion
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
