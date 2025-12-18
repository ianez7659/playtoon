import { Suspense } from 'react';
import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  // Next.js 15: client hooks like useSearchParams require a Suspense boundary during prerender.
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <DashboardClient />
    </Suspense>
  );
}


