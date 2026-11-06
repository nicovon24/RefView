import type { Locale } from '@/lib/i18n/locale';

type LocalizedText = Record<Locale, string>;

export type FictionalMatch = {
  readonly matchId: string;
  readonly date: string;
  readonly competition: LocalizedText;
  readonly homeTeam: LocalizedText;
  readonly awayTeam: LocalizedText;
  readonly description: LocalizedText;
  readonly decisionContext: LocalizedText;
  readonly refereeDecision: LocalizedText;
  readonly discussionPrompt: LocalizedText;
  readonly author: string;
  readonly version: number;
  readonly provenance: string;
};

// Repository-authored text fixtures. Names, competitions, incidents, and dates are invented.
export const fictionalMatches: readonly FictionalMatch[] = [
  {
    matchId: 'copa-del-faro-2025-04-12',
    date: '2025-04-12',
    competition: { es: 'Copa del Faro', en: 'Lighthouse Cup' },
    homeTeam: { es: 'Puerto Claro', en: 'Clear Harbor' },
    awayTeam: { es: 'Monte Azul', en: 'Blue Hill' },
    description: {
      es: 'En el minuto 64, una atacante cae después de un cruce cerca de la línea del área. La escena es un punto de partida imaginario para hablar de qué ángulos ayudarían a observar el contacto.',
      en: 'In the 64th minute, an attacker falls after a challenge near the penalty-area line. This invented scene is a starting point for discussing which angles could help observe the contact.',
    },
    decisionContext: {
      es: 'La defensora de Monte Azul cruza por delante de la atacante de Puerto Claro, que cae junto a la línea del área. Desde la posición imaginaria de la árbitra, el contacto parece ocurrir dentro del área; el relato no muestra una repetición ni resuelve qué vio desde otros ángulos.',
      en: 'A Blue Hill defender moves across the Clear Harbor attacker, who falls by the penalty-area line. From the fictional referee’s position, the contact appears to be inside the area; this account offers no replay and does not settle what other angles would show.',
    },
    refereeDecision: {
      es: 'La árbitra ficticia concede un penal a Puerto Claro y no muestra tarjeta.',
      en: 'The fictional referee awards Clear Harbor a penalty kick and shows no card.',
    },
    discussionPrompt: {
      es: '¿Qué observaciones necesitarías antes de valorar el contacto y su ubicación?',
      en: 'What observations would you need before assessing the contact and its location?',
    },
    author: 'RefView',
    version: 2,
    provenance: 'Original repository-authored text; no external media or assets.',
  },
  {
    matchId: 'liga-de-la-brisa-2025-09-20',
    date: '2025-09-20',
    competition: { es: 'Liga de la Brisa', en: 'Breeze League' },
    homeTeam: { es: 'Valle Verde', en: 'Green Valley' },
    awayTeam: { es: 'Costa Serena', en: 'Calm Coast' },
    description: {
      es: 'En el minuto 28, el balón rebota entre dos futbolistas durante una disputa aérea. Esta situación inventada invita a distinguir lo que se ve de lo que todavía habría que comprobar.',
      en: 'In the 28th minute, the ball rebounds between two players during an aerial contest. This invented situation invites a distinction between what is visible and what still needs checking.',
    },
    decisionContext: {
      es: 'Una futbolista de Valle Verde y otra de Costa Serena saltan por el balón. Sus brazos se encuentran, la jugadora de Costa Serena pierde el equilibrio y el balón queda suelto. El relato no determina si hubo un empujón o un contacto propio de la disputa.',
      en: 'A Green Valley player and a Calm Coast player jump for the ball. Their arms meet, the Calm Coast player loses balance, and the ball stays loose. This account does not establish whether there was a push or ordinary contact during the challenge.',
    },
    refereeDecision: {
      es: 'El árbitro ficticio detiene el juego y concede un tiro libre directo a Costa Serena por un empujón; no muestra tarjeta.',
      en: 'The fictional referee stops play and awards Calm Coast a direct free kick for pushing; no card is shown.',
    },
    discussionPrompt: {
      es: '¿Qué información adicional buscarías antes de describir la secuencia?',
      en: 'What additional information would you seek before describing the sequence?',
    },
    author: 'RefView',
    version: 2,
    provenance: 'Original repository-authored text; no external media or assets.',
  },
];

export function findFictionalMatch(matchId: string): FictionalMatch | undefined {
  return fictionalMatches.find((match) => match.matchId === matchId);
}
