'use client';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { VsIcon } from './VsIcon';

export function CustomScrollbar() {
  return (
    <div className="flex flex-col items-center justify-between w-12 h-screen bg-black py-4">
      <button className="p-2 text-white/50 hover:text-white">
        <ChevronUp size={24} />
      </button>
      <div className="h-full w-4 bg-white/10 rounded-full flex items-center py-2">
        <div className="h-full w-full bg-stone-500/50 rounded-full relative">
            <div className="w-full h-1/4 bg-stone-400 rounded-full absolute top-0" />
        </div>
      </div>
      <div className='relative'>
        <button className="p-2 text-white/50 hover:text-white">
            <ChevronDown size={24} />
        </button>
        <div className="absolute bottom-10 -left-1.5">
            <VsIcon />
        </div>
      </div>
    </div>
  );
}
