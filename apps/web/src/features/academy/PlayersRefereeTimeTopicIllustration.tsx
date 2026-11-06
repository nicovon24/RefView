import { useId, type ReactNode } from 'react';

type Locale = 'es' | 'en';
type TopicSlug =
  | 'substitution-procedure'
  | 'players-and-extra-persons'
  | 'referee-authority-and-advantage'
  | 'injuries-and-return-to-play'
  | 'periods-and-intervals'
  | 'added-time-and-period-end';

const ink = {
  background: '#102b27', panel: '#1b4037', line: '#9fc9ad', text: '#f1f4e6',
  muted: '#c3d8c8', player: '#b5e5ab', other: '#eea188', accent: '#e2d772',
};

const descriptions: Record<TopicSlug, Record<Locale, { title: string; detail: string }>> = {
  'substitution-procedure': {
    es: { title: 'Secuencia de una sustitución', detail: 'Primero sale el jugador sustituido. Después, con la autorización del árbitro, el sustituto entra por la línea media; la sustitución se completa cuando entra. El protocolo de 2026/27 prevé diez segundos para salir solo cuando se activa y, si hay demora sin excepción, una espera de un minuto completo con el balón en juego antes de entrar. Las excepciones de seguridad y tratamiento siguen vigentes.' },
    en: { title: 'Substitution sequence', detail: 'The replaced player leaves first. With the referee’s permission, the substitute then enters at the halfway line; the substitution is complete on entry. The 2026/27 protocol allows ten seconds to leave only when triggered and, for a delay without an exception, requires one full minute with the ball in play before entry. Safety and treatment exceptions still apply.' },
  },
  'players-and-extra-persons': {
    es: { title: 'Condición de la persona y posible interferencia', detail: 'Primero se identifica si la persona adicional es jugador, sustituto, sustituido, expulsado u oficial y cuándo entró. Su presencia y su interferencia son preguntas distintas. La decisión sobre detener, reanudar o conceder un gol depende de esa condición, de la interferencia y del momento; no toda presencia invalida un gol ni exige balón a tierra.' },
    en: { title: 'Person status and possible interference', detail: 'First identify whether an extra person is a player, substitute, substituted or sent-off player, or official, and when they entered. Presence and interference are separate questions. Whether to stop, restart or award a goal depends on status, interference and timing; mere presence does not always cancel a goal or require a dropped ball.' },
  },
  'referee-authority-and-advantage': {
    es: { title: 'Autoridad arbitral y decisión de ventaja', detail: 'Ante una infracción, el árbitro valora si la ventaja beneficia al equipo perjudicado. Si se concreta, continúa el juego; si no se concreta durante los pocos segundos siguientes, sanciona la infracción original. No hay un reloj fijo para la ventaja. La posibilidad de cambiar una decisión, la reanudación y el momento de una medida disciplinaria tienen límites distintos.' },
    en: { title: 'Referee authority and advantage decision', detail: 'After an offence, the referee judges whether advantage benefits the offended team. If it develops, play continues; if it does not develop over the next few seconds, the original offence is penalised. There is no fixed advantage clock. Changing a decision, restarting play and applying discipline have distinct limits.' },
  },
  'injuries-and-return-to-play': {
    es: { title: 'Atención de lesiones y regreso al juego', detail: 'El árbitro evalúa la gravedad y detiene el juego por lesión grave. Atención, hemorragia y salida del campo tienen reglas propias. Cuando se activa el protocolo de 2026/27, la atención fuera del campo puede exigir un minuto completo de juego antes del regreso, salvo excepciones. El jugador solo vuelve con permiso del árbitro y desde un lugar que depende de si el balón está en juego.' },
    en: { title: 'Injury response and return to play', detail: 'The referee assesses severity and stops play for a serious injury. Treatment, bleeding and leaving the field have separate rules. When the 2026/27 protocol is triggered, off-field treatment may require a full minute of play before return, subject to exceptions. The player returns only with referee permission, from a position depending on whether the ball is in play.' },
  },
  'periods-and-intervals': {
    es: { title: 'Períodos iguales, descanso y posible prórroga', detail: 'Un partido normal tiene dos tiempos iguales de 45 minutos, sujetos a las variaciones permitidas. Entre ellos hay un descanso que no excede quince minutos. La prórroga solo existe cuando la competición la autoriza y consta de dos períodos adicionales iguales. La suspensión o abandono del partido requiere una decisión distinta de una interrupción prolongada.' },
    en: { title: 'Equal periods, interval and possible extra time', detail: 'A normal match has two equal 45-minute halves, subject to permitted variations. A half-time interval of no more than fifteen minutes separates them. Extra time applies only when authorised by competition rules and has two additional equal periods. Abandoning a match is a separate decision from a long stoppage.' },
  },
  'added-time-and-period-end': {
    es: { title: 'Tiempo añadido mínimo y finalización de un penal', detail: 'El árbitro añade el tiempo perdido por causas previstas. El tiempo anunciado es un mínimo: puede aumentarse, nunca reducirse. Un error de cronometraje del primer tiempo no se traslada al segundo. Si un penal debe ejecutarse o repetirse al final de un período, ese período se prolonga separadamente hasta que el tiro se complete.' },
    en: { title: 'Minimum added time and penalty completion', detail: 'The referee allows for time lost for listed causes. Announced added time is a minimum: it may increase but cannot be reduced. A first-half timekeeping error is not transferred to the second half. If a penalty must be taken or retaken at the end of a period, that period is separately extended until the kick is completed.' },
  },
};

function Label({ x, y, children, anchor = 'start', size = 16, fill = ink.text }: {
  x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; size?: number; fill?: string;
}) {
  return <text x={x} y={y} textAnchor={anchor} fill={fill} fontFamily="Source Sans 3, Segoe UI, sans-serif" fontSize={size} fontWeight="700">{children}</text>;
}

function Panel({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  return <rect x={x} y={y} width={width} height={height} rx="8" fill={ink.panel} stroke={ink.line} />;
}

function Arrow({ x1, y1, x2, y2, fill = ink.accent }: {
  x1: number; y1: number; x2: number; y2: number; fill?: string;
}) {
  const arrowBaseX = x2 + (x2 >= x1 ? -11 : 11);
  return <g fill="none" stroke={fill} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d={`M${x1} ${y1}L${x2} ${y2}`} />
    <path d={`M${arrowBaseX} ${y2 - 7}L${x2} ${y2}L${arrowBaseX} ${y2 + 7}`} />
  </g>;
}

function Person({ x, y, fill = ink.player }: { x: number; y: number; fill?: string }) {
  return <g fill="none" stroke={fill} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx={x} cy={y - 26} r="10" fill={fill} stroke="none" />
    <path d={`M${x} ${y - 13}v33m-17-20h34m-17 20-14 24m14-24 14 24`} />
  </g>;
}

function Substitution({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={36} y={48} size={22}>{es ? 'Primero sale · después entra' : 'Exit first · entry follows'}</Label>
    <Panel x={36} y={72} width={648} height={225} />
    <path d="M360 98v175" stroke={ink.line} strokeWidth="3" strokeDasharray="8 7" />
    <Label x={214} y={106} anchor="middle" size={15}>{es ? 'CAMPO' : 'FIELD'}</Label>
    <Label x={518} y={106} anchor="middle" size={15}>{es ? 'FUERA DEL CAMPO' : 'OUTSIDE FIELD'}</Label>
    <Person x={245} y={181} /><Arrow x1={277} y1={156} x2={407} y2={156} />
    <Person x={494} y={181} fill={ink.other} /><Arrow x1={462} y1={235} x2={313} y2={235} />
    <Label x={188} y={263} anchor="middle" size={15}>{es ? '1. Sale' : '1. Leaves'}</Label>
    <Label x={527} y={263} anchor="middle" size={15}>{es ? '2. Entra con permiso' : '2. Enters with permission'}</Label>
    <Label x={360} y={329} anchor="middle" size={15} fill={ink.accent}>{es ? 'Salida por límite cercano · ingreso en línea media' : 'Leave at nearest boundary · enter at halfway line'}</Label>
    <Label x={360} y={361} anchor="middle" size={14} fill={ink.muted}>{es ? 'Demora sin excepción → espera 1 min de juego' : 'Late exit without exception → wait 1 live minute'}</Label>
  </>;
}

function ExtraPersons({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={36} y={48} size={22}>{es ? 'Identificar antes de decidir' : 'Identify before deciding'}</Label>
    <Panel x={36} y={76} width={300} height={210} /><Panel x={384} y={76} width={300} height={210} />
    <Label x={186} y={108} anchor="middle" size={16} fill={ink.accent}>{es ? '1. Condición' : '1. Status'}</Label>
    <Person x={99} y={184} /><Person x={186} y={184} fill={ink.other} /><Person x={273} y={184} fill={ink.accent} />
    <Label x={186} y={265} anchor="middle" size={14}>{es ? 'Jugador · suplente · oficial…' : 'Player · substitute · official…'}</Label>
    <Arrow x1={345} y1={181} x2={374} y2={181} />
    <Label x={534} y={108} anchor="middle" size={16} fill={ink.accent}>{es ? '2. ¿Interfiere?' : '2. Interference?'}</Label>
    <path d="M533 135v30m0 0-76 37m76-37 76 37" fill="none" stroke={ink.line} strokeWidth="3" />
    <Label x={451} y={238} anchor="middle" size={15}>{es ? 'Sí' : 'Yes'}</Label>
    <Label x={615} y={238} anchor="middle" size={15}>{es ? 'No' : 'No'}</Label>
    <Label x={360} y={327} anchor="middle" size={15}>{es ? 'Condición + momento + interferencia → decisión' : 'Status + timing + interference → decision'}</Label>
    <Label x={360} y={358} anchor="middle" size={14} fill={ink.muted}>{es ? 'Presencia sola ≠ gol anulado ni balón a tierra automático' : 'Presence alone ≠ automatic goal cancellation or dropped ball'}</Label>
  </>;
}

function Advantage({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={36} y={48} size={22}>{es ? 'Ventaja: valorar el beneficio' : 'Advantage: judge the benefit'}</Label>
    <Panel x={36} y={74} width={648} height={244} />
    <Label x={360} y={112} anchor="middle" size={17} fill={ink.accent}>{es ? 'Infracción → ¿beneficia seguir?' : 'Offence → benefit from play?'}</Label>
    <path d="M360 129v26m0 0-184 51m184-51 184 51" fill="none" stroke={ink.line} strokeWidth="3" />
    <circle cx="176" cy="211" r="7" fill={ink.player} /><circle cx="544" cy="211" r="7" fill={ink.other} />
    <Label x={176} y={248} anchor="middle" size={16}>{es ? 'Se concreta' : 'Develops'}</Label>
    <Label x={544} y={248} anchor="middle" size={16}>{es ? 'No se concreta' : 'Does not develop'}</Label>
    <Label x={176} y={284} anchor="middle" size={15} fill={ink.player}>{es ? 'Seguir jugando' : 'Play continues'}</Label>
    <Label x={544} y={284} anchor="middle" size={15} fill={ink.other}>{es ? 'Sancionar infracción' : 'Penalise offence'}</Label>
    <Label x={360} y={349} anchor="middle" size={15}>{es ? 'Evaluación durante pocos segundos · sin reloj fijo' : 'Assess over a few seconds · no fixed clock'}</Label>
    <Label x={360} y={374} anchor="middle" size={13} fill={ink.muted}>{es ? 'Disciplina y límite para cambiar decisiones: reglas distintas' : 'Discipline and decision-change limits: separate rules'}</Label>
  </>;
}

function Injury({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={36} y={48} size={22}>{es ? 'Lesión: evaluar, atender, volver' : 'Injury: assess, treat, return'}</Label>
    <Panel x={36} y={78} width={200} height={212} /><Panel x={260} y={78} width={200} height={212} /><Panel x={484} y={78} width={200} height={212} />
    <Label x={136} y={109} anchor="middle" size={16} fill={ink.accent}>{es ? '1. Evaluar' : '1. Assess'}</Label>
    <Person x={136} y={177} />
    <Label x={136} y={263} anchor="middle" size={14}>{es ? 'Grave → detener' : 'Serious → stop'}</Label>
    <Arrow x1={237} y1={182} x2={258} y2={182} />
    <Label x={360} y={109} anchor="middle" size={16} fill={ink.accent}>{es ? '2. Atender' : '2. Treat'}</Label>
    <path d="M330 183h60m-30-30v60" stroke={ink.other} strokeWidth="8" strokeLinecap="round" />
    <Label x={360} y={263} anchor="middle" size={14}>{es ? 'Salida si corresponde' : 'Leave if required'}</Label>
    <Arrow x1={461} y1={182} x2={482} y2={182} />
    <Label x={584} y={109} anchor="middle" size={16} fill={ink.accent}>{es ? '3. Volver' : '3. Return'}</Label>
    <Person x={584} y={177} fill={ink.other} />
    <Label x={584} y={263} anchor="middle" size={14}>{es ? 'Solo con permiso' : 'Permission required'}</Label>
    <Label x={360} y={327} anchor="middle" size={15}>{es ? 'Protocolo activado → 1 min de juego fuera, con excepciones' : 'If protocol applies → 1 live minute off, with exceptions'}</Label>
    <Label x={360} y={359} anchor="middle" size={14} fill={ink.muted}>{es ? 'Lugar de regreso según el estado del balón' : 'Return position depends on ball state'}</Label>
  </>;
}

function Periods({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={36} y={48} size={22}>{es ? 'Dos tiempos iguales' : 'Two equal halves'}</Label>
    <Panel x={36} y={77} width={648} height={177} />
    <rect x="65" y="124" width="205" height="67" rx="6" fill={ink.player} />
    <rect x="275" y="124" width="170" height="67" rx="6" fill={ink.panel} stroke={ink.accent} strokeWidth="2" />
    <rect x="450" y="124" width="205" height="67" rx="6" fill={ink.player} />
    <Label x={167} y={164} anchor="middle" size={21} fill={ink.background}>45 min</Label>
    <Label x={360} y={164} anchor="middle" size={16}>{es ? 'Descanso' : 'Interval'}</Label>
    <Label x={552} y={164} anchor="middle" size={21} fill={ink.background}>45 min</Label>
    <Label x={360} y={224} anchor="middle" size={14} fill={ink.muted}>{es ? 'Descanso ≤ 15 min · variaciones permitidas' : 'Interval ≤ 15 min · permitted variations'}</Label>
    <path d="M360 255v25" stroke={ink.accent} strokeWidth="3" strokeDasharray="5 5" />
    <Panel x={113} y={284} width={494} height={72} />
    <Label x={360} y={313} anchor="middle" size={15} fill={ink.accent}>{es ? 'Solo si la competición autoriza prórroga' : 'Extra time only if competition authorises it'}</Label>
    <Label x={360} y={341} anchor="middle" size={15}>{es ? 'Dos períodos adicionales iguales' : 'Two additional equal periods'}</Label>
    <Label x={360} y={382} anchor="middle" size={13} fill={ink.muted}>{es ? 'Abandono ≠ interrupción prolongada' : 'Abandonment ≠ prolonged stoppage'}</Label>
  </>;
}

function AddedTime({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Label x={36} y={48} size={22}>{es ? 'Tiempo añadido y final del período' : 'Added time and period end'}</Label>
    <Panel x={36} y={75} width={648} height={148} />
    <Label x={69} y={111} size={15} fill={ink.muted}>{es ? 'PÉRDIDAS' : 'TIME LOST'}</Label>
    <Label x={69} y={150} size={15}>{es ? 'Cambios · lesiones · demoras…' : 'Substitutions · injuries · delays…'}</Label>
    <Arrow x1={306} y1={152} x2={344} y2={152} />
    <Label x={495} y={137} anchor="middle" size={17} fill={ink.accent}>{es ? 'Mínimo anunciado' : 'Announced minimum'}</Label>
    <Label x={495} y={178} anchor="middle" size={17}>{es ? 'Puede aumentar ↑' : 'May increase ↑'}</Label>
    <Label x={360} y={208} anchor="middle" size={13} fill={ink.muted}>{es ? 'No reducir · no trasladar errores entre tiempos' : 'Never reduce · no error transfer between halves'}</Label>
    <Panel x={36} y={245} width={648} height={110} />
    <circle cx="93" cy="299" r="19" fill={ink.other} />
    <circle cx="93" cy="299" r="8" fill={ink.background} />
    <Arrow x1={128} y1={300} x2={174} y2={300} />
    <Label x={199} y={291} size={16} fill={ink.accent}>{es ? 'Penal pendiente o repetido' : 'Pending or retaken penalty'}</Label>
    <Label x={199} y={324} size={15}>{es ? 'Período extendido hasta completar el tiro' : 'Period extended until kick is complete'}</Label>
    <Label x={360} y={381} anchor="middle" size={13} fill={ink.muted}>{es ? 'La extensión por penal es una regla separada' : 'Penalty completion is a separate extension'}</Label>
  </>;
}

const diagrams: Record<TopicSlug, (props: { locale: Locale }) => ReactNode> = {
  'substitution-procedure': Substitution,
  'players-and-extra-persons': ExtraPersons,
  'referee-authority-and-advantage': Advantage,
  'injuries-and-return-to-play': Injury,
  'periods-and-intervals': Periods,
  'added-time-and-period-end': AddedTime,
};

/** Original RefView diagrams for the edition-pinned 2026/27 Laws; no IFAB artwork. */
export function PlayersRefereeTimeTopicIllustration({ slug, locale }: { slug: string; locale: Locale }) {
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
