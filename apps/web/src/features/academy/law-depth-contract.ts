import type { AcademyLocale } from './catalog-ui-v1-data';

export type LocalizedLawText = Readonly<Record<AcademyLocale, string>>;

export type LawSourceRef = Readonly<{
  section: LocalizedLawText;
  pages: LocalizedLawText;
  startPage: Readonly<Record<AcademyLocale, number>>;
  supplemental?: Readonly<{
    label: LocalizedLawText;
    startPage: Readonly<Record<AcademyLocale, number>>;
  }>;
  onlineUpdate?: Readonly<{
    label: LocalizedLawText;
    url: Readonly<Record<AcademyLocale, string>>;
  }>;
}>;

export type LawDetailSection = Readonly<{
  id: string;
  title: LocalizedLawText;
  paragraphs: readonly LocalizedLawText[];
  facts?: readonly Readonly<{ label: LocalizedLawText; value: LocalizedLawText }>[];
  steps?: readonly Readonly<{ label: LocalizedLawText; body: LocalizedLawText }>[];
  caution?: LocalizedLawText;
  source: LawSourceRef;
}>;

export type LawDepth = Readonly<{
  number: number;
  sections: readonly LawDetailSection[];
}>;

export type TopicDepth = LawDepth & Readonly<{ slug: string }>;
