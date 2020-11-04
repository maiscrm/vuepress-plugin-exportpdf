const { fs } = require('@vuepress/shared-utils');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');3

const addOutline = require('./addOutline');

let totalPageNumber = 1;

const mergePdfs = async (doc, exportPages) => {
  const helveticaFont = await doc.embedFont(StandardFonts.Helvetica);
  for (const exportPage of exportPages) {
    const tempDoc = await PDFDocument.load(fs.readFileSync(exportPage.path));
    const copiedPages = await doc.copyPages(tempDoc, tempDoc.getPageIndices());
    exportPage.pageNumber = tempDoc.getPageCount();
    copiedPages.forEach((copiedPage) => {
      copiedPage.drawText(`${totalPageNumber}`, {
        x: copiedPage.getWidth() / 2,
        y: 10,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      totalPageNumber += 1;
      doc.addPage(copiedPage);
    });
    await mergePdfs(doc, exportPage.children || []);
  }
};

module.exports = async (targetFile, exportPages) => {
  let doc = await PDFDocument.create();
  await mergePdfs(doc, exportPages);

  doc = await addOutline(doc, exportPages);
  const file = await doc.save();
  fs.writeFileSync(targetFile, file);
};
