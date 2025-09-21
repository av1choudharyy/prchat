import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors: {
    gray: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
      html: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
      },
      '#root': {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
        minHeight: '100vh',
      },
    }),
  },
  components: {
    Button: {
      variants: {
        solid: (props) => ({
          bg: props.colorMode === 'dark' ? 'blue.500' : 'blue.500',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'blue.600' : 'blue.600',
          },
        }),
      },
    },
    Input: {
      variants: {
        filled: (props) => ({
          field: {
            bg: 'white', // Always white background for input
            color: 'black', // Always black text for input
            borderColor: props.colorMode === 'dark' ? 'gray.400' : 'gray.300',
            _hover: {
              borderColor: props.colorMode === 'dark' ? 'blue.400' : 'blue.300',
            },
            _focus: {
              borderColor: props.colorMode === 'dark' ? 'blue.400' : 'blue.500',
              boxShadow: props.colorMode === 'dark' ? '0 0 0 1px #3182ce' : '0 0 0 1px #3182ce',
            },
          },
        }),
      },
    },
    Textarea: {
      baseStyle: (props) => ({
        bg: 'white !important', // Always white background for textarea
        color: 'black !important', // Always black text for textarea
        borderColor: props.colorMode === 'dark' ? 'gray.400' : 'gray.300',
        _hover: {
          borderColor: props.colorMode === 'dark' ? 'blue.400' : 'blue.300',
        },
        _focus: {
          borderColor: props.colorMode === 'dark' ? 'blue.400' : 'blue.500',
          boxShadow: props.colorMode === 'dark' ? '0 0 0 1px #3182ce' : '0 0 0 1px #3182ce',
          bg: 'white !important',
          color: 'black !important',
        },
        _placeholder: {
          color: 'gray.500 !important',
        },
      }),
      variants: {
        filled: (props) => ({
          bg: 'white !important', // Always white background for textarea
          color: 'black !important', // Always black text for textarea
          borderColor: props.colorMode === 'dark' ? 'gray.400' : 'gray.300',
          _hover: {
            borderColor: props.colorMode === 'dark' ? 'blue.400' : 'blue.300',
          },
          _focus: {
            borderColor: props.colorMode === 'dark' ? 'blue.400' : 'blue.500',
            boxShadow: props.colorMode === 'dark' ? '0 0 0 1px #3182ce' : '0 0 0 1px #3182ce',
            bg: 'white !important',
            color: 'black !important',
          },
          _placeholder: {
            color: 'gray.500 !important',
          },
        }),
      },
    },
    Box: {
      variants: {
        message: (props) => ({
          bg: props.colorMode === 'dark' ? 'gray.700' : props.bg || 'white',
        }),
      },
    },
  },
});

export default theme;
