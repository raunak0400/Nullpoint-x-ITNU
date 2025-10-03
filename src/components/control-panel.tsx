"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { City } from '@/lib/data';
import { explainForecastFactors } from '@/ai/flows/explain-forecast-factors';
import { useToast } from '@/hooks/use-toast';
import { Loader, WandSparkles } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface ControlPanelProps {
  selectedCity: City | null;
  time: number;
  onTimeChange: (time: number) => void;
  dataSource: 'nasa' | 'combined';
  onDataSourceChange: (source: 'nasa' | 'combined') => void;
  scenario: { traffic: number; industry: number; rain: number };
  onScenarioChange: (scenario: { traffic: number; industry: number; rain: number }) => void;
}

export default function ControlPanel({
  selectedCity,
  time,
  onTimeChange,
  dataSource,
  onDataSourceChange,
  scenario,
  onScenarioChange,
}: ControlPanelProps) {
  const { toast } = useToast();
  const [insights, setInsights] = React.useState<{ explanation: string; recommendations: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleExplain = async () => {
    if (!selectedCity) {
      toast({
        variant: 'destructive',
        title: 'No city selected',
        description: 'Please select a city on the globe to get insights.',
      });
      return;
    }
    setIsLoading(true);
    setInsights(null);
    try {
      const result = await explainForecastFactors({
        city: selectedCity.name,
        dateTime: new Date(Date.now() + time * 60 * 60 * 1000).toISOString(),
      });
      setInsights(result);
    } catch (error) {
      console.error('Error getting explanation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch AI insights. Please try again.',
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="glass-card absolute top-4 right-4 md:top-8 md:right-8 w-[90%] max-w-sm p-0">
      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-transparent p-2">
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="scenario">Scenario</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <div className="p-4 pt-0">
          <TabsContent value="controls">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="time-slider" className="font-headline">Time Travel (+{time}h)</Label>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">Now</span>
                  <Slider
                    id="time-slider"
                    value={[time]}
                    onValueChange={(value) => onTimeChange(value[0])}
                    max={48}
                    step={1}
                  />
                  <span className="text-xs text-muted-foreground">+48h</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-transparent p-3 -m-3 hover:border-border transition-colors">
                <div className="space-y-0.5">
                  <Label className="font-headline">Data Source</Label>
                  <p className="text-xs text-muted-foreground">
                    Switch between NASA-only and combined ground sensor data.
                  </p>
                </div>
                <Switch
                  checked={dataSource === 'combined'}
                  onCheckedChange={(checked) => onDataSourceChange(checked ? 'combined' : 'nasa')}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="scenario">
            <div className="space-y-6">
              <div>
                <Label htmlFor="traffic-slider" className="font-headline">Traffic Density ({scenario.traffic}%)</Label>
                <Slider
                  id="traffic-slider"
                  value={[scenario.traffic]}
                  onValueChange={(v) => onScenarioChange({ ...scenario, traffic: v[0] })}
                  max={100}
                  step={1}
                />
              </div>
              <div>
                <Label htmlFor="industry-slider" className="font-headline">Industrial Activity ({scenario.industry}%)</Label>
                <Slider
                  id="industry-slider"
                  value={[scenario.industry]}
                  onValueChange={(v) => onScenarioChange({ ...scenario, industry: v[0] })}
                  max={100}
                  step={1}
                />
              </div>
              <div>
                <Label htmlFor="rain-slider" className="font-headline">Precipitation Event</Label>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">None</span>
                   <Switch
                      checked={scenario.rain > 0}
                      onCheckedChange={(checked) => onScenarioChange({ ...scenario, rain: checked ? 50 : 0 })}
                    />
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="insights">
            <div className="space-y-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <WandSparkles className="h-10 w-10 text-primary" />
                <h3 className="font-headline text-lg">Explainability</h3>
                <p className="text-sm text-muted-foreground">
                  Understand the factors driving the forecast for {selectedCity?.name || 'the selected city'}.
                </p>
              </div>
              <Button onClick={handleExplain} disabled={isLoading || !selectedCity} className="w-full">
                {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Analyzing...' : 'Explain Forecast'}
              </Button>
              {insights && (
                <ScrollArea className="h-48 w-full text-left p-3 rounded-lg border bg-background/50">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-headline text-sm font-semibold mb-1">Explanation</h4>
                      <p className="text-xs text-muted-foreground">{insights.explanation}</p>
                    </div>
                    <div>
                      <h4 className="font-headline text-sm font-semibold mb-1">Recommendations</h4>
                      <p className="text-xs text-muted-foreground">{insights.recommendations}</p>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
