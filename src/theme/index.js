import { createTheme, alpha } from '@mui/material/styles';

// ─── Brand Tokens ────────────────────────────────────────────────────────────
// ─── Brand Tokens ────────────────────────────────────────────────────────────
const NAVY      = '#0B1D2B'; // Deep Navy
const MIDNIGHT  = '#13283B'; // Midnight Blue
const AQUA      = '#41C6C6'; // Aqua
const SOFT_AQUA = '#BDE7E6'; // Soft Aqua
const MIST_GREY = '#E9EEF2'; // Mist Grey
const SLATE     = '#23323C'; // Slate
const WHITE     = '#FFFFFF'; // White

// ─── Custom Shadow Palette (navy-tinted, 15 levels) ──────────────────────────
const buildShadow = (y, blur, spread, opacity) =>
  `0 ${y}px ${blur}px ${spread}px rgba(11,29,43,${opacity})`;

const shadows = [
  'none',                                                                      // 0
  `0 1px 2px 0 rgba(11,29,43,0.05)`,                                          // 1
  `0 1px 3px 0 rgba(11,29,43,0.07), 0 1px 2px -1px rgba(11,29,43,0.06)`,     // 2
  `0 2px 6px -1px rgba(11,29,43,0.08), 0 1px 3px -1px rgba(11,29,43,0.06)`,  // 3
  `0 4px 8px -2px rgba(11,29,43,0.09), 0 2px 4px -2px rgba(11,29,43,0.06)`,  // 4
  `0 6px 12px -3px rgba(11,29,43,0.10), 0 2px 5px -2px rgba(11,29,43,0.06)`, // 5
  buildShadow(8, 16, -4, 0.11),                                                // 6
  buildShadow(10, 18, -4, 0.12),                                               // 7
  buildShadow(12, 20, -5, 0.13),                                               // 8
  buildShadow(14, 22, -5, 0.14),                                               // 9
  buildShadow(16, 24, -6, 0.15),                                               // 10
  buildShadow(18, 26, -6, 0.16),                                               // 11
  buildShadow(20, 28, -6, 0.17),                                               // 12
  buildShadow(22, 30, -7, 0.18),                                               // 13
  buildShadow(24, 38, -7, 0.20),                                               // 14
  buildShadow(28, 44, -8, 0.22),                                               // 15
  buildShadow(32, 50, -9, 0.24),                                               // 16 (MUI expects 25 total)
  buildShadow(36, 56, -9, 0.26),
  buildShadow(40, 60, -10, 0.28),
  buildShadow(44, 64, -10, 0.30),
  buildShadow(48, 68, -11, 0.32),
  buildShadow(52, 72, -11, 0.34),
  buildShadow(56, 76, -12, 0.36),
  buildShadow(60, 80, -12, 0.38),
  buildShadow(64, 84, -13, 0.40),
];

// ─── Semantic shadow shortcuts ────────────────────────────────────────────────
export const elevation = {
  none:   shadows[0],
  low:    shadows[2],
  medium: shadows[5],
  high:   shadows[10],
  dialog: shadows[14],
  menu:   shadows[6],
};

// ─── Transition helpers ────────────────────────────────────────────────────────
export const transitions = {
  fast:   '120ms ease',
  normal: '200ms ease',
  slow:   '300ms ease',
};

// ─── Focus-visible ring ───────────────────────────────────────────────────────
const focusRing = {
  outline: `3px solid ${alpha(AQUA, 0.5)}`,
  outlineOffset: 2,
};

// ─────────────────────────────────────────────────────────────────────────────
const theme = createTheme({
  // ── Shadows ──────────────────────────────────────────────────────────────
  shadows,

  // ── Shape ────────────────────────────────────────────────────────────────
  shape: {
    borderRadius: 10,
  },

  // ── Palette ──────────────────────────────────────────────────────────────
  palette: {
    mode: 'light',

    primary: {
      main:          NAVY,
      light:         MIDNIGHT,
      dark:          '#07121b',
      contrastText:  WHITE,
    },

    secondary: {
      main:          AQUA,
      light:         SOFT_AQUA,
      dark:          '#2c8c8c',
      contrastText:  NAVY,
    },

    success: {
      main:          '#16a34a',
      light:         '#dcfce7',
      dark:          '#15803d',
      contrastText:  WHITE,
    },

    error: {
      main:          '#dc2626',
      light:         '#fee2e2',
      dark:          '#b91c1c',
      contrastText:  WHITE,
    },

    warning: {
      main:          '#d97706',
      light:         '#fef3c7',
      dark:          '#b45309',
      contrastText:  WHITE,
    },

    info: {
      main:          '#2563eb',
      light:         '#dbeafe',
      dark:          '#1d4ed8',
      contrastText:  WHITE,
    },

    grey: {
      50:  '#F8FAFC',
      100: '#F1F5F9',
      200: MIST_GREY,
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: SLATE,
      800: '#1E293B',
      900: '#0F172A',
    },

    text: {
      primary:   NAVY,
      secondary: SLATE,
      disabled:  '#94a3b8',
    },

    background: {
      default: WHITE,
      paper:   WHITE,
    },

    divider: MIST_GREY,

    action: {
      hover:           alpha(NAVY, 0.04),
      hoverOpacity:    0.04,
      selected:        alpha(AQUA, 0.10),
      selectedOpacity: 0.10,
      disabled:        alpha(NAVY, 0.26),
      disabledBackground: alpha(NAVY, 0.08),
      focus:           alpha(AQUA, 0.12),
      focusOpacity:    0.12,
    },
  },

  // ── Typography ───────────────────────────────────────────────────────────
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
    fontWeightLight:   300,
    fontWeightRegular: 400,
    fontWeightMedium:  600,
    fontWeightBold:    700,

    h1: {
      fontWeight:    800,
      letterSpacing: '-0.03em',
      lineHeight:    1.15,
    },
    h2: {
      fontWeight:    800,
      letterSpacing: '-0.02em',
      lineHeight:    1.2,
    },
    h3: {
      fontWeight:    800,
      letterSpacing: '-0.02em',
      lineHeight:    1.25,
    },
    h4: {
      fontWeight:    700,
      letterSpacing: '-0.01em',
      lineHeight:    1.3,
    },
    h5: {
      fontWeight:    700,
      letterSpacing: '-0.005em',
      lineHeight:    1.35,
    },
    h6: {
      fontWeight:    700,
      letterSpacing: 0,
      lineHeight:    1.4,
    },
    subtitle1: {
      fontWeight:    600,
      lineHeight:    1.5,
      letterSpacing: '-0.005em',
    },
    subtitle2: {
      fontWeight:    600,
      lineHeight:    1.5,
      letterSpacing: 0,
    },
    body1: {
      fontWeight:    400,
      lineHeight:    1.6,
      letterSpacing: 0,
    },
    body2: {
      fontWeight:    400,
      lineHeight:    1.6,
      letterSpacing: 0,
    },
    button: {
      fontWeight:      700,
      textTransform:   'none',
      letterSpacing:   '0.01em',
      lineHeight:      1.5,
    },
    caption: {
      fontWeight:    600,
      lineHeight:    1.5,
      letterSpacing: '0.01em',
    },
    overline: {
      fontWeight:    800,
      letterSpacing: '0.1em',
      lineHeight:    1.8,
      textTransform: 'uppercase',
    },
  },

  // ── Component Overrides ──────────────────────────────────────────────────
  components: {

    // ── MuiCssBaseline ───────────────────────────────────────────────────
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': {
          boxSizing: 'border-box',
        },
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        },
        body: {
          backgroundColor: WHITE,
          color: NAVY,
        },
        ':focus-visible': focusRing,
        '::selection': {
          backgroundColor: alpha(AQUA, 0.2),
          color: NAVY,
        },
      },
    },

    // ── MuiButton ────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple:    false,
      },
      styleOverrides: {
        root: {
          borderRadius:   10,
          padding:        '10px 20px',
          fontWeight:     700,
          fontSize:       '0.875rem',
          lineHeight:     1.5,
          textTransform:  'none',
          letterSpacing:  '0.01em',
          transition:     `background-color ${transitions.normal}, color ${transitions.normal}, border-color ${transitions.normal}, box-shadow ${transitions.normal}, transform ${transitions.fast}`,
          boxShadow:      'none',
          position:       'relative',
          overflow:       'hidden',

          '&:active': {
            transform: 'scale(0.98)',
          },

          '&:focus-visible': focusRing,

          '&.Mui-disabled': {
            opacity: 0.5,
            cursor:  'not-allowed',
            pointerEvents: 'auto',
          },
        },

        // Contained Primary
        containedPrimary: {
          backgroundColor: NAVY,
          color:           '#ffffff',
          '&:hover': {
            backgroundColor: '#13283B',
            boxShadow:       '0 4px 14px rgba(11,29,43,0.20)',
            transform:       'translateY(-1px)',
          },
          '&:active': {
            backgroundColor: '#071522',
            boxShadow:       'none',
            transform:       'scale(0.98)',
          },
        },

        // Contained Secondary
        containedSecondary: {
          backgroundColor: AQUA,
          color:           NAVY,
          '&:hover': {
            backgroundColor: '#35b5b5',
            boxShadow:       `0 4px 14px ${alpha(AQUA, 0.35)}`,
            transform:       'translateY(-1px)',
          },
          '&:active': {
            backgroundColor: '#259B9B',
            boxShadow:       'none',
            transform:       'scale(0.98)',
          },
        },

        // Outlined
        outlined: {
          borderWidth:  '1.5px',
          borderStyle:  'solid',
          '&:hover': {
            borderWidth:     '1.5px',
            backgroundColor: alpha(NAVY, 0.04),
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        outlinedPrimary: {
          borderColor: NAVY,
          '&:hover': {
            borderColor:     '#13283B',
            backgroundColor: alpha(NAVY, 0.04),
          },
        },
        outlinedSecondary: {
          borderColor: AQUA,
          '&:hover': {
            borderColor:     '#35b5b5',
            backgroundColor: alpha(AQUA, 0.06),
          },
        },

        // Text
        text: {
          '&:hover': {
            backgroundColor: alpha(NAVY, 0.05),
          },
        },
        textPrimary: {
          '&:hover': {
            color:           '#13283B',
            backgroundColor: alpha(NAVY, 0.05),
          },
        },
        textSecondary: {
          '&:hover': {
            color:           '#35b5b5',
            backgroundColor: alpha(AQUA, 0.08),
          },
        },

        // Sizes
        sizeSmall: {
          padding:    '6px 14px',
          fontSize:   '0.8125rem',
          borderRadius: 8,
        },
        sizeLarge: {
          padding:    '14px 28px',
          fontSize:   '1rem',
          borderRadius: 12,
        },

        // Icon spacing
        startIcon: {
          marginRight: 8,
          '&>*:nth-of-type(1)': { fontSize: '1.1em' },
        },
        endIcon: {
          marginLeft: 8,
          '&>*:nth-of-type(1)': { fontSize: '1.1em' },
        },
      },
    },

    // ── MuiIconButton ────────────────────────────────────────────────────
    MuiIconButton: {
      defaultProps: {
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          borderRadius:  10,
          transition:    `background-color ${transitions.normal}, color ${transitions.normal}, transform ${transitions.fast}`,
          '&:hover': {
            backgroundColor: alpha(NAVY, 0.06),
            transform:       'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
          '&:focus-visible': {
            ...focusRing,
            backgroundColor: alpha(AQUA, 0.10),
          },
          '&.Mui-disabled': {
            opacity: 0.4,
          },
        },
        sizeSmall: {
          borderRadius: 8,
          padding: '6px',
        },
        sizeLarge: {
          borderRadius: 12,
          padding: '12px',
        },
        colorPrimary: {
          '&:hover': {
            backgroundColor: alpha(NAVY, 0.08),
            color: '#13283B',
          },
        },
        colorSecondary: {
          '&:hover': {
            backgroundColor: alpha(AQUA, 0.10),
            color: '#259B9B',
          },
        },
      },
    },

    // ── MuiTextField ─────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: {
        variant:  'outlined',
        size:     'medium',
      },
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            fontWeight:  500,
            color:       '#475569',
            transition:  `color ${transitions.normal}`,
            '&.Mui-focused': {
              color: AQUA,
            },
            '&.Mui-error': {
              color: '#dc2626',
            },
          },
          '& .MuiFormHelperText-root': {
            fontWeight:   500,
            fontSize:     '0.75rem',
            marginTop:    6,
            marginLeft:   2,
            letterSpacing: '0.01em',
            '&.Mui-error': {
              color: '#dc2626',
            },
          },
        },
      },
    },

    // ── MuiOutlinedInput ─────────────────────────────────────────────────
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius:    10,
          backgroundColor: '#ffffff',
          transition:      `box-shadow ${transitions.normal}, border-color ${transitions.normal}`,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor:  '#CBD5E1',
            borderWidth:  '1.5px',
            transition:   `border-color ${transitions.normal}`,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: NAVY,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: AQUA,
            borderWidth: '2px',
          },
          '&.Mui-focused': {
            boxShadow: `0 0 0 4px ${alpha(AQUA, 0.12)}`,
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: '#dc2626',
          },
          '&.Mui-error.Mui-focused': {
            boxShadow: `0 0 0 4px rgba(220,38,38,0.10)`,
          },
          '&.Mui-disabled': {
            backgroundColor: '#F1F5F9',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#E2E8F0',
            },
          },
        },
        input: {
          fontWeight:    500,
          fontSize:      '0.9375rem',
          color:         NAVY,
          padding:       '13px 16px',
          '&::placeholder': {
            color:   '#94A3B8',
            opacity: 1,
          },
        },
        inputSizeSmall: {
          padding: '9px 14px',
          fontSize: '0.875rem',
        },
        notchedOutline: {
          borderColor: '#CBD5E1',
        },
      },
    },

    // ── MuiSelect ────────────────────────────────────────────────────────
    MuiSelect: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        select: {
          fontWeight:  500,
          color:       NAVY,
          '&:focus': {
            backgroundColor: 'transparent',
          },
        },
        icon: {
          color:      '#64748B',
          transition: `transform ${transitions.normal}`,
          right:      12,
        },
      },
    },

    // ── MuiPaper ─────────────────────────────────────────────────────────
    MuiPaper: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition:      `box-shadow ${transitions.normal}`,
        },
        rounded: {
          borderRadius: 12,
        },
        // Elevation variants mapped to semantic shadow scale
        elevation0:  { boxShadow: elevation.none   },
        elevation1:  { boxShadow: elevation.low    },
        elevation2:  { boxShadow: shadows[2]       },
        elevation3:  { boxShadow: shadows[3]       },
        elevation4:  { boxShadow: elevation.medium },
        elevation8:  { boxShadow: shadows[8]       },
        elevation12: { boxShadow: shadows[10]      },
        elevation16: { boxShadow: elevation.high   },
        elevation24: { boxShadow: elevation.dialog },
      },
    },

    // ── MuiCard ──────────────────────────────────────────────────────────
    MuiCard: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: {
          borderRadius:    14,
          backgroundColor: '#ffffff',
          boxShadow:       elevation.low,
          border:          '1px solid #E2E8F0',
          overflow:        'hidden',
          transition:      `box-shadow ${transitions.normal}, transform ${transitions.normal}`,
          '&:hover': {
            boxShadow: elevation.medium,
          },
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px 24px',
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },

    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '20px 24px 0',
        },
        title: {
          fontWeight: 700,
          fontSize:   '1rem',
          color:      NAVY,
        },
        subheader: {
          fontWeight: 500,
          fontSize:   '0.8125rem',
          color:      '#475569',
          marginTop:  4,
        },
      },
    },

    MuiCardActions: {
      styleOverrides: {
        root: {
          padding:    '12px 24px 20px',
          gap:        8,
        },
      },
    },

    // ── MuiDialog ────────────────────────────────────────────────────────
    MuiDialog: {
      defaultProps: {
        PaperProps: {
          elevation: 24,
        },
      },
      styleOverrides: {
        paper: {
          borderRadius:    20,
          boxShadow:       elevation.dialog,
          backgroundColor: '#ffffff',
          backgroundImage: 'none',
        },
        paperFullScreen: {
          borderRadius: 0,
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding:    '24px 28px 12px',
          fontWeight: 700,
          fontSize:   '1.125rem',
          color:      NAVY,
          letterSpacing: '-0.01em',
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding:  '12px 28px',
          '&:first-of-type': {
            paddingTop: 20,
          },
        },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 28px 24px',
          gap:     8,
        },
      },
    },

    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(NAVY, 0.45),
          backdropFilter:  'blur(4px)',
        },
        invisible: {
          backgroundColor: 'transparent',
          backdropFilter:  'none',
        },
      },
    },

    // ── MuiDrawer ────────────────────────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        root: {
          '& .MuiDrawer-paper': {
            transition:      `transform ${transitions.slow} cubic-bezier(0.4,0,0.2,1) !important`,
            boxShadow:       elevation.high,
            backgroundImage: 'none',
            borderRight:     '1px solid #E2E8F0',
          },
        },
        paper: {
          backgroundColor: '#ffffff',
          backgroundImage: 'none',
        },
        paperAnchorLeft: {
          borderRight: '1px solid #E2E8F0',
        },
        paperAnchorRight: {
          borderLeft: '1px solid #E2E8F0',
        },
        paperAnchorBottom: {
          borderRadius:  '20px 20px 0 0',
          borderTop:     '1px solid #E2E8F0',
        },
        paperAnchorTop: {
          borderRadius:  '0 0 20px 20px',
          borderBottom:  '1px solid #E2E8F0',
        },
      },
    },

    // ── MuiAppBar ────────────────────────────────────────────────────────
    MuiAppBar: {
      defaultProps: {
        elevation:   0,
        color:       'default',
        position:    'sticky',
      },
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          backgroundImage: 'none',
          borderBottom:    '1px solid #E2E8F0',
          boxShadow:       'none',
          color:           NAVY,
          transition:      `box-shadow ${transitions.normal}`,
        },
        colorDefault: {
          backgroundColor: '#ffffff',
          color:           NAVY,
        },
        colorPrimary: {
          backgroundColor: NAVY,
          color:           '#ffffff',
          borderBottom:    'none',
          boxShadow:       elevation.low,
        },
        colorTransparent: {
          backgroundColor: 'transparent',
          borderBottom:    'none',
        },
      },
    },

    // ── MuiToolbar ───────────────────────────────────────────────────────
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 64,
          padding:   '0 24px',
          '@media (min-width: 600px)': {
            minHeight: 64,
            padding:   '0 24px',
          },
        },
        dense: {
          minHeight: 52,
          '@media (min-width: 600px)': {
            minHeight: 52,
          },
        },
      },
    },

    // ── MuiChip ──────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius:    8,
          fontWeight:      600,
          fontSize:        '0.8125rem',
          height:          32,
          letterSpacing:   '0.01em',
          transition:      `background-color ${transitions.normal}, color ${transitions.normal}, box-shadow ${transitions.normal}`,
          '&:focus-visible': focusRing,
        },
        label: {
          paddingLeft:  12,
          paddingRight: 12,
        },
        labelSmall: {
          paddingLeft:  8,
          paddingRight: 8,
        },
        sizeSmall: {
          height:    24,
          fontSize:  '0.75rem',
          borderRadius: 6,
        },
        colorPrimary: {
          backgroundColor: alpha(NAVY, 0.08),
          color:           NAVY,
          '&:hover': {
            backgroundColor: alpha(NAVY, 0.13),
          },
          '&.MuiChip-filled': {
            backgroundColor: NAVY,
            color:           '#ffffff',
            '&:hover': {
              backgroundColor: '#13283B',
            },
          },
        },
        colorSecondary: {
          backgroundColor: alpha(AQUA, 0.12),
          color:           '#259B9B',
          '&:hover': {
            backgroundColor: alpha(AQUA, 0.20),
          },
          '&.MuiChip-filled': {
            backgroundColor: AQUA,
            color:           NAVY,
            '&:hover': {
              backgroundColor: '#35b5b5',
            },
          },
        },
        colorSuccess: {
          backgroundColor: '#dcfce7',
          color:           '#15803d',
        },
        colorError: {
          backgroundColor: '#fee2e2',
          color:           '#b91c1c',
        },
        colorWarning: {
          backgroundColor: '#fef3c7',
          color:           '#b45309',
        },
        colorInfo: {
          backgroundColor: '#dbeafe',
          color:           '#1d4ed8',
        },
        outlined: {
          borderWidth: '1.5px',
        },
        deleteIcon: {
          color: 'inherit',
          opacity: 0.6,
          '&:hover': {
            opacity: 1,
            color: 'inherit',
          },
        },
      },
    },

    // ── MuiTooltip ───────────────────────────────────────────────────────
    MuiTooltip: {
      defaultProps: {
        arrow:           true,
        enterDelay:      300,
        enterNextDelay:  100,
      },
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1E293B',
          color:           '#F1F5F9',
          fontSize:        '0.75rem',
          fontWeight:      600,
          lineHeight:      1.5,
          borderRadius:    8,
          padding:         '6px 12px',
          boxShadow:       elevation.medium,
          letterSpacing:   '0.01em',
          maxWidth:        260,
        },
        arrow: {
          color: '#1E293B',
        },
        tooltipPlacementTop: {
          marginBottom: '6px !important',
        },
        tooltipPlacementBottom: {
          marginTop: '6px !important',
        },
      },
    },

    // ── MuiAlert ─────────────────────────────────────────────────────────
    MuiAlert: {
      defaultProps: {
        variant: 'filled',
      },
      styleOverrides: {
        root: {
          borderRadius:  12,
          fontWeight:    600,
          fontSize:      '0.875rem',
          alignItems:    'center',
          border:        '1px solid transparent',
          padding:       '10px 16px',
        },
        filled: {
          boxShadow: elevation.low,
        },
        outlined: {
          backgroundColor: '#ffffff',
        },
        standard: {
          border: '1px solid transparent',
        },
        standardSuccess: {
          backgroundColor: '#dcfce7',
          color:           '#15803d',
          border:          '1px solid rgba(22,163,74,0.20)',
          '& .MuiAlert-icon': { color: '#16a34a' },
        },
        standardError: {
          backgroundColor: '#fee2e2',
          color:           '#b91c1c',
          border:          '1px solid rgba(220,38,38,0.20)',
          '& .MuiAlert-icon': { color: '#dc2626' },
        },
        standardWarning: {
          backgroundColor: '#fef3c7',
          color:           '#b45309',
          border:          '1px solid rgba(217,119,6,0.20)',
          '& .MuiAlert-icon': { color: '#d97706' },
        },
        standardInfo: {
          backgroundColor: '#dbeafe',
          color:           '#1d4ed8',
          border:          '1px solid rgba(37,99,235,0.20)',
          '& .MuiAlert-icon': { color: '#2563eb' },
        },
        icon: {
          opacity: 1,
          padding: '0',
          marginRight: 12,
          '& svg': { fontSize: '1.25rem' },
        },
        message: {
          padding: '0',
          lineHeight: 1.5,
        },
        action: {
          padding: '0 0 0 16px',
          alignItems: 'center',
        },
      },
    },

    // ── MuiLinearProgress ────────────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          height:       6,
          backgroundColor: '#E2E8F0',
          overflow: 'hidden',
        },
        bar: {
          borderRadius: 999,
          transition: `transform ${transitions.slow}`,
        },
        colorPrimary: {
          backgroundColor: '#E2E8F0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: AQUA,
          },
        },
        colorSecondary: {
          backgroundColor: '#E2E8F0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: NAVY,
          },
        },
      },
    },

    // ── MuiCircularProgress ──────────────────────────────────────────────
    MuiCircularProgress: {
      defaultProps: {
        color: 'secondary',
        thickness: 4,
      },
      styleOverrides: {
        colorPrimary:   { color: NAVY  },
        colorSecondary: { color: AQUA  },
      },
    },

    // ── MuiSkeleton ──────────────────────────────────────────────────────
    MuiSkeleton: {
      defaultProps: {
        animation: 'wave',
      },
      styleOverrides: {
        root: {
          backgroundColor: '#E2E8F0',
          borderRadius: 8,
          '&::after': {
            background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.6)}, transparent)`,
          },
        },
        rectangular: {
          borderRadius: 8,
        },
        rounded: {
          borderRadius: 10,
        },
        text: {
          borderRadius: 6,
          transform:    'none',
          marginBottom: 0,
        },
      },
    },

    // ── MuiDivider ───────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor:    '#E2E8F0',
          borderWidth:    '1px',
          margin:         '4px 0',
        },
        light: {
          borderColor: alpha('#E2E8F0', 0.6),
        },
        middle: {
          marginLeft:  16,
          marginRight: 16,
        },
        textAlignLeft: {
          '&::before': { width: '5%' },
          '&::after':  { width: '95%' },
        },
        textAlignRight: {
          '&::before': { width: '95%' },
          '&::after':  { width: '5%' },
        },
        wrapper: {
          fontWeight:    600,
          fontSize:      '0.75rem',
          color:         '#64748B',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          padding:       '0 12px',
        },
      },
    },

    // ── MuiMenu ──────────────────────────────────────────────────────────
    MuiMenu: {
      defaultProps: {
        elevation: 4,
      },
      styleOverrides: {
        paper: {
          borderRadius:    12,
          boxShadow:       elevation.menu,
          border:          '1px solid #E2E8F0',
          backgroundColor: '#ffffff',
          backgroundImage: 'none',
          minWidth:        180,
          marginTop:       6,
        },
        list: {
          padding: '6px',
        },
      },
    },

    // ── MuiMenuItem ──────────────────────────────────────────────────────
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius:    8,
          padding:         '9px 12px',
          fontSize:        '0.875rem',
          fontWeight:      500,
          color:           NAVY,
          gap:             10,
          transition:      `background-color ${transitions.fast}`,
          margin:          '1px 0',
          '&:hover': {
            backgroundColor: alpha(NAVY, 0.05),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(AQUA, 0.10),
            color:           '#259B9B',
            fontWeight:      600,
            '&:hover': {
              backgroundColor: alpha(AQUA, 0.15),
            },
          },
          '&.Mui-disabled': {
            opacity: 0.45,
          },
          '&:focus-visible': {
            backgroundColor: alpha(NAVY, 0.06),
            outline: 'none',
          },
        },
        dense: {
          padding:  '6px 12px',
          fontSize: '0.8125rem',
        },
      },
    },

    // ── MuiListItem ──────────────────────────────────────────────────────
    MuiListItem: {
      styleOverrides: {
        root: {
          paddingTop:    6,
          paddingBottom: 6,
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius:  8,
          transition:    `background-color ${transitions.normal}`,
          '&:hover': {
            backgroundColor: alpha(NAVY, 0.05),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(AQUA, 0.10),
            color:           '#259B9B',
            '&:hover': {
              backgroundColor: alpha(AQUA, 0.14),
            },
            '& .MuiListItemText-primary': {
              fontWeight: 600,
              color:      '#259B9B',
            },
          },
          '&:focus-visible': {
            ...focusRing,
          },
        },
      },
    },

    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontWeight:  500,
          fontSize:    '0.9375rem',
          color:       NAVY,
        },
        secondary: {
          fontSize: '0.8125rem',
          color:    '#475569',
          marginTop: 2,
        },
      },
    },

    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth:   40,
          color:      '#64748B',
        },
      },
    },

    // ── MuiAvatar ────────────────────────────────────────────────────────
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(AQUA, 0.15),
          color:           '#259B9B',
          fontWeight:      700,
          fontSize:        '0.9375rem',
          width:           40,
          height:          40,
          border:          `2px solid ${alpha('#ffffff', 0.8)}`,
          boxShadow:       elevation.low,
        },
        colorDefault: {
          backgroundColor: alpha(NAVY, 0.08),
          color:           NAVY,
        },
        rounded: {
          borderRadius: 10,
        },
        square: {
          borderRadius: 8,
        },
      },
    },

    // ── MuiAvatarGroup ───────────────────────────────────────────────────
    MuiAvatarGroup: {
      styleOverrides: {
        avatar: {
          borderColor:   '#ffffff',
          borderWidth:   2,
          width:         36,
          height:        36,
          fontSize:      '0.8125rem',
          fontWeight:    700,
          '&:first-of-type': {
            fontSize:        '0.75rem',
            backgroundColor: alpha(NAVY, 0.08),
            color:           NAVY,
          },
        },
      },
    },

    // ── MuiBadge ─────────────────────────────────────────────────────────
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight:  700,
          fontSize:    '0.6875rem',
          minWidth:    18,
          height:      18,
          padding:     '0 4px',
          borderRadius: 999,
          border:      '2px solid #ffffff',
          boxShadow:   elevation.low,
          lineHeight:  1,
        },
        dot: {
          width:  8,
          height: 8,
          border: '2px solid #ffffff',
        },
        colorPrimary:   { backgroundColor: NAVY  },
        colorSecondary: { backgroundColor: AQUA  },
        colorError:     { backgroundColor: '#dc2626' },
        colorWarning:   { backgroundColor: '#d97706' },
        colorSuccess:   { backgroundColor: '#16a34a' },
        colorInfo:      { backgroundColor: '#2563eb' },
      },
    },

    // ── MuiRating ────────────────────────────────────────────────────────
    MuiRating: {
      styleOverrides: {
        root: {
          color:        '#FBBF24',
          fontSize:     '1.375rem',
          gap:          2,
          '&:focus-visible': {
            outline: 'none',
          },
        },
        iconEmpty: {
          color: '#CBD5E1',
        },
        iconFilled: {
          color: '#FBBF24',
        },
        iconHover: {
          color: '#F59E0B',
        },
        iconFocus: {
          color: '#F59E0B',
        },
        decimal: {
          color: '#FBBF24',
        },
        sizeLarge: {
          fontSize: '1.75rem',
        },
        sizeSmall: {
          fontSize: '1.125rem',
        },
      },
    },

    // ── MuiSwitch ────────────────────────────────────────────────────────
    MuiSwitch: {
      styleOverrides: {
        root: {
          width:   52,
          height:  32,
          padding: 0,
          '& .MuiSwitch-switchBase': {
            padding:    4,
            margin:     0,
            transitionDuration: transitions.normal,
            '&.Mui-checked': {
              transform:    'translateX(20px)',
              color:        '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: AQUA,
                opacity:         1,
                border:          0,
              },
              '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
              },
            },
            '&.Mui-focusVisible .MuiSwitch-thumb': {
              color:  AQUA,
              border: `6px solid #fff`,
            },
            '&.Mui-disabled .MuiSwitch-thumb': {
              color: '#CBD5E1',
            },
            '&.Mui-disabled + .MuiSwitch-track': {
              opacity: 0.5,
            },
          },
          '& .MuiSwitch-thumb': {
            boxSizing: 'border-box',
            width:     24,
            height:    24,
            boxShadow: elevation.low,
          },
          '& .MuiSwitch-track': {
            borderRadius:    999,
            backgroundColor: '#CBD5E1',
            opacity:         1,
            transition:      `background-color ${transitions.normal}`,
          },
        },
      },
    },

    // ── MuiCheckbox ──────────────────────────────────────────────────────
    MuiCheckbox: {
      defaultProps: {
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          transition:   `color ${transitions.normal}`,
          padding:      9,
          '&:hover': {
            backgroundColor: alpha(NAVY, 0.05),
          },
          '&.Mui-focusVisible': {
            ...focusRing,
            borderRadius: 6,
          },
          '&.Mui-checked': {
            color: AQUA,
          },
          '&.MuiCheckbox-indeterminate': {
            color: AQUA,
          },
        },
        colorPrimary: {
          '&.Mui-checked': { color: NAVY },
        },
        colorSecondary: {
          '&.Mui-checked': { color: AQUA },
        },
      },
    },

    // ── MuiRadio ─────────────────────────────────────────────────────────
    MuiRadio: {
      styleOverrides: {
        root: {
          padding:    9,
          transition: `color ${transitions.normal}`,
          '&:hover': {
            backgroundColor: alpha(NAVY, 0.05),
          },
          '&.Mui-focusVisible': {
            ...focusRing,
            borderRadius: '50%',
          },
          '&.Mui-checked': { color: AQUA },
        },
        colorPrimary: {
          '&.Mui-checked': { color: NAVY },
        },
        colorSecondary: {
          '&.Mui-checked': { color: AQUA },
        },
      },
    },

    // ── MuiSlider ────────────────────────────────────────────────────────
    MuiSlider: {
      styleOverrides: {
        root: {
          color:  AQUA,
          height: 6,
          '& .MuiSlider-thumb': {
            width:      20,
            height:     20,
            backgroundColor: '#fff',
            border:     `2px solid ${AQUA}`,
            boxShadow:  elevation.low,
            transition: `box-shadow ${transitions.fast}`,
            '&:hover, &.Mui-focusVisible': {
              boxShadow: `0 0 0 8px ${alpha(AQUA, 0.16)}`,
            },
            '&.Mui-active': {
              boxShadow: `0 0 0 12px ${alpha(AQUA, 0.16)}`,
            },
          },
          '& .MuiSlider-track': {
            borderRadius: 999,
            border:       'none',
            backgroundColor: AQUA,
          },
          '& .MuiSlider-rail': {
            borderRadius:    999,
            backgroundColor: '#CBD5E1',
            opacity:         1,
          },
          '& .MuiSlider-mark': {
            backgroundColor: '#CBD5E1',
            height:          8,
            width:           2,
            borderRadius:    1,
          },
          '& .MuiSlider-markActive': {
            backgroundColor: alpha(AQUA, 0.4),
          },
          '& .MuiSlider-valueLabel': {
            backgroundColor: '#1E293B',
            borderRadius:    8,
            fontWeight:      700,
            fontSize:        '0.75rem',
            padding:         '4px 8px',
          },
        },
        colorPrimary: {
          color: NAVY,
          '& .MuiSlider-thumb': {
            border: `2px solid ${NAVY}`,
            '&:hover, &.Mui-focusVisible': {
              boxShadow: `0 0 0 8px ${alpha(NAVY, 0.12)}`,
            },
          },
        },
      },
    },

    // ── MuiTabs ──────────────────────────────────────────────────────────
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight:        44,
          borderBottom:     '1px solid #E2E8F0',
        },
        indicator: {
          height:           3,
          borderRadius:     '3px 3px 0 0',
          backgroundColor:  AQUA,
          transition:       `all ${transitions.normal}`,
        },
        scrollButtons: {
          '&.Mui-disabled': {
            opacity: 0.3,
          },
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          minHeight:     44,
          minWidth:      'auto',
          padding:       '10px 16px',
          fontWeight:    600,
          fontSize:      '0.875rem',
          textTransform: 'none',
          color:         '#64748B',
          letterSpacing: '0.01em',
          transition:    `color ${transitions.normal}, background-color ${transitions.normal}`,
          '&:hover': {
            color:           NAVY,
            backgroundColor: alpha(NAVY, 0.04),
          },
          '&.Mui-selected': {
            color:      NAVY,
            fontWeight: 700,
          },
          '&:focus-visible': {
            ...focusRing,
            borderRadius: 6,
          },
        },
      },
    },

    // ── MuiAccordion ─────────────────────────────────────────────────────
    MuiAccordion: {
      defaultProps: {
        disableGutters: true,
        elevation:      0,
      },
      styleOverrides: {
        root: {
          borderRadius:    '10px !important',
          border:          '1px solid #E2E8F0',
          backgroundColor: '#ffffff',
          overflow:        'hidden',
          '&:not(:last-of-type)': {
            marginBottom: 8,
          },
          '&::before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            boxShadow: elevation.low,
          },
        },
      },
    },

    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding:        '0 20px',
          minHeight:      52,
          fontWeight:     600,
          color:          NAVY,
          transition:     `background-color ${transitions.normal}`,
          '&:hover': {
            backgroundColor: alpha(NAVY, 0.03),
          },
          '&.Mui-expanded': {
            minHeight:       52,
            borderBottom:    '1px solid #E2E8F0',
          },
          '&:focus-visible': {
            ...focusRing,
          },
        },
        content: {
          margin:        '14px 0',
          '&.Mui-expanded': { margin: '14px 0' },
        },
        expandIconWrapper: {
          color:      '#64748B',
          transition: `transform ${transitions.normal}`,
        },
      },
    },

    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '16px 20px 20px',
          color:   '#475569',
          fontSize: '0.9375rem',
          lineHeight: 1.6,
        },
      },
    },

    // ── MuiSnackbar ──────────────────────────────────────────────────────
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      },
      styleOverrides: {
        root: {
          '& .MuiSnackbarContent-root': {
            backgroundColor: '#1E293B',
            color:           '#F1F5F9',
            borderRadius:    12,
            fontWeight:      600,
            fontSize:        '0.875rem',
            boxShadow:       elevation.high,
            padding:         '12px 20px',
          },
        },
      },
    },

    // ── MuiTable ─────────────────────────────────────────────────────────
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border:       '1px solid #E2E8F0',
          overflow:     'hidden',
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: '#F8FAFC',
            fontWeight:      700,
            fontSize:        '0.8125rem',
            color:           '#64748B',
            letterSpacing:   '0.04em',
            textTransform:   'uppercase',
            borderBottom:    '1px solid #E2E8F0',
            padding:         '12px 16px',
            whiteSpace:      'nowrap',
          },
        },
      },
    },

    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            transition: `background-color ${transitions.fast}`,
            '&:hover': {
              backgroundColor: '#F8FAFC',
            },
            '&:last-of-type .MuiTableCell-root': {
              borderBottom: 'none',
            },
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          padding:     '14px 16px',
          borderBottom: '1px solid #F1F5F9',
          fontSize:    '0.9rem',
          color:       NAVY,
        },
        head: {
          fontWeight: 700,
        },
        body: {
          fontWeight: 400,
        },
      },
    },

    MuiTablePagination: {
      styleOverrides: {
        root: {
          color:    '#475569',
          fontSize: '0.875rem',
        },
        selectLabel: {
          fontWeight: 600,
          margin:     0,
        },
        displayedRows: {
          fontWeight: 600,
          margin:     0,
        },
        select: {
          fontWeight:  600,
          borderRadius: 6,
          padding:     '4px 28px 4px 10px !important',
        },
        actions: {
          marginLeft: 8,
          '& .MuiIconButton-root': {
            borderRadius: 8,
          },
        },
      },
    },

    // ── MuiBreadcrumbs ───────────────────────────────────────────────────
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
        },
        li: {
          '& a': {
            color:          '#475569',
            fontWeight:     500,
            textDecoration: 'none',
            transition:     `color ${transitions.normal}`,
            '&:hover': {
              color: NAVY,
            },
          },
          '& .MuiBreadcrumbs-separator': {
            color: '#94A3B8',
          },
        },
        separator: {
          color:  '#94A3B8',
          margin: '0 6px',
        },
      },
    },

    // ── MuiPagination ────────────────────────────────────────────────────
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius:  8,
          fontWeight:    600,
          fontSize:      '0.875rem',
          color:         '#475569',
          transition:    `background-color ${transitions.normal}, color ${transitions.normal}`,
          '&:hover': {
            backgroundColor: alpha(NAVY, 0.06),
            color:           NAVY,
          },
          '&.Mui-selected': {
            backgroundColor: NAVY,
            color:           '#ffffff',
            '&:hover': {
              backgroundColor: '#13283B',
            },
          },
          '&:focus-visible': focusRing,
        },
        outlined: {
          border:       '1.5px solid #E2E8F0',
          '&.Mui-selected': {
            backgroundColor: NAVY,
            borderColor:     NAVY,
            color:           '#ffffff',
          },
        },
      },
    },

    // ── MuiFormControl ───────────────────────────────────────────────────
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-outlined': {
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)',
            },
          },
        },
      },
    },

    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontWeight:    500,
          fontSize:      '0.9375rem',
          color:         '#475569',
          '&.Mui-focused': {
            color: AQUA,
          },
          '&.Mui-error': {
            color: '#dc2626',
          },
        },
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontWeight:    500,
          fontSize:      '0.75rem',
          marginTop:     6,
          marginLeft:    2,
          letterSpacing: '0.01em',
          color:         '#64748B',
          '&.Mui-error': {
            color: '#dc2626',
          },
        },
      },
    },

    // ── MuiInputAdornment ────────────────────────────────────────────────
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          color: '#94A3B8',
          '& .MuiTypography-root': {
            fontWeight: 500,
            color:      '#94A3B8',
          },
        },
        positionStart: {
          marginRight: 8,
        },
        positionEnd: {
          marginLeft: 8,
        },
      },
    },

    // ── MuiAutocomplete ──────────────────────────────────────────────────
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius:    12,
          boxShadow:       elevation.menu,
          border:          '1px solid #E2E8F0',
          marginTop:       6,
          backgroundImage: 'none',
        },
        listbox: {
          padding: '6px',
          '& .MuiAutocomplete-option': {
            borderRadius:  8,
            padding:       '9px 12px',
            fontWeight:    500,
            fontSize:      '0.875rem',
            color:         NAVY,
            margin:        '1px 0',
            transition:    `background-color ${transitions.fast}`,
            '&[aria-selected="true"]': {
              backgroundColor: alpha(AQUA, 0.10),
              color:           '#259B9B',
              fontWeight:      600,
            },
            '&.Mui-focused': {
              backgroundColor: alpha(NAVY, 0.05),
            },
          },
        },
        noOptions: {
          fontSize:   '0.875rem',
          fontWeight: 500,
          color:      '#64748B',
          padding:    '12px 16px',
        },
        loading: {
          fontSize:   '0.875rem',
          fontWeight: 500,
          color:      '#64748B',
          padding:    '12px 16px',
        },
        endAdornment: {
          '& .MuiIconButton-root': {
            color: '#94A3B8',
          },
        },
        tag: {
          maxWidth: 'calc(100% - 6px)',
        },
      },
    },

    // ── MuiDatePicker (MUI X) ────────────────────────────────────────────
    MuiPickersDay: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight:   600,
          fontSize:     '0.875rem',
          '&:hover': {
            backgroundColor: alpha(NAVY, 0.06),
          },
          '&.Mui-selected': {
            backgroundColor: AQUA,
            color:           NAVY,
            fontWeight:      700,
            '&:hover': {
              backgroundColor: '#35b5b5',
            },
          },
          '&.Mui-today': {
            border:      `1.5px solid ${AQUA}`,
            '&:not(.Mui-selected)': {
              color: '#259B9B',
            },
          },
        },
      },
    },

    // ── MuiStep ──────────────────────────────────────────────────────────
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontWeight:  600,
          fontSize:    '0.875rem',
          color:       '#64748B',
          '&.Mui-active': {
            color:      NAVY,
            fontWeight: 700,
          },
          '&.Mui-completed': {
            color:      '#16a34a',
            fontWeight: 600,
          },
        },
      },
    },

    MuiStepIcon: {
      styleOverrides: {
        root: {
          color:         '#CBD5E1',
          width:         32,
          height:        32,
          '&.Mui-active': {
            color: AQUA,
          },
          '&.Mui-completed': {
            color: '#16a34a',
          },
        },
        text: {
          fontWeight: 700,
          fontSize:   '0.75rem',
          fill:       '#ffffff',
        },
      },
    },

    MuiStepConnector: {
      styleOverrides: {
        line: {
          borderColor:    '#E2E8F0',
          borderTopWidth: 2,
          borderRadius:   1,
        },
      },
    },

    // ── MuiPopover ───────────────────────────────────────────────────────
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius:    12,
          boxShadow:       elevation.menu,
          border:          '1px solid #E2E8F0',
          backgroundImage: 'none',
        },
      },
    },

    // ── MuiFab ───────────────────────────────────────────────────────────
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow:  elevation.medium,
          transition: `box-shadow ${transitions.normal}, background-color ${transitions.normal}, transform ${transitions.fast}`,
          '&:hover': {
            boxShadow: elevation.high,
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.97)',
          },
          '&:focus-visible': focusRing,
        },
        primary: {
          backgroundColor: NAVY,
          color:           '#ffffff',
          '&:hover': {
            backgroundColor: '#13283B',
          },
        },
        secondary: {
          backgroundColor: AQUA,
          color:           NAVY,
          '&:hover': {
            backgroundColor: '#35b5b5',
          },
        },
      },
    },

    // ── MuiLink ──────────────────────────────────────────────────────────
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
      styleOverrides: {
        root: {
          color:          '#259B9B',
          fontWeight:     600,
          cursor:         'pointer',
          textDecoration: 'none',
          transition:     `color ${transitions.normal}`,
          '&:hover': {
            color:           AQUA,
            textDecoration:  'underline',
          },
          '&:focus-visible': {
            ...focusRing,
            borderRadius: 3,
            outline:      `2px solid ${alpha(AQUA, 0.5)}`,
          },
        },
      },
    },
  },
});

export default theme;
