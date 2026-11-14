/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lucía Indumentaria se migró a PlayApp (14/11/2026). El QR impreso apunta a /lucia:
  // se redirige al juego nuevo. Redirección temporal (307) para poder cambiarla al dominio definitivo.
  async redirects() {
    return [
      { source: '/lucia', destination: 'https://playapp-liard.vercel.app/j/lucia-indumentaria', permanent: false },
      { source: '/lucia/admin', destination: 'https://playapp-liard.vercel.app/login', permanent: false },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;

