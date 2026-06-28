'use client';

import { useMemo } from 'react';
import QRCode from 'react-qr-code';

export function CheckinQrCode({ size = 180 }: { size?: number }) {
  const checkinUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/checkin`;
    }
    return process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/checkin`
      : 'http://localhost:3000/checkin';
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-lg border bg-white p-3">
        <QRCode value={checkinUrl} size={size} />
      </div>
      <p className="max-w-[220px] break-all text-center text-xs text-muted-foreground">
        Scan to register or check in
      </p>
    </div>
  );
}
