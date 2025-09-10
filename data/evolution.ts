export type Status = 'done' | 'in_progress' | 'planned';

export type EvoItem = {
  title: string;
  desc?: string;
  status: Status;
  link?: string;
};

export type EvoSection = {
  name: string;
  items: EvoItem[];
};

export const evolution: EvoSection[] = [
  {
    name: 'Arquitectura y Base',
    items: [
      { title: 'Next.js + App Router', status: 'done', desc: 'Proyecto inicial y estructura básica.' },
      { title: 'Supabase Postgres + RLS', status: 'in_progress', desc: 'Tablas core y políticas mínimas.' },
      { title: 'Realtime (Broadcast / Presence)', status: 'done', desc: 'Canal game-{id} para estado en vivo.' },
      { title: 'Storage (assets)', status: 'planned', desc: 'Bucket público + subida desde admin.' },
    ],
  },
  {
    name: 'Juego Público',
    items: [
      { title: 'Display TV con QR', status: 'done', link: '/display/demo/demo-game', desc: 'QR absoluto + estado y leaderboard.' },
      { title: 'Registro jugador (Play)', status: 'done', link: '/play/demo/demo-game', desc: 'Registro anon con RLS, theming.' },
      { title: 'Responder preguntas', status: 'done', desc: 'API segura, validación de ventana activa, scoring por tiempo.' },
      { title: 'Anti-trampa básico', status: 'in_progress', desc: 'Única respuesta y ventana; falta rate limiting/fingerprint.' },
    ],
  },
  {
    name: 'Host y Estado',
    items: [
      { title: 'Consola Host', status: 'done', link: '/t/demo/host/demo-game', desc: 'Start/End por Realtime.' },
      { title: 'Persistencia de estado', status: 'done', desc: 'Pregunta activa y fin de ventana en DB.' },
      { title: 'Leaderboard', status: 'done', desc: 'RPC con ranking y polling en Display.' },
    ],
  },
  {
    name: 'Branding / Multi‑tenant',
    items: [
      { title: 'Themes por tenant', status: 'done', desc: 'CSS variables por juego + logo.' },
      { title: 'Assets (logo/bg) en Storage', status: 'planned', desc: 'Guardar logo y fondo por tenant.' },
    ],
  },
  {
    name: 'Auth y Roles',
    items: [
      { title: 'Login Magic Link', status: 'done', link: '/login', desc: 'Página de ingreso y signout.' },
      { title: 'Profiles + trigger', status: 'done', desc: 'Alta automática en profiles con rol base host.' },
      { title: 'Roles por tenant', status: 'planned', desc: 'super_admin / tenant_admin / host con RLS completa.' },
    ],
  },
  {
    name: 'Panel de Administración',
    items: [
      { title: 'Super admin dashboard', status: 'planned', desc: 'Gestión de tenants, usuarios y duplicación de juegos.' },
      { title: 'CRUD juegos/preguntas', status: 'planned', desc: 'Importación CSV/Excel y orden de rondas.' },
    ],
  },
  {
    name: 'Comunicaciones',
    items: [
      { title: 'Emails a ganadores', status: 'planned', desc: 'Edge Function + plantillas y logs.' },
    ],
  },
  {
    name: 'Despliegue / DevOps',
    items: [
      { title: 'Vercel + variables', status: 'planned', desc: 'Deploy continuo y entornos.' },
      { title: 'Observabilidad', status: 'planned', desc: 'Logs y métricas básicas.' },
    ],
  },
];

export function computeProgress(sections: EvoSection[]) {
  const all = sections.flatMap((s) => s.items);
  const total = all.length;
  const done = all.filter((i) => i.status === 'done').length;
  const inProg = all.filter((i) => i.status === 'in_progress').length;
  const planned = total - done - inProg;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { total, done, inProg, planned, pct };
}

