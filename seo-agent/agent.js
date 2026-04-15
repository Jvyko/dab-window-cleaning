#!/usr/bin/env node
'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const HTML_FILES = [
  'index.html',
  'provo-window-cleaning.html',
  'orem-window-cleaning.html',
  'lehi-window-cleaning.html',
  'american-fork-window-cleaning.html',
  'saratoga-springs-window-cleaning.html',
  'eagle-mountain-window-cleaning.html',
  'spanish-fork-window-cleaning.html',
  'pleasant-grove-window-cleaning.html',
  'lindon-window-cleaning.html',
  'residential-window-cleaning.html',
  'commercial-window-cleaning.html',
  'post-construction-window-cleaning.html',
];

const MONTH = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

function stripMarkdown(text) {
  return text
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

async function improvePage(filename, content) {
  console.log(`  Sending to Claude...`);

  const stream = client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: `You are an expert local SEO specialist for DAB Window Cleaning in Utah County, UT. Today: ${MONTH}.

CRITICAL: Return ONLY the complete HTML file. Start with "<!DOCTYPE html>". End with "</html>". No explanations, no markdown fences.

What to improve:
- <title>: primary keyword + city + brand, under 60 chars
- <meta name="description">: compelling, keyword + location + CTA, under 160 chars
- <meta name="keywords">: refresh with current high-value terms
- Heading tags (h1/h2/h3): strengthen keyword targeting, natural language
- Image alt attributes: descriptive, include service + location
- Body paragraph copy: freshen with ${MONTH} seasonal angle, local city mentions, trust signals
- Schema JSON-LD: ensure phone, address, services are complete and accurate
- Add 1-2 internal links to related pages where natural

What NOT to change:
- CSS styles (inline or linked)
- JavaScript code
- Layout or structure
- href links, src paths, form actions
- Brand voice or visual design

Business info:
- Name: DAB Window Cleaning
- Phone: (801) 980-1471
- Email: dabwindowcleaningutah@gmail.com
- URL: https://dabutah.com
- Cities: Provo, Orem, Lehi, American Fork, Saratoga Springs, Eagle Mountain, Spanish Fork, Pleasant Grove, Lindon
- Services: Residential, Commercial, HOA, Post-Construction window cleaning
- Tone: Premium, trustworthy, locally owned`,

    messages: [{
      role: 'user',
      content: `Improve the SEO of ${filename}. Return the complete improved HTML only:\n\n${content}`,
    }],
  });

  let result = '';
  process.stdout.write('  Streaming response');
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      result += event.delta.text;
      process.stdout.write('.');
    }
  }
  console.log(' done');

  return stripMarkdown(result);
}

async function main() {
  const repoRoot = process.env.GITHUB_WORKSPACE
    ? process.env.GITHUB_WORKSPACE
    : path.resolve(__dirname, '..');

  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║   DAB Window Cleaning — SEO Agent    ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`Repo:  ${repoRoot}`);
  console.log(`Date:  ${new Date().toDateString()}`);
  console.log('');

  const changed = [];
  const errors = [];

  for (const filename of HTML_FILES) {
    const filepath = path.join(repoRoot, filename);

    if (!fs.existsSync(filepath)) {
      console.log(`⚠️  ${filename} — not found, skipping\n`);
      continue;
    }

    const original = fs.readFileSync(filepath, 'utf8');
    console.log(`🔧 ${filename}`);

    try {
      const improved = await improvePage(filename, original);

      // Sanity check: must be valid HTML
      if (!improved.includes('<!DOCTYPE') && !improved.toLowerCase().startsWith('<html')) {
        console.log(`⚠️  Unexpected response format — skipping\n`);
        continue;
      }

      if (improved.trim() !== original.trim()) {
        fs.writeFileSync(filepath, improved, 'utf8');
        changed.push(filename);
        console.log(`✅ Improved\n`);
      } else {
        console.log(`➡️  Already well-optimized\n`);
      }
    } catch (err) {
      console.error(`❌ Error: ${err.message}\n`);
      errors.push(filename);
    }

    // Pause between files to stay within rate limits
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log('══════════════════════════════════════');
  if (changed.length > 0) {
    console.log(`\n✨ Improved ${changed.length} page(s):`);
    changed.forEach(f => console.log(`   • ${f}`));
  } else {
    console.log('\n✅ All pages already well-optimized — no changes made.');
  }

  if (errors.length > 0) {
    console.log(`\n⚠️  Errors on ${errors.length} page(s):`);
    errors.forEach(f => console.log(`   • ${f}`));
  }

  console.log('');
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
