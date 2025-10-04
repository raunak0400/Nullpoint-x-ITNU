
'use client';

import { useState } from 'react';
import { SharedStateContext, locations } from './sidebar';

type TempUnit = 'C' | 'F';

export function Providers({ children }: { children: React.ReactNode }) {
  const [unit, setUnit] = useState<TempUnit>('C');
  const [is24Hour, setIs24Hour] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);

  return (
    <SharedStateContext.Provider value={{
      unit,
      setUnit,
      is24Hour,
      setIs24Hour,
      selectedLocation,
      setSelectedLocation
    }}>
      {children}
    </SharedStateContext.Provider>
  );
}
