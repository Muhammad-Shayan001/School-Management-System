import React, { useEffect, useState } from 'react';

async function generateBrowserJwt(payload: object, secret: string) {
  // base64url encode helper for strings
  const base64UrlEncodeStr = (str: string) => {
    return btoa(unescape(encodeURIComponent(str))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB = base64UrlEncodeStr(JSON.stringify(header));
  const payloadB = base64UrlEncodeStr(JSON.stringify(payload));
  const toSign = `${headerB}.${payloadB}`;

  // import secret key
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(toSign));
  // convert sig to base64url
  const sigArr = new Uint8Array(sig as ArrayBuffer);
  let binary = '';
  for (let i = 0; i < sigArr.byteLength; i++) binary += String.fromCharCode(sigArr[i]);
  const sigB = btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${toSign}.${sigB}`;
}

export default function StudentQrCard({ studentId, studentName }: { studentId: string; studentName?: string }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/attendance/qr?studentId=${encodeURIComponent(studentId)}`);
        const contentType = res.headers.get('content-type') || '';
        if (!mounted) return;
        if (!res.ok) {
          // try to read json or text
          if (contentType.includes('application/json')) {
            const errJson = await res.json();
            setError(errJson?.message || `QR API error: ${res.status}`);
          } else {
            const txt = await res.text();
            // Fallback: generate a browser-signed JWT (HMAC-SHA256) so scanner accepts it in dev
            try {
              const secret = import.meta.env.VITE_QR_TOKEN_SECRET || 'demo-insecure-secret';
              const token = await generateBrowserJwt({ uid: studentId, iat: Math.floor(Date.now() / 1000) }, secret);
              const qr = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(token)}`;
              setQrUrl(qr);
              setToken(token);
              console.debug('QR API returned non-JSON; using browser-signed JWT fallback.');
              setError('Unable to reach QR API; using local demo-signed QR for development.');
            } catch (e) {
              const demoPayload = `SCHOOL-QR|${studentId}|course-1|${new Date().toISOString().slice(0,10)}`;
              const demoQr = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(demoPayload)}`;
              setQrUrl(demoQr);
              setToken(demoPayload);
              console.debug('Browser JWT fallback failed, using plain demo payload:', String(txt).slice(0,400));
              setError('Unable to reach QR API; using demo QR for development.');
            }
          }
        } else {
          if (contentType.includes('application/json')) {
            const json = await res.json();
            if (json.success) {
              setQrUrl(json.qrUrl);
              setToken(json.token || json.jwt || json.jwt_token);
            } else {
              setError(json.message || 'Failed to generate QR');
            }
          } else {
            const txt = await res.text();
            try {
              const secret = import.meta.env.VITE_QR_TOKEN_SECRET || 'demo-insecure-secret';
              const token = await generateBrowserJwt({ uid: studentId, iat: Math.floor(Date.now() / 1000) }, secret);
              const qr = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(token)}`;
              setQrUrl(qr);
              setToken(token);
              console.debug('QR API returned non-JSON; using browser-signed JWT fallback.');
              setError('QR service returned unexpected content; using local demo-signed QR.');
            } catch (e) {
              const demoPayload = `SCHOOL-QR|${studentId}|course-1|${new Date().toISOString().slice(0,10)}`;
              const demoQr = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(demoPayload)}`;
              setQrUrl(demoQr);
              setToken(demoPayload);
              console.debug('Browser JWT fallback failed, using plain demo payload:', String(txt).slice(0,400));
              setError('QR service returned unexpected content; using demo QR for now.');
            }
          }
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [studentId]);

  if (loading) return <div className="p-4">Loading QR...</div>;

  return (
    <div className="p-4 rounded-xl border bg-white max-w-sm">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">📘</div>
        <div>
          <div className="text-sm font-bold">{studentName || 'Student'}</div>
          <div className="text-xs text-slate-500">ID: {studentId}</div>
        </div>
      </div>

      <div className="mt-4 text-center">
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

        {qrUrl ? (
          <>
            <img src={String(qrUrl)} alt="QR" className="mx-auto" />
            <div className="mt-3 flex justify-center gap-2">
              <a href={String(qrUrl)} download={`qr-${studentId}.png`} className="px-3 py-2 rounded-md bg-slate-900 text-white text-sm">Download</a>
              <button onClick={async () => {
                const extractTokenFromQr = (url: string | null) => {
                  if (!url) return '';
                  try {
                    const u = new URL(url);
                    const chl = u.searchParams.get('chl');
                    return chl || '';
                  } catch (e) {
                    // if it's not a full URL, try parsing query
                    const m = String(url).match(/chl=([^&]+)/);
                    return m ? decodeURIComponent(m[1]) : '';
                  }
                };
                const toCopy = token || extractTokenFromQr(qrUrl);
                try { await navigator.clipboard.writeText(toCopy || ''); setError(null); } catch (e) { setError('Copy failed: clipboard not available'); }
              }} className="px-3 py-2 rounded-md border">Copy Token</button>
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-500">Unable to generate QR.</div>
        )}
      </div>
    </div>
  );
}
