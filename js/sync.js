/* ============================================================
   Nusantara Adhi Prakarsa — CMS Sync Layer
   Reads JSON data and updates the original HTML elements.
   ============================================================ */
(function () {
  'use strict';

  async function init() {
    const [hero, missions, focus, about, contact, footer] = await Promise.all([
      fetchJSON('data/site/hero.json'),
      fetchJSON('data/site/missions.json').catch(() => null),
      fetchJSON('data/site/focus.json').catch(() => null),
      fetchJSON('data/site/about.json').catch(() => null),
      fetchJSON('data/site/contact.json').catch(() => null),
      fetchJSON('data/site/footer.json').catch(() => null)
    ]);

    if (hero) syncHero(hero);
    if (missions) syncMissions(missions);
    if (focus) syncFocus(focus);
    if (about) syncAbout(about);
    if (contact) syncContact(contact);
    if (footer) syncFooter(footer);

    await syncTeam();
    await syncArticles();
  }

  async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url);
    return r.json();
  }

  /* ── HERO ── */
  function syncHero(d) {
    // Badge
    const badge = document.querySelector('#hero .text-gold.text-xs.font-semibold.tracking-widest');
    if (badge) badge.textContent = d.badge || '';

    // Title h1
    const h1 = document.querySelector('#hero h1');
    if (h1) {
      h1.innerHTML =
        (d.title_line1 || '') + '<br/>' +
        '<span style="background:linear-gradient(90deg,#C9A84C,#E8C97A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">' +
        (d.title_highlight || '') + '</span><br/>' +
        (d.title_line2 || '');
    }

    // Description
    const desc = document.querySelector('#hero p.text-gray-300.text-base');
    if (desc) desc.textContent = d.description || '';

    // Vision
    const visionText = document.querySelector('#hero .border-l-2.border-gold p.text-gray-300.text-sm.italic');
    if (visionText) visionText.textContent = d.vision_text || '';

    // Stats
    const stats = document.querySelectorAll('#hero .stat-item');
    if (d.stats && stats.length) {
      d.stats.forEach((s, i) => {
        if (!stats[i]) return;
        const val = stats[i].querySelector('.font-display');
        const label = stats[i].querySelector('.text-gray-400');
        if (val) val.textContent = s.value || '';
        if (label) label.innerHTML = (s.label || '') + '<br/>' + (s.sublabel || '');
      });
    }

    // Agenda card (right side)
    syncAgendaCard(d.agenda_card);
  }

  function syncAgendaCard(agenda) {
    if (!agenda) return;
    const card = document.querySelector('#hero .bg-white\\/5.backdrop-blur');
    if (!card) return;

    // Title
    const titleEl = card.querySelector('.text-white.font-semibold.text-sm');
    if (titleEl) titleEl.textContent = agenda.title || '';

    // Progress items
    const progressItems = card.querySelectorAll('.space-y-3 > div');
    if (agenda.items && progressItems.length) {
      agenda.items.forEach((item, i) => {
        if (!progressItems[i]) return;
        const nameEl = progressItems[i].querySelector('.text-white\\/70');
        const statusEl = progressItems[i].querySelector('.text-gold, .text-emerald-light');
        const barFill = progressItems[i].querySelector('.bg-gold, .bg-emerald');
        if (nameEl) nameEl.textContent = item.name || '';
        if (statusEl) {
          statusEl.textContent = item.status || '';
          statusEl.className = item.color === 'emerald' ? 'text-emerald-light' : 'text-gold';
        }
        if (barFill) {
          barFill.style.width = (item.percent || 0) + '%';
          barFill.className = 'h-1.5 rounded-full ' + (item.color === 'emerald' ? 'bg-emerald' : 'bg-gold');
        }
      });
    }

    // Team
    const namesEl = card.querySelector('.text-white\\/40.text-xs');
    if (namesEl && agenda.team_names) namesEl.textContent = agenda.team_names;
  }

  /* ── MISSIONS ── */
  function syncMissions(d) {
    // Handle both formats: plain array or {missions:[...]}
    const items = Array.isArray(d) ? d : (d.missions || []);
    if (!items.length) return;
    const container = document.querySelector('.bg-white.border-y.border-slate-line .flex.flex-wrap.gap-x-8');
    if (!container) return;
    container.innerHTML = items.map(m => {
      const text = typeof m === 'string' ? m : (m.mission || '');
      return '<div class="flex items-center gap-2 text-gray-600">' +
        '<svg class="w-4 h-4 text-gold flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
        '<span class="text-xs font-medium">' + esc(text) + '</span>' +
      '</div>';
    }).join('');
  }

  /* ── FOCUS AREAS ── */
  function syncFocus(d) {
    if (!d.items || !d.items.length) return;
    const grid = document.querySelector('#fokus-riset .grid');
    if (!grid) return;

    const ICONS = {
      currency: '<path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
      people: '<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>',
      building: '<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>',
      map: '<path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>',
      globe: '<path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>'
    };

    const statusStyle = (type) =>
      type === 'active'
        ? 'sector-tag font-semibold px-2.5 py-0.5 rounded-full text-[10px]'
        : 'text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500';

    let html = d.items.map(item => {
      const icon = ICONS[item.icon] || ICONS.currency;
      const statusClass = statusStyle(item.status_type);
      return '<div class="bg-white rounded-xl border border-slate-line p-6 hover:shadow-md transition-shadow">' +
        '<div class="w-10 h-10 rounded-lg bg-navy flex items-center justify-center mb-4">' +
          '<svg class="w-5 h-5 text-gold" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">' + icon + '</svg>' +
        '</div>' +
        '<h3 class="font-semibold text-navy text-base mb-2">' + esc(item.title) + '</h3>' +
        '<p class="text-gray-500 text-xs leading-relaxed">' + esc(item.description) + '</p>' +
        '<div class="mt-3"><span class="' + statusClass + '">' + esc(item.status) + '</span></div>' +
      '</div>';
    }).join('');

    // CTA card
    if (d.cta_card) {
      const c = d.cta_card;
      html += '<div class="bg-navy rounded-xl p-6 flex flex-col justify-between">' +
        '<div>' +
          '<div class="text-gold text-xs font-bold uppercase tracking-widest mb-3">' + esc(c.label) + '</div>' +
          '<h3 class="font-semibold text-white text-base mb-2">' + esc(c.title) + '</h3>' +
          '<p class="text-gray-400 text-xs leading-relaxed">' + esc(c.description) + '</p>' +
        '</div>' +
        '<a href="' + (c.button_url || '#kontak') + '" class="btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold mt-4 w-fit">' +
          esc(c.button_text) +
          '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
        '</a>' +
      '</div>';
    }

    grid.innerHTML = html;
  }

  /* ── ABOUT ── */
  function syncAbout(d) {
    const section = document.querySelector('#tentang');
    if (!section) return;

    // Paragraphs
    const textContainer = section.querySelector('.grid.lg\\:grid-cols-2 > div:first-child');
    if (textContainer && d.paragraphs) {
      const existingH2 = textContainer.querySelector('h2');
      const existingLabel = textContainer.querySelector('.text-gold.text-xs');
      let html = '';
      if (existingLabel) html += existingLabel.outerHTML;
      if (existingH2) html += existingH2.outerHTML;
      d.paragraphs.forEach(p => {
        html += '<p class="text-gray-600 text-sm leading-relaxed mb-4">' + esc(p) + '</p>';
      });

      // Values
      if (d.values && d.values.length) {
        html += '<div class="space-y-3">';
        d.values.forEach(v => {
          html += '<div class="flex items-start gap-3">' +
            '<div class="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">' +
              '<svg class="w-3 h-3 text-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
            '</div>' +
            '<div><div class="font-semibold text-navy text-sm">' + esc(v.title) + '</div>' +
            '<div class="text-gray-500 text-xs">' + esc(v.description) + '</div></div>' +
          '</div>';
        });
        html += '</div>';
      }
      textContainer.innerHTML = html;
    }

    // Profile
    if (d.profile && d.profile.length) {
      const profileContainer = section.querySelector('.grid.lg\\:grid-cols-2 > div:last-child .space-y-4') ||
                               section.querySelector('.grid.lg\\:grid-cols-2 > div:last-child');
      if (profileContainer) {
        profileContainer.innerHTML = '<div class="bg-slate-soft rounded-xl p-6 border border-slate-line space-y-4">' +
          d.profile.map(p =>
            '<div class="flex justify-between items-center"><span class="text-gray-500 text-xs">' + esc(p.label) + '</span>' +
            '<span class="font-semibold text-navy text-sm">' + esc(p.value) + '</span></div>'
          ).join('') +
        '</div>';
      }
    }
  }

  /* ── CONTACT ── */
  function syncContact(d) {
    const section = document.querySelector('#kontak');
    if (!section) return;

    // Address
    const addrEl = section.querySelector('.text-white\\/60.text-sm');
    if (addrEl) addrEl.textContent = d.address || '';

    // Email
    const emailEl = section.querySelector('a[href^="mailto:"]');
    if (emailEl) {
      emailEl.textContent = d.email || '';
      emailEl.href = 'mailto:' + (d.email || '');
    }

    // Hours
    const hoursEls = section.querySelectorAll('.text-white\\/60.text-sm');
    if (hoursEls.length > 2) hoursEls[2].textContent = d.hours || '';

    // Collab card
    if (d.collab_card) {
      const collabText = section.querySelector('.bg-white\\/5 p.text-white\\/60');
      if (collabText) collabText.textContent = d.collab_card.text || '';
    }
  }

  /* ── FOOTER ── */
  function syncFooter(d) {
    const footer = document.querySelector('footer');
    if (!footer) return;

    // Description
    const descEl = footer.querySelector('footer p, .text-white\\/50');
    if (descEl) descEl.textContent = d.description || '';

    // Copyright
    const copyEl = footer.querySelector('.border-t span, .text-white\\/35 span');
    if (copyEl) copyEl.textContent = d.copyright || '';
  }

  /* ── TEAM ── */
  async function syncTeam() {
    const files = ['winarso.json', 'iwan-gunawan.json', 'muhammad-padang.json'];
    const members = [];
    for (const f of files) {
      try {
        const data = await fetchJSON('data/team/' + f);
        members.push(data);
      } catch {}
    }
    if (!members.length) return;

    const grid = document.querySelector('#tim .grid');
    if (!grid) return;

    const colors = { navy: 'bg-navy', emerald: 'bg-emerald', gold: 'bg-gold' };

    grid.innerHTML = members.map(m => {
      const bgClass = colors[m.color] || 'bg-navy';
      const needsInlineStyle = !colors[m.color] && m.color;
      const style = needsInlineStyle ? 'style="background:' + esc(m.color) + '"' : '';
      const initialsColor = (m.color === 'emerald') ? 'white' : 'gold';
      return '<div class="bg-white rounded-xl border border-slate-line p-6 text-center hover:shadow-md transition-shadow">' +
        '<div class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ' + bgClass + '" ' + style + '>' +
          '<span class="text-' + initialsColor + ' font-display font-800 text-xl" style="font-family:\'Montserrat\',sans-serif;">' + esc(m.initials || '') + '</span>' +
        '</div>' +
        '<h3 class="font-semibold text-navy text-base">' + esc(m.name) + '</h3>' +
        '<div class="text-gold text-xs font-semibold mt-1 mb-3">' + esc(m.role) + '</div>' +
        '<p class="text-gray-500 text-xs leading-relaxed">' + esc(m.bio || '') + '</p>' +
      '</div>';
    }).join('');
  }

  /* ── PARSE FRONTMATTER ── */
  function parseFrontmatter(text) {
    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { meta: {}, body: text };
    const meta = {};
    const lines = match[1].split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        let key = line.substring(0, colonIdx).trim();
        let val = line.substring(colonIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        meta[key] = val;
      }
    }
    return { meta: meta, body: match[2].trim() };
  }

  /* ── ARTICLES ── */
  async function syncArticles() {
    // On index.html, the inline script handles #cards-grid via NAP.ArticleRepository.
    // Only sync if #cards-grid has no dynamic content yet (fallback).
    const grid = document.querySelector('#cards-grid');
    if (grid && grid.children.length > 0) return;

    let entries = [];
    try {
      const manifest = await fetchJSON('data/articles/manifest.json');
      entries = manifest.articles || [];
    } catch {}

    if (!entries.length) return;

    const articles = [];
    for (const entry of entries) {
      const slug = typeof entry === 'string' ? entry : entry.slug;
      const filePath = typeof entry === 'string' ? entry + '.json' : entry.file;
      if (!slug || !filePath) continue;

      // Try JSON first
      try {
        const a = await fetchJSON('data/articles/' + filePath);
        if (!a.slug) a.slug = slug;
        if (!a.description && a.excerpt) a.description = a.excerpt;
        articles.push(a);
        continue;
      } catch {}
      // Try MD
      try {
        const res = await fetch('data/articles/md/' + slug + '.md');
        if (res.ok) {
          const text = await res.text();
          const parsed = parseFrontmatter(text);
          articles.push({
            slug: slug,
            title: parsed.meta.title || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            description: parsed.body.slice(0, 200).replace(/[#*_`]/g, ''),
            author: parsed.meta.author || '',
            date: parsed.meta.date || '',
            sector: parsed.meta.sector || '',
            status: parsed.meta.status || 'draft',
            reading_time: '5 menit'
          });
        }
      } catch {}
    }
    if (!articles.length) return;

    if (!grid) return;

    const sectorColors = {
      fiskal: { bg: '#EEF2FF', color: '#3730A3' },
      sosial: { bg: '#ECFDF5', color: '#065F46' },
      tatakelola: { bg: '#FDF6E3', color: '#92400E' },
      infrastruktur: { bg: '#EFF6FF', color: '#1E40AF' },
      lingkungan: { bg: '#F0FDF4', color: '#166534' }
    };

    const sectorIcons = {
      fiskal: '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
      sosial: '<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>',
      tatakelola: '<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>'
    };

    const statusBadge = (s) => {
      const map = { draft: 'badge-draft', review: 'badge-review', final: 'badge-final' };
      const label = { draft: '○ Draft', review: '◐ Review', final: '● Final' };
      return '<span class="' + (map[s] || 'badge-draft') + ' text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0">' + (label[s] || 'Draft') + '</span>';
    };

    grid.innerHTML = articles.map(a => {
      const sc = sectorColors[a.sector] || sectorColors.fiskal;
      const icon = sectorIcons[a.sector] || sectorIcons.fiskal;
      return '<article class="doc-card p-6 flex flex-col gap-4" data-sector="' + (a.sector || '') + '" data-status="' + (a.status || 'draft') + '">' +
        '<div class="flex items-start justify-between gap-3">' +
          '<div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background:' + sc.bg + ';">' +
            '<svg class="w-5 h-5" style="color:' + sc.color + ';" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">' + icon + '</svg>' +
          '</div>' +
          statusBadge(a.status) +
        '</div>' +
        '<div class="flex flex-wrap gap-1.5">' +
          '<span class="sector-tag font-semibold px-2.5 py-0.5 rounded-full">' + esc(a.sector || '') + '</span>' +
          (a.scope ? '<span class="text-[10px] px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">' + esc(a.scope) + '</span>' : '') +
        '</div>' +
        '<div>' +
          '<h3 class="font-semibold text-navy text-base leading-snug mb-2">' +
            '<a href="article.html?slug=' + encodeURIComponent(a.slug) + '" class="hover:text-gold transition-colors">' + esc(a.title) + '</a>' +
          '</h3>' +
          '<p class="text-gray-500 text-xs leading-relaxed line-clamp-3">' + esc(a.description || a.excerpt || '') + '</p>' +
        '</div>' +
        '<div class="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 border-t border-slate-line pt-4">' +
          (a.author ? '<span class="flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"/></svg>' + esc(a.author) + '</span>' : '') +
          (a.reading_time ? '<span class="flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' + esc(a.reading_time) + '</span>' : '') +
        '</div>' +
        '<div class="flex gap-2 mt-auto">' +
          '<a href="article.html?slug=' + encodeURIComponent(a.slug) + '" class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-800 transition-colors">' +
            '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>' +
            'Baca Artikel' +
          '</a>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* ── UTILS ── */
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  /* ── START ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
