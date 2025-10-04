
'use client';

import { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import {
  AppWindow,
  Brain,
  CloudSun,
  Gauge,
  Globe as GlobeIcon,
  HelpCircle,
  History,
  Map as MapIcon,
  Settings,
  Siren,
} from 'lucide-react';

type TempUnit = 'C' | 'F';

export const locations = [
  { name: 'Berlin', country: 'Germany' },
  { name: 'New York', country: 'USA' },
  { name: 'Tokyo', country: 'Japan' },
  { name: 'London', country: 'UK' },
  { name: 'Paris', country: 'France' },
];

type SharedState = {
  unit: TempUnit;
  setUnit: (unit: TempUnit) => void;
  is24Hour: boolean;
  setIs24Hour: (is24Hour: boolean) => void;
  selectedLocation: typeof locations[0];
  setSelectedLocation: (location: typeof locations[0]) => void;
};

export const SharedStateContext = createContext<SharedState | null>(null);

export const useSharedState = () => {
  const context = useContext(SharedStateContext);
  if (!context) {
    throw new Error('useSharedState must be used within a Providers component');
  }
  return context;
}

export function Sidebar() {
  const { setIs24Hour, is24Hour } = useSharedState();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const pathname = usePathname();
  
  const navItems = [
    { icon: <Gauge />, label: 'Live Air Quality', href: '/' },
    { icon: <CloudSun />, label: 'Weather Info', href: '/weather-info' },
    { icon: <Brain />, label: 'Future Air Prediction', href: '/future-air-prediction' },
    { icon: <Siren />, label: 'Air Alerts', href: '/air-alerts' },
    { icon: <MapIcon />, label: 'Easy Map View', href: '/map-view' },
    { icon: <History />, label: 'Past Air Data', href: '/past-air-data' },
  ];

  const bottomNavItems = [
    { icon: <HelpCircle />, label: 'Help', action: () => {} },
    { icon: <Settings />, label: 'Settings', action: () => setIsSettingsOpen(true) },
    { icon: <AppWindow />, label: 'App', action: () => {} },
  ];
  

  return (
    <>
      <aside className="w-64 bg-card/50 backdrop-blur-sm border-r border-white/10 p-6 flex flex-col justify-between rounded-r-[2rem]">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <GlobeIcon className="text-primary" size={32} />
            <h1 className="text-2xl font-bold">AuroraAir</h1>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} passHref>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-foreground data-[active=true]:text-foreground data-[active=true]:bg-primary/10 text-base py-6" 
                  data-active={pathname === item.href}
                  title={item.label}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>
        </div>
        <div className="space-y-2">
            {bottomNavItems.map((item, index) => (
              <Button key={index} variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground text-base py-6" title={item.label} onClick={item.action}>
                {item.icon}
                <span>{item.label}</span>
              </Button>
            ))}
        </div>
      </aside>
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} is24Hour={is24Hour} setIs24Hour={setIs24Hour} />
    </>
  );
}

function SettingsDialog({ open, onOpenChange, is24Hour, setIs24Hour }: { open: boolean, onOpenChange: (open: boolean) => void, is24Hour: boolean, setIs24Hour: (is24Hour: boolean) => void }) {
  const { theme, setTheme } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your experience.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div>
            <Label className="text-base">Appearance</Label>
            <RadioGroup
              defaultValue={theme}
              onValueChange={setTheme}
              className="grid max-w-md grid-cols-3 gap-8 pt-2"
            >
              <Label className="[&:has([data-state=checked])>div]:border-primary">
                <RadioGroupItem value="light" className="sr-only" />
                <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                  <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                    <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  Light
                </span>
              </Label>
              <Label className="[&:has([data-state=checked])>div]:border-primary">
                <RadioGroupItem value="dark" className="sr-only" />
                <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent">
                  <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                    <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  Dark
                </span>
              </Label>
               <Label className="[&:has([data-state=checked])>div]:border-primary">
                <RadioGroupItem value="default" className="sr-only" />
                <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent">
                  <div className="space-y-2 rounded-sm bg-[#0D0F13] p-2">
                    <div className="space-y-2 rounded-md bg-[#212326] p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-muted" />
                      <div className="h-2 w-[100px] rounded-lg bg-muted" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-[#212326] p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-muted" />
                      <div className="h-2 w-[100px] rounded-lg bg-muted" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-[#212326] p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-muted" />
                      <div className="h-2 w-[100px] rounded-lg bg-muted" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  Default
                </span>
              </Label>
            </RadioGroup>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="time-format" className="flex flex-col gap-1">
              <span>24-Hour Time</span>
              <span className="font-normal text-muted-foreground">
                Display time in 24-hour format.
              </span>
            </Label>
            <Switch
              id="time-format"
              checked={is24Hour}
              onCheckedChange={setIs24Hour}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
