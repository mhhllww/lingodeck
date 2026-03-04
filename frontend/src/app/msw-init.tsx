'use client';

import { useEffect } from 'react';

export function MSWInit() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true'
    ) {
      import('@/mocks/browser').then(({ worker }) => {
        worker.start({ onUnhandledRequest: 'bypass' }).catch(console.error);
      });
    }
  }, []);

  return null;
}
