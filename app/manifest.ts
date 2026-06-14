import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CruxAI',
    short_name: 'CruxAI',
    description: 'Master any book with AI — summaries, flashcards, quizzes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#08080f',
    theme_color: '#08080f',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
