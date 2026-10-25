import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const data = JSON.parse(read('assets/russian/search.json'));
const css = read('assets/russian/book.css');
const pronunciationScript = read('assets/russian/pronunciation.js');
const grammarCardsScript = read('assets/russian/grammar-cards.js');

assert.equal(data.length, 1294);
assert.match(css, /\.word-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
assert.match(css, /\.library-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
assert.match(css, /@media\(max-width:720px\)\{\.word-grid,\.library-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert(data.some(entry => entry.Group === 'الأسرة والناس'));
assert(data.some(entry => entry.Group === 'الأعداد والكمية'));
assert.match(read('books.html'), /<h1>قسم الكتب<\/h1>/);
assert(!read('books.html').includes('ملخص'));
assert.match(css, /\.speak-button\{/);
assert.match(pronunciationScript, /SpeechSynthesisUtterance/);
assert.match(pronunciationScript, /utterance\.lang = 'ru-RU'/);
assert.match(pronunciationScript, /utterance\.rate = 0\.82/);
assert.match(grammarCardsScript, /document\.createElement\('details'\)/);
assert.match(grammarCardsScript, /grammar-card-body/);
assert.match(read('russian-grammar.html'), /assets\/russian\/grammar-cards\.js\?v=\d+/);
for (const page of fs.readdirSync(root).filter(file => /^russian-.*\.html$/.test(file) && read(file).includes('assets/russian/book.css'))) {
  assert(read(page).includes('assets/russian/pronunciation.js?v=1'), `${page}: missing Russian pronunciation`);
}
assert(!read('sitemap.xml').includes('russian-summaries.html'));

console.log('PASS: compact books section, 4-column desktop/2-column phone grids, pronunciation and grammar cards.');
