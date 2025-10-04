
'use client';

import { useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { SharedStateContext, locations } from './sidebar';

type TempUnit = 'C' | 'F';

const libraries = ['visualization'] as const;

export function Providers({ children }: { children: React.ReactNode }) {
  const [unit, setUnit] = useState<TempUnit>('C');
  const [is24Hour, setIs24Hour] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  return (
    <SharedStateContext.Provider value={{
      unit,
      setUnit,
      is24Hour,
      setIs24Hour,
      selectedLocation,
      setSelectedLocation,
      isMapLoaded: isLoaded,
      mapLoadError: loadError,
    }}>
      {children}
    </SharedStateContext.Provider>
  );
}
