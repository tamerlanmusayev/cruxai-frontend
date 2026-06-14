import type { Metadata, Viewport } from 'next';
import { Inter, Caveat } from 'next/font/google';
import './globals.css';
import { LangProvider } from '@/lib/i18n';
import AppShell from '@/components/AppShell';
import Analytics from '@/components/Analytics';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' });
const caveat = Caveat({ subsets: ['latin', 'cyrillic'], variable: '--font-hand' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cruxai.az';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'CruxAI — master any book with AI',
    template: '%s · CruxAI',
  },
  description:
    'Upload any book or textbook and get a citation-grounded summary, audio, flashcards with spaced repetition, a knowledge map, and an adaptive quiz. Free, in Azerbaijani, Russian and English — for students across the CIS.',
  keywords: [
    'AI study tool', 'book summary', 'textbook summary', 'flashcards',
    'spaced repetition', 'quiz', 'exam prep', 'konspekt', 'конспект',
    'Azerbaijan', 'CIS students', 'CruxAI',
  ],
  authors: [{ name: 'Tamerlan Musayev', url: 'https://github.com/tamerlanmusayev' }],
  creator: 'Tamerlan Musayev',
  applicationName: 'CruxAI',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'CruxAI',
    title: 'CruxAI — master any book with AI',
    description:
      'Citation-grounded summaries, audio, flashcards, knowledge maps and adaptive quizzes. Free, for students across the CIS.',
    url: SITE_URL,
    locale: 'en_US',
    alternateLocale: ['ru_RU', 'az_AZ'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CruxAI — master any book with AI',
    description:
      'Citation-grounded summaries, audio, flashcards, knowledge maps and adaptive quizzes. Free, for CIS students.',
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#08080f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${caveat.variable}`}>
      <body>
        <LangProvider>
          <AppShell>{children}</AppShell>
        </LangProvider>
        <Analytics />
      </body>
    </html>
  );
}
