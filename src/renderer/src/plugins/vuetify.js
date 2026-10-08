import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { createVuetify } from "vuetify";

// Primary colors are applied at runtime from the settings (see useThemeSync)
export default createVuetify({
  defaults: {
    VTabs: { color: "primary" },
    VTextField: { color: "primary" },
    VSelect: { color: "primary" },
    VCombobox: { color: "primary" },
    VSwitch: { color: "primary" },
  },
  theme: {
    defaultTheme: "light",
    themes: {
      light: { dark: false },
      dark: { dark: true },
    },
  },
});
