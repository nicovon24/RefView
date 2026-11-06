type EngagementKind = 'agree' | 'disagree' | 'comments';

export function EngagementIcon({ kind }: { kind: EngagementKind }) {
  const shared = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  if (kind === 'comments') {
    return <svg {...shared}><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8.4 8.4 0 0 1-3.4-.7L4 20l1.5-4.2A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8.5 11.5h7" /></svg>;
  }

  return <svg {...shared} style={kind === 'disagree' ? { transform: 'rotate(180deg)' } : undefined}>
    <path d="M7 10v10H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3Z" />
    <path d="M7 10 11.2 3.5a1.7 1.7 0 0 1 3 1.2L13.6 9H19a2 2 0 0 1 2 2.4l-1.5 7A2 2 0 0 1 17.5 20H7" />
  </svg>;
}
