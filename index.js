const { join } = require('path');
const { dev } = require('vuepress');
const { logger, chalk } = require('@vuepress/shared-utils');

const generatePdf = require('./libs/generatePdf');

const { red } = chalk;

// Keep silent before running custom command.
logger.setOptions({ logLevel: 1 });

module.exports = (opts = {}, ctx) => ({
  name: 'vuepress-plugin-exportpdf',

  chainWebpack(config) {
    config.plugins.delete('bar');
    config.plugins.delete('vuepress-log');
  },

  extendCli(cli) {
    cli
      .command('exportpdf [targetDir]', 'export current vuepress site to a PDF file')
      .allowUnknownOptions()
      .action(async (dir = '.') => {
        const sourceDir = join(process.cwd(), dir);
        const nCtx = await dev({
          sourceDir,
          theme: opts.theme || ctx.theme || '@vuepress/default',
          themeConfig: opts.themeConfig || ctx.themeConfig,
          clearScreen: false,
        });
        logger.setOptions({ logLevel: 3 });
        logger.info('Start to generate current site to PDF ...');
        try {
          await generatePdf(ctx, `http://${nCtx.devProcess.host}:${nCtx.devProcess.port}`);
        } catch (error) {
          console.error(red(error));
        }
        nCtx.devProcess.server.close();
        process.exit(0);
      });
  },
});
