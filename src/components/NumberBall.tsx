import { useTranslation } from 'react-i18next';

export type BallRole = 'core' | 'filler' | 'bonus' | 'hot';

interface NumberBallProps {
  n: number;
  role: BallRole;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-8 w-8 text-xs md:h-9 md:w-9 md:text-sm',
  lg: 'h-12 w-12 text-lg',
};

// Core picks keep a red ring so they stay distinguishable from filler numbers
// without breaking the mockup's uniform dark-ball look.
const STYLES: Record<BallRole, string> = {
  hot: 'bg-gradient-to-br from-rose-500 to-red-600 text-white ring-2 ring-rose-400/40',
  core: 'bg-slate-800 text-white ring-2 ring-rose-500',
  filler: 'bg-slate-800 text-slate-200 ring-1 ring-slate-700',
  bonus: 'bg-gradient-to-br from-amber-400 to-orange-500 text-amber-950 ring-2 ring-amber-300/40',
};

export function NumberBall({ n, role, size = 'md' }: NumberBallProps) {
  const { t } = useTranslation();
  const roleKey =
    role === 'core' || role === 'hot'
      ? 'aria.roleCore'
      : role === 'bonus'
        ? 'aria.roleBonus'
        : 'aria.roleFiller';

  return (
    <span
      role="img"
      data-testid="number-ball"
      aria-label={t('aria.numberBall', { n, role: t(roleKey) })}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold tabular-nums ${SIZES[size]} ${STYLES[role]}`}
    >
      {String(n).padStart(2, '0')}
    </span>
  );
}
