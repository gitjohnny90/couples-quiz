#!/usr/bin/env node
// IG batch renderer — loads posts.json, screenshots each post via Playwright to public/ig/.
// Usage:
//   node scripts/ig/render.mjs              # render every post in posts.json
//   node scripts/ig/render.mjs --test       # render the built-in test post (no posts.json required)
//   node scripts/ig/render.mjs --only p1,p2 # render only specific post ids

import { chromium } from 'playwright';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, extname } from 'node:path';
import { createServer } from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IG_DIR = resolve(__dirname, '../../public/ig');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function startServer() {
  return new Promise((resolveP) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      const pathname = url.pathname === '/' ? '/composer.html' : url.pathname;
      const filePath = join(__dirname, pathname.replace(/^\//, ''));
      try {
        const buf = readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
        res.end(buf);
      } catch (err) {
        res.writeHead(404);
        res.end(`not found: ${pathname}`);
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolveP({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

const ASPECT_DIMS = {
  '1x1': { width: 1080, height: 1080 },
  '9x16': { width: 1080, height: 1920 },
  '16x9': { width: 1920, height: 1080 },
};

function parseArgs(argv) {
  const args = { test: false, only: null };
  for (const a of argv.slice(2)) {
    if (a === '--test') args.test = true;
    else if (a.startsWith('--only=')) args.only = a.slice(7).split(',');
    else if (a === '--only') {
      // handled in next arg
    }
  }
  const idx = argv.indexOf('--only');
  if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith('--')) {
    args.only = argv[idx + 1].split(',');
  }
  return args;
}

async function renderOne(page, baseUrl, { id, aspect, fileName }) {
  const dims = ASPECT_DIMS[aspect];
  if (!dims) throw new Error(`Unknown aspect "${aspect}" for post ${id}`);

  await page.setViewportSize({ width: dims.width, height: dims.height });
  const url = `${baseUrl}/composer.html?post=${encodeURIComponent(id)}&aspect=${encodeURIComponent(aspect)}`;
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for fonts + composer signal
  await page.waitForFunction(() => window.__IG_READY__ === true, { timeout: 15000 });
  await page.evaluate(async () => { if (document.fonts) await document.fonts.ready; });
  // Small settle for CSS transitions / layout
  await page.waitForTimeout(120);

  const stage = page.locator('#stage');
  await stage.screenshot({ path: join(IG_DIR, fileName), type: 'png', omitBackground: false });
  console.log(`  ✓ ${fileName} (${dims.width}×${dims.height})`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (!existsSync(IG_DIR)) await mkdir(IG_DIR, { recursive: true });

  let postsList;
  if (args.test) {
    postsList = [{ id: 'test', aspect: '1x1', fileName: 'post-test.png', testMode: true }];
  } else {
    const raw = await readFile(resolve(__dirname, 'posts.json'), 'utf8');
    const { posts } = JSON.parse(raw);
    if (!posts?.length) {
      console.error('posts.json has no posts. Populate it and re-run.');
      process.exit(2);
    }
    postsList = posts
      .filter(p => !args.only || args.only.includes(p.id))
      .map(p => ({
        id: p.id,
        aspect: p.aspect_ratio || '1x1',
        fileName: `${p.id}.png`,
      }));
  }

  console.log(`Rendering ${postsList.length} post(s) to ${IG_DIR}`);
  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`  [console:${msg.type()}]`, msg.text());
    }
  });
  page.on('pageerror', err => console.log(`  [pageerror]`, err.message));
  page.on('requestfailed', req => console.log(`  [requestfailed]`, req.url(), req.failure()?.errorText));
  try {
    for (const p of postsList) {
      if (args.test) {
        const dims = ASPECT_DIMS[p.aspect];
        await page.setViewportSize(dims);
        await page.goto(`${baseUrl}/composer.html?test=1&aspect=${p.aspect}`, { waitUntil: 'networkidle' });
        await page.waitForFunction(() => window.__IG_READY__ === true, { timeout: 15000 });
        await page.evaluate(async () => { if (document.fonts) await document.fonts.ready; });
        await page.waitForTimeout(120);
        await page.locator('#stage').screenshot({ path: join(IG_DIR, p.fileName), type: 'png' });
        console.log(`  ✓ ${p.fileName} (test) ${dims.width}×${dims.height}`);
      } else {
        await renderOne(page, baseUrl, p);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
