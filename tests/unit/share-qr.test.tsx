import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from '../../src/i18n';
import { ShareQr, pageUrl } from '../../src/components/ShareQr';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});
afterEach(cleanup);

describe('ShareQr', () => {
  it('opens a dialog showing the page URL and closes on Escape', () => {
    render(<ShareQr />);
    expect(screen.queryByTestId('share-qr-dialog')).toBeNull();

    fireEvent.click(screen.getByTestId('share-qr'));
    expect(screen.getByTestId('share-qr-dialog')).toBeTruthy();
    expect(screen.getByTestId('share-url').textContent).toBe(pageUrl());
    expect(pageUrl()).toBe(window.location.origin + import.meta.env.BASE_URL);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('share-qr-dialog')).toBeNull();
  });
});
