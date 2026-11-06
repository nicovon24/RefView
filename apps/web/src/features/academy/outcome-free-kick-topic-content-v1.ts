import type { LawSourceRef, TopicDepth } from './law-depth-contract';
import type { LawTopic } from './rules-directory-v1';

const source = (
  esSection: string,
  enSection: string,
  esPages: string,
  enPages: string,
  esStart: number,
  enStart: number,
): LawSourceRef => ({
  section: { es: esSection, en: enSection },
  pages: { es: esPages, en: enPages },
  startPage: { es: esStart, en: enStart },
});

export const outcomeFreeKickTopics202627: readonly LawTopic[] = [
  {
    slug: 'goal-and-match-result', lawsEdition: 'IFAB-2026-27', primaryLaw: 10,
    title: { es: 'Gol y resultado del partido', en: 'Goal and match result' },
    scope: { es: 'Comprobá cuándo vale un gol y cómo se determina el resultado.', en: 'Check when a goal counts and how the result is determined.' },
    explanation: { es: 'La línea de meta, el marco y las infracciones del equipo atacante importan antes de sumar un gol. El resultado se decide por los goles válidos y, si hace falta un ganador tras un empate, por los procedimientos previstos en la competición.', en: 'The goal line, frame and scoring team’s offences matter before adding a goal. Valid goals determine the result; competition rules provide the permitted ways to settle a draw when a winner is required.' },
    concepts: [
      { es: 'Balón entero entre los postes y bajo el travesaño', en: 'Whole ball between the posts and below the crossbar' },
      { es: 'Ninguna infracción del equipo que marca', en: 'No offence by the scoring team' },
      { es: 'El desempate depende del reglamento de competición', en: 'Tie-breaking depends on competition rules' },
    ],
    sourceSection: { es: 'Regla 10.1–2 · Gol y equipo ganador', en: 'Law 10.1–2 · Goal and winning team' },
    sourcePages: { es: '111–112', en: '103–104' },
  },
  {
    slug: 'penalty-shoot-out', lawsEdition: 'IFAB-2026-27', primaryLaw: 10,
    title: { es: 'Tanda de penales', en: 'Penalty shoot-out' },
    scope: { es: 'Seguí quién puede patear, cuándo termina la tanda y cómo se registra cada remate.', en: 'Track who may kick, when the shoot-out ends and how each kick is recorded.' },
    explanation: { es: 'La tanda se realiza después del partido para decidir un ganador cuando corresponde. Tiene su propio registro de goles y una lista de jugadores habilitados; el orden alternado y la posibilidad matemática de alcanzar al rival determinan su duración.', en: 'A shoot-out takes place after the match when a winner is required. It has its own kick record and eligible-player list; alternating turns and the possibility of catching the other team determine its length.' },
    concepts: [
      { es: 'Igualar la cantidad de jugadores habilitados', en: 'Equalise the number of eligible players' },
      { es: 'Cinco turnos sujetos a final anticipado', en: 'Five turns subject to early completion' },
      { es: 'Doble toque accidental: repetir si entra, fallado si no entra', en: 'Accidental double touch: retake if scored, missed if not' },
    ],
    sourceSection: { es: 'Regla 10.3 · Tanda de penales', en: 'Law 10.3 · Penalty shoot-out' },
    sourcePages: { es: '113–115', en: '105–107' },
  },
  {
    slug: 'free-kick-procedure', lawsEdition: 'IFAB-2026-27', primaryLaw: 13,
    title: { es: 'Procedimiento del tiro libre', en: 'Free-kick procedure' },
    scope: { es: 'Distinguí libre directo e indirecto, ubicación, señal y momento de entrada en juego.', en: 'Distinguish direct and indirect kicks, placement, signal and entry into play.' },
    explanation: { es: 'La clase de tiro libre define si puede marcarse sin otro toque. Su ejecución exige ubicar un balón inmóvil en el lugar indicado por la Regla y reconocer cuándo un golpeo lo pone en juego.', en: 'The type of free kick determines whether it can score without another touch. Execution requires a stationary ball at the place set by the Law and a clear moment when the kick puts it into play.' },
    concepts: [
      { es: 'Directo e indirecto tienen resultados distintos', en: 'Direct and indirect kicks have different outcomes' },
      { es: 'Brazo alzado para indicar el indirecto', en: 'Raised arm signals an indirect kick' },
      { es: 'Balón inmóvil, pateado y en claro movimiento', en: 'Stationary ball, kicked and clearly moving' },
    ],
    sourceSection: { es: 'Regla 13.1–3 · Tipos y procedimiento', en: 'Law 13.1–3 · Types and procedure' },
    sourcePages: { es: '141–143', en: '131–133' },
  },
  {
    slug: 'free-kick-distance-and-wall', lawsEdition: 'IFAB-2026-27', primaryLaw: 13,
    title: { es: 'Distancia y barrera en el tiro libre', en: 'Free-kick distance and wall' },
    scope: { es: 'Ubicá a rivales y atacantes antes de un tiro libre, incluso si se ejecuta rápido.', en: 'Position opponents and attackers before a free kick, including a quick restart.' },
    explanation: { es: 'La distancia general de los rivales y la separación de atacantes respecto de una barrera de tres o más defensores son reglas distintas. Un tiro rápido también exige distinguir la intercepción de quien estaba cerca de quien impide deliberadamente la reanudación.', en: 'The general opponent distance and attackers’ separation from a wall of three or more defenders are distinct rules. A quick kick also requires distinguishing interception by a nearby opponent from deliberate prevention of the restart.' },
    concepts: [
      { es: 'Rivales a 9,15 m, con excepciones de línea y área', en: 'Opponents 9.15 m away, with goal-line and area exceptions' },
      { es: 'Atacantes a 1 m de una barrera de tres o más', en: 'Attackers 1 m from a wall of three or more' },
      { es: 'Intercepción de tiro rápido y bloqueo deliberado no son iguales', en: 'Quick-kick interception and deliberate blocking differ' },
    ],
    sourceSection: { es: 'Regla 13.2–3 · Distancias e infracciones', en: 'Law 13.2–3 · Distance and offences' },
    sourcePages: { es: '141–143', en: '131–133' },
  },
];

export const outcomeFreeKickTopicDepths: readonly TopicDepth[] = [
  {
    slug: 'goal-and-match-result', number: 10, sections: [
      {
        id: 'goal-line-and-validity', title: { es: 'Cruce completo y validez', en: 'Complete crossing and validity' },
        paragraphs: [
          { es: 'Para conceder un gol, todo el balón debe haber superado toda la línea de meta entre los postes y por debajo del travesaño. También debe comprobarse que el equipo que marca no cometió una infracción. Una imagen del balón cerca de la línea, por sí sola, no resuelve esa segunda condición ni demuestra necesariamente el cruce completo.', en: 'To award a goal, the whole ball must pass beyond the whole goal line between the posts and below the crossbar. The scoring team must also have committed no offence. An image of the ball near the line alone neither settles that second condition nor necessarily proves complete crossing.' },
        ],
        source: source('Regla 10.1 · Gol marcado', 'Law 10.1 · Goal scored', '111', '103', 111, 103),
      },
      {
        id: 'unusual-goal-outcomes', title: { es: 'Dos resultados excepcionales', en: 'Two exceptional outcomes' },
        paragraphs: [
          { es: 'Si un guardameta lanza el balón con la mano directamente a la meta rival, el reinicio es saque de meta, no gol. Si el árbitro señala gol antes de que el balón cruce por completo la línea, el juego se reanuda con balón a tierra. En ambos casos importa el hecho concreto observado, no la impresión de que la jugada terminaría en gol.', en: 'If a goalkeeper throws the ball directly into the opponents’ goal, the restart is a goal kick, not a goal. If the referee signals a goal before the ball has completely crossed the line, play restarts with a dropped ball. In both cases the actual observed event matters, rather than an expectation that the move would end in a goal.' },
        ],
        source: source('Regla 10.1 · Gol marcado', 'Law 10.1 · Goal scored', '111', '103', 111, 103),
      },
      {
        id: 'result-and-tie', title: { es: 'Resultado y desempate', en: 'Result and tie-break' },
        paragraphs: [
          { es: 'Gana el equipo con más goles válidos; si ambos tienen la misma cantidad, incluso cero, el partido termina empatado. Cuando el reglamento de competición exige un ganador después de un empate o una eliminatoria de ida y vuelta, puede disponer la regla de goles fuera de casa, dos períodos iguales de prórroga de hasta quince minutos cada uno, una tanda de penales o una combinación permitida.', en: 'The team with more valid goals wins; equal totals, including nil each, mean a drawn match. When competition rules require a winner after a draw or a home-and-away tie, they may use away goals, two equal extra-time periods of no more than fifteen minutes each, a penalty shoot-out or a permitted combination.' },
        ],
        source: source('Regla 10.2 · Equipo ganador', 'Law 10.2 · Winning team', '111–112', '103–104', 111, 103),
      },
    ],
  },
  {
    slug: 'penalty-shoot-out', number: 10, sections: [
      {
        id: 'eligible-players', title: { es: 'Quiénes participan', en: 'Who takes part' },
        paragraphs: [
          { es: 'La tanda se disputa una vez terminado el partido y su registro no modifica el marcador del encuentro. Pueden participar quienes estaban en el campo o temporalmente fuera por un motivo permitido al finalizarlo; una expulsión durante el partido excluye al jugador. Si un equipo tiene más habilitados, reduce su lista hasta igualar la del rival e informa al árbitro quiénes quedan excluidos.', en: 'The shoot-out takes place after the match and its record does not alter the match score. Players on the field, or temporarily off it for an allowed reason at the final whistle, may take part; a match sending-off excludes a player. If one team has more eligible players, it reduces its list to match the other team and tells the referee who is excluded.' },
          { es: 'Un guardameta que no puede continuar tiene una excepción de reemplazo: puede entrar un jugador excluido para igualar números o, si queda un cupo de sustitución, un suplente designado. El guardameta reemplazado deja de participar; si ya pateó, quien lo reemplaza espera a la siguiente ronda para patear.', en: 'A goalkeeper unable to continue has a replacement exception: an excluded player may take over, or a named substitute if the team has an unused substitution allowance. The replaced goalkeeper takes no further part; if they have kicked already, their replacement waits until the next round to kick.' },
        ],
        source: source('Regla 10.3 · Antes de la tanda y sustituciones', 'Law 10.3 · Before the shoot-out and replacements', '113–115', '105–107', 113, 105),
      },
      {
        id: 'kick-order-and-finish', title: { es: 'Orden y final de la tanda', en: 'Kick order and completion' },
        paragraphs: [
          { es: 'Los equipos patean alternadamente. Cada remate corresponde a un jugador distinto hasta que todos los habilitados de su equipo hayan pateado una vez. La serie inicial puede acabar antes de completar cinco remates por equipo si uno ya no puede alcanzar al otro con los turnos que le restan.', en: 'Teams take alternating kicks. A different player takes each kick until every eligible player on that team has kicked once. The initial series can end before each team completes five kicks if one can no longer catch the other with its remaining turns.' },
          { es: 'Si ambos equipos completan cinco y siguen igualados, se continúa hasta que uno tenga un gol más después del mismo número de remates. En vueltas posteriores se conserva ese criterio, aunque cada equipo puede cambiar el orden de sus ejecutores.', en: 'If both complete five and remain level, kicks continue until one leads after the same number of kicks. That equal-number comparison still governs later rounds, although each team may change the order of its kickers.' },
        ],
        source: source('Regla 10.3 · Orden y finalización', 'Law 10.3 · Order and completion', '114–115', '106–107', 114, 106),
      },
      {
        id: 'kick-completion-and-offences', title: { es: 'Final del remate e infracciones', en: 'Kick completion and offences' },
        paragraphs: [
          { es: 'El remate termina cuando el balón deja de moverse, sale del juego o el árbitro detiene la acción por una infracción. Quien patea no puede jugar deliberadamente el balón por segunda vez. Si accidentalmente lo golpea con ambos pies a la vez o el balón toca su pierna o pie de apoyo inmediatamente después del golpeo, se repite el remate si entra directamente en la meta; si no entra, se registra como fallado.', en: 'A kick ends when the ball stops, leaves play or the referee stops play for an offence. The kicker may not deliberately play it a second time. If they accidentally strike it with both feet together, or it immediately touches their non-kicking foot or leg, retake the kick if it enters the goal from that kick; otherwise record it as missed.' },
          { es: 'Las amonestaciones y advertencias del partido no se trasladan a la tanda. Las infracciones durante ella se juzgan según sus propias condiciones; por ejemplo, si una infracción del guardameta obliga a repetir, se le advierte la primera vez y se le amonesta en las siguientes.', en: 'Match cautions and warnings do not carry into the shoot-out. Offences during it follow their own conditions; for example, if a goalkeeper offence causes a retake, the goalkeeper is warned on the first occasion and cautioned on later ones.' },
        ],
        source: source('Regla 10.3 · Ejecución e infracciones', 'Law 10.3 · Kicks and offences', '114–115', '106–107', 114, 106),
      },
    ],
  },
  {
    slug: 'free-kick-procedure', number: 13, sections: [
      {
        id: 'types-signal-and-goals', title: { es: 'Tipo, señal y resultado directo', en: 'Type, signal and direct outcome' },
        paragraphs: [
          { es: 'Un tiro libre directo puede convertirse en gol si entra directamente en la meta rival. Si el tiro es indirecto y entra allí sin tocar a otro jugador, se concede saque de meta. Si cualquiera de los dos entra directamente en la meta del propio equipo, corresponde saque de esquina para el rival.', en: 'A direct free kick can score if it enters the opponents’ goal directly. If an indirect kick enters that goal without another player touching it, award a goal kick. If either type enters the kicker’s own goal directly, award the opponents a corner.' },
          { es: 'El árbitro indica el tiro indirecto con un brazo por encima de la cabeza y mantiene la señal hasta que, después del golpeo, otro jugador toque el balón, este salga del juego o ya sea claro que no puede marcarse directamente. Si omite la señal y el balón entra directamente en la meta rival, se repite el tiro libre indirecto.', en: 'The referee signals an indirect kick with an arm above the head and keeps it raised until, after the kick, another player touches the ball, it leaves play or a direct goal is clearly impossible. If the referee omits the signal and the ball enters the opponents’ goal directly, the indirect kick is retaken.' },
        ],
        source: source('Regla 13.1 · Tipos de tiro libre', 'Law 13.1 · Types of free kick', '141', '131', 141, 131),
      },
      {
        id: 'place-and-live-ball', title: { es: 'Lugar y entrada en juego', en: 'Place and entry into play' },
        paragraphs: [
          { es: 'Como regla general, el tiro se ejecuta donde ocurrió la infracción. Un indirecto atacante por una infracción dentro del área de meta rival se desplaza al punto más cercano de la línea del área de meta paralela a la línea de meta. Un libre defensor dentro de su propia área de meta puede patearse desde cualquier punto de esa área; otras Reglas también fijan ubicaciones específicas.', en: 'As a general rule, take the kick where the offence occurred. An attacking indirect kick for an offence inside the opponents’ goal area moves to the nearest point on the goal-area line parallel to the goal line. A defending free kick inside its own goal area may be taken anywhere in that area; other Laws also specify particular locations.' },
          { es: 'El balón debe estar inmóvil antes del golpeo. Entra en juego cuando se patea y se mueve claramente; no necesita salir del área penal ni recorrer una distancia determinada. Puede elevarse con uno o ambos pies.', en: 'The ball must be stationary before the kick. It is in play when kicked and clearly moving; it need not leave the penalty area or travel a set distance. It may be lifted with one or both feet.' },
        ],
        source: source('Regla 13.2 · Procedimiento', 'Law 13.2 · Procedure', '141–142', '131–132', 141, 131),
      },
      {
        id: 'second-touch', title: { es: 'Segundo toque del ejecutor', en: 'Kicker’s second touch' },
        paragraphs: [
          { es: 'Después de poner el balón en juego, el ejecutor debe esperar a que lo toque otro jugador antes de volver a jugarlo. Un segundo toque ordinario se sanciona con tiro libre indirecto para el rival. Un rebote en el poste o travesaño no cuenta como toque de otro jugador.', en: 'Once the ball is in play, the kicker must wait for another player to touch it before playing it again. An ordinary second touch gives the opponents an indirect free kick. A rebound from a post or crossbar does not count as another player’s touch.' },
          { es: 'Si ese segundo contacto es una infracción de mano, corresponde libre directo o penal según el lugar. Si la mano infractora es del guardameta ejecutor dentro de su propia área penal, se concede libre indirecto. La posible medida disciplinaria depende de lo que impida esa acción, no de la mera existencia del segundo toque.', en: 'If that second contact is a handball offence, award a direct free kick or penalty according to its location. If the offending hand belongs to the goalkeeper who took the kick inside their own penalty area, award an indirect free kick. Any disciplinary action depends on what the act prevents, rather than the second touch alone.' },
        ],
        source: source('Regla 13.3 · Infracciones y sanciones', 'Law 13.3 · Offences and sanctions', '142–143', '132–133', 142, 132),
      },
    ],
  },
  {
    slug: 'free-kick-distance-and-wall', number: 13, sections: [
      {
        id: 'opponent-distance', title: { es: 'Distancia del rival', en: 'Opponent distance' },
        paragraphs: [
          { es: 'Hasta que el balón esté en juego, los rivales deben estar al menos a 9,15 m de él, salvo si permanecen sobre su propia línea de meta entre los postes. En un libre ejecutado dentro del área penal rival, también deben permanecer fuera del área. Si un rival invade la distancia al ejecutarse el tiro, se repite salvo que pueda aplicarse ventaja.', en: 'Until the ball is in play, opponents must stay at least 9.15 m from it, unless standing on their own goal line between the posts. For a free kick taken inside their penalty area, they must also stay outside that area. If an opponent encroaches when the kick is taken, retake it unless advantage can be applied.' },
        ],
        source: source('Regla 13.2–3 · Distancia y sanciones', 'Law 13.2–3 · Distance and sanctions', '142–143', '132–133', 142, 132),
      },
      {
        id: 'three-player-wall', title: { es: 'Barrera de tres o más', en: 'Wall of three or more' },
        paragraphs: [
          { es: 'Cuando tres o más defensores forman una barrera, todos los atacantes deben ubicarse al menos a 1 m de ella hasta que el balón esté en juego. La restricción nace por la barrera de ese tamaño, no por cualquier grupo de defensores. Si un atacante está a menos de 1 m al ejecutarse el tiro, se concede libre indirecto al equipo defensor.', en: 'When three or more defenders form a wall, all attackers must remain at least 1 m from it until the ball is in play. The restriction depends on a wall of that size, not simply any group of defenders. If an attacker is within 1 m when the kick is taken, award the defending team an indirect free kick.' },
        ],
        source: source('Regla 13.2–3 · Barrera e infracción atacante', 'Law 13.2–3 · Wall and attacking offence', '142–143', '132–133', 142, 132),
      },
      {
        id: 'quick-kicks-and-area', title: { es: 'Tiro rápido y excepciones del área', en: 'Quick kicks and penalty-area exceptions' },
        paragraphs: [
          { es: 'Si un equipo elige patear rápido y un rival que aún está a menos de 9,15 m intercepta el balón, el juego continúa. Es distinto impedir deliberadamente que el libre se ejecute rápido: esa conducta se amonesta por retrasar la reanudación. La elección de jugar rápido no elimina el requisito de que el balón esté inmóvil al patearlo.', en: 'If a team chooses to kick quickly and an opponent still within 9.15 m intercepts the ball, play continues. Deliberately preventing a quick kick is different: caution that opponent for delaying the restart. Choosing a quick kick does not remove the requirement for a stationary ball at the moment of the kick.' },
          { es: 'En un libre defensor dentro de su área penal, puede continuarse si un rival no tuvo tiempo de salir. Si ese rival toca o disputa el balón antes de que esté en juego, se repite el tiro. Permanecer deliberadamente dentro o entrar antes del golpeo para obtener ventaja tampoco puede beneficiar al rival.', en: 'For a defending free kick inside its penalty area, play may continue if an opponent had no time to leave. If that opponent touches or challenges for the ball before it is in play, retake the kick. Deliberately staying inside or entering before the kick to gain an advantage cannot benefit the opponent either.' },
        ],
        source: source('Regla 13.3 · Tiros rápidos e infracciones en el área', 'Law 13.3 · Quick kicks and penalty-area offences', '142–143', '132–133', 142, 132),
      },
    ],
  },
];
