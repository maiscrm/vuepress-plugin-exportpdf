module.exports = {
  theme: '@vuepress/default',
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
  },
  plugins: [
    require('../../')
  ]
}
