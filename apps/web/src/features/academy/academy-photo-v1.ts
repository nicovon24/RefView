import type { AcademyLocale } from './catalog-ui-v1-data';

type Localized = Readonly<Record<AcademyLocale, string>>;

export type AcademyPhotoDetails = Readonly<{
  src: string;
  alt: Localized;
  observe: Localized;
}>;

const lawPhotos: Readonly<Record<number, AcademyPhotoDetails>> = {
  1: { src: '/assets/academy/law-photos/law-01.png', alt: { es: 'Vista ilustrativa de un terreno de fútbol con sus líneas y porterías.', en: 'Illustrative view of a football pitch with its markings and goals.' }, observe: { es: 'Observá cómo las líneas delimitan el terreno y las áreas.', en: 'Notice how the markings define the field and its areas.' } },
  2: { src: '/assets/academy/law-photos/law-02.png', alt: { es: 'Escena ilustrativa de un balón de fútbol sobre el terreno de juego.', en: 'Illustrative scene of a football on the field of play.' }, observe: { es: 'El aspecto del balón no permite verificar sus medidas o presión.', en: 'A ball’s appearance alone cannot confirm its size or pressure.' } },
  3: { src: '/assets/academy/law-photos/law-03.png', alt: { es: 'Escena ilustrativa de dos futbolistas junto a la línea de banda durante una sustitución.', en: 'Illustrative scene of two footballers beside the touchline during a substitution.' }, observe: { es: 'Diferenciá jugadores en el terreno y sustitutos fuera de él.', en: 'Distinguish players on the field from substitutes off it.' } },
  4: { src: '/assets/academy/law-photos/law-04.png', alt: { es: 'Escena ilustrativa de futbolistas con su equipamiento de juego.', en: 'Illustrative scene of footballers wearing match equipment.' }, observe: { es: 'La revisión de seguridad también incluye elementos que una foto puede ocultar.', en: 'A safety check also covers equipment a photograph may conceal.' } },
  5: { src: '/assets/academy/law-photos/law-05.png', alt: { es: 'Escena ilustrativa de un árbitro que muestra una tarjeta amarilla a un futbolista.', en: 'Illustrative scene of a referee showing a yellow card to a footballer.' }, observe: { es: 'Una señal arbitral se interpreta junto con el contexto de juego.', en: 'Interpret a referee’s signal together with the playing context.' } },
  6: { src: '/assets/academy/law-photos/law-06.png', alt: { es: 'Escena ilustrativa de un árbitro asistente junto a una línea de banda.', en: 'Illustrative scene of an assistant referee beside a touchline.' }, observe: { es: 'Ubicá la perspectiva y la función del integrante del equipo arbitral.', en: 'Notice the match official’s viewpoint and role.' } },
  7: { src: '/assets/academy/law-photos/law-07.png', alt: { es: 'Escena ilustrativa de un partido de fútbol en curso.', en: 'Illustrative scene of a football match in progress.' }, observe: { es: 'La imagen no indica el tiempo oficial ni cuánto se añadirá.', en: 'The image does not establish the official time or added time.' } },
  8: { src: '/assets/academy/law-photos/law-08.png', alt: { es: 'Escena ilustrativa de futbolistas cerca del centro del terreno de juego.', en: 'Illustrative scene of footballers near the centre of the field.' }, observe: { es: 'Para evaluar un saque inicial, comprobá posiciones y movimiento del balón.', en: 'To assess a kick-off, check positions and the ball’s movement.' } },
  9: { src: '/assets/academy/law-photos/law-09.png', alt: { es: 'Escena ilustrativa de un balón próximo a una línea del campo.', en: 'Illustrative scene of a ball near a field boundary line.' }, observe: { es: 'La decisión depende de si todo el balón cruzó toda la línea.', en: 'The decision depends on whether the whole ball crossed the whole line.' } },
  10: { src: '/assets/academy/law-photos/law-10.png', alt: { es: 'Escena ilustrativa de una acción de fútbol cerca de la portería.', en: 'Illustrative football action near a goal.' }, observe: { es: 'La foto no demuestra por sí sola que el balón cruzó por completo la línea de meta.', en: 'The photograph alone cannot show that the ball wholly crossed the goal line.' } },
  11: { src: '/assets/academy/law-photos/law-11.png', alt: { es: 'Escena ilustrativa de atacantes y defensores en una jugada de fútbol.', en: 'Illustrative scene of attackers and defenders during football play.' }, observe: { es: 'La posición se juzga en el instante del toque del compañero; participar es otra condición.', en: 'Position is judged when a team-mate plays the ball; involvement is a separate condition.' } },
  12: { src: '/assets/academy/law-photos/law-12.png', alt: { es: 'Escena ilustrativa de dos futbolistas disputando el balón.', en: 'Illustrative scene of two footballers challenging for the ball.' }, observe: { es: 'Un fotograma no determina por sí solo si hubo falta ni su gravedad.', en: 'A still frame alone does not determine whether a foul occurred or its severity.' } },
  13: { src: '/assets/academy/law-photos/law-13.png', alt: { es: 'Escena ilustrativa de un árbitro con el brazo levantado junto a un balón detenido para un tiro libre.', en: 'Illustrative scene of a referee raising an arm beside a stationary ball for a free kick.' }, observe: { es: 'La señal arbitral distingue el tiro libre indirecto del directo.', en: 'The referee’s signal distinguishes an indirect free kick from a direct one.' } },
  14: { src: '/assets/academy/law-photos/law-14.png', alt: { es: 'Escena ilustrativa de un futbolista preparado para ejecutar un tiro penal.', en: 'Illustrative scene of a footballer preparing to take a penalty kick.' }, observe: { es: 'Antes del lanzamiento, identificá ejecutor, guardameta y posiciones del resto.', en: 'Before the kick, identify the kicker, goalkeeper and positions of the others.' } },
  15: { src: '/assets/academy/law-photos/law-15.png', alt: { es: 'Escena ilustrativa de un saque de banda en fútbol.', en: 'Illustrative scene of a football throw-in.' }, observe: { es: 'Revisá manos, recorrido del balón y apoyo de ambos pies.', en: 'Check both hands, the ball’s path and the position of both feet.' } },
  16: { src: '/assets/academy/law-photos/law-16.png', alt: { es: 'Escena ilustrativa de un saque de meta en un campo de fútbol.', en: 'Illustrative scene of a goal kick on a football pitch.' }, observe: { es: 'El balón puede colocarse en cualquier punto del área de meta.', en: 'The ball may be placed anywhere in the goal area.' } },
  17: { src: '/assets/academy/law-photos/law-17.png', alt: { es: 'Escena ilustrativa de un saque de esquina en fútbol.', en: 'Illustrative scene of a football corner kick.' }, observe: { es: 'El balón se coloca dentro del área de esquina más cercana.', en: 'The ball is placed within the nearest corner area.' } },
};

const handballPhoto: AcademyPhotoDetails = {
  src: '/assets/academy/law-photos/handball-v3.png',
  alt: { es: 'Escena ilustrativa de un balón próximo al antebrazo de un futbolista.', en: 'Illustrative scene of a ball near a footballer’s forearm.' },
  observe: { es: 'El contacto con la mano o el brazo requiere evaluar movimiento, posición y contexto.', en: 'Hand or arm contact requires assessment of movement, position and context.' },
};

const droppedBallPhoto: AcademyPhotoDetails = {
  src: '/assets/academy/law-photos/dropped-ball.png',
  alt: { es: 'Escena ilustrativa de un árbitro que deja caer el balón junto a un jugador mientras los demás esperan más lejos.', en: 'Illustrative scene of a referee dropping the ball beside one player while others wait farther away.' },
  observe: { es: 'El balón entra en juego al tocar el suelo; la foto no permite medir la distancia de los demás jugadores.', en: 'The ball enters play when it touches the ground; the photograph cannot establish the other players’ exact distance.' },
};

const injuryAssessmentPhoto: AcademyPhotoDetails = {
  src: '/assets/academy/law-photos/injury-assessment.png',
  alt: { es: 'Escena ilustrativa de un árbitro que consulta a un jugador sentado cerca de la línea de banda mientras se aproxima personal de atención.', en: 'Illustrative scene of a referee checking on a seated player near the touchline as a staff member approaches.' },
  observe: { es: 'La imagen no establece gravedad, tratamiento ni cuándo puede regresar el jugador; el procedimiento depende de los hechos y las excepciones.', en: 'The image does not establish severity, treatment or when the player may return; the procedure depends on the facts and exceptions.' },
};

const topicPhotoLaw: Readonly<Record<string, number>> = {
  'field-markings-and-areas': 1,
  'goals-and-field-safety': 1,
  'ball-specifications-and-checks': 2,
  'defective-ball-and-replacement': 2,
  'compulsory-and-safe-equipment': 4,
  'equipment-offences-and-reentry': 4,
  'assistant-referee-duties': 6,
  'fourth-official-and-video-officials': 6,
  challenge: 12,
  'indirect-free-kick': 13,
  'disciplinary-sanctions': 5,
  'offside-position-and-involvement': 11,
  'penalty-procedure': 14,
  'kick-off-procedure': 8,
  'ball-in-and-out-of-play': 9,
  'throw-in-procedure': 15,
  'goal-kick-procedure': 16,
  'corner-kick-procedure': 17,
  'goal-and-match-result': 10,
  'penalty-shoot-out': 14,
  'free-kick-procedure': 13,
  'free-kick-distance-and-wall': 13,
  'substitution-procedure': 3,
  'players-and-extra-persons': 3,
  'referee-authority-and-advantage': 5,
  'periods-and-intervals': 7,
  'added-time-and-period-end': 7,
};

const topicObserve: Readonly<Record<string, Localized>> = {
  'field-markings-and-areas': { es: 'La foto orienta sobre las marcas; el esquema y la Regla fijan líneas, áreas y medidas.', en: 'The photo gives marking context; the diagram and Law establish lines, areas and measurements.' },
  'goals-and-field-safety': { es: 'Una imagen de la portería no demuestra sus medidas ni que esté firmemente anclada.', en: 'A goal photo cannot prove its dimensions or that it is securely anchored.' },
  'ball-specifications-and-checks': { es: 'El aspecto del balón no permite verificar circunferencia, peso, presión o certificación.', en: 'The ball’s appearance cannot verify circumference, weight, pressure or certification.' },
  'defective-ball-and-replacement': { es: 'La foto no revela si el balón se deterioró ni en qué momento del juego ocurrió.', en: 'The photo does not establish whether the ball became defective or when it happened.' },
  'compulsory-and-safe-equipment': { es: 'La indumentaria visible no sustituye la inspección de seguridad ni confirma elementos ocultos.', en: 'Visible kit does not replace a safety inspection or confirm concealed items.' },
  'equipment-offences-and-reentry': { es: 'Una foto no acredita que el equipamiento haya sido corregido y revisado ni que se autorizó el regreso.', en: 'A photograph cannot confirm that kit was corrected and checked or that return was authorised.' },
  'assistant-referee-duties': { es: 'La posición del asistente ilustra su perspectiva; una imagen aislada no confirma la señal ni la decisión.', en: 'The assistant’s position illustrates a viewpoint; one image cannot establish a signal or decision.' },
  'fourth-official-and-video-officials': { es: 'La escena de un asistente no demuestra qué oficiales fueron designados ni que exista revisión de video.', en: 'An assistant-referee scene does not establish which officials were appointed or that video review is available.' },
  challenge: { es: 'Para valorar una entrada, observá acción, punto de contacto e intensidad; una foto aislada no fija la sanción.', en: 'To assess a challenge, examine the action, point of contact and intensity; one still does not establish a sanction.' },
  'indirect-free-kick': { es: 'La señal muestra la reanudación; para determinarla, primero identificá la infracción concreta.', en: 'The signal shows the restart; first identify the specific offence that caused it.' },
  'disciplinary-sanctions': { es: 'Separá la posible tarjeta de la reanudación; cada decisión exige sus propios hechos.', en: 'Consider the possible card separately from the restart; each decision needs its own facts.' },
  'offside-position-and-involvement': { es: 'Fijá el instante del pase y luego evaluá si el jugador intervino activamente.', en: 'Fix the instant the ball is played, then assess whether the player became actively involved.' },
  'penalty-procedure': { es: 'Comprobá la colocación de los jugadores antes de que el balón entre en juego.', en: 'Check the players’ positions before the ball is in play.' },
  'kick-off-procedure': { es: 'Observá el balón en el centro y la ubicación de los jugadores antes del saque.', en: 'Notice the ball at the centre and the players’ positions before the kick.' },
  'ball-in-and-out-of-play': { es: 'La perspectiva de una foto no confirma si todo el balón cruzó toda la línea.', en: 'A photograph’s perspective cannot confirm whether the whole ball crossed the whole line.' },
  'throw-in-procedure': { es: 'Observá las dos manos, el balón detrás de la cabeza y el apoyo de ambos pies.', en: 'Notice both hands, the ball behind the head and both feet on the ground.' },
  'goal-kick-procedure': { es: 'Ubicá el balón en el área de meta; el esquema distingue esa área de la penal.', en: 'Locate the ball in the goal area; the diagram distinguishes it from the penalty area.' },
  'corner-kick-procedure': { es: 'Ubicá balón, banderín y área de esquina; el esquema muestra la distancia del rival.', en: 'Locate the ball, flag and corner area; the diagram shows the opponent distance.' },
  'goal-and-match-result': { es: 'La foto no permite confirmar por sí sola que todo el balón cruzó la línea ni que el gol sea válido.', en: 'The photo alone cannot confirm that the whole ball crossed the line or that the goal is valid.' },
  'penalty-shoot-out': { es: 'La escena ilustra un penal; no demuestra que pertenezca a una tanda ni cuál sea su resultado.', en: 'The scene illustrates a penalty; it does not establish a shoot-out or its result.' },
  'free-kick-procedure': { es: 'La señal de brazo levantado identifica un libre indirecto; el esquema compara sus posibles resultados.', en: 'The raised-arm signal identifies an indirect free kick; the diagram compares possible outcomes.' },
  'free-kick-distance-and-wall': { es: 'La foto no permite medir 9,15 m desde el balón ni 1 m desde una barrera; consultá el esquema.', en: 'The photo cannot measure 9.15 m from the ball or 1 m from a wall; use the diagram.' },
  'substitution-procedure': { es: 'La foto muestra un contexto de cambio; el esquema distingue la salida, el permiso y la entrada.', en: 'The photo shows substitution context; the diagram separates exit, permission and entry.' },
  'players-and-extra-persons': { es: 'Estar junto a la línea no demuestra una entrada indebida ni interferencia en el juego.', en: 'Being near the touchline does not establish unauthorised entry or interference with play.' },
  'referee-authority-and-advantage': { es: 'La tarjeta ilustrada no revela la infracción, si se concedió ventaja ni el momento de la decisión.', en: 'The illustrated card does not establish the offence, whether advantage was played or when the decision was made.' },
  'periods-and-intervals': { es: 'La escena no muestra la duración oficial del periodo ni el intervalo aplicable.', en: 'The scene does not establish the official period length or applicable interval.' },
  'added-time-and-period-end': { es: 'Una foto no permite deducir el tiempo perdido, el mínimo anunciado ni el final del periodo.', en: 'A photograph cannot establish time lost, the announced minimum or the end of the period.' },
};

export function getAcademyPhoto(lawNumber: number, topicSlug?: string): AcademyPhotoDetails {
  if (topicSlug === 'handball') return handballPhoto;
  if (topicSlug === 'dropped-ball-procedure') return droppedBallPhoto;
  if (topicSlug === 'injuries-and-return-to-play') return injuryAssessmentPhoto;
  const photo = lawPhotos[topicSlug ? topicPhotoLaw[topicSlug] : lawNumber];
  if (!photo) throw new Error(`No Academy photo for Law ${lawNumber}${topicSlug ? ` topic ${topicSlug}` : ''}`);
  return topicSlug ? { ...photo, observe: topicObserve[topicSlug] } : photo;
}
