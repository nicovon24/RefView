import { useId, type ReactNode } from 'react';
import { RestartTopicIllustration } from './RestartTopicIllustration';
import { OutcomeFreeKickTopicIllustration } from './OutcomeFreeKickTopicIllustration';
import { PlayersRefereeTimeTopicIllustration } from './PlayersRefereeTimeTopicIllustration';
import { FoundationOfficialsTopicIllustration } from './FoundationOfficialsTopicIllustration';

type Locale = 'es' | 'en';
type TopicSlug = 'challenge' | 'handball' | 'indirect-free-kick' | 'disciplinary-sanctions' | 'offside-position-and-involvement' | 'penalty-procedure';

const palette = {
  background: '#102b27', panel: '#1b4037', line: '#9fc9ad', text: '#f1f4e6', muted: '#c3d8c8',
  attack: '#b5e5ab', defence: '#eea188', yellow: '#e2d772', red: '#e98578', ball: '#fff8e9',
};

const descriptions: Record<TopicSlug, Record<Locale, { title: string; detail: string }>> = {
  challenge: {
    es: { title: 'Contacto y gravedad de la acción', detail: 'Esquema de tres grados de una falta en disputa: imprudente sin tarjeta, temeraria con amonestación y fuerza excesiva con expulsión. El tiro libre directo y el penal dependen del lugar de la infracción.' },
    en: { title: 'Contact and challenge severity', detail: 'Three levels of a challenge foul: careless with no card, reckless with a caution, and excessive force with a sending-off. A direct free kick or penalty depends on the offence location.' },
  },
  handball: {
    es: { title: 'Cuándo puede sancionarse una mano', detail: 'Comparación entre una mano deliberada, una posición del brazo que agranda el cuerpo de forma antinatural y un contacto con el brazo que exige evaluar el contexto. No todo contacto es infracción.' },
    en: { title: 'When handball may be penalised', detail: 'Comparison of deliberate handling, an arm position that makes the body unnaturally bigger, and arm contact that requires context. Not every contact is an offence.' },
  },
  'indirect-free-kick': {
    es: { title: 'Tiro libre indirecto y toque adicional', detail: 'El árbitro señala el tiro libre indirecto con el brazo levantado. Un remate directo a la portería rival acaba en saque de meta; otro jugador debe tocar el balón antes de que pueda marcarse gol.' },
    en: { title: 'Indirect free kick and another touch', detail: 'The referee signals an indirect free kick with a raised arm. A kick directly into the opponents’ goal results in a goal kick; another player must touch the ball before a goal can be scored.' },
  },
  'disciplinary-sanctions': {
    es: { title: 'Amonestación, expulsión y reanudación', detail: 'La tarjeta amarilla comunica una amonestación; la roja, una expulsión. Una segunda amonestación también implica expulsión. La tarjeta y la reanudación son decisiones distintas.' },
    en: { title: 'Caution, sending-off and restart', detail: 'A yellow card communicates a caution; a red card communicates a sending-off. A second caution also results in a sending-off. The card and the restart are separate decisions.' },
  },
  'offside-position-and-involvement': {
    es: { title: 'Posición y participación en fuera de juego', detail: 'Vista superior en el instante del pase hacia la derecha. El atacante A está más cerca de la línea de meta rival que el balón y el penúltimo adversario; esa posición solo se sanciona si participa activamente. El atacante B está habilitado.' },
    en: { title: 'Offside position and involvement', detail: 'Top view at the moment the ball is played to the right. Attacker A is nearer the opponents’ goal line than both the ball and the second-last opponent; that position is penalised only with active involvement. Attacker B is onside.' },
  },
  'penalty-procedure': {
    es: { title: 'Colocación antes de ejecutar un penal', detail: 'Vista superior de un penal: balón en el punto a 11 metros, guardameta entre los postes sobre la línea de meta, ejecutante identificado y los demás jugadores fuera del área penal, detrás del punto y al menos a 9,15 metros.' },
    en: { title: 'Positions before a penalty kick', detail: 'Top view of a penalty: ball on the mark 11 metres from goal, goalkeeper between the posts on the goal line, identified kicker, and other players outside the penalty area, behind the mark and at least 9.15 metres away.' },
  },
};

function Label({ x, y, children, anchor = 'start', size = 17, color = palette.text }: {
  x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; size?: number; color?: string;
}) {
  return <text x={x} y={y} fill={color} fontFamily="Source Sans 3, Segoe UI, sans-serif" fontSize={size} fontWeight="700" textAnchor={anchor}>{children}</text>;
}

function Ball({ x, y, r = 10 }: { x: number; y: number; r?: number }) {
  return <g><circle cx={x} cy={y} r={r} fill={palette.ball} stroke={palette.background} strokeWidth="2" /><circle cx={x} cy={y} r={r * .34} fill={palette.background} /></g>;
}

function Player({ x, y, label, color = palette.attack }: { x: number; y: number; label?: string; color?: string }) {
  return <g><circle cx={x} cy={y} r="17" fill={color} stroke={palette.background} strokeWidth="3" />{label && <Label x={x} y={y + 6} anchor="middle" size={15} color={palette.background}>{label}</Label>}</g>;
}

function Arrow({ x1, y1, x2, y2, color = palette.attack, dashed = false }: {
  x1: number; y1: number; x2: number; y2: number; color?: string; dashed?: boolean;
}) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const ax = x2 - 14 * Math.cos(angle - Math.PI / 6);
  const ay = y2 - 14 * Math.sin(angle - Math.PI / 6);
  const bx = x2 - 14 * Math.cos(angle + Math.PI / 6);
  const by = y2 - 14 * Math.sin(angle + Math.PI / 6);
  return <g fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed ? '7 7' : undefined}>
    <path d={`M${x1} ${y1}L${x2} ${y2}`} /><path d={`M${ax} ${ay}L${x2} ${y2} ${bx} ${by}`} strokeDasharray="none" />
  </g>;
}

function Challenge({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  const rows = [
    { y: 116, severity: es ? 'Imprudente' : 'Careless', outcome: es ? 'Sin tarjeta' : 'No card', color: palette.attack },
    { y: 205, severity: es ? 'Temeraria' : 'Reckless', outcome: es ? 'Amarilla' : 'Yellow card', color: palette.yellow },
    { y: 294, severity: es ? 'Fuerza excesiva' : 'Excessive force', outcome: es ? 'Roja' : 'Red card', color: palette.red },
  ];
  return <>
    <Label x={42} y={60} size={22}>{es ? 'Gravedad de la falta' : 'Severity of the foul'}</Label>
    {rows.map((row) => <g key={row.severity}>
      <rect x="40" y={row.y - 31} width="640" height="70" rx="7" fill={palette.panel} stroke="#47715b" />
      <circle cx="75" cy={row.y + 4} r="15" fill={row.color} />
      <Label x={108} y={row.y + 11} size={19}>{row.severity}</Label>
      <Arrow x1={340} y1={row.y + 4} x2={450} y2={row.y + 4} color={row.color} />
      <Label x={474} y={row.y + 11} color={row.color} size={19}>{row.outcome}</Label>
    </g>)}
    <Label x={360} y={376} anchor="middle" size={15} color={palette.muted}>{es ? 'Reanudación: libre directo; penal si corresponde por el lugar' : 'Restart: direct free kick; penalty if the location requires it'}</Label>
  </>;
}

function Handball({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  const panels = [
    { x: 36, label: es ? 'Movimiento deliberado' : 'Deliberate movement', note: es ? 'Hacia el balón' : 'Towards the ball', arm: 'M120 216L167 171', ball: [179, 166] },
    { x: 268, label: es ? 'Cuerpo ampliado' : 'Bigger body', note: es ? 'Sin justificación' : 'Not justified', arm: 'M353 216L410 216', ball: [424, 216] },
    { x: 500, label: es ? 'Contacto ≠ falta' : 'Contact ≠ offence', note: es ? 'Evaluar contexto' : 'Assess context', arm: 'M586 216L606 261', ball: [609, 273] },
  ];
  return <>
    <Label x={40} y={57} size={22}>{es ? 'La posición y la acción importan' : 'Position and action matter'}</Label>
    {panels.map((p, i) => <g key={p.x}>
      <rect x={p.x} y="82" width="216" height="248" rx="8" fill={palette.panel} stroke="#47715b" />
      <Label x={p.x + 108} y={119} anchor="middle" size={16}>{p.label}</Label>
      <circle cx={p.x + 84} cy="170" r="18" fill={palette.attack} />
      <path d={`M${p.x + 84} 188v78m-26-42 26-8`} stroke={palette.attack} strokeWidth="12" strokeLinecap="round" fill="none" />
      {i === 0 && <><path d="M120 216L158 218" stroke={palette.muted} strokeWidth="7" strokeDasharray="4 5" strokeLinecap="round" /><Arrow x1={157} y1={204} x2={169} y2={181} color={palette.yellow} /></>}
      <path d={p.arm} stroke={palette.attack} strokeWidth="12" strokeLinecap="round" fill="none" />
      <Ball x={p.ball[0]} y={p.ball[1]} r={11} />
      {i < 2 && <circle cx={p.ball[0]} cy={p.ball[1]} r="19" fill="none" stroke={palette.yellow} strokeWidth="2" strokeDasharray="4 4" />}
      <Label x={p.x + 108} y={303} anchor="middle" size={15} color={palette.muted}>{p.note}</Label>
    </g>)}
    <Label x={360} y={376} anchor="middle" size={15} color={palette.muted}>{es ? 'El dibujo orienta; la decisión depende de los hechos' : 'The diagram guides; the decision depends on the facts'}</Label>
  </>;
}

function IndirectFreeKick({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={40} y={55} size={22}>{es ? 'Brazo levantado: tiro libre indirecto' : 'Raised arm: indirect free kick'}</Label>
    <g stroke={palette.line} strokeWidth="5" strokeLinecap="round"><circle cx="82" cy="166" r="15" fill={palette.line} stroke="none" /><path d="M82 184v70m0-55 42-90m-42 96-30 26" /></g>
    <Label x={40} y={285} size={15} color={palette.muted}>{es ? 'Señal arbitral' : 'Referee signal'}</Label>
    <Ball x={245} y={193} r={13} />
    <Arrow x1={270} y1={193} x2={405} y2={193} />
    <Player x={435} y={193} label="2" />
    <Arrow x1={461} y1={193} x2={584} y2={193} />
    <path d="M615 131h52v124h-52" fill="none" stroke={palette.text} strokeWidth="5" />
    <Label x={245} y={157} anchor="middle" size={16}>{es ? 'Ejecución' : 'Kick'}</Label>
    <Label x={435} y={157} anchor="middle" size={16}>{es ? 'Otro toque' : 'Another touch'}</Label>
    <Label x={642} y={285} anchor="middle" size={16}>{es ? 'Gol posible' : 'Goal possible'}</Label>
    <path d="M235 323h405" stroke={palette.line} strokeWidth="2" strokeDasharray="6 8" />
    <Label x={360} y={354} anchor="middle" size={16} color={palette.muted}>{es ? 'Directo a la portería rival → saque de meta' : 'Directly into opponents’ goal → goal kick'}</Label>
  </>;
}

function Disciplinary({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={40} y={58} size={22}>{es ? 'Decisiones disciplinarias' : 'Disciplinary decisions'}</Label>
    <rect x="40" y="89" width="300" height="208" rx="8" fill={palette.panel} stroke="#47715b" />
    <rect x="380" y="89" width="300" height="208" rx="8" fill={palette.panel} stroke="#47715b" />
    <rect x="88" y="122" width="64" height="88" rx="4" fill={palette.yellow} />
    <rect x="427" y="122" width="64" height="88" rx="4" fill={palette.red} />
    <Label x={178} y={155} size={19}>{es ? 'Amarilla' : 'Yellow'}</Label>
    <Label x={178} y={183} size={16} color={palette.muted}>{es ? 'Amonestación' : 'Caution'}</Label>
    <Label x={518} y={155} size={19}>{es ? 'Roja' : 'Red'}</Label>
    <Label x={518} y={183} size={16} color={palette.muted}>{es ? 'Expulsión' : 'Sending-off'}</Label>
    <Label x={65} y={265} size={15} color={palette.muted}>{es ? 'También: segunda amarilla → roja' : 'Also: second caution → red'}</Label>
    <Label x={405} y={265} size={15} color={palette.muted}>{es ? 'El jugador debe abandonar el juego' : 'Player must leave the match'}</Label>
    <path d="M70 331h580" stroke={palette.line} strokeWidth="2" />
    <Label x={360} y={359} anchor="middle" size={17}>{es ? 'La reanudación se decide por la infracción y su lugar' : 'The restart depends on the offence and its location'}</Label>
  </>;
}

function Offside({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={36} y={47} size={21}>{es ? 'Instante en que el compañero juega el balón' : 'Moment a team-mate plays the ball'}</Label>
    <rect x="40" y="70" width="640" height="254" fill="#194236" stroke={palette.text} strokeWidth="3" />
    <path d="M360 70v254M650 70v254" stroke={palette.line} strokeWidth="2" />
    <path d="M430 70v254" stroke={palette.yellow} strokeWidth="3" strokeDasharray="8 6" />
    <path d="M680 142h-35v111h35" fill="none" stroke={palette.text} strokeWidth="4" />
    <Player x={182} y={197} label="P" /><Ball x={206} y={197} r={8} />
    <Player x={347} y={247} label="B" />
    <Player x={510} y={159} label="A" />
    <Player x={430} y={250} label="D" color={palette.defence} />
    <Player x={581} y={256} label="D" color={palette.defence} />
    <Arrow x1={224} y1={189} x2={479} y2={164} dashed />
    <Label x={430} y={94} anchor="middle" size={14} color={palette.yellow}>{es ? 'Penúltimo rival' : 'Second-last opponent'}</Label>
    <Label x={500} y={132} anchor="middle" size={15}>{es ? 'Posición' : 'Position'}</Label>
    <Label x={347} y={286} anchor="middle" size={15}>{es ? 'Habilitado' : 'Onside'}</Label>
    <Label x={360} y={365} anchor="middle" size={16} color={palette.muted}>{es ? 'A: posición sola ≠ infracción; evaluar participación activa' : 'A: position alone ≠ offence; assess active involvement'}</Label>
  </>;
}

function Penalty({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={36} y={46} size={21}>{es ? 'Antes del silbato: ubicación de cada jugador' : 'Before the signal: each player’s position'}</Label>
    <rect x="40" y="66" width="640" height="284" fill="#194236" stroke={palette.text} strokeWidth="3" />
    <path d="M198 66v132h324V66" fill="none" stroke={palette.text} strokeWidth="3" />
    <path d="M330 66v17h60V66" fill="none" stroke={palette.text} strokeWidth="3" />
    <path d="M302 198A73 73 0 0 0 418 198" fill="none" stroke={palette.line} strokeWidth="2" />
    <Player x={360} y={66} label="G" color={palette.defence} />
    <Ball x={360} y={154} r={9} />
    <Player x={360} y={199} label="K" />
    <Player x={191} y={287} label="O" /><Player x={533} y={287} label="O" color={palette.defence} />
    <path d="M102 67v87m-7-87h14m-14 87h14" stroke={palette.yellow} strokeWidth="2" />
    <Label x={117} y={119} size={15} color={palette.yellow}>11 m</Label>
    <Label x={430} y={95} size={15}>{es ? 'Guardameta' : 'Goalkeeper'}</Label>
    <Label x={390} y={161} size={15}>{es ? 'Punto penal' : 'Penalty mark'}</Label>
    <Label x={391} y={204} size={15}>{es ? 'Ejecutante' : 'Kicker'}</Label>
    <Label x={360} y={333} anchor="middle" size={15} color={palette.muted}>{es ? 'Otros: fuera del área, detrás del punto y a ≥ 9,15 m' : 'Others: outside area, behind mark and ≥ 9.15 m away'}</Label>
    <Label x={360} y={382} anchor="middle" size={15} color={palette.muted}>{es ? 'Esquema; distancias indicadas según la Regla 14' : 'Schematic; distances follow Law 14'}</Label>
  </>;
}

const diagrams: Record<TopicSlug, (props: { locale: Locale }) => ReactNode> = {
  challenge: Challenge,
  handball: Handball,
  'indirect-free-kick': IndirectFreeKick,
  'disciplinary-sanctions': Disciplinary,
  'offside-position-and-involvement': Offside,
  'penalty-procedure': Penalty,
};

const outcomeFreeKickSlugs = new Set([
  'goal-and-match-result', 'penalty-shoot-out', 'free-kick-procedure', 'free-kick-distance-and-wall',
]);

const playersRefereeTimeSlugs = new Set([
  'substitution-procedure', 'players-and-extra-persons',
  'referee-authority-and-advantage', 'injuries-and-return-to-play',
  'periods-and-intervals', 'added-time-and-period-end',
]);

const foundationOfficialsSlugs = new Set([
  'field-markings-and-areas', 'goals-and-field-safety',
  'ball-specifications-and-checks', 'defective-ball-and-replacement',
  'compulsory-and-safe-equipment', 'equipment-offences-and-reentry',
  'assistant-referee-duties', 'fourth-official-and-video-officials',
]);

/** Original schematic diagrams for the static RefView Academy topic guides. */
export function TopicIllustration({ slug, locale }: { slug: string; locale: Locale }) {
  const id = useId();
  if (outcomeFreeKickSlugs.has(slug)) return <OutcomeFreeKickTopicIllustration slug={slug} locale={locale} />;
  if (playersRefereeTimeSlugs.has(slug)) return <PlayersRefereeTimeTopicIllustration slug={slug} locale={locale} />;
  if (foundationOfficialsSlugs.has(slug)) return <FoundationOfficialsTopicIllustration slug={slug} locale={locale} />;
  if (!(slug in diagrams)) return <RestartTopicIllustration slug={slug} locale={locale} />;
  const topic = slug as TopicSlug;
  const Diagram = diagrams[topic];
  const description = descriptions[topic][locale];

  return <svg role="img" aria-labelledby={`${id}-title ${id}-description`} viewBox="0 0 720 400" preserveAspectRatio="xMidYMid meet" width="100%" xmlns="http://www.w3.org/2000/svg">
    <title id={`${id}-title`}>{description.title}</title>
    <desc id={`${id}-description`}>{description.detail}</desc>
    <rect width="720" height="400" rx="18" fill={palette.background} />
    <Diagram locale={locale} />
  </svg>;
}
