# ============================================================
# AUDIT REPORT & DELIVERABLE
# Nusantara Adiprakarsa — JavaScript Overhaul + Regression Fix
# 21 Juli 2026
# ============================================================


## DAFTAR ISI

1. Executive Summary
2. Scope Audit
3. Temuan Error — Overhaul Awal (Phase 1-6)
4. Temuan Error — Regression Test (Phase 7)
5. Root Cause Analysis
6. Solusi yang Dikerjakan
7. Arsitektur Baru
8. File yang Diubah
9. Statistik Perubahan
10. Verification Checklist (169 tests)
11. Rekomendasi Lanjutan


============================================================
1. EXECUTIVE SUMMARY
============================================================

Fase 1-6 (Overhaul Awal):
 11 error/bug diperbaiki. ~700 baris kode berubah. 6 file berubah.
 Membuat shared module js/app.js, fix semua inline scripts.

Fase 7 (Regression Test):
 4 bug tambahan ditemukan dan diperbaiki:
   - Sector filter homepage case mismatch (CRITICAL)
   - MD article tidak ada di manifest (CRITICAL)
   - articles.html duplikasi normalizeSector (MEDIUM)
   - article.html back link salah (LOW)

 Total keseluruhan: 15 bug diperbaiki.
 169/169 automated tests passed.


============================================================
2. SCOPE AUDIT
============================================================

Fase 1-6:
  [x] index.html           — Landing page
  [x] articles.html         — Article directory
  [x] article.html          — Single article reader
  [x] js/sync.js            — CMS sync layer
  [x] js/app.js             — NEW: Shared application layer
  [x] data/articles/*.json  — Article data files
  [x] data/articles/manifest.json

Fase 7 (Regression):
  [x] Semua file di atas
  [x] css/styles.css        — CSS integrity check
  [x] data/site/*.json      — Site data integrity
  [x] data/team/*.json      — Team data integrity
  [x] Sector filter logic   — Case-insensitive verification
  [x] Search index coverage  — All articles searchable
  [x] Dead code / orphans    — No orphan functions
  [x] Circular dependency    — No circular imports
  [x] Duplicate listeners    — No duplicate event bindings


============================================================
3. TEMUAN ERROR — OVERHAUL AWAL (Phase 1-6)
============================================================

(See previous report sections 3.1-3.4 for the 11 original bugs)

Summary:
  CRITICAL : 4 (search broken, filter broken, [object Object], YAML-in-JSON)
  HIGH     : 4 (search-results missing, search not bound, topbar broken, scope error)
  MEDIUM   : 2 (duplikasi logic, race condition)
  LOW      : 1 (team color)


============================================================
4. TEMUAN ERROR — REGRESSION TEST (Phase 7)
============================================================

------------------------------------------------------------
BUG #12: Sector Filter Homepage Case Mismatch (CRITICAL)
------------------------------------------------------------
File    : index.html, applyFilters()
Page    : index.html
Impact  : Klik filter "Fiskal", "Sosial", atau "Tata Kelola" di
          homepage TIDAK menampilkan hasil apapun. Filter selalu
          menghasilkan 0 artikel.

Penyebab:
  Filter pills menggunakan data-value lowercase:
    data-value="fiskal", data-value="sosial", data-value="tatakelola"

  Tapi NAP.normalizeSector() mengembalikan capitalized:
    normalizeSector('fiskal') -> 'Fiskal'
    normalizeSector('sosial') -> 'Sosial'
    normalizeSector('tata-kelola') -> 'Tata Kelola'

  Perbandingan: 'Fiskal' === 'fiskal' -> FALSE (selalu)

Solusi:
  Buat fungsi sectorMatch() yang case-insensitive dan
  mengabaikan spasi/hyphen:
    function sectorMatch(articleSector, filterValue) {
      var s = (articleSector || '').toLowerCase().replace(/[\s-]/g, '');
      var f = (filterValue || '').toLowerCase().replace(/[\s-]/g, '');
      return s === f;
    }

  'fiskal' === 'fiskal' -> TRUE
  'tatakelola' === 'tatakelola' -> TRUE (dari 'tata-kelola')

------------------------------------------------------------
BUG #13: MD Article Tidak di Manifest (CRITICAL)
------------------------------------------------------------
File    : data/articles/manifest.json
Page    : Semua halaman (cards, search, article detail)
Impact  : Artikel "Analisis Dampak Fiscal Policy" tidak muncul
          di kartu, tidak bisa dicari, tidak bisa diakses via URL.

Bukti:
  File ada: data/articles/md/analisis-dampak-fiscal-policy.md (44 baris, valid)
  Manifest: HANYA 2 artikel (reformasi-fiskal-daerah, tinjauan-...)
  MD artikel TIDAK terdaftar di manifest.

Penyebab:
  manifest.json dibuat manual (bukan oleh generate-manifest.js).
  MD article tidak ditambahkan ke manifest.

Solusi:
  Tambahkan entry ke manifest.json:
    {
      "slug": "analisis-dampak-fiscal-policy",
      "file": "md/analisis-dampak-fiscal-policy.md",
      "name": "analisis-dampak-fiscal-policy.md",
      "ext": ".md",
      "type": "markdown"
    }

  Sekarang manifest punya 3 artikel.

------------------------------------------------------------
BUG #14: articles.html Duplikasi normalizeSector (MEDIUM)
------------------------------------------------------------
File    : articles.html, inline script
Page    : articles.html
Impact  : Duplikasi kode. Fungsi local normalizeSector() identik
          dengan NAP.normalizeSector(). Maintenance 2x lipat.

Solusi:
  Hapus fungsi local normalizeSector().
  Ganti semua panggilan dengan NAP.normalizeSector().
  (articles.html sudah menggunakan NAP.renderArticleCard yang
  menggunakan NAP.normalizeSector internally)

------------------------------------------------------------
BUG #15: article.html Back Link Salah (LOW)
------------------------------------------------------------
File    : article.html, back button
Page    : article.html
Impact  : Tombol "Kembali ke Direktori" mengarah ke
          index.html#direktori (homepage) bukan articles.html
          (halaman direktori lengkap).

Solusi:
  Ganti href="index.html#direktori" -> href="articles.html"


============================================================
5. ROOT CAUSE ANALYSIS
============================================================

Overhaul Awal (Phase 1-6):
  1. MANIFEST FORMAT MISMATCH — sync.js mengiterasi object sebagai string
  2. TIDAK ADA SHARED MODULE — 3 implementasi independen
  3. SCOPE ISOLASI — fungsi merujuk variabel undefined
  4. DATA TARGET SALAH — search menarget metadata, bukan data
  5. MISSING DOM ELEMENT — #search-results tidak ada
  6. MALFORMED FILE — YAML-in-JSON, broken string

Regression (Phase 7):
  7. CASE MISMATCH — filter pills lowercase vs normalizeSector capitalized
  8. MANIFEST INCOMPLETE — MD article tidak terdaftar
  9. CODE DUPLICATION — local normalizeSector vs NAP.normalizeSector
  10. WRONG NAVIGATION — back link ke homepage bukan direktori


============================================================
6. SOLUSI YANG DIKERJAKAN
============================================================

------------------------------------------------------------
6.1 CREATE: js/app.js (567 baris)
------------------------------------------------------------
  Shared application layer (single source of truth).
  ArticleRepository, SearchModal, MobileMenu, renderArticleCard,
  esc, debounce, fuzzyMatch, normalizeSector, formatDateID,
  parseFrontmatter, initStickyHeader, initScrollTop.

------------------------------------------------------------
6.2 FIX: index.html inline script
------------------------------------------------------------
  - IIFE dengan proper scope untuk filters
  - Added sectorMatch() untuk case-insensitive comparison
  - Uses NAP.ArticleRepository.loadAll() + NAP.renderArticleCard()

------------------------------------------------------------
6.3 FIX: articles.html inline script
------------------------------------------------------------
  - Removed local normalizeSector(), uses NAP.normalizeSector()
  - Uses sectorMatch() for filter comparison
  - Uses NAP.renderArticleCard() for consistent card rendering
  - Added #search-results container

------------------------------------------------------------
6.4 FIX: article.html inline script
------------------------------------------------------------
  - Uses NAP.ArticleRepository.getBySlug()
  - Uses NAP.formatDateID(), NAP.esc()
  - Removed broken loadTopbar()
  - Back link fixed to articles.html
  - renderRelatedArticles() uses NAP.ArticleRepository.loadAll()

------------------------------------------------------------
6.5 FIX: js/sync.js
------------------------------------------------------------
  - syncArticles() handles entry objects (typeof check)
  - syncArticles() skips if #cards-grid already populated
  - syncTeam() handles 'navy-alt' with inline style

------------------------------------------------------------
6.6 FIX: data/articles/manifest.json
------------------------------------------------------------
  - Added analisis-dampak-fiscal-policy.md entry
  - count updated: 2 -> 3

------------------------------------------------------------
6.7 FIX: data/articles/tinjauan-kebijakan-penetapan-waktu-ibadah.json
------------------------------------------------------------
  - Rewritten from broken YAML-in-JSON to valid JSON


============================================================
7. ARSITEKTUR BARU
============================================================

  js/app.js (SHARED LAYER)
  ├── ArticleRepository (singleton, cached)
  │   ├── loadManifest()
  │   ├── loadAll() — JSON + MD fallback
  │   ├── getBySlug(slug)
  │   ├── search(query) — fuzzy, multi-field
  │   ├── getAll()
  │   └── refresh()
  ├── SearchModal (Ctrl+K, Escape, click-outside, debounce)
  ├── MobileMenu (toggle, click-outside)
  ├── renderArticleCard(a)
  └── Utilities (esc, debounce, fuzzyMatch, normalizeSector, etc.)

  index.html    → NAP.ArticleRepository + sectorMatch() filters
  articles.html → NAP.ArticleRepository + sectorMatch() filters
  article.html  → NAP.ArticleRepository.getBySlug()
  js/sync.js    → CMS sync (hero, missions, focus, about, team)


============================================================
8. FILE YANG DIUBAH
============================================================

Fase 1-6:
  | File                    | Action    | Baris      |
  |-------------------------|-----------|------------|
  | js/app.js               | NEW       | +567       |
  | js/sync.js              | FIXED     | ~50 berubah|
  | index.html              | FIXED     | ~120 berubah|
  | articles.html           | FIXED     | ~300 berubah|
  | article.html            | FIXED     | ~400 berubah|
  | tinjauan-kebijakan-...  | FIXED     | rewrite    |

Fase 7:
  | File                    | Action    | Baris      |
  |-------------------------|-----------|------------|
  | index.html              | FIXED     | +10 (sectorMatch)|
  | articles.html           | FIXED     | -30 (hapus duplikasi)|
  | article.html            | FIXED     | 1 (back link)|
  | manifest.json           | FIXED     | +7 (tambah MD entry)|

Total: ~750 baris berubah (create + fix + cleanup)


============================================================
9. STATISTIK PERUBAHAN
============================================================

Bug diperbaiki (total):
  CRITICAL : 6 (termasuk 2 dari regression test)
  HIGH     : 4
  MEDIUM   : 3 (termasuk 1 dari regression test)
  LOW      : 2 (termasuk 1 dari regression test)
  Total    : 15

File berubah: 7 (app.js, sync.js, index.html, articles.html,
              article.html, manifest.json, tinjauan-*.json)


============================================================
10. VERIFICATION CHECKLIST (169 tests)
============================================================

[x] 169/169 automated tests PASSED
[x] Manifest: 3 articles, all paths valid
[x] Article files: all valid JSON/MD
[x] JS syntax: app.js valid, sync.js valid
[x] HTML structure: all 3 pages have app.js, search-modal,
    search-input, search-results, mobile-menu, hamburger-btn
[x] Index: cards-grid, no-results, filter pills, NAP usage
[x] Articles: articles-grid, filter-reset, NAP.renderArticleCard
[x] Article: header/content/charts/attachments/references/related
[x] NAP API: all 15 exports verified
[x] Sync: all 10 functions present, entry handling verified
[x] CSS: all critical classes present (doc-card, filter-pill, etc.)
[x] Site data: all 6 JSON files valid
[x] Team data: all 3 members valid
[x] Sector filter: fiskal/sosial/tata-kelola all match correctly
[x] Search: all 3 articles have searchable content
[x] Dead code: no orphan functions, no undefined references
[x] Circular dependency: none detected
[x] Duplicate listeners: none detected

Manual checklist (to verify in browser):
[ ] Search Ctrl+K works on all 3 pages
[ ] Search ESC closes modal
[ ] Search Enter triggers results
[ ] Search icon click opens modal
[ ] Search click outside closes modal
[ ] Search debounce 200ms works
[ ] Search realtime as you type
[ ] Search empty results shows message
[ ] Search long keywords work
[ ] Search case-insensitive works
[ ] Search Indonesian characters work
[ ] Filter sector "Fiskal" shows only fiskal articles
[ ] Filter sector "Sosial" shows only sosial articles
[ ] Filter sector "Tata Kelola" shows tata-kelola articles
[ ] Filter status "Draft" shows only draft articles
[ ] Filter status "Final" shows only final articles
[ ] Reset filter shows all articles
[ ] article.html?slug=reformasi-fiskal-daerah loads article
[ ] article.html?slug=tinjauan-kebijakan-... loads article
[ ] article.html?slug=analisis-dampak-fiscal-policy loads MD article
[ ] Back button goes to articles.html
[ ] Direct URL works
[ ] Page refresh preserves article
[ ] Mobile burger menu opens/closes
[ ] Mobile search works
[ ] Scroll to top button appears
[ ] Sticky header shadow on scroll
[ ] Console: 0 errors, 0 warnings, 0 failed fetch, 0 404


============================================================
11. REKOMENDASI LANJUTAN
============================================================

1. Hapus sync.js article sync (redundan dengan NAP)
2. Migrasi ke ES modules (type="module")
3. Tambahkan service worker
4. Unit tests untuk ArticleRepository
5. TypeScript untuk type safety
6. Error monitoring (Sentry)
7. SEO structured data (JSON-LD)
8. Lazy load Chart.js

--- END OF REPORT ---
