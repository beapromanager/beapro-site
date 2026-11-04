/**
 * One icon family for the whole game. Vector only, never emoji.
 * 24x24 grid, 1.8 stroke where stroked, so weight reads the same everywhere.
 */

export type IconName =
  | 'ball' | 'cardYellow' | 'cardRed' | 'sub' | 'clipboard' | 'injury'
  | 'alert' | 'glove' | 'trophy' | 'coins' | 'star' | 'flame'
  | 'chevron' | 'play' | 'pause' | 'shirt' | 'mic' | 'crowd'
  | 'whistle' | 'flag' | 'target' | 'handshake' | 'calendar' | 'boot'
  | 'download' | 'share' | 'home';

const S = { stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

function body(name: IconName) {
  switch (name) {
    case 'ball':
      return (<>
        <circle cx="12" cy="12" r="8.6" {...S} />
        <path d="M12 7.6l3.4 2.5-1.3 4h-4.2l-1.3-4z" {...S} />
        <path d="M12 3.4v4.2M18.9 9.4l-3.8 1.3M16.4 17.6l-2.3-3.5M7.6 17.6l2.3-3.5M5.1 9.4l3.8 1.3" {...S} />
      </>);
    case 'cardYellow':
    case 'cardRed':
      return <rect x="7.5" y="3.6" width="9" height="16.8" rx="1.6" fill="currentColor" transform="rotate(11 12 12)" />;
    case 'sub':
      return (<>
        <path d="M8.5 20V5.5M5.5 8.5l3-3 3 3" {...S} />
        <path d="M15.5 4v14.5M18.5 15.5l-3 3-3-3" {...S} />
      </>);
    case 'clipboard':
      return (<>
        <rect x="4.8" y="5" width="14.4" height="15.2" rx="2.2" {...S} />
        <path d="M9.2 5V3.9c0-.5.4-.9.9-.9h3.8c.5 0 .9.4.9.9V5" {...S} />
        <path d="M8.6 10.5h6.8M8.6 14.4h4.4" {...S} />
      </>);
    case 'injury':
      return (<>
        <rect x="3.6" y="6.6" width="16.8" height="11.6" rx="2.6" {...S} />
        <path d="M12 10.4v4M10 12.4h4" {...S} />
      </>);
    case 'alert':
      return (<>
        <circle cx="12" cy="12" r="8.6" {...S} />
        <path d="M12 7.6v5" {...S} />
        <circle cx="12" cy="16.1" r="1.05" fill="currentColor" />
      </>);
    case 'glove':
      return <path d="M8 20.4h7.4a2.4 2.4 0 0 0 2.4-2.4v-5.6a1.9 1.9 0 0 0-3.8 0V9a1.7 1.7 0 0 0-3.4 0V6.2a1.7 1.7 0 0 0-3.4 0v6.2l-1.1-1a1.5 1.5 0 0 0-2.1 2.1l1.5 1.6A5.6 5.6 0 0 0 8 20.4z" {...S} />;
    case 'trophy':
      return (<>
        <path d="M7.4 4h9.2v4.4a4.6 4.6 0 0 1-9.2 0z" {...S} />
        <path d="M7.4 5.6H5.2a2.6 2.6 0 0 0 2.6 2.6M16.6 5.6h2.2a2.6 2.6 0 0 1-2.6 2.6" {...S} />
        <path d="M12 13v3.6M8.6 20.4h6.8" {...S} />
      </>);
    case 'coins':
      return (<>
        <ellipse cx="12" cy="7.2" rx="6.6" ry="2.8" {...S} />
        <path d="M5.4 7.2v4.4c0 1.6 3 2.8 6.6 2.8s6.6-1.2 6.6-2.8V7.2" {...S} />
        <path d="M5.4 11.8v4.4c0 1.6 3 2.8 6.6 2.8s6.6-1.2 6.6-2.8v-4.4" {...S} />
      </>);
    case 'star':
      return <path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" {...S} />;
    case 'flame':
      return <path d="M12 3.2s4.6 3.8 4.6 8.4a4.6 4.6 0 0 1-9.2 0c0-1.9.9-3.2.9-3.2s.6 1.7 1.8 1.7c1.5 0 1.9-3.4 1.9-6.9z" {...S} />;
    case 'chevron':
      return <path d="M14.4 6.6L8.8 12l5.6 5.4" {...S} />;
    case 'play':
      return <path d="M8 5.4l10 6.6-10 6.6z" fill="currentColor" />;
    case 'pause':
      return (<>
        <rect x="7.4" y="5.4" width="3.4" height="13.2" rx="1.2" fill="currentColor" />
        <rect x="13.2" y="5.4" width="3.4" height="13.2" rx="1.2" fill="currentColor" />
      </>);
    case 'shirt':
      return <path d="M8.6 3.6L4 5.8l1.2 4.4h2.2v9.4a.8.8 0 0 0 .8.8h7.6a.8.8 0 0 0 .8-.8v-9.4h2.2L20 5.8l-4.6-2.2a3.4 3.4 0 0 1-6.8 0z" {...S} />;
    case 'mic':
      return (<>
        <rect x="9.2" y="2.8" width="5.6" height="11" rx="2.8" fill="currentColor" />
        <path d="M5.8 11.4a6.2 6.2 0 0 0 12.4 0" {...S} />
        <path d="M12 17.6v3.6M9.2 21.2h5.6" {...S} />
      </>);
    case 'crowd':
      return (<>
        <circle cx="8" cy="8.6" r="2.6" {...S} />
        <circle cx="16" cy="8.6" r="2.6" {...S} />
        <path d="M3.4 19.2a4.6 4.6 0 0 1 9.2 0M11.4 19.2a4.6 4.6 0 0 1 9.2 0" {...S} />
      </>);
    case 'whistle':
      return (<>
        <path d="M13.4 8.4h6.2a1.8 1.8 0 0 1 0 3.6h-6.2" {...S} />
        <circle cx="8.6" cy="12.6" r="5.2" {...S} />
        <path d="M8.6 3.8v2.6" {...S} />
      </>);
    case 'flag':
      return (<>
        <path d="M6.2 20.4V4.2" {...S} />
        <path d="M6.2 5.2h10.4l-2 3.4 2 3.4H6.2z" {...S} />
      </>);
    case 'target':
      return (<>
        <circle cx="12" cy="12" r="8.4" {...S} />
        <circle cx="12" cy="12" r="4.2" {...S} />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      </>);
    case 'handshake':
      return (<>
        <path d="M3.6 12.4l3.2-3.2 3 1.6 2.2-2.2 5.4 5.4-2 2-1.6-1.6" {...S} />
        <path d="M13.8 16.4l-1.8-1.8M11.4 18l-1.8-1.8" {...S} />
      </>);
    case 'calendar':
      return (<>
        <rect x="3.8" y="5.4" width="16.4" height="15" rx="2.4" {...S} />
        <path d="M3.8 10h16.4M8.4 3.4v4M15.6 3.4v4" {...S} />
      </>);
    case 'boot':
      return <path d="M4 7.4h5.6l1.4 3.6 5.2 1.6a3.4 3.4 0 0 1 2.4 3.2v1.4a1.2 1.2 0 0 1-1.2 1.2H5.2A1.2 1.2 0 0 1 4 17.2z" {...S} />;

    // send to somebody: three dots joined, the usual mark for sharing
    case 'share':
      return (
        <g {...S}>
          <circle cx="6.5" cy="12" r="2.2" />
          <circle cx="17.5" cy="6.2" r="2.2" />
          <circle cx="17.5" cy="17.8" r="2.2" />
          <path d="m8.5 10.9 7-3.6M8.5 13.1l7 3.6" />
        </g>
      );
    // the game's own front page (Itzik, 4.11)
    case 'home':
      return (
        <g {...S}>
          <path d="M3.8 11.2 12 4.2l8.2 7" />
          <path d="M6.2 9.4v9.2a1.4 1.4 0 0 0 1.4 1.4h8.8a1.4 1.4 0 0 0 1.4-1.4V9.4" />
          <path d="M10 20v-5.4h4V20" />
        </g>
      );
    // onto the home screen: an arrow into a tray
    case 'download':
      return (
        <g {...S}>
          <path d="M12 3v10m0 0 3.6-3.6M12 13 8.4 9.4" />
          <path d="M4.6 15.4v2.8A2.2 2.2 0 0 0 6.8 20.4h10.4a2.2 2.2 0 0 0 2.2-2.2v-2.8" />
        </g>
      );
  }
}

export function Icon({ name, size = 20, color, className, style }: {
  name: IconName; size?: number; color?: string; className?: string; style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      className={className} aria-hidden="true" focusable="false"
      style={{ color, flex: 'none', display: 'block', ...style }}
    >
      {body(name)}
    </svg>
  );
}
