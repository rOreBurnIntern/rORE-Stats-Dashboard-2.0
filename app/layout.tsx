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
      <body className="bg-[#0a0a0b] text-[#fafafa]">
        <SentryInitializer />
        {children}
      </body>
    </html>
  );
}
