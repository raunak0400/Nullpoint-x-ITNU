'use client';

import { MapLayout } from '@/components/layout/map-layout';
import { Map } from '@/components/map';

export default function MapViewPage() {
  return (
    <MapLayout>
      <div className="h-full w-full">
        <Map showFilters={true} />
      </div>
    </MapLayout>
  );
}
