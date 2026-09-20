import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { UploadCard } from './UploadCard';
import { ToastProvider } from './ToastProvider';

function renderUploadCard(props = {}) {
  return render(
    <ToastProvider>
      <UploadCard onSubmit={vi.fn()} {...props} />
    </ToastProvider>
  );
}

describe('UploadCard', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderUploadCard();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('disables submit until a file is selected', () => {
    renderUploadCard();
    expect(screen.getByRole('button', { name: /analyze pdf/i })).toBeDisabled();
  });

  it('enables submit and calls onSubmit with the selected file and WCAG level', async () => {
    const onSubmit = vi.fn();
    renderUploadCard({ onSubmit });

    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/select pdf file to upload/i);
    fireEvent.change(input, { target: { files: [file] } });

    const submitButton = screen.getByRole('button', { name: /analyze pdf/i });
    expect(submitButton).toBeEnabled();

    await userEvent.click(screen.getByRole('radio', { name: /wcag aaa/i }));
    await userEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(file, 'AAA');
  });

  it('associates the dropzone label with the file input for native keyboard activation', () => {
    renderUploadCard();
    // A real <label htmlFor> association means the input itself is the tab
    // stop; the browser's native file-input behavior handles Enter/Space,
    // so there is nothing bespoke here for us to simulate.
    const input = screen.getByLabelText(/select pdf file to upload/i);
    expect(input).toHaveAttribute('type', 'file');
  });
});
