// React hooks for Air Quality API integration

import { useState, useEffect, useCallback, useRef } from 'react';
import { airQualityApi } from '@/lib/api-service';
import {
  Location,
  PollutantType,
  ThreeDataTypesResponse,
  EnhancedPredictionResponse,
  DataComparisonResponse,
  QualityAssessmentResponse,
  AirQualityState
} from '@/lib/types';

// Hook for managing three data types
export const useThreeDataTypes = (
  location: Location | null,
  pollutants: PollutantType[] = ['NO2', 'O3', 'PM2.5'],
  radiusKm: number = 50,
  autoRefresh: boolean = false,
  refreshInterval: number = 600000 // 10 minutes
) => {
  const [data, setData] = useState<ThreeDataTypesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const fetchData = useCallback(async (useCache: boolean = true) => {
    if (!location) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await airQualityApi.getAllThreeDataTypes(
        location,
        pollutants,
        radiusKm,
        useCache
      );
      
      setData(result);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch air quality data';
      setError(errorMessage);
      console.error('Error fetching three data types:', err);
    } finally {
      setLoading(false);
    }
  }, [location, pollutants, radiusKm]);
  
  // Initial fetch
  useEffect(() => {
    if (location) {
      fetchData();
    }
  }, [fetchData]);
  
  // Auto refresh setup
  useEffect(() => {
    if (autoRefresh && location) {
      intervalRef.current = setInterval(() => {
        fetchData(false); // Don't use cache for auto-refresh
      }, refreshInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchData]);
  
  const refresh = useCallback(() => {
    fetchData(false);
  }, [fetchData]);
  
  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    refetch: fetchData
  };
};

// Hook for enhanced predictions
export const useEnhancedPrediction = (
  location: Location | null,
  pollutant: PollutantType = 'NO2',
  forecastHours: number = 24
) => {
  const [prediction, setPrediction] = useState<EnhancedPredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchPrediction = useCallback(async (useCache: boolean = true) => {
    if (!location) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await airQualityApi.getEnhancedPrediction(
        location,
        pollutant,
        forecastHours,
        useCache
      );
      
      setPrediction(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prediction';
      setError(errorMessage);
      console.error('Error fetching prediction:', err);
    } finally {
      setLoading(false);
    }
  }, [location, pollutant, forecastHours]);
  
  useEffect(() => {
    if (location) {
      fetchPrediction();
    }
  }, [fetchPrediction]);
  
  return {
    prediction,
    loading,
    error,
    refresh: () => fetchPrediction(false),
    refetch: fetchPrediction
  };
};

// Hook for data comparison
export const useDataComparison = (
  location: Location | null,
  pollutant: PollutantType = 'NO2',
  radiusKm: number = 50
) => {
  const [comparison, setComparison] = useState<DataComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchComparison = useCallback(async (useCache: boolean = true) => {
    if (!location) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await airQualityApi.getDataComparison(
        location,
        pollutant,
        radiusKm,
        useCache
      );
      
      setComparison(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch comparison';
      setError(errorMessage);
      console.error('Error fetching comparison:', err);
    } finally {
      setLoading(false);
    }
  }, [location, pollutant, radiusKm]);
  
  useEffect(() => {
    if (location) {
      fetchComparison();
    }
  }, [fetchComparison]);
  
  return {
    comparison,
    loading,
    error,
    refresh: () => fetchComparison(false),
    refetch: fetchComparison
  };
};

// Hook for quality assessment
export const useQualityAssessment = (
  location: Location | null,
  pollutants: PollutantType[] = ['NO2', 'O3', 'PM2.5']
) => {
  const [assessment, setAssessment] = useState<QualityAssessmentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchAssessment = useCallback(async (useCache: boolean = true) => {
    if (!location) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await airQualityApi.getQualityAssessment(
        location,
        pollutants,
        useCache
      );
      
      setAssessment(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assessment';
      setError(errorMessage);
      console.error('Error fetching assessment:', err);
    } finally {
      setLoading(false);
    }
  }, [location, pollutants]);
  
  useEffect(() => {
    if (location) {
      fetchAssessment();
    }
  }, [fetchAssessment]);
  
  return {
    assessment,
    loading,
    error,
    refresh: () => fetchAssessment(false),
    refetch: fetchAssessment
  };
};

// Combined hook for complete air quality state management
export const useAirQualityState = (
  initialLocation?: Location,
  initialPollutants: PollutantType[] = ['NO2', 'O3', 'PM2.5']
) => {
  const [state, setState] = useState<AirQualityState>({
    selectedLocation: initialLocation || null,
    selectedPollutants: initialPollutants,
    selectedDataType: 'all',
    radiusKm: 50,
    forecastHours: 24,
    isLoading: false,
    error: null,
    lastUpdated: null
  });
  
  const updateLocation = useCallback((location: Location) => {
    setState(prev => ({ ...prev, selectedLocation: location }));
  }, []);
  
  const updatePollutants = useCallback((pollutants: PollutantType[]) => {
    setState(prev => ({ ...prev, selectedPollutants: pollutants }));
  }, []);
  
  const updateDataType = useCallback((dataType: 'all' | 'satellite' | 'ground' | 'fused') => {
    setState(prev => ({ ...prev, selectedDataType: dataType }));
  }, []);
  
  const updateRadius = useCallback((radiusKm: number) => {
    setState(prev => ({ ...prev, radiusKm }));
  }, []);
  
  const updateForecastHours = useCallback((forecastHours: number) => {
    setState(prev => ({ ...prev, forecastHours }));
  }, []);
  
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);
  
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);
  
  const setLastUpdated = useCallback((lastUpdated: string) => {
    setState(prev => ({ ...prev, lastUpdated }));
  }, []);
  
  return {
    state,
    updateLocation,
    updatePollutants,
    updateDataType,
    updateRadius,
    updateForecastHours,
    setLoading,
    setError,
    setLastUpdated
  };
};

// Hook for health monitoring
export const useHealthStatus = (checkInterval: number = 300000) => { // 5 minutes
  const [health, setHealth] = useState<{
    api: boolean;
    fusion: boolean;
    threeTypes: boolean;
    lastCheck: string | null;
  }>({
    api: false,
    fusion: false,
    threeTypes: false,
    lastCheck: null
  });
  
  const checkHealth = useCallback(async () => {
    try {
      const [apiHealth, fusionHealth, threeTypesHealth] = await Promise.allSettled([
        airQualityApi.checkHealth(),
        airQualityApi.checkFusionHealth(),
        airQualityApi.checkThreeTypesHealth()
      ]);
      
      setHealth({
        api: apiHealth.status === 'fulfilled' && apiHealth.value.status === 'healthy',
        fusion: fusionHealth.status === 'fulfilled' && fusionHealth.value.status === 'healthy',
        threeTypes: threeTypesHealth.status === 'fulfilled' && threeTypesHealth.value.status === 'healthy',
        lastCheck: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth(prev => ({
        ...prev,
        api: false,
        fusion: false,
        threeTypes: false,
        lastCheck: new Date().toISOString()
      }));
    }
  }, []);
  
  useEffect(() => {
    checkHealth(); // Initial check
    
    const interval = setInterval(checkHealth, checkInterval);
    return () => clearInterval(interval);
  }, [checkHealth, checkInterval]);
  
  return {
    health,
    checkHealth
  };
};

// Hook for batch operations
export const useBatchOperations = () => {
  const [operations, setOperations] = useState<{
    [key: string]: {
      loading: boolean;
      data: any;
      error: string | null;
    };
  }>({});
  
  const batchFetchThreeDataTypes = useCallback(async (
    locations: Location[],
    pollutants: PollutantType[] = ['NO2', 'O3', 'PM2.5'],
    radiusKm: number = 50
  ) => {
    const operationId = `batch_three_data_${Date.now()}`;
    
    setOperations(prev => ({
      ...prev,
      [operationId]: { loading: true, data: null, error: null }
    }));
    
    try {
      const results = await airQualityApi.batchGetThreeDataTypes(locations, pollutants, radiusKm);
      
      setOperations(prev => ({
        ...prev,
        [operationId]: { loading: false, data: results, error: null }
      }));
      
      return { operationId, results };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch operation failed';
      
      setOperations(prev => ({
        ...prev,
        [operationId]: { loading: false, data: null, error: errorMessage }
      }));
      
      throw error;
    }
  }, []);
  
  const getOperationStatus = useCallback((operationId: string) => {
    return operations[operationId] || { loading: false, data: null, error: null };
  }, [operations]);
  
  const clearOperation = useCallback((operationId: string) => {
    setOperations(prev => {
      const newOperations = { ...prev };
      delete newOperations[operationId];
      return newOperations;
    });
  }, []);
  
  return {
    batchFetchThreeDataTypes,
    getOperationStatus,
    clearOperation,
    operations
  };
};
