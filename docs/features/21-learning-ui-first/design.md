# Learning interface-first design

Use the existing RefView field-led visual language and feature-local presentation components. Server route containers supply already authorized data and action slots; visual components do not select database rows or decide publication.

## View boundaries

| View | Presentation input | Authority outside the view |
| --- | --- | --- |
| Academy catalog | Locale, `CatalogLesson[]`, read outcome, explicit published/preview mode | `readAcademyCatalog` and verified publication |
| Academy lesson | Locale, `PublicLesson`, save-control slot, navigation targets, explicit mode | `readAcademyLesson`, exact-version save, practice eligibility |
| Assessment catalog | Locale, catalog DTOs, counts, selected level, start-control slot, explicit mode | `readAssessmentCatalog`, owner resolution, start action |
| Assessment question | Active-attempt DTO and action/form slot only | No accepted answer, rubric, correction, or result in question props |
| Assessment result | Finalized-result DTO and next-action slot | Server evaluation, ownership, and finalized provenance |

Academy interface preview may project the approved fixture server-side through `projectPublicLesson` with no practice or save action. Public Academy routes retain their DB readers. Assessment interface preview reuses the existing `/[locale]/assessments/editorial-preview` local draft-only gate and has separate question and correction requests. It must never weaken that gate or include answer/correction markup on the question screen. A preset example correction is labelled as an illustration, not as evaluation of the visitor's choice. Public Assessment routes retain their DB readers and owner actions.

The exact approved source fixtures are not edited in this pass. The visual preview is not a publication transition or an alternate database.
