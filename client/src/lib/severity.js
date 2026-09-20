export const SEVERITY_ORDER = ['critical', 'moderate', 'minor'];

export const SEVERITY_META = {
  critical: {
    label: 'Critical',
    description: 'Blocks assistive technology users from accessing content',
    textClass: 'text-critical',
    bgClass: 'bg-critical-bg',
    ringClass: 'ring-critical/20',
    barClass: 'bg-critical',
  },
  moderate: {
    label: 'Moderate',
    description: 'Makes content harder to use, but not impossible',
    textClass: 'text-moderate',
    bgClass: 'bg-moderate-bg',
    ringClass: 'ring-moderate/20',
    barClass: 'bg-moderate',
  },
  minor: {
    label: 'Minor',
    description: 'A refinement rather than a barrier',
    textClass: 'text-minor',
    bgClass: 'bg-minor-bg',
    ringClass: 'ring-minor/20',
    barClass: 'bg-minor',
  },
};
