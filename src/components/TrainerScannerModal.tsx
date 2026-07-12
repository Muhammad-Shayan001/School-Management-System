import React from 'react';

export default function TrainerScannerModal({ sessionId, onClose, onScanned }: { sessionId?: string; onClose?: () => void; onScanned?: (record: any) => void }) {
  const [tokenInput, setTokenInput] = React.useState('');
  const [scanning, setScanning] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function submitToken() {
    if (!sessionId) return setMessage('No session selected');
    setMessage('Scanning...');
    try {
      const res = await fetch('/api/attendance/sessions/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, token: tokenInput, scannedBy: 'trainer-demo' }) });
      const json = await res.json();
      if (json.success) {
        setMessage('Marked present: ' + (json.record?.student_id || 'unknown'));
        onScanned?.(json.record);
      } else {
        setMessage('Scan failed: ' + (json.message || 'unknown'));
      }
    } catch (e: any) {
      setMessage('Error: ' + (e?.message || String(e)));
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow max-w-md">
      <div className="flex items-center justify-between">
        <div className="font-bold">Scanner</div>
        <button onClick={onClose} className="px-2 py-1">Close</button>
      </div>

      <div className="mt-3">
        <div className="text-sm text-slate-600">Manual token input (paste QR token here) — demo fallback if camera not available</div>
        <textarea value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} className="w-full mt-2 h-24 border rounded p-2" />
        <div className="flex gap-2 mt-2">
          <button onClick={submitToken} className="px-3 py-2 rounded bg-slate-900 text-white">Submit Token</button>
          <button onClick={() => { navigator.clipboard.readText().then(t => setTokenInput(t)).catch(()=>{}); }} className="px-3 py-2 rounded border">Paste Clipboard</button>
        </div>
        {message && <div className="mt-2 text-sm">{message}</div>}
      </div>
    </div>
  );
}
