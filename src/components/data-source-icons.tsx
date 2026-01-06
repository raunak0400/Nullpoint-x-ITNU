import type { SVGProps } from 'react';

const NasaIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const OpenAqIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c1.356 0 2.648-.217 3.863-.636M12 21c-1.356 0-2.648-.217-3.863-.636M3.284 14.253C2.473 13.263 2 12.025 2 10.5c0-1.525.473-2.763 1.284-3.753m17.432 7.506c.811-1 .284-2.238.284-3.753 0-1.525-.473-2.763-1.284-3.753M12 3c-1.356 0-2.648.217-3.863.636M12 3c1.356 0 2.648.217 3.863.636" />
  </svg>
);

const CpcbIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const TempoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const DataSourceIcons: Record<string, React.FC<SVGProps<SVGSVGElement>>> = {
  nasa: NasaIcon,
  openaq: OpenAqIcon,
  cpcb: CpcbIcon,
  tempo: TempoIcon,
};
