import type { AcademyLocale } from './catalog-ui-v1-data';
import { restartTopics202627 } from './restart-topic-content-v1';
import { outcomeFreeKickTopics202627 } from './outcome-free-kick-topic-content-v1';
import { playersRefereeTimeTopics202627 } from './players-referee-time-topic-content-v1';
import { foundationOfficialsTopics202627 } from './foundation-officials-topic-content-v1';

type Localized = Readonly<Record<AcademyLocale, string>>;
export type LawEntry = Readonly<{ number: number; slug: string; title: Localized; overview: Localized }>;
export type LawTopic = Readonly<{
  slug: string; lawsEdition: 'IFAB-2026-27'; primaryLaw: number; title: Localized; scope: Localized;
  explanation: Localized; concepts: readonly Localized[]; sourceSection: Localized; sourcePages: Localized;
}>;

export const lawTopics202627: readonly LawTopic[] = [
  {
    slug: 'challenge', lawsEdition: 'IFAB-2026-27', primaryLaw: 12,
    title: { es: 'Contacto y gravedad de la acción', en: 'Contact and challenge severity' },
    scope: { es: 'Observá el contacto y distinguí la gravedad de una acción.', en: 'Observe contact and distinguish the severity of a challenge.' },
    explanation: { es: 'La posición, la forma y la intensidad del contacto ayudan a ordenar lo observado antes de decidir si hubo infracción y qué respuesta corresponde.', en: 'Position, manner and force of contact help organise the evidence before deciding whether an offence occurred and what response follows.' },
    concepts: [
      { es: 'Contacto en una disputa por el balón', en: 'Contact during a challenge for the ball' },
      { es: 'Acción imprudente, temeraria o con fuerza excesiva', en: 'Careless, reckless or excessive-force action' },
      { es: 'Decisión técnica y posible sanción disciplinaria', en: 'Technical decision and possible disciplinary sanction' },
    ],
    sourceSection: { es: 'Regla 12, apartado 1 · Faltas sancionables con tiro libre directo', en: 'Law 12, section 1 · Direct free kick offences' },
    sourcePages: { es: '123–124', en: '115–116' },
  },
  {
    slug: 'handball', lawsEdition: 'IFAB-2026-27', primaryLaw: 12,
    title: { es: 'Mano', en: 'Handball' },
    scope: { es: 'Ubicá las preguntas relevantes cuando el balón toca la mano o el brazo.', en: 'Identify the relevant questions when the ball touches a hand or arm.' },
    explanation: { es: 'Un toque de mano o brazo requiere contexto: movimiento hacia el balón, posición del cuerpo y situación de juego. El contacto por sí solo no resuelve la decisión.', en: 'A hand or arm contact needs context: movement towards the ball, body position and phase of play. Contact alone does not settle the decision.' },
    concepts: [
      { es: 'Movimiento de la mano o el brazo hacia el balón', en: 'Movement of the hand or arm towards the ball' },
      { es: 'Posición del brazo y ampliación del cuerpo', en: 'Arm position and making the body bigger' },
      { es: 'Contexto de gol y ataque', en: 'Goal and attacking context' },
    ],
    sourceSection: { es: 'Regla 12, apartado 1 · Mano', en: 'Law 12, section 1 · Handball' },
    sourcePages: { es: '124–126', en: '116–118' },
  },
  {
    slug: 'indirect-free-kick', lawsEdition: 'IFAB-2026-27', primaryLaw: 12,
    title: { es: 'Infracciones de tiro libre indirecto', en: 'Indirect free kick offences' },
    scope: { es: 'Reconocé infracciones cuyo reinicio es un tiro libre indirecto.', en: 'Recognise offences restarted with an indirect free kick.' },
    explanation: { es: 'Algunas acciones no implican el tipo de contacto de una falta de tiro libre directo. Identificar la conducta concreta ayuda a elegir el reinicio correcto.', en: 'Some actions do not involve the contact associated with a direct free kick offence. Identifying the specific conduct helps determine the correct restart.' },
    concepts: [
      { es: 'Juego peligroso sin contacto', en: 'Playing in a dangerous manner without contact' },
      { es: 'Obstaculizar el avance sin contacto', en: 'Impeding progress without contact' },
      { es: 'Infracciones específicas del guardameta', en: 'Specific goalkeeper offences' },
    ],
    sourceSection: { es: 'Regla 12, apartado 2 · Tiro libre indirecto', en: 'Law 12, section 2 · Indirect free kick' },
    sourcePages: { es: '126–128', en: '118–119' },
  },
  {
    slug: 'disciplinary-sanctions', lawsEdition: 'IFAB-2026-27', primaryLaw: 12,
    title: { es: 'Sanciones disciplinarias', en: 'Disciplinary sanctions' },
    scope: { es: 'Separá la decisión sobre el reinicio de la posible sanción personal.', en: 'Separate the restart decision from a possible personal sanction.' },
    explanation: { es: 'La respuesta disciplinaria atiende a la conducta y al contexto de la acción. Una misma revisión puede exigir decidir tanto el reinicio como si corresponde advertir, amonestar o expulsar.', en: 'The disciplinary response considers conduct and context. Reviewing an incident may require both a restart decision and a decision on warning, caution or sending-off.' },
    concepts: [
      { es: 'Advertencia y amonestación', en: 'Warning and caution' },
      { es: 'Motivos de expulsión', en: 'Sending-off offences' },
      { es: 'Contexto de oportunidad manifiesta de gol', en: 'Obvious goal-scoring opportunity context' },
    ],
    sourceSection: { es: 'Regla 12, apartado 4 · Medidas disciplinarias', en: 'Law 12, section 4 · Disciplinary action' },
    sourcePages: { es: '128–136', en: '119–127' },
  },
  {
    slug: 'offside-position-and-involvement', lawsEdition: 'IFAB-2026-27', primaryLaw: 11,
    title: { es: 'Posición e intervención en fuera de juego', en: 'Offside position and involvement' },
    scope: { es: 'Distinguí estar en posición de fuera de juego de participar en una infracción.', en: 'Distinguish being in an offside position from committing an offside offence.' },
    explanation: { es: 'Primero se ubica al futbolista en el momento pertinente; después se observa si interviene en el juego, interfiere en un adversario o gana ventaja.', en: 'First locate the player at the relevant moment; then observe whether they interfere with play, interfere with an opponent or gain an advantage.' },
    concepts: [
      { es: 'Momento del toque de un compañero', en: 'Moment a team-mate plays or touches the ball' },
      { es: 'Posición de fuera de juego', en: 'Offside position' },
      { es: 'Participación activa', en: 'Active involvement' },
    ],
    sourceSection: { es: 'Regla 11, apartados 1–2 · Posición e infracción', en: 'Law 11, sections 1–2 · Position and offence' },
    sourcePages: { es: '117–119', en: '109–111' },
  },
  {
    slug: 'penalty-procedure', lawsEdition: 'IFAB-2026-27', primaryLaw: 14,
    title: { es: 'Procedimiento del penal', en: 'Penalty kick procedure' },
    scope: { es: 'Recorré la colocación y la ejecución de un penal.', en: 'Explore the setup and taking of a penalty kick.' },
    explanation: { es: 'Antes del remate importan la posición del balón, del ejecutante, del guardameta y de los demás jugadores. Después se observa la ejecución para determinar cómo continúa el juego.', en: 'Before the kick, the positions of the ball, kicker, goalkeeper and other players matter. The kick itself determines how play continues.' },
    concepts: [
      { es: 'Colocación antes de la señal', en: 'Positioning before the signal' },
      { es: 'Ejecución del remate', en: 'Taking the kick' },
      { es: 'Movimiento de los jugadores y continuación', en: 'Player movement and continuation of play' },
    ],
    sourceSection: { es: 'Regla 14, apartado 1 · Procedimiento', en: 'Law 14, section 1 · Procedure' },
    sourcePages: { es: '145–146', en: '135–136' },
  },
  ...restartTopics202627,
  ...outcomeFreeKickTopics202627,
  ...playersRefereeTimeTopics202627,
  ...foundationOfficialsTopics202627,
];

export function topicsForLaw(lawNumber: number): readonly LawTopic[] {
  return lawTopics202627.filter((topic) => topic.primaryLaw === lawNumber);
}

export function getLawTopic(lawNumber: number, slug: string): LawTopic | undefined {
  return topicsForLaw(lawNumber).find((topic) => topic.slug === slug);
}

export const laws202627: readonly LawEntry[] = [
  { number: 1, slug: 'the-field-of-play', title: { es: 'El terreno de juego', en: 'The Field of Play' }, overview: { es: 'Presenta las dimensiones, líneas, áreas y elementos que delimitan el espacio de juego.', en: 'Introduces the dimensions, markings, areas and equipment that define the playing field.' } },
  { number: 2, slug: 'the-ball', title: { es: 'El balón', en: 'The Ball' }, overview: { es: 'Describe las características del balón y qué sucede si debe reemplazarse.', en: 'Covers the ball’s characteristics and what happens when it must be replaced.' } },
  { number: 3, slug: 'the-players', title: { es: 'Los jugadores', en: 'The Players' }, overview: { es: 'Sitúa el número de jugadores, las sustituciones y la participación de otras personas.', en: 'Sets out player numbers, substitutions and the involvement of other people.' } },
  { number: 4, slug: 'the-players-equipment', title: { es: 'El equipamiento de los jugadores', en: 'The Players’ Equipment' }, overview: { es: 'Orienta sobre la indumentaria obligatoria, la seguridad y los elementos permitidos.', en: 'Introduces required kit, safety and permitted equipment.' } },
  { number: 5, slug: 'the-referee', title: { es: 'El árbitro', en: 'The Referee' }, overview: { es: 'Reúne la autoridad, las decisiones y las responsabilidades del árbitro durante el partido.', en: 'Covers the referee’s authority, decisions and responsibilities during a match.' } },
  { number: 6, slug: 'the-other-match-officials', title: { es: 'Los otros miembros del equipo arbitral', en: 'The Other Match Officials' }, overview: { es: 'Presenta las funciones de los demás integrantes del equipo arbitral.', en: 'Introduces the roles of the other match officials.' } },
  { number: 7, slug: 'the-duration-of-the-match', title: { es: 'La duración del partido', en: 'The Duration of the Match' }, overview: { es: 'Ubica los períodos, intervalos y recuperación del tiempo perdido.', en: 'Covers periods of play, intervals and allowance for time lost.' } },
  { number: 8, slug: 'the-start-and-restart-of-play', title: { es: 'Inicio y reanudación del juego', en: 'The Start and Restart of Play' }, overview: { es: 'Introduce el saque inicial y el balón a tierra como formas de iniciar o reanudar el juego.', en: 'Introduces the kick-off and dropped ball as ways to start or restart play.' } },
  { number: 9, slug: 'the-ball-in-and-out-of-play', title: { es: 'Balón en juego', en: 'The Ball in and out of Play' }, overview: { es: 'Ayuda a distinguir cuándo el balón sigue en juego y cuándo deja de estarlo.', en: 'Helps distinguish when the ball remains in play and when it is out of play.' } },
  { number: 10, slug: 'determining-the-outcome-of-a-match', title: { es: 'El resultado de un partido', en: 'Determining the Outcome of a Match' }, overview: { es: 'Presenta el gol, el resultado y los procedimientos para decidir un ganador.', en: 'Introduces goals, match results and procedures for determining a winner.' } },
  { number: 11, slug: 'offside', title: { es: 'El fuera de juego', en: 'Offside' }, overview: { es: 'Distingue la posición de fuera de juego de las situaciones que constituyen infracción.', en: 'Distinguishes an offside position from an offside offence.' } },
  { number: 12, slug: 'fouls-and-misconduct', title: { es: 'Faltas y conducta incorrecta', en: 'Fouls and Misconduct' }, overview: { es: 'Orienta sobre faltas, conducta incorrecta y las posibles respuestas técnicas y disciplinarias.', en: 'Introduces fouls, misconduct and possible technical and disciplinary responses.' } },
  { number: 13, slug: 'free-kicks', title: { es: 'Tiros libres', en: 'Free Kicks' }, overview: { es: 'Presenta los tiros libres directos e indirectos y sus procedimientos básicos.', en: 'Introduces direct and indirect free kicks and their basic procedures.' } },
  { number: 14, slug: 'the-penalty-kick', title: { es: 'El penal', en: 'The Penalty Kick' }, overview: { es: 'Sitúa cuándo se concede un penal y cómo se ejecuta.', en: 'Covers when a penalty kick is awarded and how it is taken.' } },
  { number: 15, slug: 'the-throw-in', title: { es: 'El saque de banda', en: 'The Throw-in' }, overview: { es: 'Explica el contexto y el procedimiento para reanudar desde la línea de banda.', en: 'Introduces the context and procedure for a restart from the touchline.' } },
  { number: 16, slug: 'the-goal-kick', title: { es: 'El saque de meta', en: 'The Goal Kick' }, overview: { es: 'Sitúa cuándo corresponde un saque de meta y cómo se reanuda el juego.', en: 'Covers when a goal kick is awarded and how play restarts.' } },
  { number: 17, slug: 'the-corner-kick', title: { es: 'El saque de esquina', en: 'The Corner Kick' }, overview: { es: 'Sitúa cuándo corresponde un saque de esquina y cómo se ejecuta.', en: 'Covers when a corner kick is awarded and how it is taken.' } },
];

export function getLawEntry(raw: string): LawEntry | undefined {
  if (!/^(?:[1-9]|1[0-7])$/.test(raw)) return undefined;
  return laws202627[Number(raw) - 1];
}

export function officialLawUrl(law: LawEntry, locale: AcademyLocale): string {
  return `https://www.theifab.com/${locale === 'es' ? 'es/' : ''}laws/latest/${law.slug}/`;
}

export function officialEditionPdfUrl(locale: AcademyLocale, pageNumber?: number): string {
  const url = locale === 'es'
    ? 'https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es'
    : 'https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en';
  return pageNumber === undefined ? url : `${url}#page=${pageNumber}`;
}
