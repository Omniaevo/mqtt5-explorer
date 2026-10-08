import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { createVuetify } from "vuetify";

// Primary colors are applied at runtime from the settings (see useThemeSync)
export default createVuetify({
  theme: {
    defaultTheme: "light",
    themes: {
      light: { dark: false },
      dark: { dark: true },
    },
  },
});
