const { PDFDict, PDFName, PDFPageLeaf, PDFNumber, PDFArray, PDFHexString, PDFNull } = require('pdf-lib');

const getPageRefs = (pdfDoc) => {
  const refs = [];
  pdfDoc.catalog.Pages().traverse((kid, ref) => {
    if (kid instanceof PDFPageLeaf) {
      refs.push(ref);
    }
  });
  return refs;
};

let pageIndex = 0;
function setRefsForOutlineItems(exportPages, context, parentRef, pageRefs) {
  for (const exportPage of exportPages) {
    exportPage.ref = context.nextRef();
    exportPage.parentRef = parentRef;
    exportPage.pageRef = pageRefs[pageIndex];
    pageIndex += exportPage.pageNumber;
    setRefsForOutlineItems(exportPage.children, context, exportPage.ref, pageRefs);
  }
}

function countChildrenOfOutline(exportPages) {
  let count = 0;
  for (const exportPage of exportPages) {
    count += 1;
    count += countChildrenOfOutline(exportPage.children);
  }
  return count;
}

function buildPdfObjectsOfOutline(exportPages, context) {
  for (const [index, exportPage] of exportPages.entries()) {
    const prev = exportPages[index - 1];
    const next = exportPages[index + 1];

    const array = PDFArray.withContext(context);
    array.push(exportPage.pageRef);
    array.push(PDFName.of('XYZ'));
    array.push(PDFNull);
    array.push(PDFNull);
    array.push(PDFNull);
    const pdfObject = new Map([
      [PDFName.of('Title'), PDFHexString.fromText(exportPage.title)],
      [PDFName.of('Dest'), array],
      [PDFName.of('Parent'), exportPage.parentRef],
    ]);
    if (prev) {
      pdfObject.set(PDFName.of('Prev'), prev.ref);
    }
    if (next) {
      pdfObject.set(PDFName.of('Next'), next.ref);
    }
    if (exportPage.children.length > 0) {
      pdfObject.set(PDFName.of('First'), exportPage.children[0].ref);
      pdfObject.set(PDFName.of('Last'), exportPage.children[exportPage.children.length - 1].ref);
      pdfObject.set(PDFName.of('Count'), PDFNumber.of(countChildrenOfOutline(exportPage.children)));
    }
    context.assign(exportPage.ref, PDFDict.fromMapWithContext(pdfObject, context));

    buildPdfObjectsOfOutline(exportPage.children, context);
  }
}

async function addOutline(pdfDoc, exportPages) {
  const pcontext = pdfDoc.context;
  const outlineRef = pcontext.nextRef();

  const pageRefs = getPageRefs(pdfDoc);
  setRefsForOutlineItems(exportPages, pcontext, outlineRef, pageRefs);
  buildPdfObjectsOfOutline(exportPages, pcontext);

  const outlineObject = PDFDict.fromMapWithContext(new Map([
    [PDFName.of('First'), exportPages[0].ref],
    [PDFName.of('Last'), exportPages[exportPages.length - 1].ref],
    [PDFName.of('Count'), PDFNumber.of(countChildrenOfOutline(exportPages))],
  ]), pcontext);
  pcontext.assign(outlineRef, outlineObject);

  pdfDoc.catalog.set(PDFName.of('Outlines'), outlineRef);
  return pdfDoc;
}

module.exports = addOutline;
