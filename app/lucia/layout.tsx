import React from 'react';
import './lucia.css';

export const metadata = {
  title: 'Lucía Indumentaria · Girá y ganá',
  description: 'Girá la ruleta de Lucía Indumentaria y ganá premios en tu próxima compra.',
  icons: { icon: '/lucia/logo-verde.png' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#76845F',
};

export default function LuciaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&display=swap"
      />
      <div className="lucia">{children}</div>
    </>
  );
}
