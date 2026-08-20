import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const STRICT = process.argv.includes('--strict');
const targets = [
  'src/pages',
  'src/marketplace/components',
  'src/data/marketplaceMock.js',
];
const skip = [
  /pdfGenerator/i,
  /legal/i,
  /templates?/i,
  /generator\/steps?/i,
];
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx']);

const rules = [
  ['Канцелярит', /\b(произвести оплату|осуществить (?:проверку|внедрение|оплату|отправку)|выполнить отправку)\b/gi],
  ['Пустая вводная', /\b(стоит отметить|важно понимать|нельзя недооценивать|в современном мире|есть один важный нюанс|но это ещё не всё|отсюда следует)\b/gi],
  ['Затёртая концовка', /\b(выбор за вами|решать только вам|время действовать)\b/gi],
  ['Кликбейт', /\b(эта ошибка уничтожит|один (?:промпт|способ|секрет) изменит всё)\b/gi],
  ['Размытый хедж', /\b(потенциально|в некоторых случаях|как правило)\b/gi],
  ['Абстракция без факта', /\b(синергия|трансформация|масштабирование)\b/gi],
  ['Слабый глагол', /\b(осуществляется|производится|является возможным)\b/gi],
];

function walk(entry) {
  const full = path.join(ROOT, entry);
  if (!fs.existsSync(full)) return [];
  const stat = fs.statSync(full);
  if (stat.isFile()) return [full];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap(item => {
    const next = path.join(full, item.name);
    if (item.isDirectory()) return walk(path.relative(ROOT, next));
    return [next];
  });
}

const files = [...new Set(targets.flatMap(walk))]
  .filter(file => extensions.has(path.extname(file)))
  .filter(file => !skip.some(pattern => pattern.test(file)));

const findings = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  for (const [label, pattern] of rules) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text))) {
      const before = text.slice(0, match.index);
      const line = before.split(/\r?\n/).length;
      findings.push({ label, file: path.relative(ROOT, file), line, match: match[0] });
      if (pattern.lastIndex === match.index) pattern.lastIndex++;
    }
  }
}

if (!findings.length) {
  console.log('Copy lint: явных нейрошаблонов в интерфейсных текстах не найдено.');
  process.exit(0);
}

console.log(`Copy lint: найдено ${findings.length} мест.`);
for (const item of findings) {
  console.log(`- ${item.label}: ${item.file}:${item.line} — «${item.match}»`);
}
console.log('\nПроверка не переписывает текст автоматически. Правила: docs/content-style-ru.md');
if (STRICT) process.exit(1);
