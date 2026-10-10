import { formatInTimeZone } from 'date-fns-tz';
import { TIMEZONE } from '../config/game';
import type { SupportedLanguage } from './index';

const localeToIntl: Record<SupportedLanguage, string> = { vi: 'vi-VN', en: 'en-US' };

export function formatDate(iso: string, lang: SupportedLanguage): string {
  const date = new Date(iso + 'T00:00:00');
  if (lang === 'vi') return formatInTimeZone(date, TIMEZONE, 'dd/MM/yyyy');
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).format(date);
}

export function formatWeekday(iso: string, lang: SupportedLanguage): string {
  const date = new Date(iso + 'T00:00:00');
  return new Intl.DateTimeFormat(localeToIntl[lang], { weekday: 'long' }).format(date);
}

export function formatMoney(vnd: number, lang: SupportedLanguage): string {
  if (lang === 'vi') return `${new Intl.NumberFormat('vi-VN').format(vnd)} ₫`;
  return `${new Intl.NumberFormat('en-US').format(vnd)} VND`;
}

/** Short form, e.g. "30 tỷ ₫" / "30B VND". Only billions/millions are abbreviated. */
export function formatMoneyShort(vnd: number, lang: SupportedLanguage): string {
  const billion = 1_000_000_000;
  const million = 1_000_000;
  if (vnd >= billion) {
    const value = vnd / billion;
    return lang === 'vi' ? `${trim(value)} tỷ ₫` : `${trim(value)}B VND`;
  }
  if (vnd >= million) {
    const value = vnd / million;
    return lang === 'vi' ? `${trim(value)} triệu ₫` : `${trim(value)}M VND`;
  }
  return formatMoney(vnd, lang);
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function formatCountdown(ms: number, lang: SupportedLanguage): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  if (lang === 'vi') return `${days} ngày ${hours} giờ`;
  return `${days}d ${hours}h`;
}
