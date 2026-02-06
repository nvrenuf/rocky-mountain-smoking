export const BBQ_CATEGORIES = [
  {
    key: 'beef',
    label: 'Beef',
    description: 'Brisket, short ribs, and steak-forward cooks built for clean smoke and deep bark.',
    color: '#7c2d12',
  },
  {
    key: 'pork',
    label: 'Pork',
    description: 'Shoulder, ribs, and heritage cuts tuned for long smokes and tender pull.',
    color: '#9a3412',
  },
  {
    key: 'chicken',
    label: 'Chicken',
    description: 'Birds and wings that balance smoke, heat, and crisp skin.',
    color: '#b45309',
  },
] as const;

export type BbqCategoryKey = (typeof BBQ_CATEGORIES)[number]['key'];
