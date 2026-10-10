import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, QrCode, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import { ControlTooltip } from './InfoTooltip';

/** The page's canonical URL: origin + Vite base path, without query/hash. */
export function pageUrl(): string {
  return window.location.origin + (import.meta.env.BASE_URL ?? '/');
}

const LOOPBACK = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\])$/;

/** Header button that opens a dialog with a QR code linking to this page. */
export function ShareQr() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const url = pageUrl();
  const isLoopback = LOOPBACK.test(window.location.hostname);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure origin, permissions); the URL is shown for manual copy.
    }
  };

  const download = () => {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'power-655-qr.png';
    a.click();
  };

  return (
    <>
      <ControlTooltip label={t('share.tooltip')}>
        <button
          type="button"
          data-testid="share-qr"
          aria-label={t('share.tooltip')}
          onClick={() => setOpen(true)}
          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-white/40 text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <QrCode size={16} aria-hidden="true" />
        </button>
      </ControlTooltip>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-qr-title"
            data-testid="share-qr-dialog"
            className="panel w-full max-w-sm p-5"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="share-qr-title" className="panel-title">
                  {t('share.title')}
                </h2>
                <p className="panel-subtitle">{t('share.subtitle')}</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                aria-label={t('share.close')}
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div ref={wrapRef} className="mx-auto w-fit rounded-xl bg-white p-3">
              <QRCodeCanvas
                value={url}
                size={220}
                level="M"
                marginSize={1}
                role="img"
                aria-label={t('share.qrAlt', { url })}
              />
            </div>

            <p className="mt-3 break-all text-center text-xs text-slate-300" data-testid="share-url">
              {url}
            </p>
            {isLoopback && <p className="mt-2 text-center text-[11px] leading-relaxed text-amber-400">{t('share.localhostNote')}</p>}

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={copy} className="chip chip-off inline-flex flex-1 items-center justify-center gap-1.5">
                {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copied ? t('share.copied') : t('share.copy')}
              </button>
              <button type="button" onClick={download} className="chip chip-on inline-flex flex-1 items-center justify-center gap-1.5">
                <Download size={14} aria-hidden="true" />
                {t('share.download')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
