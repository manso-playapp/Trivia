import './globals.css';
import React from 'react';

export const metadata = {
  title: 'JAKPOT Trivia',
  description: 'White‑label trivia for retail displays',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

