import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'EGOL Fantasy - Liga Privada de Pachangas',
  description: 'Gestor y juego fantasy de pachangas: mercado de fichajes, 100M€ de presupuesto, alineaciones y votaciones post-partido.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
