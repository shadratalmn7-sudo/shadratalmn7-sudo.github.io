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

toc = "".join(
    f'<a href="#lesson-{index}"><b>{index:02}</b><span>{escape(title.split("—", 1)[-1].strip())}</span></a>'
    for index, (title, _) in enumerate(lessons, 1)
)

lesson_html = []
for index, (title, rows) in enumerate(lessons, 1):
    table_rows = []
    for row_start in range(0, len(rows), 4):
        cells = []
        for russian, arabic, english, details in rows[row_start:row_start + 4]:
            cells.append(
                '<td><article class="card">'
                f'<b class="ru" lang="ru">{escape(russian)}</b>'
                f'<span class="ar">{escape(arabic)}</span>'
                f'<span class="en" lang="en">{escape(english)}</span>'
                f'<small>{escape(details)}</small>'
                '</article></td>'
            )
        cells.extend('<td class="empty"></td>' for _ in range(4 - len(cells)))
        table_rows.append(f'<tr>{"".join(cells)}</tr>')
    cards = f'<table class="cards"><tbody>{"".join(table_rows)}</tbody></table>'
    lesson_html.append(
        f'<section class="lesson" id="lesson-{index}">'
        f'<header><span>الدرس {index:02}</span><h1>{escape(title)}</h1><p>{len(rows)} كلمة للمراجعة السريعة</p></header>'
        f'<div class="cards">{cards}</div></section>'
    )

css = r'''
@font-face{font-family:Study;src:url(../../assets/russian/study.ttf)}
@page{size:A4;margin:13mm 11mm 15mm;@top-left{content:"شذرات · ملخص الكلمات";font:7.5pt Study;color:#718096}@bottom-center{content:counter(page);font:8pt Study;color:#718096}}
@page:first{@top-left{content:none}@bottom-center{content:none}}
*{box-sizing:border-box}
body{margin:0;color:#183657;font-family:Study,sans-serif;font-size:9pt;line-height:1.35;direction:rtl}
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
.lesson header{margin-bottom:4mm;padding:0 0 3mm;border-bottom:0.7mm solid #c7ac75;min-height:18mm}
.lesson header span{display:none}
.lesson h1{margin:0;color:#183657;font-size:14.5pt;line-height:1.25;overflow-wrap:anywhere}
.lesson header p{margin:0;color:#718096;font-size:8pt}
.cards{width:100%;margin:0;border-collapse:separate;border-spacing:1.5mm;table-layout:fixed;direction:rtl}
.cards tr{break-inside:avoid}
.cards td{width:25%;height:27mm;padding:0;border:0;vertical-align:top}
.cards td.empty{height:0}
.card{height:27mm;padding:2.5mm;border:0.25mm solid #d6e1ef;border-radius:2.5mm;background:#fff;overflow:hidden;overflow-wrap:anywhere}
.cards tr:nth-child(even) .card{background:#f5f8fc}
.card b,.card span,.card small{display:block}
.ru{margin-bottom:1.8mm;direction:ltr;text-align:left;color:#174f9a;font-size:10.5pt;line-height:1.15;font-weight:bold;unicode-bidi:isolate;overflow-wrap:anywhere;word-break:break-all}
.ar{margin-bottom:1mm;font-size:9pt;line-height:1.2}
.en{direction:ltr;text-align:left;color:#334e68;font-size:8pt;line-height:1.15;unicode-bidi:isolate}
.card small{margin-top:1.5mm;color:#718096;font-size:6.5pt;line-height:1.15}
'''

html = f'''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>ملخص الكلمات - غالب</title><style>{css}</style></head><body>
<section class="cover"><span class="label">شذرات · مكتبة الطالب</span><h1 lang="ru" dir="ltr">ДОРОГА В РОССИЮ 1</h1><h2>ملخص الكلمات</h2><p>Русский · العربية · English</p><p>{sum(len(rows) for _, rows in lessons)} كلمة مختارة · 15 درسًا</p><p class="credit">إعداد وتلخيص وتنظيم: <b>غالب — Галиб</b></p></section>
<section class="front"><h1>مراجعة أوضح وأسرع</h1><p class="intro">ملخص منظم للمراجعة حسب الدروس. حُذفت عناوين المجموعات المتكررة ووُضعت الكلمات في بطاقات متناسقة تستغل الصفحة بصورة أفضل. تبقى جميع المداخل الأصلية البالغ عددها 1,294 مدخلًا متاحة في الكتاب الكامل على موقع شذرات.</p><h2>فهرس الدروس</h2><nav class="toc">{toc}</nav></section>
{''.join(lesson_html)}
</body></html>'''

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
HTML(string=html, base_url=str(ROOT)).write_pdf(OUTPUT)
SITE_OUTPUT.write_bytes(OUTPUT.read_bytes())
print(f"Wrote {OUTPUT} and {SITE_OUTPUT} with {sum(len(rows) for _, rows in lessons)} summary entries")
