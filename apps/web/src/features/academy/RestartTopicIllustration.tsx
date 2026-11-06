import { useId, type ReactNode } from 'react';

type Locale = 'es' | 'en';
type RestartSlug =
  | 'kick-off-procedure'
  | 'dropped-ball-procedure'
  | 'ball-in-and-out-of-play'
  | 'throw-in-procedure'
  | 'goal-kick-procedure'
  | 'corner-kick-procedure';

const color = {
  background: '#102b27', panel: '#1b4037', line: '#9fc9ad', text: '#f1f4e6', muted: '#c3d8c8',
  attack: '#b5e5ab', defence: '#eea188', accent: '#e2d772', ball: '#fff8e9',
};

const descriptions: Record<RestartSlug, Record<Locale, { title: string; detail: string }>> = {
  'kick-off-procedure': {
    es: { title: 'Posiciones y momento del saque inicial', detail: 'Vista superior: balón inmóvil en el centro, jugadores en su propia mitad excepto quien ejecuta y rivales fuera del círculo de 9,15 metros. El balón entra en juego al patearlo y moverlo claramente.' },
    en: { title: 'Kick-off positions and live-ball moment', detail: 'Top view: stationary ball on the centre mark, players in their own half except the kicker, and opponents outside the 9.15-metre centre circle. The ball is in play when kicked and clearly moves.' },
  },
  'dropped-ball-procedure': {
    es: { title: 'Balón a tierra y contacto con el suelo', detail: 'Un destinatario espera debajo del balón que cae; los demás jugadores permanecen a cuatro metros o más hasta que toque el suelo. En el área penal recibe el guardameta defensor; fuera de ella, el jugador del equipo al que corresponda según la posesión o el último toque.' },
    en: { title: 'Dropped ball and ground contact', detail: 'One recipient waits under the falling ball; all other players stay at least four metres away until it touches the ground. Inside the penalty area the defending goalkeeper receives it; elsewhere, a player from the team entitled by possession or last touch.' },
  },
  'ball-in-and-out-of-play': {
    es: { title: 'El balón debe cruzar toda la línea', detail: 'Dos vistas superiores de la misma línea: a la izquierda, parte del balón aún se superpone con la línea y sigue en juego; a la derecha, el balón ya cruzó por completo y está fuera.' },
    en: { title: 'The whole ball must cross the whole line', detail: 'Two top views of the same boundary: on the left, part of the ball still overlaps the line and remains in play; on the right, the ball has wholly crossed and is out.' },
  },
  'throw-in-procedure': {
    es: { title: 'Postura y distancia del saque de banda', detail: 'Vista lateral esquemática: el ejecutante lanza con ambas manos desde detrás y por encima de la cabeza, con parte de cada pie sobre la línea o fuera del campo. Los adversarios guardan al menos dos metros del punto de saque; el balón entra en juego al entrar al campo.' },
    en: { title: 'Throw-in posture and distance', detail: 'Schematic side view: the thrower uses both hands from behind and over the head, with part of each foot on the touchline or outside the field. Opponents stay at least two metres from the throw-in point; the ball is in play when it enters the field.' },
  },
  'goal-kick-procedure': {
    es: { title: 'Área de meta y momento del saque de meta', detail: 'Vista superior: el balón inmóvil se ubica en el área de meta, dentro del área penal más amplia. Los adversarios esperan fuera del área penal; al patear y mover claramente el balón, este entra en juego aunque permanezca dentro del área penal.' },
    en: { title: 'Goal area and goal-kick live-ball moment', detail: 'Top view: the stationary ball is placed in the goal area inside the larger penalty area. Opponents wait outside the penalty area; once the ball is kicked and clearly moves, it is in play even inside the penalty area.' },
  },
  'corner-kick-procedure': {
    es: { title: 'Área de esquina, banderín y distancia', detail: 'Vista superior de la esquina: el balón está en el área de esquina junto al banderín, que permanece en su lugar. El rival debe estar al menos a 9,15 metros del arco de esquina. El balón entra en juego al patearlo y moverlo claramente.' },
    en: { title: 'Corner area, flag and distance', detail: 'Top view of the corner: the ball sits inside the corner area beside the flag, which stays in place. An opponent must remain at least 9.15 metres from the corner arc. The ball is in play when kicked and clearly moves.' },
  },
};

function Label({ x, y, children, anchor = 'start', size = 17, fill = color.text }: {
  x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; size?: number; fill?: string;
}) {
  return <text x={x} y={y} fill={fill} fontFamily="Source Sans 3, Segoe UI, sans-serif" fontSize={size} fontWeight="700" textAnchor={anchor}>{children}</text>;
}

function Ball({ x, y, r = 12 }: { x: number; y: number; r?: number }) {
  return <g><circle cx={x} cy={y} r={r} fill={color.ball} stroke={color.background} strokeWidth="2" /><circle cx={x} cy={y} r={r * .3} fill={color.background} /></g>;
}

function Player({ x, y, fill = color.attack, letter }: { x: number; y: number; fill?: string; letter?: string }) {
  return <g><circle cx={x} cy={y} r="15" fill={fill} stroke={color.background} strokeWidth="3" />{letter && <Label x={x} y={y + 5} anchor="middle" size={13} fill={color.background}>{letter}</Label>}</g>;
}

function Arrow({ x1, y1, x2, y2, fill = color.accent, dashed = false }: {
  x1: number; y1: number; x2: number; y2: number; fill?: string; dashed?: boolean;
}) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const left = [x2 - 12 * Math.cos(angle - Math.PI / 6), y2 - 12 * Math.sin(angle - Math.PI / 6)];
  const right = [x2 - 12 * Math.cos(angle + Math.PI / 6), y2 - 12 * Math.sin(angle + Math.PI / 6)];
  return <g fill="none" stroke={fill} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d={`M${x1} ${y1}L${x2} ${y2}`} strokeDasharray={dashed ? '6 6' : undefined} />
    <path d={`M${left[0]} ${left[1]}L${x2} ${y2}L${right[0]} ${right[1]}`} />
  </g>;
}

function KickOff({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={40} y={53} size={22}>{es ? 'Antes del saque inicial' : 'Before the kick-off'}</Label>
    <rect x="95" y="83" width="530" height="234" rx="4" fill={color.panel} stroke={color.line} strokeWidth="2" />
    <path d="M360 83v234" stroke={color.line} strokeWidth="2" />
    <circle cx="360" cy="200" r="67" fill="none" stroke={color.accent} strokeWidth="2" />
    <Player x={257} y={144} /><Player x={252} y={257} /><Player x={342} y={200} letter="E" />
    <Player x={493} y={143} fill={color.defence} /><Player x={493} y={257} fill={color.defence} />
    <Ball x={360} y={200} />
    <Label x={190} y={112} size={14}>{es ? 'Mitad propia' : 'Own half'}</Label>
    <Label x={525} y={112} size={14} anchor="middle">{es ? 'Rivales' : 'Opponents'}</Label>
    <Label x={421} y={155} size={15} fill={color.accent}>≥ 9,15 m</Label>
    <path d="M379 176l17-17" stroke={color.accent} strokeWidth="2" />
    <Label x={360} y={351} anchor="middle" size={16}>{es ? 'Balón quieto en el centro → patada y movimiento claro → en juego' : 'Stationary at centre → kicked and clearly moves → in play'}</Label>
  </>;
}

function DroppedBall({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={40} y={53} size={22}>{es ? 'Esperar el contacto con el suelo' : 'Wait for ground contact'}</Label>
    <rect x="88" y="82" width="544" height="233" rx="6" fill={color.panel} stroke={color.line} strokeWidth="2" />
    <circle cx="350" cy="222" r="94" fill="none" stroke={color.accent} strokeWidth="2" strokeDasharray="7 7" />
    <Player x={350} y={258} letter="R" />
    <Player x={221} y={171} fill={color.defence} /><Player x={489} y={257} fill={color.defence} />
    <Ball x={350} y={142} />
    <Arrow x1={350} y1={162} x2={350} y2={202} />
    <path d="M321 279h58" stroke={color.line} strokeWidth="3" />
    <Label x={454} y={141} size={15} fill={color.accent}>{es ? 'Otros ≥ 4 m' : 'Others ≥ 4 m'}</Label>
    <path d="M450 148l-47 28" stroke={color.accent} strokeWidth="2" />
    <Label x={128} y={293} size={14}>{es ? 'R: destinatario' : 'R: recipient'}</Label>
    <Label x={360} y={348} anchor="middle" size={15}>{es ? 'Área penal: guardameta defensor · fuera: equipo con derecho' : 'Penalty area: defending keeper · elsewhere: entitled team'}</Label>
    <Label x={360} y={373} anchor="middle" size={14} fill={color.muted}>{es ? 'En juego al tocar el suelo' : 'In play on ground contact'}</Label>
  </>;
}

function Boundary({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={40} y={53} size={22}>{es ? 'Toda la pelota · toda la línea' : 'Whole ball · whole line'}</Label>
    {[40, 370].map((x) => <g key={x}>
      <rect x={x} y="86" width="310" height="224" rx="7" fill={color.panel} stroke={color.line} strokeWidth="2" />
      <rect x={x + 173} y="106" width="11" height="184" fill={color.text} />
    </g>)}
    <Ball x={226} y={196} r={31} /><Ball x={590} y={196} r={31} />
    <Label x={126} y={126} anchor="middle" size={14}>{es ? 'Campo' : 'Field'}</Label>
    <Label x={455} y={126} anchor="middle" size={14}>{es ? 'Campo' : 'Field'}</Label>
    <Label x={196} y={346} anchor="middle" size={18} fill={color.attack}>{es ? 'Aún en juego' : 'Still in play'}</Label>
    <Label x={525} y={346} anchor="middle" size={18} fill={color.defence}>{es ? 'Fuera de juego' : 'Out of play'}</Label>
    <Label x={360} y={376} anchor="middle" size={14} fill={color.muted}>{es ? 'La línea pertenece al terreno · mismo criterio por aire o suelo' : 'The line belongs to the field · same test in air or on ground'}</Label>
  </>;
}

function ThrowIn({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={40} y={53} size={22}>{es ? 'Saque desde donde salió el balón' : 'Throw from where the ball left'}</Label>
    <rect x="485" y="89" width="194" height="236" fill={color.panel} />
    <path d="M485 89v236" stroke={color.text} strokeWidth="8" />
    <Label x={578} y={112} anchor="middle" size={14}>{es ? 'Campo' : 'Field'}</Label>
    <circle cx="345" cy="147" r="22" fill={color.attack} />
    <path d="M345 169v86m0 0-46 49m46-49 95 49M335 303h-43m112 0h52" fill="none" stroke={color.attack} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M337 193q-44-72 1-105m23 105q45-75-1-105" fill="none" stroke={color.attack} strokeWidth="11" strokeLinecap="round" />
    <Ball x={350} y={77} r={16} />
    <Arrow x1={381} y1={91} x2={518} y2={170} dashed />
    <Player x={625} y={238} fill={color.defence} />
    <path d="M488 269h118m-118-7v14m118-14v14" stroke={color.accent} strokeWidth="2" />
    <Label x={550} y={257} anchor="middle" size={14} fill={color.accent}>≥ 2 m</Label>
    <Label x={101} y={156} size={15}>{es ? 'Dos manos' : 'Both hands'}</Label>
    <Label x={101} y={178} size={15}>{es ? 'por encima' : 'over head'}</Label>
    <Label x={40} y={348} size={15}>{es ? 'Cada pie: en la línea o fuera' : 'Each foot: on line or outside'}</Label>
    <Label x={40} y={375} size={14} fill={color.muted}>{es ? 'En juego al entrar en el campo' : 'In play on entering the field'}</Label>
  </>;
}

function GoalKick({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={40} y={53} size={22}>{es ? 'El área de meta está dentro del área penal' : 'The goal area is inside the penalty area'}</Label>
    <rect x="92" y="87" width="542" height="229" rx="3" fill={color.panel} stroke={color.line} strokeWidth="2" />
    <path d="M92 112h280v179H92M92 157h107v89H92" fill="none" stroke={color.text} strokeWidth="2" />
    <path d="M92 178H75v45h17" fill="none" stroke={color.accent} strokeWidth="4" />
    <Ball x={152} y={203} />
    <Arrow x1={175} y1={203} x2={262} y2={203} />
    <Player x={466} y={151} fill={color.defence} /><Player x={475} y={254} fill={color.defence} />
    <Label x={138} y={139} anchor="middle" size={14}>{es ? 'Área de meta' : 'Goal area'}</Label>
    <Label x={276} y={106} anchor="middle" size={14}>{es ? 'Área penal' : 'Penalty area'}</Label>
    <Label x={530} y={205} anchor="middle" size={15}>{es ? 'Rivales fuera' : 'Opponents outside'}</Label>
    <Label x={360} y={350} anchor="middle" size={16}>{es ? 'Patada + movimiento claro → en juego dentro del área penal' : 'Kick + clear movement → in play inside penalty area'}</Label>
  </>;
}

function CornerKick({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={40} y={53} size={22}>{es ? 'Distancia medida desde el arco' : 'Distance measured from the arc'}</Label>
    <rect x="145" y="104" width="517" height="242" fill={color.panel} />
    <path d="M145 104h517M145 104v242" stroke={color.text} strokeWidth="4" fill="none" />
    <path d="M145 143a39 39 0 0 0 39-39" stroke={color.accent} strokeWidth="3" fill="none" />
    <path d="M145 104V69m0 0 52 15-52 15" stroke={color.text} strokeWidth="4" fill={color.defence} strokeLinejoin="round" />
    <Ball x={160} y={125} r={11} />
    <Arrow x1={174} y1={141} x2={244} y2={191} />
    <Player x={487} y={240} fill={color.defence} />
    <path d="M172 132L466 228" stroke={color.accent} strokeWidth="2" strokeDasharray="7 7" />
    <Label x={351} y={173} anchor="middle" size={16} fill={color.accent}>≥ 9,15 m</Label>
    <Label x={235} y={148} size={15}>{es ? 'Arco de esquina' : 'Corner arc'}</Label>
    <path d="M229 151L183 128" stroke={color.accent} strokeWidth="2" fill="none" />
    <Label x={50} y={181} size={14}>{es ? 'Banderín' : 'Flag'}</Label>
    <Label x={360} y={373} anchor="middle" size={15} fill={color.muted}>{es ? 'Banderín fijo · en juego al patear y mover claramente' : 'Flag stays · in play when kicked and clearly moves'}</Label>
  </>;
}

const diagrams: Record<RestartSlug, (props: { locale: Locale }) => ReactNode> = {
  'kick-off-procedure': KickOff,
  'dropped-ball-procedure': DroppedBall,
  'ball-in-and-out-of-play': Boundary,
  'throw-in-procedure': ThrowIn,
  'goal-kick-procedure': GoalKick,
  'corner-kick-procedure': CornerKick,
};

/** Original RefView schematics summarising the edition-pinned 2026/27 Laws, not IFAB artwork. */
export function RestartTopicIllustration({ slug, locale }: { slug: string; locale: Locale }) {
  const id = useId();
  if (!(slug in diagrams)) return null;
  const topic = slug as RestartSlug;
  const Diagram = diagrams[topic];
  const description = descriptions[topic][locale];

  return <svg role="img" aria-labelledby={`${id}-title ${id}-description`} viewBox="0 0 720 400" preserveAspectRatio="xMidYMid meet" width="100%" xmlns="http://www.w3.org/2000/svg">
    <title id={`${id}-title`}>{description.title}</title>
    <desc id={`${id}-description`}>{description.detail}</desc>
    <rect width="720" height="400" rx="18" fill={color.background} />
    <Diagram locale={locale} />
  </svg>;
}
