import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

const CONTENT_CLASS =
  'z-50 max-w-xs rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs leading-relaxed text-white shadow-xl';

/** An `i` button that reveals an explanation on hover, focus or tap. */
export function InfoTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label={label}
            className="inline-flex items-center justify-center rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            <Info size={14} aria-hidden="true" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="top" align="center" sideOffset={6} collisionPadding={12} className={CONTENT_CLASS}>
            {children}
            <Tooltip.Arrow className="fill-slate-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/**
 * Wraps a decorative icon (or an icon-only control) so it explains itself on
 * hover/focus. The label doubles as the accessible name, so the icon it wraps
 * should stay `aria-hidden`.
 */
export function IconTooltip({
  label,
  side = 'top',
  children,
}: {
  label: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
}) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span tabIndex={0} role="img" aria-label={label} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-0 rounded-lg">
            {children}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side={side} align="center" sideOffset={6} collisionPadding={12} className={CONTENT_CLASS}>
            {label}
            <Tooltip.Arrow className="fill-slate-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/** Adds a tooltip to an existing interactive element (button, link, …). */
export function ControlTooltip({
  label,
  side = 'top',
  children,
}: {
  label: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
}) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side={side} align="center" sideOffset={6} collisionPadding={12} className={CONTENT_CLASS}>
            {label}
            <Tooltip.Arrow className="fill-slate-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
