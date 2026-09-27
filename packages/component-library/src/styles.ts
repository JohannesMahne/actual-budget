import { keyframes } from '@emotion/css';

import { theme } from './theme';
import { radius, shadows, tokens } from './tokens';

// oxlint-disable-next-line typescript/no-explicit-any
export type CSSProperties = Record<string, any>;

const MOBILE_MIN_HEIGHT = 44;

const shadowLarge = {
  boxShadow: shadows.lg,
};

export const styles: CSSProperties = {
  incomeHeaderHeight: 70,
  cardShadow: shadows.sm,
  monthRightPadding: 5,
  menuBorderRadius: radius.md,
  mobileMinHeight: MOBILE_MIN_HEIGHT,
  mobileMenuItem: {
    fontSize: 17,
    fontWeight: 400,
    paddingTop: 8,
    paddingBottom: 8,
    height: MOBILE_MIN_HEIGHT,
    minHeight: MOBILE_MIN_HEIGHT,
  },
  mobileEditingPadding: 12,
  altMenuMaxHeight: 250,
  altMenuText: {
    fontSize: 13,
  },
  altMenuHeaderText: {
    fontSize: 13,
    fontWeight: 700,
  },
  veryLargeText: {
    fontSize: 28,
    fontWeight: 650,
    letterSpacing: '-0.02em',
  },
  largeText: {
    fontSize: 20,
    fontWeight: 650,
    letterSpacing: '-0.01em',
  },
  mediumText: {
    fontSize: 15,
    fontWeight: 600,
  },
  smallText: {
    fontSize: 13,
  },
  verySmallText: {
    fontSize: 12,
  },
  tinyText: {
    fontSize: 10,
  },
  page: {
    flex: 1,
    '@media (max-height: 550px)': {
      minHeight: 700, // ensure we can scroll on small screens
    },
    paddingTop: 8, // height of the titlebar
    [`@media (min-width: ${tokens.breakpoint_small})`]: {
      paddingTop: 36,
    },
  },
  pageContent: {
    paddingLeft: 2,
    paddingRight: 2,
    [`@media (min-width: ${tokens.breakpoint_small})`]: {
      paddingLeft: 20,
      paddingRight: 20,
    },
  },
  settingsPageContent: {
    padding: 20,
    [`@media (min-width: ${tokens.breakpoint_small})`]: {
      padding: 'inherit',
    },
  },
  staticText: {
    cursor: 'default',
    userSelect: 'none',
  },
  shadow: {
    boxShadow: shadows.sm,
  },
  shadowLarge,
  tnum: {
    // tnum: Tabular numbers
    // ss01: Open digits
    // ss04: Disambiguation w/o zero
    fontFeatureSettings: '"tnum", "ss01", "ss04"',
  },
  notFixed: { fontFeatureSettings: '' },
  text: {
    fontSize: 16,
    // lineHeight: 22.4 // TODO: This seems like trouble, but what's the right value?
  },
  delayedFadeIn: {
    animationName: keyframes({
      '0%': { opacity: 0 },
      '100%': { opacity: 1 },
    }),
    animationDuration: '1s',
    animationFillMode: 'both',
    animationDelay: '0.5s',
  },
  underlinedText: {
    borderBottom: `2px solid`,
  },
  noTapHighlight: {
    WebkitTapHighlightColor: 'transparent',
    ':focus': {
      outline: 'none',
    },
  },
  lineClamp: (lines: number) => {
    return {
      display: '-webkit-box',
      WebkitLineClamp: lines,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      wordBreak: 'break-word',
    };
  },
  ellipsisText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
  tooltip: {
    padding: '6px 8px',
    boxShadow: shadows.md,
    borderWidth: 1,
    borderRadius: radius.md,
    borderStyle: 'solid',
    borderColor: theme.tooltipBorder,
    backgroundColor: theme.tooltipBackground,
    color: theme.tooltipText,
    overflow: 'auto',
  },
  popover: {
    border: 'none',
    backgroundColor: theme.menuBackground,
    color: theme.menuItemText,
  },
  // Dynamically set
  horizontalScrollbar: null as CSSProperties | null,
  lightScrollbar: null as CSSProperties | null,
  darkScrollbar: null as CSSProperties | null,
  scrollbarWidth: null as number | null,
  editorPill: {
    color: theme.pillText,
    backgroundColor: theme.pillBackground,
    borderRadius: radius.sm,
    padding: '3px 5px',
  },
  mobileListItem: {
    borderBottom: `1px solid ${theme.tableBorder}`,
    backgroundColor: theme.tableBackground,
    padding: 16,
    cursor: 'pointer',
  },
  tableContainer: {
    flex: 1,
    border: '1px solid ' + theme.tableBorder,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
  },
};
