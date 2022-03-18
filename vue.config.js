const pkg = require("./package.json");

process.env.VUE_APP_VERSION = pkg.version || "0.0.0";
process.env.VUE_GITHUB_PAGE = pkg.homepage || "";

const builderOpts = {
  appRepos: [
    {
      provider: "github",
      owner: pkg.author.name,
      private: false,
      publishAutoUpdate: true,
      releaseType: "release",
    },
  ],
  appStrings: {
    synopsis: pkg.description,
    executableName: pkg.name,
    description:
      "MQTT5 Explorer is a simple yet feature-rich client to " +
      "visualize data of any MQTT broker. Differently from many " +
      "other clients, it supports version 5 of the MQTT protocol.",
  },
  appCategories: {
    linux: "Development",
    mac: "public.app-category.developer-tools",
  },
};

module.exports = {
  transpileDependencies: ["vuetify"],
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      contextIsolation: true,
      builderOptions: {
        appId: "com.omniaevo.${name}",
        artifactName: "${name}-${version}-${platform}-${arch}.${ext}",
        productName: "MQTT5 Explorer",
        publish: [...builderOpts.appRepos],
        linux: {
          executableName: builderOpts.appStrings.executableName,
          icon: "build/icon/",
          target: ["AppImage"],
        },
        appImage: {
          category: builderOpts.appCategories.linux,
          description: builderOpts.appStrings.description,
          desktop: {
            StartupWMClass: builderOpts.appStrings.executableName,
          },
          synopsis: builderOpts.appStrings.synopsis,
        },
        mac: {
          category: builderOpts.appCategories.mac,
          target: ["dmg"],
        },
        win: {
          target: ["nsis:x64"],
        },
        nsis: {
          installerIcon: "build/icon.ico",
        },
      },
    },
  },
};
