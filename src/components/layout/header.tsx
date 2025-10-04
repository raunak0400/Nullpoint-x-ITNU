
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSharedState, locations } from './sidebar';

type TempUnit = 'C' | 'F';

const TemperatureSwitch = ({ unit, setUnit }: { unit: TempUnit; setUnit: (unit: TempUnit) => void }) => {
  return (
    <div className="relative flex w-[72px] h-10 cursor-pointer items-center rounded-full bg-card/50 p-1 backdrop-blur-sm border border-white/10">
      <div
        className={cn(
          'absolute h-8 w-8 rounded-full bg-primary transition-transform duration-300 ease-in-out',
          unit === 'C' ? 'translate-x-[2px]' : 'translate-x-[34px]'
        )}
      />
      <button
        onClick={() => setUnit('C')}
        className={cn(
          'z-10 flex-1 h-8 text-center font-medium transition-colors',
          unit === 'C' ? 'text-primary-foreground' : 'text-muted-foreground'
        )}
      >
        °C
      </button>
      <button
        onClick={() => setUnit('F')}
        className={cn(
          'z-10 flex-1 h-8 text-center font-medium transition-colors',
          unit === 'F' ? 'text-primary-foreground' : 'text-muted-foreground'
        )}
      >
        °F
      </button>
    </div>
  );
};


export function Header() {
  const { unit, setUnit, is24Hour, selectedLocation, setSelectedLocation } = useSharedState();
  const [now, setNow] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  const pageTitles: { [key: string]: { title: string, description: string } } = {
    '/': { title: 'Hi, Nullpoint', description: '' },
    '/weather-info': { title: 'Weather Info', description: `Detailed view for ${selectedLocation.name}` },
    '/future-air-prediction': { title: 'Future Air Prediction', description: 'AI-powered 24-hour AQI forecast' },
    '/air-alerts': { title: 'Air Alerts', description: `Current advisories for ${selectedLocation.name}` },
    '/map-view': { title: 'Interactive Map View', description: `Data layers for ${selectedLocation.name}` },
    '/past-air-data': { title: 'Past Air Data', description: `Historical pollutant levels in ${selectedLocation.name}` },
  };

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      setIsSearchOpen(true);
      setSearchResults(locations.filter(loc => loc.name.toLowerCase().includes(searchQuery.toLowerCase())));
    } else {
      setIsSearchOpen(false);
      setSearchResults([]);
    }
  }, [searchQuery]);
  
  if (!now) {
    return (
     <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Loading...</h1>
          <p className="text-muted-foreground flex items-center">
            <span>Loading...</span>
          </p>
        </div>
     </header>
    );
  }

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(now);
  
  const formattedTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !is24Hour,
  }).format(now);

  const [timePart, ampmPart] = formattedTime.split(' ');
  const [hours, minutes] = timePart.split(':');

  const handleSelectLocation = (location: any) => {
    setSelectedLocation(location);
    setSearchQuery('');
    setIsSearchOpen(false);
  }
  
  const currentPage = pageTitles[pathname] || { title: '', description: '' };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{currentPage.title}</h1>
        <p className="text-muted-foreground flex items-center" suppressHydrationWarning>
          {pathname === '/' ? (
            <>
              <span>{formattedDate}</span>
              <span className="mx-2">|</span>
              <span>
                {hours}
                <span className="animate-colon-pulse">:</span>
                {minutes}
              </span>
              {ampmPart && <span className='ml-1'>{ampmPart}</span>}
            </>
          ) : currentPage.description}
        </p>
      </div>
      <div className="flex items-center gap-2 md:gap-4 flex-wrap">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" size={20} />
          <Input 
            placeholder="Search city or postcode" 
            className="bg-card/50 backdrop-blur-sm border-white/10 pl-10 w-48 md:w-64 rounded-full" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearchOpen && searchResults.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 w-full bg-card/80 backdrop-blur-sm border border-white/10 rounded-2xl z-20 overflow-hidden"
            >
              <ul>
                {searchResults.map(loc => (
                  <li key={loc.name}>
                    <button onClick={() => handleSelectLocation(loc)} className="w-full text-left px-4 py-2 hover:bg-primary/10">
                      {loc.name}, {loc.country}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
        <TemperatureSwitch unit={unit} setUnit={setUnit} />
      </div>
    </header>
  );
}
