"use client";

import * as React from 'react';
import AuroraGlobe from '@/components/aurora-globe';
import ControlPanel from '@/components/control-panel';
import StationCard from '@/components/station-card';
import { cities, type City } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Code } from 'lucide-react';

export default function Home() {
  const [selectedCity, setSelectedCity] = React.useState<City | null>(null);
  const [time, setTime] = React.useState(0);
  const [dataSource, setDataSource] = React.useState<'nasa' | 'combined'>('combined');
  const [scenario, setScenario] = React.useState({ traffic: 50, industry: 50, rain: 0 });

  const handleCitySelect = (city: City | null) => {
    setSelectedCity(city);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background font-body">
      <AuroraGlobe
        cities={cities}
        selectedCity={selectedCity}
        onCitySelect={handleCitySelect}
        time={time}
        dataSource={dataSource}
        scenario={scenario}
      />

      <div className="absolute top-0 left-0 w-full p-4 md:p-8 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2 items-start">
          <h1 className="font-headline text-3xl md:text-5xl font-bold text-white shadow-black/50 [text-shadow:0_2px_4px_var(--tw-shadow-color)]">
            AuroraAir
          </h1>
          <Badge variant="outline" className="text-white/80 border-white/20 bg-black/20 backdrop-blur-md">
            <Code className="mr-2" />
            Predictive Air Quality
          </Badge>
        </div>
      </div>

      <ControlPanel
        selectedCity={selectedCity}
        time={time}
        onTimeChange={setTime}
        dataSource={dataSource}
        onDataSourceChange={setDataSource}
        scenario={scenario}
        onScenarioChange={setScenario}
      />

      <div
        className={cn(
          'absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl transition-all duration-500 ease-out pointer-events-none',
          selectedCity ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        )}
      >
        {selectedCity && (
          <div className="pointer-events-auto">
            <StationCard
              city={selectedCity}
              onClose={() => handleCitySelect(null)}
              time={time}
            />
          </div>
        )}
      </div>
    </main>
  );
}
