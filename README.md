# MQTT5 Explorer

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

**N.B.**: the build process includes **electron publish**, a *.env* file with the `GITHUB_TOKEN` environment variable set is required.

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
```

## Customize configuration

See:

- [Vue Configuration Reference](https://cli.vuejs.org/config/).
- [Vuetify Configuration Reference](https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides).
- [Electron Build Configuration Reference](https://www.electron.build/configuration/configuration).

## Contributors

[![Contributors](https://contrib.rocks/image?repo=Omniaevo/mqtt5-explorer)](https://github.com/Omniaevo/mqtt5-explorer/graphs/contributors)
