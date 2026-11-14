import './globals.css';

export const metadata = {
  title: 'EGOL Fantasy - Liga Privada de Pachangas',
  description: 'Gestor y juego fantasy de pachangas: mercado de fichajes, 100M€ de presupuesto, alineaciones y votaciones post-partido.',
  icons: {
    icon: '/logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
