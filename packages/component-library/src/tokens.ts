enum BreakpointNames {
  small = 'small',
  medium = 'medium',
  wide = 'wide',
}

type NumericBreakpoints = {
  [key in BreakpointNames]: number;
};

export const breakpoints: NumericBreakpoints = {
  small: 512,
  medium: 730,
  wide: 1100,
};

type BreakpointsPx = {
  [B in keyof NumericBreakpoints as `breakpoint_${B}`]: string;
};

// Provide the same breakpoints in a form usable by CSS media queries
// {
//   breakpoint_small: '512px',
//   breakpoint_medium: '740px',
//   breakpoint_wide: '1100px',
// }
export const tokens: BreakpointsPx = Object.entries(
  breakpoints,
).reduce<BreakpointsPx>(
  (acc, [key, val]) => ({
    ...acc,
    [`breakpoint_${key}`]: `${val}px`,
  }),
  {} as BreakpointsPx,
);

type SpacingSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const spacing: Record<SpacingSize, number> = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

type RadiusSize = 'xs' | 'sm' | 'md' | 'lg' | 'pill';

export const radius: Record<RadiusSize, number> = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
};

type ShadowSize = 'xs' | 'sm' | 'md' | 'lg';

export const shadows: Record<ShadowSize, string> = {
  xs: '0 1px 2px rgba(16, 24, 40, 0.05)',
  sm: '0 1px 3px rgba(16, 24, 40, 0.08), 0 1px 2px rgba(16, 24, 40, 0.04)',
  md: '0 6px 16px -4px rgba(16, 24, 40, 0.1), 0 2px 6px -2px rgba(16, 24, 40, 0.06)',
  lg: '0 20px 40px -12px rgba(16, 24, 40, 0.22), 0 8px 16px -8px rgba(16, 24, 40, 0.1)',
};
