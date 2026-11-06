import type { LawSourceRef, TopicDepth } from './law-depth-contract';
import type { LawTopic } from './rules-directory-v1';

const source = (
  esSection: string,
  enSection: string,
  esPages: string,
  enPages: string,
  esStart: number,
  enStart: number,
  supplemental?: LawSourceRef['supplemental'],
): LawSourceRef => ({
  section: { es: esSection, en: enSection },
  pages: { es: esPages, en: enPages },
  startPage: { es: esStart, en: enStart },
  ...(supplemental ? { supplemental } : {}),
});

const countdownProtocol: NonNullable<LawSourceRef['supplemental']> = {
  label: { es: 'Protocolo oficial · pp. 28–29', en: 'Official protocol · pp. 26–27' },
  startPage: { es: 28, en: 26 },
};

export const restartTopics202627: readonly LawTopic[] = [
  {
    slug: 'kick-off-procedure', lawsEdition: 'IFAB-2026-27', primaryLaw: 8,
    title: { es: 'Procedimiento del saque inicial', en: 'Kick-off procedure' },
    scope: { es: 'Reconocé la colocación, la señal y el momento en que comienza el juego.', en: 'Recognise the setup, signal and moment play begins.' },
    explanation: { es: 'El saque inicial abre cada tiempo y reanuda tras un gol. La posición de los jugadores y el movimiento del balón se juzgan en momentos distintos.', en: 'A kick-off begins each half and restarts after a goal. Player positions and ball movement are judged at different moments.' },
    concepts: [
      { es: 'Balón inmóvil en el punto central', en: 'Stationary ball on the centre mark' },
      { es: 'Jugadores en sus mitades y rivales a 9,15 m', en: 'Players in their halves and opponents 9.15 m away' },
      { es: 'Señal, golpeo y movimiento claro', en: 'Signal, kick and clear movement' },
    ],
    sourceSection: { es: 'Regla 8.1 · Saque inicial', en: 'Law 8.1 · Kick-off' },
    sourcePages: { es: '105–106', en: '97–98' },
  },
  {
    slug: 'dropped-ball-procedure', lawsEdition: 'IFAB-2026-27', primaryLaw: 8,
    title: { es: 'Procedimiento del balón a tierra', en: 'Dropped-ball procedure' },
    scope: { es: 'Identificá a quién se entrega el balón y cuándo vuelve a estar en juego.', en: 'Identify the recipient and when the ball returns to play.' },
    explanation: { es: 'Cuando el árbitro detiene el juego sin otro reinicio previsto, la ubicación del balón y la posesión probable determinan el destinatario. El contacto con el suelo marca el reinicio.', en: 'When the referee stops play and no other restart applies, ball location and likely possession determine the recipient. Ground contact marks the restart.' },
    concepts: [
      { es: 'Guardameta defensor si el balón estaba en el área penal', en: 'Defending goalkeeper if the ball was in the penalty area' },
      { es: 'Posesión actual o probable fuera del área', en: 'Current or likely possession outside the area' },
      { es: 'Cuatro metros hasta que el balón toque el suelo', en: 'Four metres until the ball touches the ground' },
    ],
    sourceSection: { es: 'Regla 8.2 · Balón a tierra', en: 'Law 8.2 · Dropped ball' },
    sourcePages: { es: '106–107', en: '98' },
  },
  {
    slug: 'ball-in-and-out-of-play', lawsEdition: 'IFAB-2026-27', primaryLaw: 9,
    title: { es: 'Balón en juego y fuera de juego', en: 'Ball in and out of play' },
    scope: { es: 'Distinguí un balón que aún pisa la línea de uno que la cruzó por completo.', en: 'Distinguish a ball still over the line from one that has fully crossed it.' },
    explanation: { es: 'La línea forma parte del terreno. Además de una salida completa, una detención arbitral o ciertos contactos con un árbitro pueden interrumpir el juego.', en: 'The line belongs to the field. Besides a complete crossing, a referee stoppage or certain contacts with a match official can interrupt play.' },
    concepts: [
      { es: 'Todo el balón cruza toda la línea', en: 'The whole ball crosses the whole line' },
      { es: 'El silbato puede detener el juego antes de una salida', en: 'The whistle can stop play before a crossing' },
      { es: 'Rebotes y contactos con árbitros requieren contexto', en: 'Rebounds and match-official contact require context' },
    ],
    sourceSection: { es: 'Regla 9.1–2 · Balón fuera y en juego', en: 'Law 9.1–2 · Ball out of and in play' },
    sourcePages: { es: '109', en: '101' },
  },
  {
    slug: 'throw-in-procedure', lawsEdition: 'IFAB-2026-27', primaryLaw: 15,
    title: { es: 'Procedimiento del saque de banda', en: 'Throw-in procedure' },
    scope: { es: 'Revisá el lugar, la postura, el lanzamiento y la entrada del balón.', en: 'Check the place, posture, delivery and entry of the ball.' },
    explanation: { es: 'Cuando el balón sale por la línea lateral, el rival del último jugador que lo tocó efectúa el saque. La Regla exige una técnica concreta y distingue su ejecución de la entrada del balón al campo.', en: 'When the ball crosses a touchline, the opponents of its last player to touch it take the throw. The Law requires a specific technique and distinguishes delivery from the ball entering the field.' },
    concepts: [
      { es: 'Dos manos desde atrás y por encima de la cabeza', en: 'Both hands from behind and over the head' },
      { es: 'Cada pie toca la línea o el suelo exterior', en: 'Each foot touches the line or ground outside' },
      { es: 'Entrada al campo y distancia rival de 2 m', en: 'Entry onto the field and 2 m opponent distance' },
    ],
    sourceSection: { es: 'Regla 15.1–2 · Saque de banda', en: 'Law 15.1–2 · Throw-in' },
    sourcePages: { es: '153–154', en: '141–142' },
  },
  {
    slug: 'goal-kick-procedure', lawsEdition: 'IFAB-2026-27', primaryLaw: 16,
    title: { es: 'Procedimiento del saque de meta', en: 'Goal-kick procedure' },
    scope: { es: 'Ubicá el balón, a los rivales y el instante en que el saque entra en juego.', en: 'Locate the ball, opponents and moment the kick enters play.' },
    explanation: { es: 'Si el equipo atacante tocó por último un balón que salió por la línea de meta sin gol, el defensor reanuda desde el área de meta. El balón puede jugarse dentro del área penal.', en: 'If the attacking team last touched a ball crossing the goal line without a goal, the defenders restart from the goal area. The ball may be played inside the penalty area.' },
    concepts: [
      { es: 'Balón inmóvil en cualquier punto del área de meta', en: 'Stationary ball anywhere in the goal area' },
      { es: 'Rivales fuera del área penal hasta el golpeo', en: 'Opponents outside the penalty area until the kick' },
      { es: 'Golpeo y movimiento claro, sin salir del área', en: 'Kick and clear movement without leaving the area' },
    ],
    sourceSection: { es: 'Regla 16.1–2 · Saque de meta', en: 'Law 16.1–2 · Goal kick' },
    sourcePages: { es: '157–158', en: '145–146' },
  },
  {
    slug: 'corner-kick-procedure', lawsEdition: 'IFAB-2026-27', primaryLaw: 17,
    title: { es: 'Procedimiento del saque de esquina', en: 'Corner-kick procedure' },
    scope: { es: 'Elegí el vértice correcto y reconocé cuándo el balón está en juego.', en: 'Choose the correct corner and recognise when the ball is in play.' },
    explanation: { es: 'Tras una salida por la línea de meta con último toque defensor y sin gol, ataca el equipo rival desde el área de esquina más cercana. También hay supuestos especiales que conceden esquina.', en: 'After a goal-line crossing last touched by a defender with no goal, the opponents attack from the nearest corner area. Special cases can also award a corner.' },
    concepts: [
      { es: 'Área de esquina correspondiente', en: 'Correct corner area' },
      { es: 'Bandera intacta y rivales a 9,15 m del arco', en: 'Flag in place and opponents 9.15 m from the arc' },
      { es: 'Golpeo y movimiento claro dentro o fuera del área', en: 'Kick and clear movement inside or outside the area' },
    ],
    sourceSection: { es: 'Regla 17.1–2 · Saque de esquina', en: 'Law 17.1–2 · Corner kick' },
    sourcePages: { es: '161–162', en: '149–150' },
  },
];

export const restartTopicDepths: readonly TopicDepth[] = [
  {
    slug: 'kick-off-procedure', number: 8, sections: [
      {
        id: 'who-takes-the-kick', title: { es: 'Cuándo y para quién', en: 'When and for whom' },
        paragraphs: [
          { es: 'El sorteo inicial permite al equipo ganador elegir campo para el primer tiempo o efectuar el saque. El otro equipo recibe la opción restante. El equipo que eligió campo saca al comenzar el segundo tiempo, tras el cambio de lados; después de cada gol saca el equipo que lo recibió.', en: 'The team winning the opening toss chooses its first-half goal to attack or takes the kick-off. The other team receives the remaining choice. The team that chose its attacking goal kicks off the second half after ends change; after each goal, the team that conceded takes the kick-off.' },
        ],
        source: source('Regla 8.1 · Saque inicial: procedimiento', 'Law 8.1 · Kick-off: procedure', '105–106', '97–98', 105, 97),
      },
      {
        id: 'setup-and-live-ball', title: { es: 'Del punto central al juego', en: 'From centre mark to live play' },
        paragraphs: [
          { es: 'Antes de la señal, el balón permanece inmóvil en el punto central. Salvo quien ejecuta, todos los jugadores están en su propia mitad; los rivales guardan al menos 9,15 m del balón. Después de la señal del árbitro, el balón entra en juego cuando se patea y se mueve claramente. No necesita avanzar hacia la meta contraria.', en: 'Before the signal, the ball is stationary on the centre mark. Apart from the kicker, all players are in their own half, and opponents stay at least 9.15 m from the ball. After the referee’s signal, play begins when the ball is kicked and clearly moves. It need not travel towards the opponents’ goal.' },
        ],
        source: source('Regla 8.1 · Saque inicial: procedimiento', 'Law 8.1 · Kick-off: procedure', '105–106', '97–98', 105, 97),
      },
      {
        id: 'kick-off-outcomes', title: { es: 'Gol y errores de ejecución', en: 'Goals and procedure errors' },
        paragraphs: [
          { es: 'Un saque inicial puede terminar directamente en gol contra el rival. Si entra directamente en la meta propia, se concede esquina. Si quien sacó vuelve a tocar el balón antes que otro jugador, corresponde libre indirecto; si ese toque es mano sancionable, libre directo. Otras infracciones del procedimiento exigen repetir el saque.', en: 'A kick-off may score directly against the opponents. If it enters the kicker’s own goal directly, award a corner. A second touch by the kicker before any other player brings an indirect free kick; a punishable handball brings a direct free kick. Other kick-off procedure offences require a retake.' },
        ],
        source: source('Regla 8.1 · Saque inicial: infracciones y sanciones', 'Law 8.1 · Kick-off: offences and sanctions', '106', '97–98', 106, 97),
      },
    ],
  },
  {
    slug: 'dropped-ball-procedure', number: 8, sections: [
      {
        id: 'choose-recipient', title: { es: 'Elegir destinatario', en: 'Choose the recipient' },
        paragraphs: [
          { es: 'Si el balón estaba dentro del área penal al detenerse el juego, el árbitro lo deja caer para el guardameta defensor dentro de esa área. Fuera del área, lo entrega a un jugador del equipo que tenía o habría conservado u obtenido la posesión, incluso mediante la reanudación que habría seguido a una salida del balón. Si esto no puede determinarse, corresponde al equipo que lo tocó por última vez.', en: 'If the ball was inside the penalty area when play stopped, the referee drops it for the defending goalkeeper there. Outside the area, it goes to one player of the team that had or would have retained or gained possession, including through the restart that would have followed a ball going out. If this cannot be determined, it goes to the team that touched it last.' },
        ],
        source: source('Regla 8.2 · Balón a tierra: destinatario', 'Law 8.2 · Dropped ball: recipient', '106–107', '98', 106, 98),
      },
      {
        id: 'drop-position-and-timing', title: { es: 'Lugar, distancia y momento', en: 'Place, distance and timing' },
        paragraphs: [
          { es: 'Fuera del área, se deja caer donde estaba el balón al detenerse el juego; si intervino un árbitro u otra persona ajena, se usa el punto de contacto o interferencia. Los demás jugadores de ambos equipos esperan al menos a 4 m. El balón entra en juego al tocar el suelo: desde entonces puede jugarlo cualquier jugador, sin obligación de que el destinatario sea el primero.', en: 'Outside the area, the drop is where the ball was when play stopped; if a match official or outside agent interfered, use the point of contact or interference. All other players from both teams stay at least 4 m away. The ball is in play on touching the ground: any player may then play it, with no requirement that the recipient touch it first.' },
        ],
        source: source('Regla 8.2 · Balón a tierra: procedimiento', 'Law 8.2 · Dropped ball: procedure', '106–107', '98', 106, 98),
      },
      {
        id: 'repeat-or-restart', title: { es: 'Cuándo se repite y si entra en la meta', en: 'Retake and ball entering goal' },
        paragraphs: [
          { es: 'Se repite si un jugador toca el balón antes de que caiga al suelo, o si, tras tocarlo, sale del campo sin contacto de ningún jugador. Si entra en una meta sin que lo hayan tocado al menos dos jugadores, no hay gol: saque de meta si entra en la rival y esquina si entra en la propia.', en: 'Repeat the drop if a player touches the ball before it reaches the ground, or if it leaves the field after landing without touching a player. If it enters either goal without at least two players touching it, there is no goal: award a goal kick at the opponents’ goal or a corner at the team’s own goal.' },
        ],
        source: source('Regla 8.2 · Balón a tierra: infracciones y sanciones', 'Law 8.2 · Dropped ball: offences and sanctions', '107', '98', 107, 98),
      },
    ],
  },
  {
    slug: 'ball-in-and-out-of-play', number: 9, sections: [
      {
        id: 'whole-ball-whole-line', title: { es: 'Todo el balón, toda la línea', en: 'Whole ball, whole line' },
        paragraphs: [
          { es: 'Una salida exige que el balón entero haya superado la línea de banda o de meta, por aire o por suelo. Si una parte todavía se proyecta sobre la línea, sigue en juego. Para decidirlo, importa la posición completa del balón respecto de todo el borde de la línea, no solo dónde toca el césped.', en: 'The ball is out only when all of it has passed over a touchline or goal line, in the air or on the ground. If any part still overhangs the line, it remains in play. Judge the entire ball against the line’s full width, rather than only its point of contact with the turf.' },
        ],
        source: source('Regla 9.1 · Balón fuera de juego', 'Law 9.1 · Ball out of play', '109', '101', 109, 101),
      },
      {
        id: 'referee-stoppage', title: { es: 'Detención antes de una salida', en: 'Stoppage before a crossing' },
        paragraphs: [
          { es: 'El balón también queda fuera de juego cuando el árbitro detiene el encuentro. Si silba antes de que el balón cruce por completo una línea, la reanudación depende de la razón de esa detención, no de una salida que aún no ocurrió.', en: 'The ball also becomes out of play when the referee stops the match. If the whistle comes before a full line crossing, the restart follows the reason for that stoppage, rather than a crossing that had not yet happened.' },
        ],
        source: source('Regla 9.1 · Balón fuera de juego', 'Law 9.1 · Ball out of play', '109', '101', 109, 101),
      },
      {
        id: 'rebounds-and-officials', title: { es: 'Rebotes y contacto arbitral', en: 'Rebounds and match officials' },
        paragraphs: [
          { es: 'Un rebote en un poste, travesaño o banderín de esquina conserva el balón en juego si permanece en el campo. El contacto con un árbitro también permite continuar, salvo si el balón permanece en el campo y ese contacto produce un ataque prometedor, un gol directo o un cambio de posesión. En cualquiera de esos tres casos se detiene y se reanuda con balón a tierra.', en: 'A rebound from a post, crossbar or corner flag leaves the ball in play if it remains on the field. Contact with a match official also allows play to continue unless the ball stays on the field and that contact produces a promising attack, sends the ball directly into goal or changes possession. In those three cases play stops and restarts with a dropped ball.' },
        ],
        source: source('Regla 9.1–2 · Balón fuera y en juego', 'Law 9.1–2 · Ball out of and in play', '109', '101', 109, 101),
      },
    ],
  },
  {
    slug: 'throw-in-procedure', number: 15, sections: [
      {
        id: 'throw-in-setup', title: { es: 'Lugar y postura', en: 'Place and stance' },
        paragraphs: [
          { es: 'Cuando todo el balón cruza la línea de banda, saca el equipo contrario al último jugador que lo tocó. Se ejecuta desde el punto de salida, de frente al campo. Al soltar el balón, una parte de cada pie debe tocar la línea o el suelo exterior; los rivales permanecen al menos a 2 m del punto de saque.', en: 'When the whole ball crosses a touchline, the opponents of the last player to touch it take the throw from the exit point, facing the field. At release, part of each foot must touch the line or the ground outside it; opponents remain at least 2 m from the throw-in point.' },
        ],
        source: source('Regla 15.1 · Saque de banda: procedimiento', 'Law 15.1 · Throw-in: procedure', '153', '141', 153, 141),
      },
      {
        id: 'delivery-and-entry', title: { es: 'Lanzamiento y entrada en juego', en: 'Delivery and entry into play' },
        paragraphs: [
          { es: 'Se lanza con ambas manos desde detrás de la cabeza y por encima de ella. El balón entra en juego al ingresar al campo, no al abandonar las manos. Si toca el suelo fuera antes de entrar, repite el mismo equipo; si el saque se hizo incorrectamente y el balón ingresó, saca el rival. El lanzador no puede volver a tocarlo antes que otro jugador.', en: 'The ball is thrown with both hands from behind and over the head. It enters play when it enters the field, not when it leaves the hands. If it touches the ground outside before entering, the same team retakes; if an incorrectly delivered throw enters, the opponents take it. The thrower cannot touch it again before another player.' },
        ],
        source: source('Regla 15.1–2 · Procedimiento e infracciones', 'Law 15.1–2 · Procedure and offences', '153–154', '141–142', 153, 141),
      },
      {
        id: 'throw-in-delay-and-goal', title: { es: 'Demora y resultado directo', en: 'Delay and direct outcome' },
        paragraphs: [
          { es: 'Si el equipo demora injustamente, el árbitro pita, señala y cuenta visualmente cinco segundos. Si la cuenta termina sin que el balón esté en juego, el rival saca desde el mismo lugar, salvo que el jugador ya esté en el acto de lanzar: en ese caso no se le penaliza por exceder el tiempo. La amonestación por esta secuencia solo procede si después se retrasa excesivamente el saque rival. No se puede marcar directamente de banda: si entra en la meta rival hay saque de meta; en la propia, esquina.', en: 'For unfair delay, the referee whistles, signals and visibly counts down five seconds. If the count ends before the ball is in play, the opponents throw from the same place unless the player is already in the act of throwing; in that case, the player is not penalised for exceeding the time limit. A caution in this sequence applies only if the player then excessively delays the opponents’ restart. A throw cannot score directly: entry into the opponents’ goal brings a goal kick; into the thrower’s own goal, a corner.' },
        ],
        source: source('Regla 15, introducción y 15.2 · Demora y sanciones', 'Law 15, introduction and 15.2 · Delay and sanctions', '153–154', '141–142', 153, 141, countdownProtocol),
      },
    ],
  },
  {
    slug: 'goal-kick-procedure', number: 16, sections: [
      {
        id: 'goal-kick-award-and-place', title: { es: 'Cuándo se concede y dónde se coloca', en: 'Award and ball placement' },
        paragraphs: [
          { es: 'Si todo el balón cruza la línea de meta, sin gol, tras un último toque atacante, se concede saque de meta. Un jugador defensor coloca el balón inmóvil en cualquier punto del área de meta. Un saque directo puede convertirse en gol contra el rival; si entra directamente en la propia meta, hay esquina.', en: 'If the whole ball crosses the goal line without a goal after an attacker touched it last, award a goal kick. A defender places the stationary ball anywhere in the goal area. A direct kick can score against the opponents; if it enters the kicker’s own goal directly, award a corner.' },
        ],
        source: source('Regla 16, introducción y 16.1 · Saque de meta', 'Law 16, introduction and 16.1 · Goal kick', '157', '145', 157, 145),
      },
      {
        id: 'goal-kick-live-ball', title: { es: 'Rivales y balón en juego', en: 'Opponents and live ball' },
        paragraphs: [
          { es: 'Los rivales deben estar fuera del área penal hasta que el balón entre en juego. Esto ocurre al patearlo y moverlo claramente; no hace falta que salga del área. Si un rival no tuvo tiempo de salir por un saque rápido, el árbitro puede dejar continuar. Si ese rival toca o disputa el balón antes de que entre en juego, se repite; permanecer deliberadamente dentro para obtener ventaja tampoco está permitido.', en: 'Opponents must be outside the penalty area until the ball is in play. That happens when it is kicked and clearly moves; it need not leave the area. If a quick kick leaves an opponent no time to exit, play may continue. If that opponent touches or challenges for the ball before it is in play, retake it; deliberately remaining inside to gain an advantage is also prohibited.' },
        ],
        source: source('Regla 16.1–2 · Procedimiento e infracciones', 'Law 16.1–2 · Procedure and offences', '157–158', '145–146', 157, 145),
      },
      {
        id: 'goal-kick-delay-and-second-touch', title: { es: 'Demora y segundo toque', en: 'Delay and second touch' },
        paragraphs: [
          { es: 'Ante una demora injusta, el árbitro pita, señala y cuenta visualmente cinco segundos. Si la cuenta termina sin que el balón esté en juego, concede esquina al rival del lado más próximo al lugar previsto para el saque, salvo que el jugador ya esté en el acto de patear: en ese caso no se le penaliza por exceder el tiempo. La amarilla por esta secuencia solo corresponde si luego se retrasa excesivamente esa esquina. Una vez en juego, un segundo toque del ejecutor antes de otro jugador se sanciona con libre indirecto, salvo mano sancionable, que exige valorar la sanción técnica específica.', en: 'For unfair delay, the referee whistles, signals and visibly counts down five seconds. If the count ends before the ball is in play, the opponents receive a corner on the side nearest the intended goal-kick position unless the player is already in the act of kicking; in that case, the player is not penalised for exceeding the time limit. A caution in this sequence applies only for excessive delay of that corner afterward. Once in play, a second touch by the kicker before another player brings an indirect free kick, while punishable handball requires its specific technical decision.' },
        ],
        source: source('Regla 16.2 · Infracciones y sanciones', 'Law 16.2 · Offences and sanctions', '157–158', '145–146', 157, 145, countdownProtocol),
      },
    ],
  },
  {
    slug: 'corner-kick-procedure', number: 17, sections: [
      {
        id: 'corner-award-and-place', title: { es: 'Motivo y esquina correspondiente', en: 'Award and correct corner' },
        paragraphs: [
          { es: 'La esquina habitual sigue a una salida completa por la línea de meta, sin gol, con último toque defensor. La Regla también concede esquina por control del guardameta con manos o brazos durante más de ocho segundos y por demora injusta de un saque de meta tras la cuenta arbitral. Se elige el área de esquina más próxima a la salida, a la posición del guardameta sancionado o al lado donde iba a ejecutarse el saque de meta demorado, según corresponda.', en: 'The usual corner follows a complete goal-line crossing without a goal after a defender’s last touch. The Law also awards a corner for goalkeeper hand or arm control beyond eight seconds and for an unfairly delayed goal kick after the referee’s countdown. Choose the corner area nearest the crossing, the penalised goalkeeper’s position or the side of the delayed goal kick, as applicable.' },
        ],
        source: source('Regla 17, introducción y 17.1 · Saque de esquina', 'Law 17, introduction and 17.1 · Corner kick', '161', '149', 161, 149, countdownProtocol),
      },
      {
        id: 'corner-setup-and-live-ball', title: { es: 'Colocación y momento del golpeo', en: 'Setup and moment of the kick' },
        paragraphs: [
          { es: 'El balón permanece inmóvil en el área de esquina y lo patea un atacante. El banderín no se mueve. Los rivales guardan al menos 9,15 m desde el arco de esquina hasta que el balón esté en juego. Basta patearlo y moverlo claramente: puede seguir dentro del área de esquina después del toque.', en: 'An attacker kicks the stationary ball from the corner area. The flagpost stays in place. Opponents remain at least 9.15 m from the corner arc until the ball is in play. A kick and clear movement suffice: the ball may still be inside the corner area afterward.' },
        ],
        source: source('Regla 17.1 · Saque de esquina: procedimiento', 'Law 17.1 · Corner kick: procedure', '161', '149', 161, 149),
      },
      {
        id: 'corner-outcomes', title: { es: 'Gol directo e infracciones', en: 'Direct goal and offences' },
        paragraphs: [
          { es: 'Puede marcarse directamente contra el rival. Si el saque entra directamente en la meta propia, el rival recibe esquina. El ejecutor no puede jugar de nuevo antes de que otro jugador toque el balón: un segundo toque ordinario implica libre indirecto, y una mano sancionable exige la decisión específica de libre directo o penal según lugar y jugador. Las demás infracciones del procedimiento requieren repetir el saque.', en: 'A corner can score directly against the opponents. If it enters the kicker’s own goal directly, the opponents receive a corner. The kicker may not play it again before another player touches it: an ordinary second touch brings an indirect free kick, while punishable handball calls for the applicable direct free kick or penalty decision according to place and player. Other procedure offences require a retake.' },
        ],
        source: source('Regla 17, introducción y 17.2 · Infracciones y sanciones', 'Law 17, introduction and 17.2 · Offences and sanctions', '161–162', '149–150', 161, 149),
      },
    ],
  },
];
