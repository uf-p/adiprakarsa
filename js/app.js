/* ============================================================
   Nusantara Adiprakarsa — Shared Application Layer
   Single source of truth for: ArticleRepository, SearchEngine,
   Modal/Navigation utilities, Error handling.
   ============================================================ */
(function () {
  'use strict';

  /* ──────────────────────────────────────────────
     UTILITIES
     ────────────────────────────────────────────── */

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function debounce(fn, ms) {
    var timer;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function fuzzyMatch(text, query) {
    if (!text || !query) return false;
    var t = text.toLowerCase();
    var q = query.toLowerCase();
    if (t.indexOf(q) !== -1) return true;
    var qi = 0;
    for (var ti = 0; ti < t.length && qi < q.length; ti++) {
      if (t[ti] === q[qi]) qi++;
    }
    return qi === q.length;
  }

  function formatDateID(dateStr) {
    if (!dateStr) return '';
    var months = [
      'Januari','Februari','Maret','April','Mei','Juni',
      'Juli','Agustus','September','Oktober','November','Desember'
    ];
    try {
      var d = new Date(dateStr);
      return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    } catch (e) { return dateStr; }
  }

  function normalizeSector(raw) {
    if (!raw) return '';
    var map = {
      'fiskal': 'Fiskal',
      'sosial': 'Sosial',
      'tata-kelola': 'Tata Kelola',
      'tata kelola': 'Tata Kelola',
      'tatakelola': 'Tata Kelola',
      'infrastruktur': 'Infrastruktur',
      'lingkungan': 'Lingkungan',
      'energi': 'Lingkungan'
    };
    var lower = raw.toLowerCase().trim();
    return map[lower] || raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  function parseFrontmatter(text) {
    var match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { meta: {}, body: text };
    var meta = {};
    var lines = match[1].split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        var key = line.substring(0, colonIdx).trim();
        var val = line.substring(colonIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        meta[key] = val;
      }
    }
    return { meta: meta, body: match[2].trim() };
  }

  /* ──────────────────────────────────────────────
     ARTICLE REPOSITORY (Singleton)
     ────────────────────────────────────────────── */

  var ArticleRepository = (function () {
    var _manifest = null;
    var _articles = [];       // fully loaded article objects
    var _index = {};          // slug -> article
    var _loading = null;      // shared promise
    var _searchIndex = null;  // built on first search

    function fetchJSON(url) {
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
        return r.json();
      });
    }

    /**
     * Load manifest. Returns manifest object.
     */
    function loadManifest() {
      if (_manifest) return Promise.resolve(_manifest);
      return fetchJSON('data/articles/manifest.json').then(function (m) {
        _manifest = m;
        return m;
      });
    }

    /**
     * Load a single article by its manifest entry.
     * Tries JSON first, then Markdown.
     * Returns article object or null.
     */
    function loadArticle(entry) {
      var slug = entry.slug;
      var filePath = entry.file;

      // Try JSON first
      return fetchJSON('data/articles/' + filePath).then(function (data) {
        var item = Array.isArray(data) ? data[0] : data;
        if (!item) return null;

        // Detect YAML-frontmatter-in-JSON (files starting with ---)
        // The fetch will fail JSON.parse if content has ---, but .json() already parsed it.
        // However, the tinjauan file is actually broken. If the parsed item has a "slug" 
        // field that looks like YAML, detect that.
        if (item.slug && item.slug.indexOf('---') !== -1) {
          // This is the broken file. Fall through to markdown.
          throw new Error('YAML-in-JSON detected');
        }

        if (!item.slug) item.slug = slug;
        // Ensure description field exists
        if (!item.description && item.excerpt) item.description = item.excerpt;
        return item;
      }).catch(function () {
        // Try Markdown
        return fetch('data/articles/md/' + slug + '.md').then(function (r) {
          if (!r.ok) return null;
          return r.text();
        }).then(function (text) {
          if (!text) return null;
          var parsed = parseFrontmatter(text);
          return {
            slug: slug,
            title: parsed.meta.title || slug.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }),
            description: parsed.body.slice(0, 300).replace(/[#*_`<>]/g, ''),
            content: parsed.body,
            author: parsed.meta.author || '',
            date: parsed.meta.date || '',
            sector: parsed.meta.sector || '',
            scope: parsed.meta.scope || '',
            status: parsed.meta.status || 'draft',
            reading_time: parsed.meta.reading_time || '',
            charts: [],
            attachments: [],
            references: []
          };
        }).catch(function () { return null; });
      });
    }

    /**
     * Load all articles from manifest.
     * Returns array of article objects.
     */
    function loadAll() {
      if (_articles.length) return Promise.resolve(_articles);
      if (_loading) return _loading;

      _loading = loadManifest().then(function (manifest) {
        var entries = manifest.articles || [];
        if (!entries.length) return [];

        return Promise.allSettled(entries.map(function (entry) {
          return loadArticle(entry);
        })).then(function (results) {
          var articles = [];
          results.forEach(function (r) {
            if (r.status === 'fulfilled' && r.value) {
              var a = r.value;
              articles.push(a);
              _index[a.slug] = a;
            }
          });
          _articles = articles;
          _searchIndex = null; // rebuild
          return articles;
        });
      });

      return _loading;
    }

    /**
     * Get article by slug.
     */
    function getBySlug(slug) {
      if (_index[slug]) return Promise.resolve(_index[slug]);
      return loadAll().then(function () {
        return _index[slug] || null;
      });
    }

    /**
     * Build search index (called lazily on first search).
     */
    function buildSearchIndex() {
      if (_searchIndex) return _searchIndex;
      _searchIndex = _articles.map(function (a) {
        return {
          article: a,
          searchText: [
            a.title || '',
            a.author || '',
            a.sector || '',
            normalizeSector(a.sector),
            a.slug || '',
            a.description || a.excerpt || '',
            a.scope || '',
            (a.tags || []).join(' ')
          ].join(' ').toLowerCase()
        };
      });
      return _searchIndex;
    }

    /**
     * Search articles. Returns matching articles.
     */
    function search(query) {
      if (!query) return [];
      var idx = buildSearchIndex();
      var q = query.toLowerCase().trim();
      var results = [];
      for (var i = 0; i < idx.length; i++) {
        if (fuzzyMatch(idx[i].searchText, q)) {
          results.push(idx[i].article);
        }
      }
      return results;
    }

    /**
     * Get all loaded articles.
     */
    function getAll() {
      return _articles;
    }

    /**
     * Refresh (force reload).
     */
    function refresh() {
      _manifest = null;
      _articles = [];
      _index = {};
      _searchIndex = null;
      _loading = null;
      return loadAll();
    }

    return {
      loadManifest: loadManifest,
      loadAll: loadAll,
      getBySlug: getBySlug,
      search: search,
      getAll: getAll,
      refresh: refresh
    };
  })();

  /* ──────────────────────────────────────────────
     SEARCH MODAL CONTROLLER
     ────────────────────────────────────────────── */

  var SearchModal = (function () {
    var _modal, _input, _results;
    var _isOpen = false;

    function init() {
      _modal = document.getElementById('search-modal');
      _input = document.getElementById('search-input');
      _results = document.getElementById('search-results');
      if (!_modal || !_input) return;

      // Escape closes
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && _isOpen) {
          close();
          e.stopPropagation();
        }
        // Ctrl+K / Cmd+K opens
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          toggle();
        }
      });

      // Click outside closes
      _modal.addEventListener('click', function (e) {
        if (e.target === _modal) close();
      });

      // Search input with debounce
      _input.addEventListener('input', debounce(function () {
        var query = _input.value.trim();
        renderResults(query);
      }, 200));

      // Enter key triggers search (already handled by input debounce, but focus)
      _input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var query = _input.value.trim();
          renderResults(query);
        }
      });
    }

    function open() {
      if (!_modal) return;
      _modal.classList.add('open');
      _isOpen = true;
      if (_input) {
        _input.value = '';
        setTimeout(function () { _input.focus(); }, 50);
      }
      if (_results) {
        _results.innerHTML = '<div class="text-center text-gray-400 py-8 text-sm">Ketik untuk mulai mencari...</div>';
      }
    }

    function close() {
      if (!_modal) return;
      _modal.classList.remove('open');
      _isOpen = false;
    }

    function toggle() {
      if (_isOpen) close(); else open();
    }

    function renderResults(query) {
      if (!_results) return;
      if (!query) {
        _results.innerHTML = '<div class="text-center text-gray-400 py-8 text-sm">Ketik untuk mulai mencari...</div>';
        return;
      }

      var results = ArticleRepository.search(query);
      if (!results.length) {
        _results.innerHTML = '<div class="text-center text-gray-400 py-8 text-sm">Tidak ada hasil untuk &quot;' + esc(query) + '&quot;</div>';
        return;
      }

      var html = results.slice(0, 10).map(function (a) {
        var excerpt = a.description || a.excerpt || '';
        var sector = normalizeSector(a.sector);
        return '<a href="article.html?slug=' + encodeURIComponent(a.slug) + '" class="block p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">' +
          '<div class="font-semibold text-navy text-sm mb-1">' + esc(a.title) + '</div>' +
          '<div class="text-xs text-gray-500">' +
            (sector ? esc(sector) + ' &bull; ' : '') +
            (a.author ? esc(a.author) : '') +
            (a.status ? ' &bull; <span class="capitalize">' + esc(a.status) + '</span>' : '') +
          '</div>' +
          (excerpt ? '<div class="text-xs text-gray-400 mt-1 line-clamp-2">' + esc(excerpt.slice(0, 120)) + (excerpt.length > 120 ? '...' : '') + '</div>' : '') +
        '</a>';
      }).join('');

      _results.innerHTML = html;
    }

    return { init: init, open: open, close: close, toggle: toggle };
  })();

  /* ──────────────────────────────────────────────
     MOBILE MENU CONTROLLER
     ────────────────────────────────────────────── */

  var MobileMenu = (function () {
    var _menu, _btn;

    function init() {
      _menu = document.getElementById('mobile-menu');
      _btn = document.getElementById('hamburger-btn');
      if (!_menu || !_btn) return;

      _btn.addEventListener('click', function (e) {
        e.stopPropagation();
        _menu.classList.toggle('open');
      });

      document.addEventListener('click', function (e) {
        if (_menu.classList.contains('open') && !_menu.contains(e.target) && !_btn.contains(e.target)) {
          _menu.classList.remove('open');
        }
      });
    }

    function toggle() {
      if (_menu) _menu.classList.toggle('open');
    }

    function close() {
      if (_menu) _menu.classList.remove('open');
    }

    return { init: init, toggle: toggle, close: close };
  })();

  /* ──────────────────────────────────────────────
     STICKY HEADER
     ────────────────────────────────────────────── */

  function initStickyHeader() {
    var header = document.getElementById('main-header');
    if (!header) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          header.classList.toggle('scrolled', window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /* ──────────────────────────────────────────────
     SCROLL TO TOP
     ────────────────────────────────────────────── */

  function initScrollTop() {
    var btn = document.getElementById('scroll-top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > 400);
    });
  }

  /* ──────────────────────────────────────────────
     STATUS / SECTOR CONSTANTS
     ────────────────────────────────────────────── */

  var STATUS_LABELS = { draft: 'Draft', review: 'Review', final: 'Final' };
  var STATUS_BADGE_PREFIX = { draft: 'badge-draft', review: 'badge-review', final: 'badge-final' };

  var SECTOR_ICONS = {
    fiskal: '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
    sosial: '<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>',
    'tata-kelola': '<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>',
    infrastruktur: '<path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>',
    lingkungan: '<path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>'
  };

  var SECTOR_COLORS = {
    fiskal:            { bg: '#EEF2FF', color: '#3730A3' },
    sosial:            { bg: '#ECFDF5', color: '#065F46' },
    'tata-kelola':     { bg: '#FDF6E3', color: '#92400E' },
    'tatakelola':      { bg: '#FDF6E3', color: '#92400E' },
    infrastruktur:     { bg: '#EFF6FF', color: '#1E40AF' },
    lingkungan:        { bg: '#F0FDF4', color: '#166534' }
  };

  /* ──────────────────────────────────────────────
     ARTICLE CARD RENDERER
     ────────────────────────────────────────────── */

  function renderArticleCard(a) {
    var sectorKey = (a.sector || '').toLowerCase().trim();
    var sc = SECTOR_COLORS[sectorKey] || SECTOR_COLORS.fiskal;
    var icon = SECTOR_ICONS[sectorKey] || SECTOR_ICONS.fiskal;
    var status = a.status || 'draft';
    var badgeClass = STATUS_BADGE_PREFIX[status] || 'badge-draft';
    var badgeLabel = STATUS_LABELS[status] || 'Draft';
    var sector = normalizeSector(a.sector);
    var excerpt = a.description || a.excerpt || '';

    return '<article class="doc-card p-6 flex flex-col gap-4" data-sector="' + esc(sector) + '" data-status="' + esc(status) + '">' +
      '<div class="flex items-start justify-between gap-3">' +
        '<div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background:' + sc.bg + ';">' +
          '<svg class="w-5 h-5" style="color:' + sc.color + ';" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">' + icon + '</svg>' +
        '</div>' +
        '<span class="' + badgeClass + ' text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0">\u25CB ' + badgeLabel + '</span>' +
      '</div>' +
      '<div class="flex flex-wrap gap-1.5">' +
        '<span class="sector-tag font-semibold px-2.5 py-0.5 rounded-full">' + esc(sector) + '</span>' +
        (a.scope ? '<span class="text-[10px] px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">' + esc(a.scope) + '</span>' : '') +
      '</div>' +
      '<div>' +
        '<h3 class="font-semibold text-navy text-base leading-snug mb-2">' +
          '<a href="article.html?slug=' + encodeURIComponent(a.slug) + '" class="hover:text-gold transition-colors">' + esc(a.title) + '</a>' +
        '</h3>' +
        '<p class="text-gray-500 text-xs leading-relaxed line-clamp-3">' + esc(excerpt) + '</p>' +
      '</div>' +
      '<div class="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 border-t border-slate-line pt-4">' +
        (a.date ? '<span class="flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' + formatDateID(a.date) + '</span>' : '') +
        (a.author ? '<span class="flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"/></svg>' + esc(a.author) + '</span>' : '') +
      '</div>' +
      '<div class="flex gap-2 mt-auto">' +
        '<a href="article.html?slug=' + encodeURIComponent(a.slug) + '" class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-800 transition-colors">' +
          '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>' +
          'Baca Artikel' +
        '</a>' +
      '</div>' +
    '</article>';
  }

  /* ──────────────────────────────────────────────
     PUBLIC API (window.NAP)
     ────────────────────────────────────────────── */

  window.NAP = {
    // Core
    ArticleRepository: ArticleRepository,
    SearchModal: SearchModal,
    MobileMenu: MobileMenu,

    // Utilities
    esc: esc,
    debounce: debounce,
    fuzzyMatch: fuzzyMatch,
    formatDateID: formatDateID,
    normalizeSector: normalizeSector,
    parseFrontmatter: parseFrontmatter,

    // UI helpers
    initStickyHeader: initStickyHeader,
    initScrollTop: initScrollTop,

    // Constants
    STATUS_LABELS: STATUS_LABELS,
    SECTOR_ICONS: SECTOR_ICONS,
    SECTOR_COLORS: SECTOR_COLORS,

    // Renderers
    renderArticleCard: renderArticleCard
  };

  /* ──────────────────────────────────────────────
     AUTO-INIT (runs on DOMContentLoaded)
     ────────────────────────────────────────────── */

  function autoInit() {
    initStickyHeader();
    initScrollTop();
    SearchModal.init();
    MobileMenu.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

})();
