import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ResultsPanel } from './ResultsPanel';

const result = {
  jobId: '00000000-0000-0000-0000-000000000000',
  status: 'analyzed',
  issues: 6,
  issuesBySeverity: { critical: 2, moderate: 3, minor: 1 },
  pythonEnhanced: true,
};

describe('ResultsPanel', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<ResultsPanel result={result} onRemediate={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the real severity breakdown from the API response', () => {
    render(<ResultsPanel result={result} onRemediate={vi.fn()} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('disables the remediate button while remediating', () => {
    render(<ResultsPanel result={result} onRemediate={vi.fn()} remediating />);
    expect(screen.getByRole('button', { name: /remediating/i })).toBeDisabled();
  });
});
