#!/usr/bin/env node
/**
 * Script: Generate optimized lucide-react barrel file
 * Hanya re-export icon yang benar-benar dipakai di source code.
 * Ini mengurangi modules yang di-transform Vite dari ~1600 jadi ~60.
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '../src');
const BARREL_FILE = path.resolve(__dirname, '../node_modules/lucide-react/dist/esm/lucide-react.js');
const OUTPUT_FILE = path.resolve(__dirname, '../src/lib/icons.js');

// Step 1: Find all icon names imported from 'lucide-react' in source files
function findUsedIcons(dir) {
  const icons = new Set();
  const files = [];

  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'lib') {
        walk(full);
      } else if (entry.isFile() && /\.(jsx?|tsx?)$/.test(entry.name)) {
        files.push(full);
      }
    }
  }
  walk(dir);

  // Match: import { Icon1, Icon2 } from 'lucide-react';
  // Handle multi-line imports
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const regex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const names = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
      for (const name of names) {
        icons.add(name);
      }
    }
  }
  return icons;
}

// Step 2: Parse barrel file to map icon names to file paths
function parseBarrelFile(barrelPath) {
  const content = fs.readFileSync(barrelPath, 'utf8');
  const map = {};
  // Each line: export { default as Name1, default as Name2 } from './icons/file.js';
  const regex = /export\s*\{([^}]+)\}\s*from\s*'([^']+)'/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const filePath = match[2]; // e.g. './icons/bell.js'
    const names = match[1].split(',').map(s => s.trim().replace(/^default\s+as\s+/, '').trim()).filter(Boolean);
    for (const name of names) {
      map[name] = filePath;
    }
  }
  return map;
}

// Step 3: Generate optimized barrel file
const usedIcons = findUsedIcons(SRC_DIR);
const iconMap = parseBarrelFile(BARREL_FILE);

console.log(`Found ${usedIcons.size} unique icons used in source code`);

// Also export createLucideIcon and other non-icon exports if used
const lines = [
  '/**',
  ' * Auto-generated optimized lucide-react imports.',
  ' * Hanya icon yang benar-benar dipakai yang di-import.',
  ' * Ini mengurangi Vite transform dari ~1600 modules jadi ~' + usedIcons.size + '.',
  ' * ',
  ' * Re-generate: node scripts/generate-icons.js',
  ' */',
  '',
];

const missing = [];
const found = [];

for (const icon of [...usedIcons].sort()) {
  const filePath = iconMap[icon];
  if (filePath) {
    // Convert './icons/bell.js' to '../../node_modules/lucide-react/dist/esm/icons/bell.js'
    const importPath = filePath.replace('./', '../../node_modules/lucide-react/dist/esm/');
    lines.push(`export { default as ${icon} } from '${importPath}';`);
    found.push(icon);
  } else {
    missing.push(icon);
  }
}

if (missing.length > 0) {
  console.warn(`\n⚠️  Icons not found in lucide-react (mungkin typo atau deprecated):`);
  for (const m of missing) {
    console.warn(`   - ${m}`);
  }
  lines.push('');
  lines.push('// WARNING: Icons berikut tidak ditemukan di lucide-react barrel file.');
  lines.push('// Kemungkinan typo atau icon deprecated. Cek dan perbaiki di source code.');
  for (const m of missing) {
    lines.push(`// MISSING: ${m}`);
  }
}

// Ensure output directory exists
const outDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, lines.join('\n') + '\n');
console.log(`\n✅ Generated ${OUTPUT_FILE}`);
console.log(`   ${found.length} icons exported`);
if (missing.length) {
  console.log(`   ${missing.length} icons MISSING (need manual fix)`);
}
