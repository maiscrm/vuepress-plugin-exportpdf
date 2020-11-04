const { join } = require('path');
const { fs, logger, chalk } = require('@vuepress/shared-utils');
const puppeteer = require('puppeteer');

const mergePdfs = require('./mergePdfs');

const { yellow, gray } = chalk;

const findPage = (path, pages) => {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return pages.find((page) => page.regularPath === `${path.endsWith('/') ? path : `${path}.html`}`)
};

const buildExportPageByPath = (path, baseUrl, pages, tempDir, children = []) => {
  const tempPage = findPage(path, pages);
  return {
    title: tempPage.title,
    location: `${baseUrl}${tempPage.path}`,
    path: `${tempDir}/${tempPage.key}.pdf`,
    children: buildExportPagesFromSidebar(children, baseUrl, pages, tempDir),
  };
};

const buildExportPagesFromSidebar = (sidebar, baseUrl, pages, tempDir) => {
  return sidebar.map((item) => {
    let path = item;
    if (item instanceof Object) {
      path = item.children[0];
      if (path instanceof Object) {
        logger.error(`First entry of ${item.title}'s children must be a string.`);
        process.exit(1);
      }
      item.children = item.children.slice(1);
      return buildExportPageByPath(path, baseUrl, pages, tempDir, item.children);
    }
    return buildExportPageByPath(path, baseUrl, pages, tempDir, item.children);
  });
};

const generateSubPdfs = async (exportPages, browserPage) => {
  for (const exportPage of exportPages) {
    const { location, path: pagePath, title } = exportPage;
    await browserPage.goto(
      location,
      { waitUntil: 'networkidle2' },
    );
    await browserPage.pdf({
      path: pagePath,
      format: 'A4',
      margin: { top: '16px', right: '10px', bottom: '16px', left: '10px' },
      printBackground: true,
    });
    logger.success(`Generated ${yellow(title)} ${gray(location)}`);
    await generateSubPdfs(exportPage.children, browserPage);
  }
};

module.exports = async (ctx, baseUrl) => {
  const { pages, tempPath, siteConfig, themeConfig } = ctx;
  const tempDir = join(tempPath, 'pdf');
  fs.ensureDirSync(tempDir);
  let exportPages = [];
  if (themeConfig.sidebar) {
    exportPages = buildExportPagesFromSidebar(themeConfig.sidebar, baseUrl, pages, tempDir);
    exportPages = [buildExportPageByPath('/', baseUrl, pages, tempDir), ...exportPages];
  } else {
    exportPages = pages.map((page) => ({
      title: page.title,
      location: `${baseUrl}${page.path}`,
      path: `${tempDir}/${page.key}.pdf`,
      children: [],
    }));
  }
  const browser = await puppeteer.launch();
  const browserPage = await browser.newPage();

  await generateSubPdfs(exportPages, browserPage);

  const outputFilename = siteConfig.title || 'site';
  const outputFile = `${outputFilename}.pdf`;
  await mergePdfs(outputFile, exportPages);

  await browser.close();
  fs.removeSync(tempDir);
}
