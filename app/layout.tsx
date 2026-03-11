import './globals.css';
import SentryInitializer from '@/components/SentryInitializer';

export const metadata = {
  title: 'rORE Stats Dashboard',
  description: 'rORE Statistics Dashboard 2.0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <SentryInitializer />
        {children}
      </body>
    </html>
  );
}
