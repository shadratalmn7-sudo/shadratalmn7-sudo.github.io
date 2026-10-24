from pathlib import Path
from html import escape
from bs4 import BeautifulSoup
from weasyprint import HTML

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "russian-vocabulary.html"
OUTPUT = ROOT / "output/pdf/russian-vocabulary-summary.pdf"
SITE_OUTPUT = ROOT / "assets/russian/vocabulary.pdf"

document = BeautifulSoup(SOURCE.read_text(encoding="utf-8"), "html.parser")
lessons = []
for section in document.select('section[id^="review-"]'):
    title = section.find("h2").get_text(" ", strip=True)
    rows = []
    for card in section.select("article.word"):
        russian = card.find("h3").get_text(" ", strip=True)
        paragraphs = card.find_all("p", recursive=False)
        arabic = paragraphs[0].get_text(" ", strip=True) if paragraphs else ""
        english_node = card.select_one('p[lang="en"]')
        english = english_node.get_text(" ", strip=True) if english_node else ""
        note_node = card.find("small")
        note = note_node.get_text(" ", strip=True) if note_node else ""
        forms_node = card.select_one(".forms")
        forms = forms_node.get_text(" ", strip=True) if forms_node else ""
        details = " · ".join(value for value in (note, forms) if value)
        rows.append((russian, arabic, english, details))
    lessons.append((title, rows))

all_rows = [row for _, rows in lessons for row in rows]

def breakable_russian(value):
    parts = []
    for word in value.split(" "):
        if len(word) <= 10:
            parts.append(escape(word))
        else:
            parts.append("&#8203;".join(escape(word[i:i + 8]) for i in range(0, len(word), 8)))
    return " ".join(parts)

word_pages = []
for page_index, page_rows in enumerate(
    (all_rows[start:start + 40] for start in range(0, len(all_rows), 40)), 1
):
    cards = []
    for card_index, (russian, arabic, english, _) in enumerate(page_rows):
        row, column = divmod(card_index, 5)
        cards.append(
            f'<article class="card" style="top:{row * 28.6}mm;right:{column * 20}%">'
            '<div class="card-content">'
            f'<b class="ru" lang="ru">{breakable_russian(russian)}</b>'
            f'<span class="ar">{escape(arabic)}</span>'
            f'<span class="en" lang="en">{escape(english)}</span>'
            '</div></article>'
        )
    for card_index in range(len(page_rows), 40):
        row, column = divmod(card_index, 5)
        cards.append(
            f'<article class="card placeholder" style="top:{row * 28.6}mm;right:{column * 20}%"></article>'
        )
    start_number = (page_index - 1) * 40 + 1
    end_number = start_number + len(page_rows) - 1
    word_pages.append(
        f'<section class="lesson">'
        f'<header><h1>ملخص الكلمات</h1><p>{start_number} - {end_number} من {len(all_rows)} كلمة</p></header>'
        f'<div class="cards">{"".join(cards)}</div></section>'
    )

css = r'''
@font-face{font-family:Study;src:url(../../assets/russian/study.ttf)}
@page{size:A4;margin:13mm 11mm 15mm;@top-left{content:"شذرات · ملخص الكلمات";font:7.5pt Study;color:#718096}@bottom-center{content:counter(page);font:8pt Study;color:#718096}}
@page:first{@top-left{content:none}@bottom-center{content:none}}
*{box-sizing:border-box}
body{margin:0;color:#183657;font-family:Tahoma,Arial,Study,sans-serif;font-size:9pt;line-height:1.35;direction:rtl}
.cover{height:269mm;margin:-13mm -11mm -15mm;padding:34mm 20mm;background:#173b70;color:#fff;border-right:4mm solid #c7ac75;break-after:page}
.cover .label{display:inline-block;padding:2mm 4mm;border:0.3mm solid #ffffff55;border-radius:8mm;color:#dbeafe;font-size:9pt}
.cover h1{margin:34mm 0 8mm;color:#fff;font-size:38pt;line-height:1.15}
.cover h2{margin:0 0 7mm;color:#e4c68d;font-size:24pt}
.cover p{margin:2mm 0;color:#e5eefb;font-size:12pt}
.cover .credit{margin-top:28mm;padding-top:7mm;border-top:0.3mm solid #ffffff45}
.front{height:245mm;break-after:page}
.front h1{margin:0 0 4mm;color:#174f9a;font-size:22pt}
.front .intro{margin:0 0 7mm;padding:5mm 6mm;border-right:1.5mm solid #c7ac75;background:#f3f7fd;font-size:10pt;line-height:1.65}
.front h2{margin:0 0 4mm;font-size:14pt}
.toc{display:grid;grid-template-columns:1fr 1fr;gap:2.5mm}
.toc a{display:flex;align-items:center;gap:3mm;padding:3mm 4mm;border:0.25mm solid #d7e2ef;border-radius:2.5mm;color:#183657;text-decoration:none}
.toc b{display:grid;width:9mm;height:9mm;place-items:center;border-radius:50%;background:#174f9a;color:#fff;font-size:8pt}
.toc span{font-size:9pt}
.lesson{break-before:page}
.lesson header{display:flex;align-items:end;justify-content:space-between;margin-bottom:2mm;padding:0 0 2mm;border-bottom:0.7mm solid #c7ac75;min-height:12mm}
.lesson header span{display:none}
.lesson h1{margin:0;color:#183657;font-size:13pt;line-height:1.2}
.lesson header p{margin:0;color:#718096;font-size:8pt}
.cards{position:relative;width:100%;height:229mm;direction:rtl}
.card{position:absolute;width:calc(20% - 1.15mm);height:27.45mm;padding:0;border:0.35mm solid #b9cce4;border-radius:2.2mm;background:#fff;overflow:hidden;overflow-wrap:anywhere}
.card:nth-child(even){background:#f5f8fc}
.card.placeholder{visibility:hidden}
.card-content{position:absolute;top:50%;right:2.2mm;left:2.2mm;transform:translateY(-50%)}
.card b,.card span,.card small{display:block}
.ru{margin:0 0 1.15mm;direction:ltr;text-align:left;color:#174f9a;font-family:Arial,Study,sans-serif;font-size:9.5pt;line-height:1.15;font-weight:bold;unicode-bidi:isolate;overflow-wrap:anywhere;word-break:break-all}
.ar{margin:0 0 1mm;font-family:Tahoma,Arial,Study,sans-serif;font-size:8.2pt;line-height:1.25}
.en{margin:0;direction:ltr;text-align:left;color:#334e68;font-family:Arial,Study,sans-serif;font-size:7.4pt;line-height:1.15;unicode-bidi:isolate;overflow-wrap:anywhere}
.card small{margin-top:1.5mm;color:#718096;font-size:6.5pt;line-height:1.15}
'''

html = f'''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>ملخص الكلمات - غالب</title><style>{css}</style></head><body>
<section class="cover"><span class="label">شذرات · مكتبة الطالب</span><h1 lang="ru" dir="ltr">ДОРОГА В РОССИЮ 1</h1><h2>ملخص الكلمات</h2><p>Русский · العربية · English</p><p>{len(all_rows)} كلمة مختارة · 40 كلمة في الصفحة</p><p class="credit">إعداد وتلخيص وتنظيم: <b>غالب — Галиб</b></p></section>
{''.join(word_pages)}
</body></html>'''

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
HTML(string=html, base_url=str(ROOT)).write_pdf(OUTPUT)
SITE_OUTPUT.write_bytes(OUTPUT.read_bytes())
print(f"Wrote {OUTPUT} and {SITE_OUTPUT} with {len(all_rows)} summary entries in 40-word pages")
