import { useId, type ReactNode } from 'react';

type Locale = 'es' | 'en';
type TopicSlug =
  | 'field-markings-and-areas'
  | 'goals-and-field-safety'
  | 'ball-specifications-and-checks'
  | 'defective-ball-and-replacement'
  | 'compulsory-and-safe-equipment'
  | 'equipment-offences-and-reentry'
  | 'assistant-referee-duties'
  | 'fourth-official-and-video-officials';

const c = {
  background: '#102b27', panel: '#1b4037', panel2: '#244d41', line: '#a8cdb3',
  text: '#f4f5e9', muted: '#c7dacb', accent: '#e8d976', good: '#b8e6ae',
  caution: '#f0a58d', ball: '#fff9eb',
};

const descriptions: Record<TopicSlug, Record<Locale, { title: string; detail: string }>> = {
  'field-markings-and-areas': {
    es: { title: 'Líneas y áreas del terreno', detail: 'Vista superior esquemática de área penal, área de meta y punto penal. Una marca señala un contacto sobre la línea del área penal: la línea forma parte del área que delimita. La posición del balón no decide dónde se produjo la infracción.' },
    en: { title: 'Field lines and marked areas', detail: 'Schematic top view of the penalty area, goal area and penalty mark. A marker shows contact on the penalty-area line: the line belongs to the area it bounds. Ball position does not decide where the offence occurred.' },
  },
  'goals-and-field-safety': {
    es: { title: 'Medidas y seguridad de la portería', detail: 'Alzado esquemático de la portería con 7,32 metros entre postes y 2,44 metros hasta el travesaño. Los postes y travesaño deben ser seguros y la portería estar anclada; si el travesaño se daña o desplaza, se detiene el juego hasta repararlo o sustituirlo.' },
    en: { title: 'Goal dimensions and safety', detail: 'Schematic goal elevation showing 7.32 metres between posts and 2.44 metres to the crossbar. Posts and bar must be safe and the goal anchored; if the bar is damaged or displaced, play stops until it is repaired or replaced.' },
  },
  'ball-specifications-and-checks': {
    es: { title: 'Especificaciones y control del balón', detail: 'Diagrama de comprobación: tamaño, peso y presión reglamentarios; marca de calidad cuando corresponda a la competición; balones adicionales bajo control del árbitro. La apariencia no verifica la presión.' },
    en: { title: 'Ball specifications and control', detail: 'Check diagram: regulation size, weight and pressure; quality mark when required for the competition; additional balls under the referee’s control. Appearance does not verify pressure.' },
  },
  'defective-ball-and-replacement': {
    es: { title: 'Qué hacer si se deteriora el balón', detail: 'Tres rutas separadas: durante el juego se detiene y se reanuda con balón a tierra; en una reanudación se repite la reanudación; en un penal se comprueba la excepción del intervalo entre movimiento hacia delante y primer toque.' },
    en: { title: 'What happens when the ball becomes defective', detail: 'Three separate paths: during play, stop and restart with a dropped ball; at a restart, retake it; at a penalty kick, check the exception window between forward movement and first touch.' },
  },
  'compulsory-and-safe-equipment': {
    es: { title: 'Equipamiento obligatorio y seguro', detail: 'Cinco piezas obligatorias rodean una figura esquemática: camiseta, pantalón corto, medias, espinilleras y calzado. Los accesorios se permiten si no son peligrosos y están cubiertos de forma segura; los objetos peligrosos deben retirarse.' },
    en: { title: 'Compulsory and safe equipment', detail: 'Five compulsory items surround a schematic figure: shirt, shorts, socks, shinguards and footwear. Accessories are allowed if not dangerous and safely covered; dangerous items must be removed.' },
  },
  'equipment-offences-and-reentry': {
    es: { title: 'Corrección del equipamiento y regreso', detail: 'Secuencia: el árbitro indica corregir sin detener el juego automáticamente; el jugador sale para corregir, el equipamiento se inspecciona y solo vuelve con permiso arbitral. Una entrada sin permiso puede conllevar amonestación y una reanudación específica si se detiene el juego.' },
    en: { title: 'Equipment correction and return', detail: 'Sequence: the referee instructs correction without automatically stopping play; the player leaves to correct it, the equipment is inspected and return requires referee permission. Entry without permission can bring a caution and a specific restart if play is stopped.' },
  },
  'assistant-referee-duties': {
    es: { title: 'Funciones y señales del árbitro asistente', detail: 'El asistente observa límites del campo, fuera de juego y sustituciones, y señala con banderín. Puede ayudar con infracciones y observaciones de penal; el árbitro conserva la decisión final.' },
    en: { title: 'Assistant referee duties and signals', detail: 'The assistant observes field boundaries, offside and substitutions, and signals with a flag. They may help with offences and penalty observations; the referee retains the final decision.' },
  },
  'fourth-official-and-video-officials': {
    es: { title: 'Cuarto árbitro y oficiales de vídeo', detail: 'El cuarto árbitro apoya sustituciones y tareas técnicas. VAR y AVAR solo intervienen si están designados y dentro del protocolo de revisión. La información llega al árbitro, que toma la decisión final.' },
    en: { title: 'Fourth official and video officials', detail: 'The fourth official assists with substitutions and technical duties. VAR and AVAR act only when appointed and within the review protocol. Information reaches the referee, who makes the final decision.' },
  },
};

function Label({ x, y, children, size = 16, fill = c.text, anchor = 'start', weight = 700 }: {
  x: number; y: number; children: ReactNode; size?: number; fill?: string;
  anchor?: 'start' | 'middle' | 'end'; weight?: number;
}) {
  return <text x={x} y={y} fill={fill} fontFamily="Source Sans 3, Segoe UI, sans-serif" fontSize={size} fontWeight={weight} textAnchor={anchor}>{children}</text>;
}

function Panel({ x, y, w, h, fill = c.panel }: { x: number; y: number; w: number; h: number; fill?: string }) {
  return <rect x={x} y={y} width={w} height={h} rx="10" fill={fill} stroke={c.line} strokeWidth="1.5" />;
}

function Arrow({ x1, y1, x2, y2, color = c.accent }: { x1: number; y1: number; x2: number; y2: number; color?: string }) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const a = [x2 - 10 * Math.cos(angle - Math.PI / 6), y2 - 10 * Math.sin(angle - Math.PI / 6)];
  const b = [x2 - 10 * Math.cos(angle + Math.PI / 6), y2 - 10 * Math.sin(angle + Math.PI / 6)];
  return <path d={`M${x1} ${y1}L${x2} ${y2}M${a[0]} ${a[1]}L${x2} ${y2}L${b[0]} ${b[1]}`} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />;
}

function Heading({ children }: { children: ReactNode }) {
  return <Label x={36} y={45} size={22}>{children}</Label>;
}

function Markings({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Heading>{es ? 'Líneas que delimitan áreas' : 'Lines that bound areas'}</Heading>
    <Panel x={36} y={67} w={400} h={282} />
    <rect x="62" y="93" width="348" height="226" fill={c.panel2} stroke={c.line} strokeWidth="2" />
    <path d="M62 112h196v188H62M62 156h77v100H62" fill="none" stroke={c.text} strokeWidth="5" />
    <circle cx="191" cy="206" r="5" fill={c.accent} />
    <path d="M248 197l20 20m0-20-20 20" stroke={c.caution} strokeWidth="5" strokeLinecap="round" />
    <Label x={163} y={137} size={13} anchor="middle">{es ? 'Área penal' : 'Penalty area'}</Label>
    <Label x={99} y={185} size={12} anchor="middle">{es ? 'Área de' : 'Goal'}</Label>
    <Label x={99} y={201} size={12} anchor="middle">{es ? 'meta' : 'area'}</Label>
    <Label x={191} y={232} size={12} anchor="middle" fill={c.accent}>{es ? 'Punto penal' : 'Penalty mark'}</Label>
    <Panel x={455} y={67} w={229} h={282} />
    <Label x={475} y={103} size={16} fill={c.accent}>{es ? 'Línea = área' : 'Line = area'}</Label>
    <path d="M511 130v83" stroke={c.text} strokeWidth="14" />
    <path d="M498 159l26 26m0-26-26 26" stroke={c.caution} strokeWidth="6" strokeLinecap="round" />
    <Arrow x1={551} y1={172} x2={619} y2={172} />
    <Label x={474} y={253} size={15}>{es ? 'Contacto sobre' : 'Contact on the'}</Label>
    <Label x={474} y={276} size={15}>{es ? 'la línea: dentro' : 'line: inside'}</Label>
    <Label x={360} y={380} size={13} fill={c.muted} anchor="middle">{es ? 'Esquema de pertenencia; no representa proporciones del terreno' : 'Membership schematic; field proportions are not shown'}</Label>
  </>;
}

function Goals({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Heading>{es ? 'Portería: medida y seguridad' : 'Goal: dimensions and safety'}</Heading>
    <Panel x={36} y={66} w={402} h={285} />
    <path d="M90 281V181h300v100" fill="none" stroke={c.text} strokeWidth="10" strokeLinecap="round" />
    <path d="M90 291h300" stroke={c.line} strokeWidth="2" />
    <path d="M95 157h290m-290-7v14m290-14v14" stroke={c.accent} strokeWidth="2" />
    <Label x={240} y={147} anchor="middle" size={17} fill={c.accent}>{es ? '7,32 m' : '7.32 m'}</Label>
    <path d="M66 181v100m-7-100h14m-14 100h14" stroke={c.accent} strokeWidth="2" />
    <Label x={154} y={242} anchor="middle" size={15} fill={c.accent}>{es ? '2,44 m' : '2.44 m'}</Label>
    <Label x={238} y={326} anchor="middle" size={13}>{es ? 'Entre postes · suelo a travesaño' : 'Between posts · ground to crossbar'}</Label>
    <Panel x={454} y={66} w={230} h={285} />
    <Label x={476} y={103} size={16} fill={c.good}>{es ? 'Anclaje seguro' : 'Secure anchoring'}</Label>
    <path d="M495 126v42m-17 0h34m-17 0v14" stroke={c.good} strokeWidth="5" strokeLinecap="round" />
    <Label x={476} y={221} size={15} fill={c.caution}>{es ? 'Travesaño dañado' : 'Damaged crossbar'}</Label>
    <Arrow x1={565} y1={231} x2={565} y2={260} color={c.caution} />
    <Label x={476} y={286} size={15}>{es ? 'Detener el juego' : 'Stop play'}</Label>
    <Label x={476} y={311} size={13} fill={c.muted}>{es ? 'Reparar o sustituir' : 'Repair or replace'}</Label>
    <Label x={360} y={380} size={13} fill={c.muted} anchor="middle">{es ? 'Alzado esquemático; el dibujo no verifica un anclaje real' : 'Schematic elevation; drawing does not verify real anchoring'}</Label>
  </>;
}

function BallChecks({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Heading>{es ? 'Comprobar antes de usar' : 'Check before use'}</Heading>
    <Panel x={36} y={67} w={306} h={285} />
    <circle cx="189" cy="195" r="67" fill={c.ball} stroke={c.accent} strokeWidth="3" />
    <circle cx="189" cy="195" r="17" fill={c.panel} />
    <Label x={189} y={108} anchor="middle" size={16}>{es ? 'Balón reglamentario' : 'Regulation ball'}</Label>
    <Label x={189} y={301} anchor="middle" size={14} fill={c.muted}>{es ? 'Aspecto ≠ presión' : 'Looks ≠ pressure'}</Label>
    <Panel x={361} y={67} w={323} h={285} />
    <Label x={383} y={105} size={16} fill={c.accent}>{es ? 'Propiedades medibles' : 'Measurable properties'}</Label>
    <Label x={383} y={142} size={15}>{es ? 'Circunferencia: 68–70 cm' : 'Circumference: 68–70 cm'}</Label>
    <Label x={383} y={173} size={15}>{es ? 'Peso: 410–450 g' : 'Weight: 410–450 g'}</Label>
    <Label x={383} y={204} size={15}>{es ? 'Presión: 0,6–1,1 atm' : 'Pressure: 0.6–1.1 atm'}</Label>
    <path d="M382 225h280" stroke={c.line} />
    <Label x={383} y={251} size={14}>{es ? 'Marca: si la competición la exige' : 'Mark: if competition requires it'}</Label>
    <Label x={383} y={280} size={14}>{es ? 'Reservas: control arbitral' : 'Spare balls: referee control'}</Label>
    <Label x={360} y={381} anchor="middle" size={13} fill={c.muted}>{es ? 'Peso al inicio · presión al nivel del mar' : 'Weight at kick-off · pressure at sea level'}</Label>
  </>;
}

function DefectiveBall({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  const rows = [
    { y: 76, color: c.good, left: es ? 'Durante el juego' : 'During play', right: es ? 'Detener → balón a tierra' : 'Stop → dropped ball' },
    { y: 166, color: c.accent, left: es ? 'En una reanudación' : 'At a restart', right: es ? 'Repetir reanudación' : 'Retake the restart' },
    { y: 256, color: c.caution, left: es ? 'Durante un penal' : 'During a penalty', right: es ? 'Comprobar excepción' : 'Check exception' },
  ];
  return <>
    <Heading>{es ? 'Balón deteriorado: ¿cuándo?' : 'Defective ball: when?'}</Heading>
    {rows.map((row) => <g key={row.y}>
      <Panel x={36} y={row.y} w={648} h={76} />
      <circle cx="76" cy={row.y + 38} r="18" fill={row.color} />
      <Label x={110} y={row.y + 44} size={16}>{row.left}</Label>
      <Arrow x1={340} y1={row.y + 38} x2={378} y2={row.y + 38} color={row.color} />
      <Label x={401} y={row.y + 44} size={16} fill={row.color}>{row.right}</Label>
    </g>)}
    <Label x={360} y={371} anchor="middle" size={13} fill={c.muted}>{es ? 'Penal: desde avance del balón hasta primer toque en jugador o marco' : 'Penalty: from forward motion to first player or goal-frame touch'}</Label>
  </>;
}

function Equipment({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Heading>{es ? 'Cinco piezas y seguridad' : 'Five items and safety'}</Heading>
    <Panel x={36} y={67} w={415} h={284} />
    <circle cx="238" cy="122" r="20" fill={c.good} />
    <path d="M214 148h48l13 60h-74zM213 209h50l-4 38h-42zM222 249l-7 58m38-58 7 58" fill="none" stroke={c.good} strokeWidth="13" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M215 304h-19m64 0h19" stroke={c.text} strokeWidth="9" strokeLinecap="round" />
    <Label x={62} y={117} size={14}>{es ? 'Camiseta' : 'Shirt'}</Label>
    <Label x={314} y={171} size={14}>{es ? 'Pantalón' : 'Shorts'}</Label>
    <Label x={62} y={224} size={14}>{es ? 'Medias' : 'Socks'}</Label>
    <Label x={310} y={273} size={14}>{es ? 'Espinilleras' : 'Shinguards'}</Label>
    <Label x={62} y={321} size={14}>{es ? 'Calzado' : 'Footwear'}</Label>
    <Panel x={469} y={67} w={215} h={284} />
    <circle cx="578" cy="157" r="39" fill="none" stroke={c.caution} strokeWidth="6" />
    <path d="M548 127l60 60" stroke={c.caution} strokeWidth="6" />
    <Label x={577} y={235} anchor="middle" size={15} fill={c.caution}>{es ? 'Sin objetos' : 'No dangerous'}</Label>
    <Label x={577} y={256} anchor="middle" size={15} fill={c.caution}>{es ? 'peligrosos' : 'items'}</Label>
    <Label x={577} y={302} anchor="middle" size={12} fill={c.muted}>{es ? 'Cubrir no alcanza' : 'Covering is not enough'}</Label>
    <Label x={360} y={380} anchor="middle" size={13} fill={c.muted}>{es ? 'Esquema de requisitos; no certifica un equipo fotografiado' : 'Requirement schematic; does not certify photographed kit'}</Label>
  </>;
}

function Reentry({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  const steps = [
    { x: 36, heading: es ? '1 · Indicación' : '1 · Instruction', a: es ? 'Corregir' : 'Correct it', b: es ? 'sin parar automáticamente' : 'without automatic stop' },
    { x: 258, heading: es ? '2 · Salida' : '2 · Leave', a: es ? 'Corregir fuera' : 'Correct off field', b: es ? 'y pasar inspección' : 'and pass inspection' },
    { x: 480, heading: es ? '3 · Regreso' : '3 · Return', a: es ? 'Solo con permiso' : 'Only with permission', b: es ? 'del árbitro' : 'from referee' },
  ];
  return <>
    <Heading>{es ? 'Corregir, inspeccionar, autorizar' : 'Correct, inspect, permit'}</Heading>
    {steps.map((step) => <g key={step.x}>
      <Panel x={step.x} y={91} w={204} h={186} />
      <Label x={step.x + 16} y={131} size={17} fill={c.accent}>{step.heading}</Label>
      <Label x={step.x + 16} y={179} size={15}>{step.a}</Label>
      <Label x={step.x + 16} y={204} size={13} fill={c.muted}>{step.b}</Label>
    </g>)}
    <Arrow x1={242} y1={185} x2={255} y2={185} />
    <Arrow x1={464} y1={185} x2={477} y2={185} />
    <Panel x={36} y={295} w={648} h={63} fill={c.panel2} />
    <Label x={360} y={323} anchor="middle" size={15} fill={c.caution}>{es ? 'Entrar sin permiso → amonestación' : 'Enter without permission → caution'}</Label>
    <Label x={360} y={345} anchor="middle" size={13} fill={c.muted}>{es ? 'Si el árbitro detiene el juego, aplicar la reanudación prevista' : 'If the referee stops play, apply the prescribed restart'}</Label>
  </>;
}

function Assistant({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Heading>{es ? 'Asistir y señalar, sin decidir por el árbitro' : 'Assist and signal; referee decides'}</Heading>
    <Panel x={36} y={76} w={303} h={260} />
    <path d="M90 161v107m0-107 51 17-51 17" fill={c.accent} stroke={c.text} strokeWidth="4" strokeLinejoin="round" />
    <Label x={168} y={125} size={16} fill={c.accent}>{es ? 'Banderín' : 'Flag'}</Label>
    <Label x={167} y={173} size={15}>{es ? 'Balón fuera' : 'Ball out'}</Label>
    <Label x={167} y={211} size={15}>{es ? 'Fuera de juego' : 'Offside'}</Label>
    <Label x={167} y={249} size={15}>{es ? 'Sustitución' : 'Substitution'}</Label>
    <Label x={63} y={312} size={13} fill={c.muted}>{es ? 'También ayuda con infracciones' : 'Also helps with offences'}</Label>
    <Arrow x1={344} y1={206} x2={373} y2={206} />
    <Panel x={379} y={76} w={305} h={260} />
    <Label x={402} y={121} size={16}>{es ? 'Información al árbitro' : 'Information to referee'}</Label>
    <circle cx="531" cy="201" r="35" fill={c.good} />
    <Label x={531} y={207} anchor="middle" size={16} fill={c.background}>R</Label>
    <Label x={531} y={276} anchor="middle" size={17} fill={c.accent}>{es ? 'Decisión final' : 'Final decision'}</Label>
    <Label x={360} y={375} anchor="middle" size={13} fill={c.muted}>{es ? 'Las observaciones de penal dependen de la posición y funciones asignadas' : 'Penalty observations depend on position and assigned duties'}</Label>
  </>;
}

function OtherOfficials({ locale }: { locale: Locale }) {
  const es = locale === 'es';
  return <>
    <Heading>{es ? 'Apoyos distintos, autoridad única' : 'Different support, one final authority'}</Heading>
    <Panel x={36} y={76} w={310} h={226} />
    <Label x={58} y={117} size={18} fill={c.good}>{es ? 'Cuarto árbitro' : 'Fourth official'}</Label>
    <Label x={58} y={160} size={15}>{es ? 'Sustituciones' : 'Substitutions'}</Label>
    <Label x={58} y={188} size={15}>{es ? 'Área técnica' : 'Technical area'}</Label>
    <Label x={58} y={241} size={13} fill={c.muted}>{es ? 'Oficial designado' : 'Appointed official'}</Label>
    <Panel x={374} y={76} w={310} h={226} />
    <Label x={396} y={117} size={18} fill={c.accent}>VAR / AVAR</Label>
    <Label x={396} y={160} size={15}>{es ? 'Solo si están designados' : 'Only if appointed'}</Label>
    <Label x={396} y={188} size={15}>{es ? 'Protocolo limitado' : 'Limited review protocol'}</Label>
    <Label x={396} y={241} size={13} fill={c.muted}>{es ? 'No toda jugada es revisable' : 'Not every play is reviewable'}</Label>
    <Arrow x1={196} y1={306} x2={281} y2={337} />
    <Arrow x1={524} y1={306} x2={439} y2={337} />
    <Label x={360} y={372} anchor="middle" size={17} fill={c.good}>{es ? 'Árbitro → decisión final' : 'Referee → final decision'}</Label>
  </>;
}

const diagrams: Record<TopicSlug, (props: { locale: Locale }) => ReactNode> = {
  'field-markings-and-areas': Markings,
  'goals-and-field-safety': Goals,
  'ball-specifications-and-checks': BallChecks,
  'defective-ball-and-replacement': DefectiveBall,
  'compulsory-and-safe-equipment': Equipment,
  'equipment-offences-and-reentry': Reentry,
  'assistant-referee-duties': Assistant,
  'fourth-official-and-video-officials': OtherOfficials,
};

/** Original RefView schematics for the edition-pinned 2026/27 Laws; no IFAB artwork. */
export function FoundationOfficialsTopicIllustration({ slug, locale }: { slug: string; locale: Locale }) {
  const id = useId();
  if (!Object.hasOwn(diagrams, slug)) return null;
  const topic = slug as TopicSlug;
  const Diagram = diagrams[topic];
  const description = descriptions[topic][locale];

  return <svg role="img" aria-labelledby={`${id}-title ${id}-description`} viewBox="0 0 720 400" preserveAspectRatio="xMidYMid meet" width="100%" xmlns="http://www.w3.org/2000/svg">
    <title id={`${id}-title`}>{description.title}</title>
    <desc id={`${id}-description`}>{description.detail}</desc>
    <rect width="720" height="400" rx="18" fill={c.background} />
    <Diagram locale={locale} />
  </svg>;
}
