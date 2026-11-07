import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site/SiteHeader';
import { readPrivateSocialWorkspace } from '@/features/community/social-private-service';
import { SocialPrivateWorkspace } from '@/features/community/SocialPrivateWorkspace';
import '@/features/community/community.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  return {
    title: locale === 'es' ? 'Mis publicaciones | RefView' : 'My posts | RefView',
    robots: { index: false, follow: false },
  };
}

export default async function SocialPrivatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const workspace = await readPrivateSocialWorkspace();
  const isSpanish = locale === 'es';
  return <div className="rv-community">
    <a className="rv-community__skip" href="#private-social-title">{isSpanish ? 'Ir al contenido' : 'Skip to content'}</a>
    <SiteHeader locale={locale} active="community" languagePath="/community/my" />
    {workspace.kind === 'ready' ? <SocialPrivateWorkspace locale={locale} workspace={workspace} />
      : <main className="rv-community__content">
      <Link className="rv-community__back" href={`/${locale}/community`}>
        {isSpanish ? 'Volver a Comunidad' : 'Back to Community'}
      </Link>
      <header className="rv-community__hero">
        <div>
          <h1 id="private-social-title" tabIndex={-1}>{isSpanish ? 'Mis publicaciones' : 'My posts'}</h1>
          <p className="rv-community__intro">{isSpanish
            ? 'Prepará un partido y tu opinión sobre una jugada. Consultá el estado de cada aporte.'
            : 'Prepare a match and your opinion on a play. Check the status of each entry.'}</p>
        </div>
        <aside className="rv-community__disclosure">
          <strong>{isSpanish ? 'Estado de publicación' : 'Publication status'}</strong>
          <p>{isSpanish
            ? 'Los aportes pendientes siguen privados. Los visibles aparecen en el feed compartido. No hay comentarios ni archivos todavía.'
            : 'Pending entries remain private. Visible entries appear in the shared feed. Comments and files are not available yet.'}</p>
        </aside>
      </header>
      {workspace.kind === 'missing'
        ? <section aria-labelledby="private-social-access"><h2 id="private-social-access">
          {isSpanish ? 'Iniciá sesión para continuar' : 'Sign in to continue'}</h2>
          <p>{isSpanish ? 'Necesitás una cuenta de RefView para escribir sobre una jugada.'
            : 'You need a RefView account to write about a play.'}</p>
          <Link href={`/${locale}/profile`}>{isSpanish ? 'Ir a mi perfil' : 'Go to my profile'}</Link>
        </section>
        : <section aria-labelledby="private-social-unavailable"><h2 id="private-social-unavailable">
            {isSpanish ? 'No podemos cargar este espacio ahora' : 'This workspace is unavailable now'}</h2>
            <p>{isSpanish ? 'Volvé a intentarlo más tarde desde tu perfil.' : 'Try again later from your profile.'}</p>
          </section>}
    </main>}
  </div>;
}
