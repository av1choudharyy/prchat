// client/src/theme.js
import { extendTheme } from "@chakra-ui/react";

const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: "#fdf7ff",
    100: "#fae8ff",
    200: "#f6d4ff",
    300: "#edb8ff",
    400: "#e293ff",
    500: "#c86bff",
    600: "#9e3fe6",
    700: "#7729b8",
    800: "#531989",
    900: "#2e0a58",
  },
};

const styles = {
  global: (props) => ({
    "html, body, #root": {
      height: "100%",
      margin: 0,
      padding: 0,
      background: props.colorMode === "light" ? "gray.50" : "gray.900",
      color: props.colorMode === "light" ? "gray.800" : "whiteAlpha.900",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },
    ".App": {
      minHeight: "100vh",
    },
  }),
};

const fonts = {
  heading: `'Work Sans', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`,
  body: `'Work Sans', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`,
};

const theme = extendTheme({
  config,
  colors,
  styles,
  fonts,
  components: {
    Button: {
      baseStyle: { borderRadius: "md" },
    },
  },
});

export default theme;
