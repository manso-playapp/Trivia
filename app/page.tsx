export default function HomePage() {
  return (
    <main className="container">
      <h1>JAKPOT Trivia</h1>
      <p>Setup inicial listo. Próximo: configurar Supabase y rutas.</p>
      <ul>
        <li>Display TV: /display/[tenant]/[game]</li>
        <li>Jugador móvil: /play/[game]</li>
        <li>Admin (pronto): /admin</li>
      </ul>
    </main>
  );
}

