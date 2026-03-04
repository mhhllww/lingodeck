'use client';

import { useEffect } from 'react';
import { loadFromBackend } from '@/store/useCardStore';

export function BackendInit() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_MOCK !== 'true') {
      loadFromBackend().catch(console.error);
    }
  }, []);

  return null;
}
