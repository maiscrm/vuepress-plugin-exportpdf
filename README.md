# vuepress-plugin-exportpdf

Inspired by [vuepress-plugin-export](https://github.com/ulivz/vuepress-plugin-export).

> This plugin requires VuePress >= **1.0.0-alpha.44**.

## Features

- Merge all of your pages automatically.
- Create outline by your sidebar.
- Inject page numbers.

## Install

```shell
npm i @maiscrm/vuepress-plugin-exportpdf
```

## Usage

Using this plugin:

```javascript
// .vuepress/config.js
module.exports = {
  plugins: [
    [
      '@maiscrm/vuepress-plugin-exportpdf',
      {
        themeConfig: {
          navbar: false,
          nextLinks: false,
          prevLinks: false,
          sidebar: [
            'docs/',
            {
              title: 'Plugin',
              children: [
                'docs/plugin/',
                'docs/plugin/using-a-plugin'
              ]
            }
          ]
        }
      }
    ]
  ]
}
```

Then run:

```bash
vuepress exportpdf [path/to/your/docs]
```

## Development

```bash
# Note that this package is powered by [puppeteer](https://github.com/GoogleChrome/puppeteer), if you are in a mysterious wall, consider setting this [environment variables](https://github.com/GoogleChrome/puppeteer/blob/v1.11.0/docs/api.md#environment-variables) before installation.
export PUPPETEER_DOWNLOAD_HOST=https://npm.taobao.org/mirrors
yarn install
yarn exportpdf
```
