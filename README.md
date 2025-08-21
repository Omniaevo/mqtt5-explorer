# MQTT5 Explorer

![Repo stars](https://img.shields.io/github/stars/Omniaevo/mqtt5-explorer?style=social) ![Repo watchers](https://img.shields.io/github/watchers/Omniaevo/mqtt5-explorer?style=social) ![Repo forks](https://img.shields.io/github/forks/Omniaevo/mqtt5-explorer?style=social)

[![Issues](https://img.shields.io/github/issues/Omniaevo/mqtt5-explorer)](https://github.com/Omniaevo/mqtt5-explorer/issues) [![Workflow status](https://img.shields.io/github/actions/workflow/status/Omniaevo/mqtt5-explorer/electron.yml)](https://github.com/Omniaevo/mqtt5-explorer/actions) ![Last commit](https://img.shields.io/github/last-commit/Omniaevo/mqtt5-explorer) [![Latest release](https://img.shields.io/github/v/release/Omniaevo/mqtt5-explorer)](https://github.com/Omniaevo/mqtt5-explorer/releases) ![AUR](https://img.shields.io/aur/version/mqtt5-explorer-bin) [![License](https://img.shields.io/github/license/Omniaevo/mqtt5-explorer)](https://github.com/Omniaevo/mqtt5-explorer/blob/master/LICENSE) 

## About this project

The aim of this project is to bring the users a client app capable of making use of all the features of the version 5 of the MQTT protocol. The lack of any application that can offer the compatibility with the newer version of the protocol forced us to implement one to test the data of MQTT brokers workwise, why not to share this tool with others that may have the same issue?

## Screenshots

### Dark theme

![Client screenshot (dark theme)](screenshots/client-connection.png)

### Light theme

![Client screenshot (light theme)](screenshots/client-connection-white.png)

## Downloads

<p>
  <a href='https://flathub.org/apps/io.github.Omniaevo.mqtt5-explorer'>
    <img width='150' alt='Download on Flathub' src='https://flathub.org/api/badge?locale=en'/>
  </a>
</p>

<p>
  <a href="https://aur.archlinux.org/packages/mqtt5-explorer-bin">
    <img width="150" alt="Download on AUR" src="https://archlinux.org/static/logos/archlinux-logo-dark-90dpi.ebdee92a15b3.png" />
  </a>
</p>

<p>
  <a href='https://github.com/Omniaevo/mqtt5-explorer/releases'>
    <img width='150' alt='Download on Github' src='https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white'/>
  </a>
</p>

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
# Install and run the flatpak package
flatpak install --user mqtt5-explorer-[VERSION]-linux-x86_64.flatpak && flatpak run com.omniaevo.mqtt5_explorer
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
