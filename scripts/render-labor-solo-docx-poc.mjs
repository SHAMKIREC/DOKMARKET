import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

import { buildDocumentModel } from "../src/document-model/builders/buildDocumentModel.js";
import { laborSoloCompleteClaimData } from "../src/document-model/__fixtures__/labor-solo.complete.js";
import { validateDocumentModel } from "../src/document-model/validation/validateDocumentModel.js";
import { renderDocx } from "../src/document-renderers/docx/renderDocx.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const templatePath = path.join(
  projectRoot,
  "src",
  "document-templates",
  "docx",
  "labor",
  "solo",
  "1.0.0",
  "template.docx",
);
const outputDirectory = path.join(projectRoot, "dev-output");
const outputPath = path.join(outputDirectory, "labor-solo-poc.docx");

const paragraph = (text, options = {}) => {
  const align = options.align ? `<w:jc w:val="${options.align}"/>` : "";
  const spacing = `<w:spacing w:after="${options.after ?? 120}" w:line="360" w:lineRule="auto"/>`;
  const bold = options.bold ? "<w:b/>" : "";
  const size = options.size || 24;
  return `<w:p><w:pPr>${align}${spacing}</w:pPr><w:r><w:rPr>${bold}<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
};

function createTemplateBuffer() {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
  const packageRelationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  const documentRelationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/><w:qFormat/>
    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
  </w:style>
</w:styles>`;

  const body = [
    paragraph("Работодателю:", { bold: true }),
    paragraph("{respondent.displayName}"),
    paragraph("{respondent.address}"),
    paragraph("ИНН: {respondent.inn}"),
    paragraph("{respondent.registrationNumberLabel}: {respondent.registrationNumber}", { after: 240 }),
    paragraph("От:", { bold: true }),
    paragraph("{claimant.fullName}"),
    paragraph("{claimant.address}"),
    paragraph("{claimant.phone}"),
    paragraph("{claimant.email}", { after: 300 }),
    paragraph("{document.title}", { bold: true, align: "center", size: 28 }),
    paragraph("{document.subtitle}", { bold: true, align: "center", after: 300 }),
    paragraph("Я, {claimant.fullName}, работал(а) в должности {claimant.position}."),
    paragraph("Период работы: {facts.workStartDate} — {facts.workEndText}."),
    paragraph("Рабочее место: {facts.workplaceAddress}."),
    paragraph("Задолженность: {facts.debtAmount}.", { after: 240 }),
    paragraph("Обстоятельства", { bold: true }),
    paragraph("{facts.description}", { after: 240 }),
    paragraph("Правовое обоснование", { bold: true }),
    paragraph("{#legalGrounds}", { after: 0 }),
    paragraph("{number}. {citation} — {title}. {text}"),
    paragraph("{/legalGrounds}", { after: 0 }),
    paragraph("Требования", { bold: true }),
    paragraph("{#demands}", { after: 0 }),
    paragraph("{number}. {text} {amount}"),
    paragraph("{/demands}", { after: 0 }),
    paragraph("Приложения", { bold: true }),
    paragraph("{#evidence}", { after: 0 }),
    paragraph("{number}. {label}. {description} {filesText}"),
    paragraph("{/evidence}", { after: 0 }),
    paragraph("Срок ответа", { bold: true }),
    paragraph("{deadlines.responseTermText}", { after: 240 }),
    paragraph("Дата: {document.date}"),
    paragraph("Подпись: __________________ / {claimant.shortName}"),
  ].join("");
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1701" w:bottom="1134" w:left="1701"/></w:sectPr></w:body>
</w:document>`;

  const zip = new PizZip();
  zip.file("[Content_Types].xml", contentTypes);
  zip.folder("_rels").file(".rels", packageRelationships);
  const word = zip.folder("word");
  word.file("document.xml", documentXml);
  word.file("styles.xml", styles);
  word.folder("_rels").file("document.xml.rels", documentRelationships);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}

async function ensureTemplate() {
  try {
    await readFile(templatePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await mkdir(path.dirname(templatePath), { recursive: true });
    await writeFile(templatePath, createTemplateBuffer());
  }
}

async function main() {
  await ensureTemplate();
  const template = await readFile(templatePath);
  const buildResult = buildDocumentModel(laborSoloCompleteClaimData, {
    generatedAt: new Date().toISOString(),
    source: "fixture",
  });
  if (!buildResult.ok) {
    throw new Error(`${buildResult.error.code}: ${buildResult.error.message}`);
  }
  const validation = validateDocumentModel(buildResult.model);
  if (!validation.valid) {
    throw new Error(`DocumentModel invalid: ${JSON.stringify(validation.errors)}`);
  }

  const rendered = await renderDocx({
    model: buildResult.model,
    template: new Uint8Array(template),
    dependencies: { Docxtemplater, PizZip },
  });
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, Buffer.from(await rendered.blob.arrayBuffer()));
  process.stdout.write(`DOCX PoC created: ${outputPath}\n`);
}

main().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});

