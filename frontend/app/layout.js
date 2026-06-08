import Providers from './providers';
import '@/index.css';
import '@/App.css';

export const metadata = {
  title: 'RockStar Social',
  description: 'Professional web design services and premium themes',
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
