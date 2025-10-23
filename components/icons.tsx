import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

const createIcon = (path: JSX.Element) => ({ size = 24, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {path}
  </svg>
);

export const HomeIcon = createIcon(
  <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-6v-6h-4v6H4a1 1 0 0 1-1-1z" />
);

export const TrophyIcon = createIcon(
  <>
    <path d="M8 21h8" />
    <path d="M9 17h6" />
    <path d="M12 17v4" />
    <path d="M18 4h3v2a4 4 0 0 1-3 3.87" />
    <path d="M6 4H3v2a4 4 0 0 0 3 3.87" />
    <path d="M17 4a5 5 0 0 1-10 0" />
  </>
);

export const PlusIcon = createIcon(<path d="M12 5v14M5 12h14" />);

export const UserIcon = createIcon(
  <>
    <path d="M4 21v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1" />
    <circle cx={12} cy={7} r={4} />
  </>
);

export const ImageIcon = createIcon(
  <>
    <rect x={3} y={5} width={18} height={14} rx={2} />
    <circle cx={8.5} cy={10.5} r={1.5} />
    <path d="m21 16-3.5-3.5a1 1 0 0 0-1.4 0L11 17" />
  </>
);
