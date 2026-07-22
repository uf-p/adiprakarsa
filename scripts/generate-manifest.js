#!/usr/bin/env node
/**
 * generate-manifest.js
 * 
 * Scans data/articles/ and data/articles/md/ untuk .json, .md, dan .html files
 * Otomatis generate manifest.json dengan slug + file extension
 * 
 * Features:
 * - Scan recursive di data/articles/ dan subdirektori md/
 * - Exclude manifest.json dan hidden files
 * - Support multiple formats: .json, .md, .html
 * - Output berisi slug lengkap dengan extension (untuk auto-load)
 * - Sorted alphabetically
 * - Verbose logging
 * 
 * Run: npm run manifest
 * atau: node scripts/generate-manifest.js
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, '..', 'data', 'articles');
//const MD_DIR = path.join(ARTICLES_DIR, 'md');
const MANIFEST_PATH = path.join(ARTICLES_DIR, 'manifest.json');

// Konfigurasi
const CONFIG = {
  supportedExts: ['.json', '.md', '.html'],
  excludeFiles: ['manifest.json', '.DS_Store'],
  excludeDirs: ['node_modules', '.git', '__pycache__'],
  verbose: true,
};

/**
 * Scan directory recursively
 * @param {string} dir - Directory path
 * @param {Set} results - Set untuk store hasil
 * @param {string} baseDir - Base directory untuk relative path
 */
function scanDirectory(dir, results = new Set(), baseDir = ARTICLES_DIR) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach((file) => {
    // Skip hidden files dan excluded names
    if (file.name.startsWith('.') || CONFIG.excludeFiles.includes(file.name)) {
      return;
    }

    const fullPath = path.join(dir, file.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (file.isDirectory()) {
      // Skip excluded dirs
      if (CONFIG.excludeDirs.includes(file.name)) {
        return;
      }
      // Recursive scan subfolder
      scanDirectory(fullPath, results, baseDir);
    } else if (file.isFile()) {
      // Check if file extension is supported
      const ext = path.extname(file.name);
      if (CONFIG.supportedExts.includes(ext)) {
        // Store relative path (dengan extension)
        const relativeFile = path.normalize(relativePath).replace(/\\/g, '/');
        results.add(relativeFile);

        if (CONFIG.verbose) {
          console.log(`  ✓ Found: ${relativeFile}`);
        }
      }
    }
  });

  return results;
}

/**
 * Main generator function
 */
function generate() {
  console.log('\n📋 Scanning articles directory...\n');

  const articles = new Set();

  // Scan root articles directory
  console.log(`Scanning: ${ARTICLES_DIR}`);
  scanDirectory(ARTICLES_DIR, articles, ARTICLES_DIR);


  // Sort hasil
  const sortedArticles = Array.from(articles).sort();

  // Build manifest dengan struktur yang lebih detail
  const manifest = {
    generated: new Date().toISOString(),
    count: sortedArticles.length,
    articles: sortedArticles.map((filePath) => {
      const name = path.basename(filePath);
      const ext = path.extname(filePath);
      const slug = path.parse(filePath).name;

      return {
        slug: slug,
        file: filePath,
        name: name,
        ext: ext,
        type: ext === '.json' ? 'json' : ext === '.md' ? 'markdown' : 'html',
      };
    }),
  };

  // Write manifest.json
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

  // Output summary
  console.log('\n✅ Manifest generated successfully!\n');
  console.log(`📁 Output: ${MANIFEST_PATH}`);
  console.log(`📊 Total articles: ${sortedArticles.length}\n`);

  if (sortedArticles.length > 0) {
    console.log('📄 Articles found:');
    sortedArticles.forEach((article, idx) => {
      const ext = path.extname(article);
      console.log(`   ${idx + 1}. ${path.basename(article)} (${ext})`);
    });
  } else {
    console.log('⚠️  No articles found!');
  }

  console.log('');
}

/**
 * Auto-load helper function untuk digunakan di aplikasi
 * Contoh: const filePath = getArticleFilePath('tinjauan-kebijakan-penetapan-waktu-ibadah');
 */
function getArticleFilePath(slug) {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ manifest.json tidak ditemukan. Jalankan: npm run manifest');
    return null;
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const article = manifest.articles.find((a) => a.slug === slug);

  if (!article) {
    console.warn(`⚠️  Article slug "${slug}" not found in manifest`);
    return null;
  }

  return `/data/articles/${article.file}`;
}

// Export untuk digunakan sebagai module
module.exports = {
  generate,
  getArticleFilePath,
  CONFIG,
};

// Run jika dijalankan langsung
if (require.main === module) {
  generate();
}
