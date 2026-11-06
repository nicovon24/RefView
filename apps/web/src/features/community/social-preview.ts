import type { Locale } from '@/lib/i18n/locale';
import { fictionalMatches } from './fixtures';

type Text = Record<Locale, string>;
export type PreviewComment = { author: string; role: Text; text: Text; replyTo?: string };
export type SocialPreview = {
  matchId: string; teams: Text; context: Text; published: Text;
  author: string; authorRole: Text; title: Text; opinion: Text;
  image?: string; imageAlt?: Text; attachment: Text;
  agree: number; disagree: number; comments: readonly PreviewComment[];
  matchRating?: { author: string; role: Text; viewed: Text; score: number; text: Text };
  legacy?: boolean;
};

// All people, posts, scenes, reactions, and discussions below are repository-authored fiction.
// Club names provide recognizable context; no real fixture or event is asserted.
const featured: readonly SocialPreview[] = [
  {
    matchId: 'liverpool-manchester-city-fictional-play',
    teams: { es: 'Liverpool × Manchester City', en: 'Liverpool × Manchester City' },
    context: { es: 'Cruce imaginario · sin fecha ni resultado', en: 'Imagined matchup · no date or result' },
    published: { es: 'Hace 2 horas · hora ilustrativa', en: '2 hours ago · illustrative time' },
    author: 'Inés R.', authorRole: { es: 'Aficionada · dice que vio el partido', en: 'Fan · says she watched the match' },
    title: { es: '¿Había que dejar seguir esta disputa?', en: 'Should play have continued after this challenge?' },
    opinion: { es: 'Yo habría dejado seguir. En esta jugada inventada, el contacto parece parte de la disputa por el balón y no veo una acción clara para sancionar. Me interesa saber qué vio quien estaba mejor ubicado.', en: 'I would have let play continue. In this invented play, the contact looks like part of the challenge for the ball, and I do not see a clear offence. I would like to hear from someone with a better view.' },
    image: '/assets/community-demo/liverpool-city-fictional-play.png',
    imageAlt: { es: 'Ilustración generada de una jugada ficticia entre Liverpool y Manchester City; no es una imagen del partido.', en: 'Generated illustration of a fictional play between Liverpool and Manchester City; not match footage.' },
    attachment: { es: 'Imagen generada para esta demostración · no es foto ni video de un partido real', en: 'Image generated for this demonstration · not a photo or footage of a real match' },
    agree: 18, disagree: 7,
    comments: [
      { author: 'Marcos T.', role: { es: 'Árbitro · dice que vio el partido', en: 'Referee · says he watched the match' }, text: { es: 'Desde mi lectura también seguiría el juego, aunque una imagen fija no muestra la intensidad del contacto.', en: 'I would also let play continue from what is described, though a still image cannot show the force of the contact.' } },
      { author: 'Noa P.', role: { es: 'Aficionada · no indica si lo vio', en: 'Fan · viewing not stated' }, replyTo: 'Marcos T.', text: { es: 'Coincido con la cautela. ¿Cambiarías de opinión si hubiera un empujón antes de esta imagen?', en: 'Agreed on the caution. Would an earlier push change your view?' } },
      { author: 'Marcos T.', role: { es: 'Árbitro · dice que vio el partido', en: 'Referee · says he watched the match' }, replyTo: 'Noa P.', text: { es: 'Sí. Esa secuencia anterior sería decisiva para mí.', en: 'Yes. That earlier sequence would be decisive for me.' } },
    ],
    matchRating: { author: 'Damián L.', role: { es: 'Aficionado', en: 'Fan' }, viewed: { es: 'Dice que vio el partido', en: 'Says he watched the match' }, score: 4, text: { es: 'Mi valoración ficticia del arbitraje de este encuentro imaginario: consistente en las decisiones descritas, con dudas en esta disputa.', en: 'My fictional rating of the refereeing in this imagined match: consistent in the described decisions, with some doubt about this challenge.' } },
  },
  {
    matchId: 'liverpool-arsenal-fictional-play',
    teams: { es: 'Liverpool × Arsenal', en: 'Liverpool × Arsenal' },
    context: { es: 'Cruce imaginario · sin fecha ni resultado', en: 'Imagined matchup · no date or result' },
    published: { es: 'Ayer · hora ilustrativa', en: 'Yesterday · illustrative time' },
    author: 'Bruno C.', authorRole: { es: 'Árbitro · dice que vio el partido', en: 'Referee · says he watched the match' },
    title: { es: '¿Hubo falta en esta disputa aérea?', en: 'Was there a foul in this aerial challenge?' },
    opinion: { es: 'En esta escena ficticia, dos futbolistas saltan por el balón. Esta imagen fija no alcanza para saber si el contacto de brazos fue una disputa normal o un empujón: me gustaría ver la secuencia desde otro ángulo.', en: 'In this fictional scene, two players challenge for an aerial ball. This still image cannot establish whether the arm contact was a normal challenge or a push; I would want to see the sequence from another angle.' },
    image: '/assets/community-demo/liverpool-arsenal-fictional-play.png',
    imageAlt: { es: 'Ilustración generada de una disputa aérea ficticia entre Liverpool y Arsenal; no es una imagen del partido.', en: 'Generated illustration of a fictional aerial challenge between Liverpool and Arsenal; not match footage.' },
    attachment: { es: 'Imagen generada para esta demostración · no es foto ni video de un partido real', en: 'Image generated for this demonstration · not a photo or footage of a real match' },
    agree: 12, disagree: 3,
    comments: [
      { author: 'Eva S.', role: { es: 'Aficionada · dice que vio el partido', en: 'Fan · says she watched the match' }, text: { es: 'Yo había pensado que hubo empujón, pero esta imagen fija no muestra cómo se movieron los brazos.', en: 'I first thought there was a push, but this still image does not show how their arms moved.' } },
      { author: 'Pablo M.', role: { es: 'Árbitro · no indica si lo vio', en: 'Referee · viewing not stated' }, replyTo: 'Eva S.', text: { es: 'Exacto. Vería la secuencia completa antes de decidir si el contacto fue sancionable.', en: 'Exactly. I would need the full sequence before deciding whether the contact was an offence.' } },
    ],
  },
];

const legacy: readonly SocialPreview[] = fictionalMatches.map((match) => ({
  matchId: match.matchId,
  teams: { es: `${match.homeTeam.es} × ${match.awayTeam.es}`, en: `${match.homeTeam.en} × ${match.awayTeam.en}` },
  context: match.competition,
  published: { es: 'Ejemplo del archivo', en: 'Archived example' },
  author: 'RefView', authorRole: { es: 'Ejemplo del repositorio', en: 'Repository example' },
  title: { es: '¿Qué evidencia falta en esta jugada?', en: 'What evidence is missing from this play?' },
  opinion: match.description,
  attachment: { es: 'Sin imagen ni enlace externo en este ejemplo', en: 'No image or external link in this example' },
  agree: 0, disagree: 0, comments: [], legacy: true,
}));

export const socialPreview: readonly SocialPreview[] = [...featured, ...legacy];
export function findSocialPreview(matchId: string): SocialPreview | undefined {
  return socialPreview.find((entry) => entry.matchId === matchId);
}
