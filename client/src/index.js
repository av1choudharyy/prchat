import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, ColorModeScript, extendTheme } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import ChatProvider from "./context/ChatProvider";

const theme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  styles: {
    global: (props) => ({
      'html, body, #root': {
        height: '100%'
      },
      body: {
        bg: mode('#ffffff', '#000000')(props),
        color: mode('#000000', '#ffffff')(props),
      },
      '.ql-toolbar': {
        backgroundColor: mode('#ffffff', '#111111')(props),
        borderColor: mode('#E2E8F0', '#222222')(props),
        color: mode('#000000', '#E5E7EB')(props),
      },
      '.ql-container': {
        backgroundColor: mode('#ffffff', '#000000')(props),
        borderColor: mode('#E2E8F0', '#222222')(props),
      },
      '.ql-editor': {
        color: mode('#1A202C', '#F9FAFB')(props),
      },
      '.ql-editor.ql-blank::before': {
        color: mode('#718096', '#9CA3AF')(props),
      },
    }),
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ChatProvider>
        <ChakraProvider theme={theme}>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <App />
        </ChakraProvider>
      </ChatProvider>
    </BrowserRouter>
  </React.StrictMode>
);
