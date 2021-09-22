module.exports = {
  transpileDependencies: ["vuetify"],
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      contextIsolation: true,
      builderOptions: {
        appId: "com.omniaevo.mqtt5explorer",
        productName: "MQTT5 Explorer",
        linux: {
          category: "Development",
          desktop: {
            StartupWMClass: "mqtt5-explorer",
          },
          executableName: "mqtt5-explorer",
          target: ["AppImage", "deb"],
        },
        mac: {
          category: "public.app-category.developer-tools",
          target: ["dmg"],
        },
        win: {
          target: ["nsis:x64"],
        },
      },
    },
  },
};
