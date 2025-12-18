import { Suspense } from 'react';
import GenrePageClient from './GenrePageClient';

export default function GenrePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <GenrePageClient />
    </Suspense>
  );
}


