import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const data = JSON.parse(read('assets/russian/search.json'));
const css = read('assets/russian/book.css');
const topics = read('russian-vocabulary-topics.html');
const topicsScript = read('assets/russian/topics.js');

assert.equal(data.length, 1294);
assert.match(css, /font-family:Tahoma,Arial,sans-serif/);
assert.match(css, /\.word-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
assert.match(css, /\.library-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
assert.match(css, /@media\(max-width:720px\)\{\.word-grid,\.library-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(topics, /حسب القرابة والموضوع/);
assert.match(topics, /assets\/russian\/topics\.js\?v=1/);
assert(data.some(entry => entry.Group === 'الأسرة والناس'));
assert(data.some(entry => entry.Group === 'الأعداد والكمية'));
assert.match(topicsScript, /الدراسة والتخصصات والمهن والمدرسون/);
assert.match(topicsScript, /fetch\('assets\/russian\/search\.json'\)/);
assert(read('russian-vocabulary.html').includes('russian-vocabulary-topics.html'));
assert(read('sitemap.xml').includes('russian-vocabulary-topics.html'));

console.log('PASS: Shatharat font, 4-column desktop/2-column phone grids, lesson and semantic vocabulary modes.');
