'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-green-400 font-upheaval text-2xl animate-pulse">
        REDIRECTING TO SENTINEL...
      </div>
    </div>
  );
}
