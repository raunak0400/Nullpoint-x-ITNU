
'use client';

import { PageWrapper } from '@/components/layout/page-wrapper';
import { Map } from '@/components/map';

export default function MapViewPage() {
  return (
    <PageWrapper>
      <div className="h-full w-full rounded-2xl overflow-hidden">
        <Map showFilters={true} />
      </div>
    </PageWrapper>
  );
}
