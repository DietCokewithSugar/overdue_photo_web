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

export const ArrowLeftIcon = createIcon(
  <>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </>
);

export const DotsVerticalIcon = createIcon(
  <>
    <circle cx={12} cy={5} r={1.5} />
    <circle cx={12} cy={12} r={1.5} />
    <circle cx={12} cy={19} r={1.5} />
  </>
);

export const DownloadIcon = createIcon(
  <>
    <path d="M12 3v12" />
    <path d="m7 12 5 5 5-5" />
    <path d="M5 19h14" />
  </>
);

export const TrashIcon = createIcon(
  <>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </>
);

export const HeartIcon = createIcon(
  <path
    d="M12 20s-6.3-3.35-8.28-6.32C1 10.07 3.02 6 6.66 6c1.78 0 3.11 1.01 3.97 2.24C11.23 7.01 12.56 6 14.34 6c3.64 0 5.66 4.07 2.94 7.68C18.3 16.65 12 20 12 20Z"
    fill="currentColor"
    stroke="currentColor"
  />
);

export const MessageCircleIcon = createIcon(
  <>
    <path d="M21 11.5a8.38 8.38 0 0 1-1 3.8 8.5 8.5 0 0 1-7.5 4.7 8.38 8.38 0 0 1-3.8-1l-4.7 1 1-4.7A8.38 8.38 0 0 1 4.5 11 8.5 8.5 0 0 1 9.2 3.5 8.38 8.38 0 0 1 13 2.5h1a8.5 8.5 0 0 1 8 9Z" />
    <path d="M8 11h8" />
    <path d="M8 15h5" />
  </>
);

export const ShareIcon = createIcon(
  <>
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
    <path d="m16 6-4-4-4 4" />
    <path d="M12 2v14" />
  </>
);
