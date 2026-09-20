import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { RemediationPanel } from './RemediationPanel';

const result = {
  originalIssues: 4,
  fixedIssues: 2,
  remainingIssues: 2,
  remainingBySeverity: { critical: 0, moderate: 2, minor: 0 },
  downloadUrl: '/api/download/job-1',
  fixedIssuesDetail: [{ id: 'metadata-001', title: 'Missing title', fixApplied: 'Title set' }],
  remainingIssuesDetail: [
    { id: 'alt-text-p1', title: 'Missing alt text', reason: 'Requires human judgment' },
  ],
};

describe('RemediationPanel', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <RemediationPanel jobId="job-1" result={result} onStartOver={vi.fn()} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('expands the fixed-issues accordion to reveal detail', async () => {
    render(<RemediationPanel jobId="job-1" result={result} onStartOver={vi.fn()} />);

    const toggle = screen.getByRole('button', { name: /what was fixed/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Missing title')).not.toBeVisible();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Missing title')).toBeVisible();
  });

  it('calls onStartOver when "Analyze another PDF" is clicked', async () => {
    const onStartOver = vi.fn();
    render(<RemediationPanel jobId="job-1" result={result} onStartOver={onStartOver} />);

    await userEvent.click(screen.getByRole('button', { name: /analyze another pdf/i }));
    expect(onStartOver).toHaveBeenCalled();
  });
});
