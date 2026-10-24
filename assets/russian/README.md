# Russian study reference

Primary site: shadratalmn7-sudo/shadratalmn7-sudo.github.io, static root on main.
No changes to the redirect repository.

Content: Ghalib_Russian_Vocabulary_Data.xlsx (2026-10-22), 1,294 entries across 15 units. Workbook and editable HTML were byte-matched to Ghalib_Russian_Reference_Package.zip. Ghalib_Doroga_v_Rossiyu_Reference(1).pdf has the same size as the earlier full reference (124 pages). Older Russian_Book files cover lessons 1–5 and were not used to replace the complete dataset. The original 343-page scan and review report were inspected; original book images are not redistributed.

Original authors: В. Е. Антонова, М. М. Нахабина, М. В. Сафронова, А. А. Толстых. Дорога в Россию, часть 1, 6-е издание, 2010.
Compilation, organization and summary: غالب — Галиб. Source audit identifies stress marks as editorial, not specialist-verified; page matches are automatic. The public source note preserves this limitation.

search.json retains all workbook columns and is the canonical vocabulary dataset. Lesson HTML is statically rendered for fast reading and indexing. Search loads JSON only on the first query. Summary selects up to two entries per semantic group by number of recorded source pages, with source ordering as tie-breaker (314 entries); this is not a word-frequency statistic. Full vocabulary remains untouched. Grammar retains source explanations, tables and examples; quick grammar excludes the pronunciation introduction and review exercises.

PDFs were generated with WeasyPrint, embedded DejaVu Sans and reviewed as rasterized pages. Font licensing is in FONT-LICENSE.txt. Static styles and search have no application framework or runtime dependency.

Validation: node scripts/site-audit.mjs; node scripts/test-russian-book.mjs. Browser checks covered all 23 relevant pages at widths 1280, 375 and 320; Russian/Arabic/English search, stress normalization, zero-result query, global menu and actual download event; no uncaught page errors. Existing account, Firestore and scholarship code was not changed.
