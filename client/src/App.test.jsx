import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import App from './App';
import { ToastProvider } from './components/ToastProvider';

function renderApp() {
  return render(
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}

describe('App', () => {
  it('renders the upload screen with no accessibility violations', async () => {
    const { container } = renderApp();

    expect(screen.getByRole('heading', { level: 1, name: /docubil/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /upload your pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute(
      'href',
      '#main-content'
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('opens and closes the About dialog from the footer', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    renderApp();

    await userEvent.click(screen.getByRole('button', { name: /^about$/i }));
    const dialog = await screen.findByRole('dialog', { name: /about docubil/i });
    expect(dialog).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /close dialog/i }));
  });
});
