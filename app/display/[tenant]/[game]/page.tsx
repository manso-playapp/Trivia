import Link from 'next/link';
import { Suspense } from 'react';
import QRCode from 'qrcode';
import { headers } from 'next/headers';
import DisplayClient from './DisplayClient';
import { getThemeForGame, cssVarsToStyleTag } from '@/lib/theme';
import ThemeStyle from '@/components/ThemeStyle';

type Props = { params: { tenant: string; game: string } };

export default async function DisplayPage({ params }: Props) {
  const { tenant, game } = params;
  const hdrs = headers();
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'localhost:3000';
  const proto = (hdrs.get('x-forwarded-proto') || 'http') + '://';
  const playPath = `/play/${encodeURIComponent(tenant)}/${encodeURIComponent(game)}`;
  const playUrl = `${proto}${host}${playPath}`;
  const qrDataUrl = await QRCode.toDataURL(playUrl, { width: 1024, margin: 1, color: { dark: '#000000', light: '#FFFFFFFF' } });
  const theme = await getThemeForGame(tenant, game);
  const style = cssVarsToStyleTag(theme.css_vars || undefined);
  const logoSrc = theme.logo_url || '/logo.svg';

  return (
    <main className="container" style={{ textAlign: 'center' }}>
      <ThemeStyle css={style} />
      <div className="row" style={{ justifyContent: 'center', gap: 16 }}>
        <img src={logoSrc} alt="Logo" height={42} style={{ objectFit: 'contain' }} />
        <h1 style={{ margin: 0 }}>Trivia en {tenant}</h1>
      </div>
      <p>Escaneá el QR para jugar desde tu celular.</p>
      <img src={qrDataUrl} alt={`QR para ${playUrl}`} width={280} height={280} style={{ borderRadius: 12 }} />
      <p>
        Alternativa: visitá <code>{playUrl}</code> o{' '}
        <Link href={playUrl}>abrir enlace</Link>
      </p>
      <Suspense>
        <small style={{ color: 'var(--muted)' }}>Modo TV vertical recomendado (1080x1920).</small>
      </Suspense>
      <DisplayClient tenant={tenant} game={game} />
    </main>
  );
}
