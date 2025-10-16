import { createTheme } from '@mui/material/styles';

const cerulean = '#00556B';
const ceruleanLight = '#4C9CB5';
const ceruleanDark = '#003B4B';

const periwinkle = '#95B0DD';
const periwinkleLight = '#C3D2EE';
const periwinkleDark = '#6F8EC3';

const tyrianPurple = '#611C35';
const tyrianPurpleLight = '#8E3A57';
const tyrianPurpleDark = '#3E0F23';

const gradientPrimary = `linear-gradient(135deg, ${cerulean} 0%, ${tyrianPurple} 100%)`;

const theme = createTheme({
  palette: {
    primary: {
      main: cerulean,
      light: ceruleanLight,
      dark: ceruleanDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: tyrianPurple,
      light: tyrianPurpleLight,
      dark: tyrianPurpleDark,
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
      disabled: '#999999',
    },
    divider: '#D0D0D0',
    success: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    warning: {
      main: '#F57C00',
      light: '#FF9800',
      dark: '#E65100',
    },
    error: {
      main: '#D32F2F',
      light: '#EF5350',
      dark: '#C62828',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
    htmlFontSize: 16,
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    body1: {
      fontSize: '0.875rem',
    },
    body2: {
      fontSize: '0.8125rem',
    },
    caption: {
      fontSize: '0.75rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '0.875rem',
    },
  },
  spacing: 6,
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--gradient-primary': gradientPrimary,
        },
        body: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 6,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
          padding: '12px 16px',
          borderBottom: '1px solid #E0E0E0',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px !important',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontSize: '0.875rem',
            '&:hover fieldset': {
              borderColor: cerulean,
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
        },
        input: {
          padding: '6px 10px',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '5px 14px',
          fontSize: '0.875rem',
          minHeight: 'unset',
        },
        sizeSmall: {
          padding: '4px 10px',
          fontSize: '0.8125rem',
        },
        sizeMedium: {
          padding: '6px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(21, 101, 192, 0.3)',
          },
        },
        containedPrimary: {
          backgroundImage: 'var(--gradient-primary)',
          color: '#fff',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '3px 10px',
          fontSize: '0.8125rem',
          borderRight: '1px solid #E0E0E0',
          borderBottom: '1px solid #E0E0E0',
          '&:last-child': {
            borderRight: 'none',
          },
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#F5F5F5',
          borderBottom: '2px solid #D0D0D0',
          padding: '8px 10px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#F9F9F9',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 20,
          fontSize: '0.75rem',
        },
        sizeSmall: {
          height: 18,
          fontSize: '0.7rem',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: 6,
        },
        sizeSmall: {
          padding: 4,
        },
      },
    },
  },
});

export default theme;