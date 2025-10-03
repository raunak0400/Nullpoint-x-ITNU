export type City = {
  id: string;
  name: string;
  coords: { lat: number; lng: number };
  aqi: number;
  dataSource: ('nasa' | 'openaq' | 'cpcb' | 'tempo')[];
};

export const cities: City[] = [
  { id: 'delhi', name: 'Delhi', coords: { lat: 28.6139, lng: 77.2090 }, aqi: 152, dataSource: ['nasa', 'cpcb'] },
  { id: 'mumbai', name: 'Mumbai', coords: { lat: 19.0760, lng: 72.8777 }, aqi: 85, dataSource: ['nasa', 'openaq'] },
  { id: 'bangalore', name: 'Bangalore', coords: { lat: 12.9716, lng: 77.5946 }, aqi: 60, dataSource: ['nasa', 'openaq', 'cpcb'] },
  { id: 'kolkata', name: 'Kolkata', coords: { lat: 22.5726, lng: 88.3639 }, aqi: 110, dataSource: ['nasa', 'cpcb'] },
  { id: 'chennai', name: 'Chennai', coords: { lat: 13.0827, lng: 80.2707 }, aqi: 72, dataSource: ['nasa', 'openaq'] },
];

const generateForecast = (baseAqi: number, sinFactor: number, randFactor: number) => 
  Array.from({ length: 49 }, (_, i) => ({ 
    hour: i, 
    predicted: Math.round(baseAqi + (Math.sin(i / 8) * sinFactor) + (Math.random() * randFactor - randFactor/2)),
    observed: i < 6 ? Math.round(baseAqi + (Math.sin(i / 8) * sinFactor) + (Math.random() * (randFactor/2) - randFactor/4)) : null 
  }));

export const forecastData: Record<string, {hour: number; predicted: number; observed: number | null}[]> = {
  'delhi': generateForecast(152, 20, 10),
  'mumbai': generateForecast(85, 15, 8),
  'bangalore': generateForecast(60, 10, 6),
  'kolkata': generateForecast(110, 18, 9),
  'chennai': generateForecast(72, 12, 7),
};
