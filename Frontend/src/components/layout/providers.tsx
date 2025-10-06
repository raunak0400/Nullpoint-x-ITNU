
'use client';

import { useState, useEffect } from 'react';
import { SharedStateContext, locations, Location } from './sidebar';

type TempUnit = 'C' | 'F';
type DataSources = {
  satellite: boolean;
  ground: boolean;
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [unit, setUnit] = useState<TempUnit>('C');
  const [is24Hour, setIs24Hour] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(locations[7]); // New York City as default
  const [dataSources, setDataSources] = useState<DataSources>({
    satellite: true,
    ground: false,
  });

  useEffect(() => {
    const savedIs24Hour = localStorage.getItem('is24Hour');
    if (savedIs24Hour) {
      setIs24Hour(JSON.parse(savedIs24Hour));
    }
  }, []);

  const handleSetIs24Hour = (value: boolean) => {
    setIs24Hour(value);
    localStorage.setItem('is24Hour', JSON.stringify(value));
  };
  
  return (
    <SharedStateContext.Provider value={{
      unit,
      setUnit,
      is24Hour,
      setIs24Hour: handleSetIs24Hour,
      selectedLocation,
      setSelectedLocation,
      dataSources,
      setDataSources,
    }}>
      {children}
    </SharedStateContext.Provider>
  );
}
