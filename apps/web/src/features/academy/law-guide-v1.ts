import type { AcademyLocale } from './catalog-ui-v1-data';

type Localized = Readonly<Record<AcademyLocale, string>>;
type KeyPoint = Readonly<{ title: Localized; body: Localized }>;
type GuideCopy = Readonly<{
  number: number; introduction: Localized; explanation: Localized;
  keyPoints: readonly KeyPoint[]; figureCaption: Localized;
}>;

const guides: readonly GuideCopy[] = [
  {
    number: 1,
    introduction: { es: 'El terreno define dónde se juega y qué significa cada línea para las decisiones arbitrales.', en: 'The field defines where play takes place and what each marking means for match decisions.' },
    explanation: { es: 'Las líneas forman parte de las áreas que delimitan. Por eso, para juzgar si una acción ocurrió dentro del área penal o si el balón salió, importa la ubicación completa respecto de la línea correspondiente.', en: 'Boundary lines belong to the areas they mark. To judge whether an action happened inside the penalty area or whether the ball left the field, its position relative to the relevant line matters.' },
    keyPoints: [
      { title: { es: 'Superficie y medidas', en: 'Surface and dimensions' }, body: { es: 'El terreno debe respetar la forma y los rangos reglamentarios; la competición puede fijar dimensiones dentro de esos límites.', en: 'The field must meet the required shape and permitted ranges; a competition may choose dimensions within them.' } },
      { title: { es: 'Líneas y áreas', en: 'Lines and areas' }, body: { es: 'Las líneas de banda y de meta delimitan el juego. El área penal, el área de meta, el círculo central y las esquinas cumplen funciones distintas.', en: 'Touchlines and goal lines bound play. The penalty area, goal area, centre circle and corners each serve different purposes.' } },
      { title: { es: 'Arcos y seguridad', en: 'Goals and safety' }, body: { es: 'Los arcos deben estar colocados y asegurados conforme a la Regla; otros elementos del campo también deben ser seguros.', en: 'Goals must be positioned and secured as the Law requires; other field equipment must also be safe.' } },
    ],
    figureCaption: { es: 'líneas y zonas del terreno', en: 'field markings and zones' },
  },
  {
    number: 2,
    introduction: { es: 'El balón debe reunir condiciones concretas para que el juego sea justo y pueda continuar.', en: 'The ball must meet defined conditions so play is fair and can continue.' },
    explanation: { es: 'La Regla fija sus características y explica qué hacer si deja de estar en condiciones durante el juego o una reanudación. El momento de la falla determina cómo se vuelve a jugar.', en: 'The Law sets the ball’s characteristics and explains what happens if it becomes defective during play or at a restart. The timing of the defect affects how play resumes.' },
    keyPoints: [
      { title: { es: 'Características', en: 'Characteristics' }, body: { es: 'Forma, material, tamaño, peso y presión deben estar dentro de los límites de la edición aplicable.', en: 'Shape, material, size, weight and pressure must fall within the limits of the applicable edition.' } },
      { title: { es: 'Balón defectuoso', en: 'Defective ball' }, body: { es: 'Si el balón se deteriora mientras está en juego, el árbitro detiene el partido y aplica la reanudación prevista para ese caso.', en: 'If the ball becomes defective during play, the referee stops the match and uses the restart specified for that situation.' } },
      { title: { es: 'Reemplazo controlado', en: 'Controlled replacement' }, body: { es: 'No se cambia el balón sin autorización arbitral; las competiciones pueden usar balones adicionales bajo condiciones.', en: 'The ball is not changed without the referee’s permission; competitions may use additional balls under conditions.' } },
    ],
    figureCaption: { es: 'balón y control de sus condiciones', en: 'ball and condition checks' },
  },
  {
    number: 3,
    introduction: { es: 'La Regla 3 organiza quién puede participar y cómo se realizan las sustituciones.', en: 'Law 3 governs who may take part and how substitutions are made.' },
    explanation: { es: 'Antes y durante el partido hay que distinguir jugadores, suplentes y personas ajenas. La cantidad de sustituciones y sus oportunidades dependen de la competición y del tipo de encuentro; el procedimiento de salida y entrada sigue siendo una responsabilidad arbitral.', en: 'Before and during a match, players, substitutes and outside agents must be distinguished. The number of substitutions and opportunities depends on the competition and match type; the exit and entry procedure still requires referee control.' },
    keyPoints: [
      { title: { es: 'Equipos y mínimo', en: 'Teams and minimum' }, body: { es: 'Cada equipo juega con un máximo de once, incluido un guardameta. El partido no puede comenzar o continuar por debajo del mínimo reglamentario.', en: 'Each team has at most eleven players, including a goalkeeper. A match cannot start or continue below the required minimum.' } },
      { title: { es: 'Sustituciones', en: 'Substitutions' }, body: { es: 'El árbitro debe ser informado, el jugador sale por el lugar indicado y el suplente entra con autorización. La edición 2026/27 también fija un plazo de salida para el sustituido.', en: 'The referee must be informed, the player leaves as directed and the substitute enters with permission. The 2026/27 edition also sets a time limit for the replaced player to leave.' } },
      { title: { es: 'Personas adicionales', en: 'Extra persons' }, body: { es: 'Una entrada indebida puede exigir detener el juego, retirar a la persona y decidir la reanudación según su intervención.', en: 'An unauthorised entry may require stopping play, removing the person and choosing a restart according to their involvement.' } },
    ],
    figureCaption: { es: 'participantes y zona de sustitución', en: 'participants and substitution area' },
  },
  {
    number: 4,
    introduction: { es: 'El equipamiento identifica a los equipos y protege a quienes juegan.', en: 'Equipment identifies the teams and protects the people playing.' },
    explanation: { es: 'El árbitro comprueba que la indumentaria obligatoria, los colores y los accesorios cumplen la Regla. Un elemento peligroso debe retirarse o corregirse antes de volver a participar.', en: 'The referee checks required kit, colours and accessories against the Law. Dangerous equipment must be removed or corrected before the player returns.' },
    keyPoints: [
      { title: { es: 'Elementos obligatorios', en: 'Required items' }, body: { es: 'Camiseta, pantalón, medias, espinilleras y calzado forman el equipamiento básico de un jugador.', en: 'Shirt, shorts, socks, shin guards and footwear form a player’s basic equipment.' } },
      { title: { es: 'Identificación', en: 'Identification' }, body: { es: 'Los equipos y los guardametas deben distinguirse entre sí y del equipo arbitral.', en: 'Teams and goalkeepers must be distinguishable from each other and from the match officials.' } },
      { title: { es: 'Seguridad', en: 'Safety' }, body: { es: 'Se prohíben objetos peligrosos. La edición 2026/27 permite accesorios solo si no presentan peligro y están cubiertos de forma segura.', en: 'Dangerous objects are prohibited. The 2026/27 edition permits accessories only when they are safe and securely covered.' } },
    ],
    figureCaption: { es: 'equipamiento de un jugador', en: 'player equipment' },
  },
  {
    number: 5,
    introduction: { es: 'El árbitro dirige el partido y aplica las Reglas con la ayuda del equipo arbitral.', en: 'The referee controls the match and applies the Laws with help from the officiating team.' },
    explanation: { es: 'Su autoridad abarca las decisiones de juego, la disciplina, la ventaja, el tiempo y la seguridad. Algunas decisiones pueden modificarse dentro de los límites de la Regla y, cuando corresponde, con la tecnología permitida por la competición.', en: 'The referee’s authority covers play decisions, discipline, advantage, time and safety. Some decisions may be changed within the Law’s limits and, where applicable, with technology permitted by the competition.' },
    keyPoints: [
      { title: { es: 'Decidir y comunicar', en: 'Decide and communicate' }, body: { es: 'El árbitro decide sobre hechos del juego y señala las reanudaciones y sanciones de forma comprensible.', en: 'The referee decides matters of play and signals restarts and sanctions clearly.' } },
      { title: { es: 'Ventaja y control', en: 'Advantage and control' }, body: { es: 'Puede dejar seguir cuando el equipo perjudicado se beneficia, sin perder de vista la disciplina ni el control del encuentro.', en: 'The referee may allow play to continue when the offended team benefits, while still managing discipline and match control.' } },
      { title: { es: 'Salud y asistencia', en: 'Health and assistance' }, body: { es: 'Lesiones, interferencias y otras interrupciones requieren aplicar procedimientos específicos; VAR y otras tecnologías solo operan bajo sus protocolos.', en: 'Injuries, interference and other stoppages require specific procedures; VAR and other technology operate only under their protocols.' } },
    ],
    figureCaption: { es: 'árbitro y área de decisión', en: 'referee and decision area' },
  },
  {
    number: 6,
    introduction: { es: 'Los demás miembros del equipo arbitral aportan información y tareas definidas.', en: 'Other match officials provide information and carry out defined duties.' },
    explanation: { es: 'Árbitros asistentes, cuarto árbitro y otros oficiales colaboran según la designación de la competición. Su ayuda mejora el ángulo de observación, pero la decisión final en el campo corresponde al árbitro.', en: 'Assistant referees, the fourth official and other officials assist according to the competition’s appointments. Their support improves observation, while the referee retains the final on-field decision.' },
    keyPoints: [
      { title: { es: 'Asistentes', en: 'Assistants' }, body: { es: 'Ayudan a observar salidas del balón, fuera de juego, sustituciones y otras incidencias dentro de su campo de visión.', en: 'They help observe ball exits, offside, substitutions and other incidents in their field of view.' } },
      { title: { es: 'Otras funciones', en: 'Other duties' }, body: { es: 'El cuarto árbitro y los oficiales adicionales cumplen funciones concretas de control, comunicación y apoyo.', en: 'The fourth official and additional officials have specific control, communication and support duties.' } },
      { title: { es: 'Tecnología y protocolo', en: 'Technology and protocol' }, body: { es: 'Los oficiales de vídeo actúan solo cuando se usa VAR y dentro de los incidentes y pasos que permite el protocolo.', en: 'Video officials act only when VAR is used and within the incidents and steps allowed by its protocol.' } },
    ],
    figureCaption: { es: 'posiciones del equipo arbitral', en: 'officiating team positions' },
  },
  {
    number: 7,
    introduction: { es: 'La duración del partido combina períodos de juego, intervalo y tiempo añadido.', en: 'Match duration combines periods of play, an interval and added time.' },
    explanation: { es: 'El tiempo nominal no siempre coincide con el tiempo realmente jugado. El árbitro registra pérdidas por sustituciones, lesiones, sanciones, revisiones y otras demoras, y decide cuánto añadir a cada período.', en: 'Nominal time is not always the time actually played. The referee accounts for time lost to substitutions, injuries, sanctions, reviews and other delays, then determines the allowance for each period.' },
    keyPoints: [
      { title: { es: 'Períodos e intervalo', en: 'Periods and interval' }, body: { es: 'Habitualmente hay dos períodos iguales y un descanso; las condiciones de competición pueden establecer las variaciones admitidas.', en: 'There are normally two equal periods and a half-time interval; competition rules may set permitted variations.' } },
      { title: { es: 'Tiempo perdido', en: 'Time lost' }, body: { es: 'El tiempo añadido compensa las interrupciones previstas en la Regla y puede ampliarse si aparecen nuevas demoras.', en: 'Added time accounts for the stoppages listed in the Law and may increase if further delays occur.' } },
      { title: { es: 'Final del período', en: 'End of a period' }, body: { es: 'La Regla contempla la extensión necesaria para ejecutar o repetir un penal al final de un período.', en: 'The Law allows the time needed to take or retake a penalty kick at the end of a period.' } },
    ],
    figureCaption: { es: 'períodos y tiempo añadido', en: 'periods and added time' },
  },
  {
    number: 8,
    introduction: { es: 'El saque inicial y el balón a tierra ponen la pelota otra vez en juego en situaciones distintas.', en: 'A kick-off and a dropped ball put the ball back in play in different situations.' },
    explanation: { es: 'El saque inicial abre cada período y reanuda después de un gol. El balón a tierra se usa cuando el árbitro detiene el juego y ninguna otra reanudación corresponde; su destinatario y lugar dependen de dónde y cómo se interrumpió.', en: 'A kick-off opens each period and follows a goal. A dropped ball is used when the referee stops play and no other restart applies; its recipient and location depend on where and how play stopped.' },
    keyPoints: [
      { title: { es: 'Saque inicial', en: 'Kick-off' }, body: { es: 'Los jugadores deben ocupar las posiciones reglamentarias y el balón entra en juego cuando se patea y se mueve claramente.', en: 'Players take the required positions, and the ball is in play when kicked and clearly moves.' } },
      { title: { es: 'Balón a tierra', en: 'Dropped ball' }, body: { es: 'Se entrega a un jugador del equipo que corresponde según la situación, con los demás a la distancia exigida.', en: 'It is dropped for one player of the team identified by the situation, with other players at the required distance.' } },
      { title: { es: 'Interferencia', en: 'Interference' }, body: { es: 'La edición 2026/27 aclara la reanudación cuando intervienen el árbitro o un agente externo y cómo identificar al equipo que habría obtenido la posesión.', en: 'The 2026/27 edition clarifies the restart when the referee or an outside agent interferes and how to identify the team that would have gained possession.' } },
    ],
    figureCaption: { es: 'centro del campo y reanudación', en: 'centre of the field and restart' },
  },
  {
    number: 9,
    introduction: { es: 'La pelota puede seguir en juego aunque toque líneas, postes, travesaño u oficiales.', en: 'The ball can remain in play after touching lines, posts, the crossbar or officials.' },
    explanation: { es: 'El punto decisivo en los límites es si el balón cruzó por completo la línea de banda o de meta. También deja de estar en juego cuando el árbitro detiene el partido; algunos contactos con oficiales tienen una respuesta especial.', en: 'At the boundaries, the decisive question is whether the whole ball crossed the touchline or goal line. The ball is also out of play when the referee stops the match; certain contacts with officials have a special response.' },
    keyPoints: [
      { title: { es: 'Salida completa', en: 'Whole ball over the line' }, body: { es: 'Una parte del balón sobre la línea basta para que siga en juego.', en: 'If any part of the ball remains over the line, it remains in play.' } },
      { title: { es: 'Rebotes', en: 'Rebounds' }, body: { es: 'Un rebote en el arco, el banderín o un miembro del equipo arbitral no detiene automáticamente el juego.', en: 'A rebound from the goal frame, corner flag or a match official does not automatically stop play.' } },
      { title: { es: 'Contacto con un oficial', en: 'Contact with an official' }, body: { es: 'Cuando ese contacto produce ciertos cambios relevantes de posesión, ataque o gol, el árbitro detiene y reanuda conforme a la Regla.', en: 'When that contact produces certain significant changes of possession, attack or a goal, the referee stops and restarts under the Law.' } },
    ],
    figureCaption: { es: 'balón y línea de juego', en: 'ball and boundary line' },
  },
  {
    number: 10,
    introduction: { es: 'Un gol y el resultado del partido tienen criterios propios que no dependen solo de dónde termina el balón.', en: 'A goal and a match result have their own criteria beyond where the ball finishes.' },
    explanation: { es: 'Para conceder un gol, el balón debe cruzar completamente la línea de meta entre los postes y bajo el travesaño, sin una infracción previa del equipo anotador. Si la competición necesita un ganador, puede establecer los procedimientos permitidos para decidirlo.', en: 'A goal requires the whole ball to cross the goal line between the posts and under the crossbar without a prior offence by the scoring team. If a competition needs a winner, it may set permitted procedures to decide one.' },
    keyPoints: [
      { title: { es: 'Gol válido', en: 'Valid goal' }, body: { es: 'La ubicación de todo el balón y la ausencia de infracción del equipo atacante son las dos preguntas principales.', en: 'The position of the whole ball and absence of an offence by the attacking team are the main questions.' } },
      { title: { es: 'Resultado', en: 'Result' }, body: { es: 'Gana el equipo con más goles; un empate puede permanecer o resolverse según el reglamento de la competición.', en: 'The team with more goals wins; a draw may stand or be resolved under competition rules.' } },
      { title: { es: 'Definir un ganador', en: 'Determine a winner' }, body: { es: 'Prórroga y tanda de penales son procedimientos posibles; la tanda tiene reglas propias y no suma goles al marcador del partido.', en: 'Extra time and a penalty shoot-out are possible procedures; the shoot-out has its own rules and does not add goals to the match score.' } },
    ],
    figureCaption: { es: 'línea de meta y definición del resultado', en: 'goal line and match outcome' },
  },
  {
    number: 11,
    introduction: { es: 'Estar adelantado no es, por sí solo, cometer una infracción de fuera de juego.', en: 'Being in an offside position is not, by itself, an offside offence.' },
    explanation: { es: 'Primero se determina la posición en el instante en que un compañero juega o toca el balón. Después se observa si el jugador participa en el juego, interfiere con un adversario o obtiene ventaja de esa posición.', en: 'First determine the player’s position when a team-mate plays or touches the ball. Then observe whether the player interferes with play, interferes with an opponent or gains an advantage from that position.' },
    keyPoints: [
      { title: { es: 'Momento y posición', en: 'Moment and position' }, body: { es: 'La referencia temporal es el toque del compañero; se compara al atacante con el balón y el penúltimo adversario en la mitad rival.', en: 'The time reference is the team-mate’s touch; compare the attacker with the ball and second-last opponent in the opponents’ half.' } },
      { title: { es: 'Participación activa', en: 'Active involvement' }, body: { es: 'La infracción aparece al intervenir de una de las formas definidas por la Regla, no por ocupar únicamente esa posición.', en: 'An offence occurs through one of the Law’s forms of involvement, not solely by occupying that position.' } },
      { title: { es: 'Reanudaciones excluidas', en: 'Excluded restarts' }, body: { es: 'No hay infracción de fuera de juego al recibir directamente un saque de meta, de banda o de esquina.', en: 'There is no offside offence when receiving the ball directly from a goal kick, throw-in or corner kick.' } },
    ],
    figureCaption: { es: 'posición del atacante y línea de referencia', en: 'attacker position and reference line' },
  },
  {
    number: 12,
    introduction: { es: 'Las faltas y la conducta incorrecta exigen separar la infracción, el reinicio y la posible sanción personal.', en: 'Fouls and misconduct require separating the offence, the restart and any personal sanction.' },
    explanation: { es: 'Una acción puede dar lugar a tiro libre directo, indirecto o penal según la conducta y el lugar. La gravedad y el contexto determinan si además corresponde advertencia, amonestación o expulsión.', en: 'An action may lead to a direct free kick, indirect free kick or penalty depending on conduct and location. Severity and context determine whether a warning, caution or sending-off also applies.' },
    keyPoints: [
      { title: { es: 'Tipo de infracción', en: 'Type of offence' }, body: { es: 'Identificá primero la conducta y si hubo contacto; eso orienta el reinicio técnico correcto.', en: 'Identify the conduct and whether contact occurred first; this guides the correct technical restart.' } },
      { title: { es: 'Gravedad y disciplina', en: 'Severity and discipline' }, body: { es: 'Una disputa imprudente, temeraria o con fuerza excesiva recibe respuestas distintas. También importan otros motivos de amonestación o expulsión.', en: 'A careless, reckless or excessive-force challenge has different consequences. Other caution and sending-off offences also matter.' } },
      { title: { es: 'Contexto de juego', en: 'Match context' }, body: { es: 'El área penal, la ventaja y la oportunidad de gol pueden cambiar la decisión final, sin alterar lo que ocurrió en la jugada.', en: 'The penalty area, advantage and a goal-scoring opportunity may affect the final decision without changing what happened in the play.' } },
    ],
    figureCaption: { es: 'contacto, lugar y respuesta arbitral', en: 'contact, location and referee response' },
  },
  {
    number: 13,
    introduction: { es: 'Los tiros libres reanudan el juego después de determinadas infracciones.', en: 'Free kicks restart play after certain offences.' },
    explanation: { es: 'El árbitro distingue un tiro libre directo de uno indirecto y comprueba lugar, distancia de adversarios y forma de ejecución. La diferencia importa especialmente para saber si un gol puede convertirse directamente.', en: 'The referee distinguishes a direct from an indirect free kick and checks location, opponent distance and execution. The difference matters especially for whether a goal can be scored directly.' },
    keyPoints: [
      { title: { es: 'Directo e indirecto', en: 'Direct and indirect' }, body: { es: 'Un tiro directo puede entrar directamente en el arco rival; uno indirecto requiere que otro jugador toque el balón para que ese gol sea válido.', en: 'A direct free kick may score directly against the opponents; an indirect one needs another player to touch the ball for such a goal to count.' } },
      { title: { es: 'Lugar y barrera', en: 'Location and wall' }, body: { es: 'La posición del balón, la distancia de adversarios y las excepciones dentro de áreas deben revisarse antes de reanudar.', en: 'Ball position, opponent distance and exceptions inside the areas must be checked before the restart.' } },
      { title: { es: 'Balón en juego', en: 'Ball in play' }, body: { es: 'En general, queda en juego cuando se patea y se mueve claramente; el ejecutante no puede volver a tocarlo antes de otro jugador.', en: 'In general, it is in play when kicked and clearly moves; the kicker may not touch it again before another player does.' } },
    ],
    figureCaption: { es: 'balón, barrera y dirección del tiro', en: 'ball, wall and kick direction' },
  },
  {
    number: 14,
    introduction: { es: 'El penal tiene un lugar, participantes y secuencia de ejecución propios.', en: 'A penalty kick has its own location, participants and sequence.' },
    explanation: { es: 'Se concede por una infracción de tiro libre directo del equipo defensor dentro de su área penal, con las condiciones precisas de la Regla. Antes de la señal se ordenan balón, ejecutante, guardameta y demás jugadores; después se evalúa cualquier infracción y el resultado del remate.', en: 'It is awarded for a direct free kick offence by the defending team inside its penalty area, subject to the Law’s conditions. Before the signal, ball, kicker, goalkeeper and other players take their positions; after the kick, any offence and its outcome are assessed.' },
    keyPoints: [
      { title: { es: 'Preparación', en: 'Preparation' }, body: { es: 'El balón va en el punto penal, se identifica al ejecutante y el guardameta ocupa la posición exigida.', en: 'The ball is placed on the penalty mark, the kicker is identified and the goalkeeper takes the required position.' } },
      { title: { es: 'Ejecución', en: 'Execution' }, body: { es: 'Tras la señal, el balón se patea hacia delante y entra en juego al moverse claramente; el ejecutante espera otro toque antes de jugarlo de nuevo.', en: 'After the signal, the ball is kicked forward and is in play when clearly moving; the kicker waits for another touch before playing it again.' } },
      { title: { es: 'Infracciones', en: 'Offences' }, body: { es: 'La consecuencia de una invasión, una infracción del guardameta o un segundo toque depende de quién la cometió y de qué ocurrió con el remate.', en: 'The consequence of encroachment, a goalkeeper offence or a second touch depends on who offended and what happened to the kick.' } },
    ],
    figureCaption: { es: 'disposición antes del penal', en: 'positions before a penalty kick' },
  },
  {
    number: 15,
    introduction: { es: 'El saque de banda devuelve el balón al juego desde una línea lateral.', en: 'A throw-in returns the ball to play from a touchline.' },
    explanation: { es: 'Normalmente se concede al equipo contrario al último jugador que tocó el balón antes de que saliera completamente por la banda. Una demora sancionada puede transferir el saque. El lugar y la técnica del lanzamiento forman parte del procedimiento.', en: 'It is normally awarded to the opponents of the player who last touched the ball before it wholly crossed a touchline. A penalised delay can transfer the throw-in. Its location and throwing technique form part of the procedure.' },
    keyPoints: [
      { title: { es: 'A quién corresponde', en: 'Who takes it' }, body: { es: 'En la salida normal por banda, reanuda el rival del último jugador que tocó el balón; la demora tiene una consecuencia distinta.', en: 'For a normal touchline exit, the opponents of the last player to touch the ball restart; delay has a different consequence.' } },
      { title: { es: 'Forma del saque', en: 'Throwing procedure' }, body: { es: 'El ejecutante mira al campo y lanza con ambas manos desde detrás y por encima de la cabeza, con los pies colocados conforme a la Regla.', en: 'The thrower faces the field and delivers the ball with both hands from behind and over the head, with feet placed as the Law requires.' } },
      { title: { es: 'Evitar demoras', en: 'Avoiding delay' }, body: { es: 'La edición 2026/27 permite una cuenta atrás arbitral de cinco segundos ante una demora; superarla cambia la posesión del saque.', en: 'The 2026/27 edition allows a referee’s five-second countdown for delay; exceeding it transfers the throw-in to the opponents.' } },
    ],
    figureCaption: { es: 'línea lateral y lanzamiento', en: 'touchline and throw' },
  },
  {
    number: 16,
    introduction: { es: 'El saque de meta suele reanudar cuando el atacante fue el último en tocar un balón que salió por la línea de meta sin gol.', en: 'A goal kick normally restarts play when an attacker last touched a ball that crossed the goal line without a goal.' },
    explanation: { es: 'El equipo defensor ejecuta desde su área de meta. La colocación del balón, la de los adversarios y el momento en que entra en juego permiten reconocer una reanudación válida.', en: 'The defending team takes the kick from its goal area. Ball placement, opponent positioning and the moment the ball enters play determine a valid restart.' },
    keyPoints: [
      { title: { es: 'Concesión', en: 'Award' }, body: { es: 'La salida normal exige cruce completo por la línea de meta, sin gol, tras el último toque atacante. La demora en un saque de meta ya concedido puede dar un córner al rival.', en: 'For the normal award, the whole ball crosses the goal line without a goal after an attacker’s final touch. Delay at an already awarded goal kick can give the opponents a corner.' } },
      { title: { es: 'Ejecución', en: 'Taking the kick' }, body: { es: 'El balón se coloca en cualquier punto del área de meta y entra en juego cuando se patea y se mueve claramente.', en: 'The ball is placed anywhere in the goal area and is in play when kicked and clearly moves.' } },
      { title: { es: 'Demora', en: 'Delay' }, body: { es: 'En 2026/27, una demora puede activar una cuenta atrás de cinco segundos; si se agota, el rival recibe un saque de esquina.', en: 'In 2026/27, delay may trigger a five-second countdown; if it expires, the opponents receive a corner kick.' } },
    ],
    figureCaption: { es: 'área de meta y dirección del saque', en: 'goal area and kick direction' },
  },
  {
    number: 17,
    introduction: { es: 'El saque de esquina suele seguir a un último toque defensor antes de una salida por la línea de meta sin gol; también sanciona ciertas demoras.', en: 'A corner kick normally follows a defender’s final touch before the ball crosses the goal line without a goal; it also penalises certain delays.' },
    explanation: { es: 'Además de esa salida, se concede un córner si el guardameta controla el balón con manos o brazos durante más de ocho segundos, o si se agota la cuenta atrás por demorar un saque de meta. En una salida normal, se ejecuta desde el área de esquina más cercana.', en: 'A corner is also awarded if the goalkeeper controls the ball with the hands or arms for more than eight seconds, or if the countdown for delaying a goal kick expires. After a normal goal-line exit, it is taken from the nearest corner area.' },
    keyPoints: [
      { title: { es: 'Concesión', en: 'Award' }, body: { es: 'La salida normal exige cruce completo por la línea de meta, sin gol, tras el último toque defensor. Las dos demoras descritas arriba también dan un córner.', en: 'A normal goal-line exit requires the whole ball to cross without a goal after a defender’s final touch. The two delays above also award a corner.' } },
      { title: { es: 'Ubicación', en: 'Location' }, body: { es: 'El balón permanece en el área de esquina correspondiente y los adversarios guardan la distancia reglamentaria.', en: 'The ball stays in the relevant corner area and opponents keep the required distance.' } },
      { title: { es: 'Juego y gol', en: 'Play and goal' }, body: { es: 'El balón entra en juego cuando se patea y se mueve claramente; puede marcarse directamente en el arco rival.', en: 'The ball is in play when kicked and clearly moves; a goal may be scored directly against the opponents.' } },
    ],
    figureCaption: { es: 'área de esquina y trayectoria', en: 'corner area and trajectory' },
  },
];

type PageLocator = Readonly<{ es: number; en: number }>;
const lawPageStarts: readonly PageLocator[] = [
  { es: 49, en: 45 }, { es: 59, en: 55 }, { es: 63, en: 59 },
  { es: 73, en: 67 }, { es: 81, en: 73 }, { es: 93, en: 85 },
  { es: 101, en: 93 }, { es: 105, en: 97 }, { es: 109, en: 101 },
  { es: 111, en: 103 }, { es: 117, en: 109 }, { es: 123, en: 115 },
  { es: 141, en: 131 }, { es: 145, en: 135 }, { es: 153, en: 141 },
  { es: 157, en: 145 }, { es: 161, en: 149 },
];

export type LawGuide = GuideCopy & Readonly<{
  sourceSection: Localized; sourceStartPage: PageLocator; sourcePages: Localized;
}>;

export function getLawGuide(number: number): LawGuide {
  const copy = guides[number - 1];
  const start = lawPageStarts[number - 1];
  const next = lawPageStarts[number];
  if (!copy || copy.number !== number || !start) throw new Error(`Missing Law ${number} guide`);
  const esEnd = next ? next.es - 2 : 163;
  const enEnd = next ? next.en - 2 : 151;
  return {
    ...copy,
    sourceSection: { es: `Regla ${number}`, en: `Law ${number}` },
    sourceStartPage: start,
    sourcePages: { es: `${start.es}–${esEnd}`, en: `${start.en}–${enEnd}` },
  };
}
