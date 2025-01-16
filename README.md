# MQTT5 Explorer

![Repo stars](https://img.shields.io/github/stars/Omniaevo/mqtt5-explorer?style=social) ![Repo watchers](https://img.shields.io/github/watchers/Omniaevo/mqtt5-explorer?style=social) ![Repo forks](https://img.shields.io/github/forks/Omniaevo/mqtt5-explorer?style=social)

[![Issues](https://img.shields.io/github/issues/Omniaevo/mqtt5-explorer)](https://github.com/Omniaevo/mqtt5-explorer/issues) [![Workflow status](https://img.shields.io/github/actions/workflow/status/Omniaevo/mqtt5-explorer/electron.yml)](https://github.com/Omniaevo/mqtt5-explorer/actions) [![Latest release](https://img.shields.io/github/v/release/Omniaevo/mqtt5-explorer)](https://github.com/Omniaevo/mqtt5-explorer/releases) [![License](https://img.shields.io/github/license/Omniaevo/mqtt5-explorer)](https://github.com/Omniaevo/mqtt5-explorer/blob/master/LICENSE)

![Contributors](https://img.shields.io/github/contributors/Omniaevo/mqtt5-explorer) ![Last commit](https://img.shields.io/github/last-commit/Omniaevo/mqtt5-explorer) ![Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2FOmniaevo%2Fmqtt5-explorer&count_bg=%230F80C1&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false)

## About this project

The aim of this project is to bring the users a client app capable of making use of all the features of the version 5 of the MQTT protocol. The lack of any application that can offer the compatibility with the newer version of the protocol forced us to implement one to test the data of MQTT brokers workwise, why not to share this tool with others that may have the same issue?

## Screenshots

### Dark theme

![Client screenshot (dark theme)](screenshots/client-connection.png)

### Light theme

![Client screenshot (light theme)](screenshots/client-connection-white.png)

## Project setup

```bash
npm install
```

### Compiles and hot-reloads for development

```bash
npm run electron:serve
```

### Generate app icons

```bash
npm run electron:icons
```

### Lints and fixes files

```bash
npm run lint
```

## Compiles and minifies for production

**N.B.**: the build process includes **electron publish**, a _.env_ file with the `GITHUB_TOKEN` environment variable set is required.

```bash
# Linux
npm run electron:build -- --linux # Without publish
npm run electron:build -- --linux -p always # With GitHub publish

# MacOS
npm run electron:build -- --mac # Without publish
npm run electron:build -- --mac -p always # With GitHub publish

# Windows
npm run electron:build -- --win # Without publish
npm run electron:build -- --win -p always # With GitHub publish

# Flatpak
# ⚠️ The flatpak and flatpak-builder packages need to be installed in order to build Flatpak bundles. ⚠️
npm run electron:build -- --linux flatpak
```

## Customize configuration

See:

- [Vue Configuration Reference](https://cli.vuejs.org/config/).
- [Vuetify Configuration Reference](https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides).
- [Electron Build Configuration Reference](https://www.electron.build/configuration/configuration).

## Get involved

See:

- [The code of conduct](CODE_OF_CONDUCT.md).
- [The contribution guidelines](.github/contributing.md).

## Contributors

[![Contributors](https://contrib.rocks/image?repo=Omniaevo/mqtt5-explorer)](https://github.com/Omniaevo/mqtt5-explorer/graphs/contributors)
