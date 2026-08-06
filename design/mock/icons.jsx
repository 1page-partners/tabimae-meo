/* Icon set — stroke-based, Notion/lucide flavour. Each takes no props (uses currentColor). */
const Icon = ({ d, children, fill, vb = 24, sw = 2 }) => (
  <svg viewBox={`0 0 ${vb} ${vb}`} fill={fill || 'none'} stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

const IconHome = () => <Icon><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V9.5" /></Icon>;
const IconStar = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
  </svg>
);
const IconTemplate = () => <Icon><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></Icon>;
const IconEdit = () => <Icon><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Icon>;
const IconChat = () => <Icon><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 21l1.1-4A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" /></Icon>;
const IconGear = () => <Icon><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 2.6h.1A1.6 1.6 0 0 0 9 1.1V1a2 2 0 0 1 4 0v.1A1.6 1.6 0 0 0 15 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></Icon>;
const IconSearch = () => <Icon><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>;
const IconTrendUp = () => <Icon><path d="M3 17l6-6 4 4 8-8" /><path d="M17 7h4v4" /></Icon>;
const IconTarget = () => <Icon><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></Icon>;
const IconEye = () => <Icon><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></Icon>;
const IconArrowUp = () => <Icon sw={2.4}><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></Icon>;
const IconArrowDown = () => <Icon sw={2.4}><path d="M12 5v14" /><path d="m6 13 6 6 6-6" /></Icon>;
const IconChevL = () => <Icon sw={2.2}><path d="m15 18-6-6 6-6" /></Icon>;
const IconChevR = () => <Icon sw={2.2}><path d="m9 18 6-6-6-6" /></Icon>;
const IconCopy = () => <Icon><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></Icon>;
const IconCheck = () => <Icon sw={2.4}><path d="M20 6 9 17l-5-5" /></Icon>;
const IconSparkle = () => <Icon><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6.3 6.3 2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" /></Icon>;
const IconMenu = () => <Icon sw={2.2}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>;
const IconLogout = () => <Icon><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></Icon>;
const IconExternal = () => <Icon><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></Icon>;
const IconSave = () => <Icon><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></Icon>;
const IconReply = () => <Icon><path d="M9 17l-5-5 5-5" /><path d="M4 12h11a5 5 0 0 1 5 5v2" /></Icon>;
const IconClose = () => <Icon sw={2.2}><path d="M18 6 6 18M6 6l12 12" /></Icon>;
const IconRefresh = () => <Icon><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v5h-5" /></Icon>;
const IconSun = () => <Icon><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></Icon>;
const IconList = () => <Icon><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none" /><circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none" /></Icon>;

Object.assign(window, {
  IconHome, IconStar, IconTemplate, IconEdit, IconChat, IconGear, IconSearch,
  IconTrendUp, IconTarget, IconEye, IconArrowUp, IconArrowDown, IconChevL, IconChevR,
  IconCopy, IconCheck, IconSparkle, IconMenu, IconLogout, IconExternal, IconSave,
  IconReply, IconClose, IconRefresh, IconSun, IconList,
});
