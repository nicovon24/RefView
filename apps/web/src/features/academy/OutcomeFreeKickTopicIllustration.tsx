import { useId, type ReactNode } from 'react';

type Locale = 'es' | 'en';
type TopicSlug = 'goal-and-match-result' | 'penalty-shoot-out' | 'free-kick-procedure' | 'free-kick-distance-and-wall';

const ink = {
  background: '#102b27', panel: '#1b4037', pitch: '#194236', line: '#9fc9ad', text: '#f1f4e6',
  muted: '#c3d8c8', attack: '#b5e5ab', defence: '#eea188', accent: '#e2d772', ball: '#fff8e9',
};

const descriptions: Record<TopicSlug, Record<Locale, { title: string; detail: string }>> = {
  'goal-and-match-result': {
    es: { title: 'Cuándo se concede un gol y cómo se decide el resultado', detail: 'La vista superior muestra todo el balón más allá de toda la línea de meta, entre los postes. La vista frontal lo muestra por debajo del travesaño. El gol solo es válido si el equipo que marca no cometió una infracción. El resultado del partido compara los goles válidos de cada equipo.' },
    en: { title: 'When a goal counts and how the match result is decided', detail: 'The top view shows the whole ball beyond the whole goal line, between the posts. The front view shows it below the crossbar. A goal counts only if the scoring team committed no offence. The match result compares each team’s valid goals.' },
  },
  'penalty-shoot-out': {
    es: { title: 'Resultado del partido y tanda de penales separados', detail: 'El partido ilustrativo terminó uno a uno. En la tanda, ambos equipos ejecutaron cuatro penales: A convirtió cuatro y B convirtió dos. Con un turno inicial pendiente para cada equipo, B ya no puede alcanzar a A, por lo que la tanda termina anticipadamente. Si sigue empatada tras los turnos iniciales, se compara el mismo número de ejecuciones por equipo.' },
    en: { title: 'Match result and penalty shoot-out kept separate', detail: 'The illustrative match ended one all. In the shoot-out, both teams have taken four kicks: A scored four and B scored two. With one initial kick left for each, B cannot catch A, so the shoot-out ends early. If still level after the initial kicks, compare the same number of kicks per team.' },
  },
  'free-kick-procedure': {
    es: { title: 'Tiro libre directo e indirecto: señal, puesta en juego y gol', detail: 'El balón debe estar inmóvil y entra en juego al ser pateado y moverse claramente. Un tiro libre directo puede entrar directamente en la meta rival; uno indirecto necesita tocar a otro jugador para que pueda marcarse gol. Si el indirecto entra directamente en la meta rival, corresponde saque de meta. Si cualquiera entra directamente en la propia meta, corresponde tiro de esquina. El árbitro mantiene el brazo levantado hasta que el balón toque a otro jugador, salga del juego o sea evidente que no puede marcarse un gol directamente. Si omite la señal y el balón entra directamente en la meta rival, se repite el tiro libre indirecto.' },
    en: { title: 'Direct and indirect free kicks: signal, ball in play and goal', detail: 'The ball must be stationary and is in play when kicked and clearly moves. A direct free kick may enter the opponents’ goal directly; an indirect free kick needs another player’s touch for a goal to count. An indirect kick directly into the opponents’ goal gives a goal kick. Either type directly into the team’s own goal gives a corner kick. The referee keeps an arm raised until the ball touches another player, goes out of play or it is clear that a goal cannot be scored directly. If the signal is omitted and the ball enters the opponents’ goal directly, the indirect free kick is retaken.' },
  },
  'free-kick-distance-and-wall': {
    es: { title: 'Distancia de los rivales y separación de la barrera', detail: 'Esquema en vista superior: los rivales deben estar al menos a 9,15 metros del balón, salvo excepciones de la Regla 13.2. Cuando tres o más defensores forman una barrera, los atacantes deben permanecer al menos a un metro de ella hasta que el balón esté en juego. Un tiro libre rápido y los tiros dentro del área penal o del área de meta tienen condiciones adicionales.' },
    en: { title: 'Opponent distance and separation from the wall', detail: 'Schematic top view: opponents must stay at least 9.15 metres from the ball, subject to Law 13.2 exceptions. When three or more defenders form a wall, attackers must remain at least one metre from it until the ball is in play. A quick free kick and kicks inside the penalty area or goal area have additional conditions.' },
  },
};

function Label({ x, y, children, anchor = 'start', size = 16, fill = ink.text }: {
  x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; size?: number; fill?: string;
}) {
  return <text x={x} y={y} textAnchor={anchor} fill={fill} fontFamily="Source Sans 3, Segoe UI, sans-serif" fontSize={size} fontWeight="700">{children}</text>;
}

function Ball({ x, y, r = 12 }: { x: number; y: number; r?: number }) {
  return <g><circle cx={x} cy={y} r={r} fill={ink.ball} stroke={ink.background} strokeWidth="2" /><circle cx={x} cy={y} r={r * .3} fill={ink.background} /></g>;
}

function Player({ x, y, fill = ink.defence }: { x: number; y: number; fill?: string }) {
  return <circle cx={x} cy={y} r="15" fill={fill} stroke={ink.background} strokeWidth="3" />;
}

function GoalAndMatchResult({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={36} y={50} size={22}>{es ? 'Gol: cruzar toda la línea dentro de la meta' : 'Goal: wholly across the line inside the goal'}</Label>
    <rect x="36" y="76" width="310" height="246" rx="8" fill={ink.panel} stroke={ink.line} />
    <rect x="374" y="76" width="310" height="246" rx="8" fill={ink.panel} stroke={ink.line} />
    <Label x={191} y={108} anchor="middle" size={16}>{es ? 'Vista superior' : 'Top view'}</Label>
    <path d="M166 130v161" stroke={ink.text} strokeWidth="9" />
    <path d="M166 146h99v130h-99" stroke={ink.line} strokeWidth="3" fill="none" />
    <circle cx="166" cy="146" r="8" fill={ink.text} /><circle cx="166" cy="276" r="8" fill={ink.text} />
    <Ball x={199} y={211} r={12} />
    <Label x={64} y={207} size={14}>{es ? 'Campo' : 'Field'}</Label>
    <Label x={270} y={209} anchor="middle" size={14} fill={ink.accent}>{es ? 'Dentro' : 'Inside'}</Label>
    <Label x={190} y={303} anchor="middle" size={13} fill={ink.muted}>{es ? 'Balón completo más allá de la línea' : 'Whole ball beyond the line'}</Label>
    <Label x={529} y={108} anchor="middle" size={16}>{es ? 'Vista frontal' : 'Front view'}</Label>
    <path d="M425 258V135h207v123" fill="none" stroke={ink.text} strokeWidth="9" strokeLinejoin="round" />
    <path d="M414 270h229" stroke={ink.line} strokeWidth="3" />
    <Ball x={529} y={208} r={12} />
    <Label x={529} y={303} anchor="middle" size={13} fill={ink.muted}>{es ? 'Entre postes · bajo travesaño' : 'Between posts · below crossbar'}</Label>
    <Label x={360} y={355} anchor="middle" size={15}>{es ? 'Sin infracción del equipo que marca → gol válido' : 'No offence by scoring team → valid goal'}</Label>
    <Label x={360} y={379} anchor="middle" size={14} fill={ink.muted}>{es ? 'Resultado del partido = goles válidos de cada equipo' : 'Match result = each team’s valid goals'}</Label>
  </>;
}

function PenaltyShootOut({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={36} y={49} size={22}>{es ? 'La tanda decide el ganador por separado' : 'The shoot-out decides the winner separately'}</Label>
    <rect x="36" y="78" width="648" height="75" rx="8" fill={ink.panel} stroke={ink.line} />
    <Label x={64} y={107} size={15} fill={ink.muted}>{es ? 'PARTIDO' : 'MATCH'}</Label>
    <Label x={360} y={133} anchor="middle" size={26}>A  1 : 1  B</Label>
    <rect x="36" y="171" width="648" height="159" rx="8" fill={ink.panel} stroke={ink.line} />
    <Label x={64} y={202} size={15} fill={ink.muted}>{es ? 'TANDA' : 'SHOOT-OUT'}</Label>
    <Label x={120} y={240} size={19}>A</Label><Label x={120} y={293} size={19}>B</Label>
    {[0, 1, 2, 3].map((index) => <g key={index}>
      <circle cx={236 + index * 86} cy="233" r="20" fill={ink.attack} /><Label x={236 + index * 86} y={240} anchor="middle" size={21} fill={ink.background}>✓</Label>
      <circle cx={236 + index * 86} cy="286" r="20" fill={index < 2 ? ink.attack : ink.defence} /><Label x={236 + index * 86} y={293} anchor="middle" size={21} fill={ink.background}>{index < 2 ? '✓' : '×'}</Label>
    </g>)}
    <Label x={611} y={240} anchor="middle" size={21}>4</Label><Label x={611} y={293} anchor="middle" size={21}>2</Label>
    <Label x={360} y={358} anchor="middle" size={15}>{es ? '4 turnos cada uno; queda 1 → B ya no alcanza a A' : '4 kicks each; 1 left → B cannot catch A'}</Label>
    <Label x={360} y={381} anchor="middle" size={14} fill={ink.muted}>{es ? 'Si persiste el empate: comparar igual número de tiros' : 'If still level: compare equal numbers of kicks'}</Label>
  </>;
}

function FreeKickProcedure({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={36} y={48} size={22}>{es ? 'Tiro libre: tipo y destino del balón' : 'Free kick: type and ball destination'}</Label>
    <rect x="36" y="73" width="648" height="248" rx="8" fill={ink.panel} stroke={ink.line} />
    <path d="M36 131h648M360 73v248" stroke={ink.line} strokeWidth="2" />
    <Label x={198} y={107} anchor="middle" size={19}>{es ? 'Directo' : 'Direct'}</Label>
    <Label x={522} y={107} anchor="middle" size={19}>{es ? 'Indirecto' : 'Indirect'}</Label>
    <Ball x={96} y={192} /><path d="M122 192h102m-13-11 13 11-13 11" fill="none" stroke={ink.attack} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M258 160h43v64h-43" fill="none" stroke={ink.text} strokeWidth="4" />
    <Label x={198} y={261} anchor="middle" size={15}>{es ? 'Directo a meta rival → gol' : 'Direct to opponents’ goal → goal'}</Label>
    <g stroke={ink.accent} strokeWidth="5" strokeLinecap="round" fill="none"><circle cx="404" cy="171" r="11" fill={ink.accent} stroke="none" /><path d="M404 185v51m0-39 28-52m-28 55-20 21" /></g>
    <Ball x={479} y={192} r={10} /><path d="M497 192h83m-13-11 13 11-13 11" fill="none" stroke={ink.attack} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M611 160h42v64h-42" fill="none" stroke={ink.text} strokeWidth="4" />
    <Label x={522} y={261} anchor="middle" size={14}>{es ? 'Sin otro toque → saque de meta' : 'No other touch → goal kick'}</Label>
    <Label x={522} y={297} anchor="middle" size={13} fill={ink.accent}>{es ? 'Gol posible tras otro toque' : 'Goal possible after another touch'}</Label>
    <Label x={360} y={349} anchor="middle" size={15}>{es ? 'Balón inmóvil → pateado y se mueve claramente → en juego' : 'Stationary ball → kicked and clearly moves → in play'}</Label>
    <Label x={360} y={377} anchor="middle" size={14} fill={ink.muted}>{es ? 'Cualquiera directo a propia meta → córner' : 'Either type directly into own goal → corner kick'}</Label>
  </>;
}

function FreeKickDistanceAndWall({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={36} y={48} size={22}>{es ? 'Rivales y barrera de tres o más' : 'Opponents and a wall of three or more'}</Label>
    <rect x="36" y="72" width="648" height="259" rx="8" fill={ink.pitch} stroke={ink.line} />
    <Ball x={133} y={194} r={12} />
    <Label x={133} y={160} anchor="middle" size={14}>{es ? 'Balón' : 'Ball'}</Label>
    <path d="M155 277h291m-291-8v16m291-16v16" stroke={ink.accent} strokeWidth="2" />
    <Label x={301} y={266} anchor="middle" size={17} fill={ink.accent}>≥ 9,15 m</Label>
    <Player x={467} y={145} /><Player x={467} y={194} /><Player x={467} y={243} />
    <Label x={530} y={153} size={15}>{es ? 'Barrera' : 'Wall'}</Label>
    <Label x={530} y={175} size={13} fill={ink.muted}>{es ? '≥ 3 defensores' : '≥ 3 defenders'}</Label>
    <Player x={376} y={194} fill={ink.attack} />
    <path d="M395 214h53m-53-7v14m53-14v14" stroke={ink.accent} strokeWidth="2" />
    <Label x={421} y={242} anchor="middle" size={15} fill={ink.accent}>≥ 1 m</Label>
    <Label x={311} y={129} anchor="middle" size={13} fill={ink.attack}>{es ? 'Atacante' : 'Attacker'}</Label>
    <Label x={360} y={356} anchor="middle" size={14}>{es ? 'Tiro rápido: posible intercepción ≠ impedir deliberadamente' : 'Quick kick: possible interception ≠ deliberate prevention'}</Label>
    <Label x={360} y={379} anchor="middle" size={13} fill={ink.muted}>{es ? 'Excepciones de área penal, área de meta y línea de gol: ver Regla 13.2' : 'Penalty area, goal area and goal-line exceptions: see Law 13.2'}</Label>
  </>;
}

const diagrams: Record<TopicSlug, (props: { locale: Locale }) => ReactNode> = {
  'goal-and-match-result': GoalAndMatchResult,
  'penalty-shoot-out': PenaltyShootOut,
  'free-kick-procedure': FreeKickProcedure,
  'free-kick-distance-and-wall': FreeKickDistanceAndWall,
};

/** Original RefView teaching diagrams for the edition-pinned 2026/27 Laws; no IFAB artwork. */
export function OutcomeFreeKickTopicIllustration({ slug, locale }: { slug: string; locale: Locale }) {
  const id = useId();
  if (!Object.hasOwn(diagrams, slug)) return null;
  const topic = slug as TopicSlug;
  const Diagram = diagrams[topic];
  const description = descriptions[topic][locale];

  return <svg role="img" aria-labelledby={`${id}-title ${id}-description`} viewBox="0 0 720 400" preserveAspectRatio="xMidYMid meet" width="100%" xmlns="http://www.w3.org/2000/svg">
    <title id={`${id}-title`}>{description.title}</title>
    <desc id={`${id}-description`}>{description.detail}</desc>
    <rect width="720" height="400" rx="18" fill={ink.background} />
    <Diagram locale={locale} />
  </svg>;
}
