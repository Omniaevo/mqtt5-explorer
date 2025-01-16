const crypto = require("crypto");
const pkg = require("./package.json");

/**
 * The MD4 algorithm is not available anymore in Node.js 17+ (because of library SSL 3).
 * In that case, silently replace MD4 by the MD5 algorithm.
 */
try {
  crypto.createHash("md4");
} catch (e) {
  console.warn(
    `Crypto "MD4" is not supported anymore by this Node.js version (v${process.versions.node})\n`
  );

  const origCreateHash = crypto.createHash;

  crypto.createHash = (alg, opts) => {
    return origCreateHash(alg === "md4" ? "md5" : alg, opts);
  };
}

process.env.VUE_APP_VERSION = pkg.version || "0.0.0";
process.env.VUE_APP_GITHUB_PAGE = pkg.homepage || "";
process.env.VUE_APP_GITHUB_BUGS = pkg.bugs.url || "";

const builderOpts = {
  appRepos: [
    {
      provider: "github",
      owner: "Omniaevo",
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
        appId: `com.omniaevo.${builderOpts.appStrings.executableName}`,
        artifactName: "${name}-${version}-${platform}-${arch}.${ext}",
        productName: "MQTT5 Explorer",
        publish: [...builderOpts.appRepos],
        linux: {
          executableName: builderOpts.appStrings.executableName,
          icon: "build/icon/",
          target: ["AppImage"],
        },
        flatpak: {
          runtime: "org.freedesktop.Platform",
          runtimeVersion: "23.08",
          sdk: "org.freedesktop.Sdk",
          base: "org.electronjs.Electron2.BaseApp",
          baseVersion: "23.08",
          category: builderOpts.appCategories.linux,
          description: builderOpts.appStrings.description,
          desktop: {
            StartupWMClass: builderOpts.appStrings.executableName,
          },
          finishArgs: [
            "--share=ipc",
            "--socket=x11",
            "--socket=pulseaudio",
            "--share=network",
          ],
          synopsis: builderOpts.appStrings.synopsis,
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
          target: {
            target: "dmg",
            arch: ["x64", "arm64"],
          },
        },
        win: {
          target: ["portable:x64"],
          icon: "build/icons/icon.ico",
        },
      },
    },
  },
};
