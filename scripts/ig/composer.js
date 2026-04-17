// IG Composer — reads a post spec from URL params and renders to #stage.
// Post data lives in posts.json (keyed by id). Aspect and id come from the URL
// so the Playwright driver can iterate without navigating a server.

const params = new URLSearchParams(window.location.search);
const postId = params.get('post');
const aspect = params.get('aspect') || '1x1';
const testMode = params.get('test') === '1';

const stage = document.getElementById('stage');
stage.className = `aspect-${aspect}`;

function svgHeart(color = 'var(--accent-coral)', size = 120, rot = 0) {
  return `<svg class="doodle" width="${size}" height="${size}" viewBox="0 0 100 100" style="transform:rotate(${rot}deg)">
    <path d="M50 85 C 20 62, 10 40, 25 25 C 40 12, 50 28, 50 35 C 50 28, 60 12, 75 25 C 90 40, 80 62, 50 85 Z"
      fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" />
  </svg>`;
}

function svgStar(color = 'var(--accent-mustard)', size = 110, rot = 0) {
  return `<svg class="doodle" width="${size}" height="${size}" viewBox="0 0 100 100" style="transform:rotate(${rot}deg)">
    <path d="M50 12 L58 42 L90 45 L64 62 L72 92 L50 74 L28 92 L36 62 L10 45 L42 42 Z"
      fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" />
  </svg>`;
}

function svgSparkle(color = 'var(--accent-mustard)', size = 90, rot = 0) {
  return `<svg class="doodle" width="${size}" height="${size}" viewBox="0 0 100 100" style="transform:rotate(${rot}deg)">
    <path d="M50 8 L54 44 L90 50 L54 56 L50 92 L46 56 L10 50 L46 44 Z"
      fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" />
  </svg>`;
}

function scatterDoodles(target) {
  const scatter = document.createElement('div');
  scatter.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  scatter.innerHTML = `
    <div style="position:absolute;top:5%;right:7%;">${svgHeart('var(--accent-coral)', 140, 12)}</div>
    <div style="position:absolute;bottom:8%;left:6%;">${svgHeart('var(--accent-coral-light)', 110, -20)}</div>
    <div style="position:absolute;top:10%;left:7%;">${svgStar('var(--accent-mustard)', 100, -10)}</div>
    <div style="position:absolute;bottom:14%;right:9%;">${svgSparkle('var(--accent-mustard)', 82, 24)}</div>
  `;
  target.appendChild(scatter);
}

function renderHeadline(data) {
  const el = document.createElement('div');
  el.className = 'tpl-headline';
  const parts = [];
  if (data.eyebrow) parts.push(`<div class="eyebrow">${data.eyebrow}</div>`);
  if (data.headline) parts.push(`<div class="headline">${data.headline}</div>`);
  if (data.body) parts.push(`<div class="body">${data.body}</div>`);
  if (data.tag) parts.push(`<div class="tag">${data.tag}</div>`);
  el.innerHTML = parts.join('');
  return el;
}

function renderQuiz(data) {
  const el = document.createElement('div');
  el.className = 'tpl-quiz';
  const optA = (data.options && data.options[0]) || 'option a';
  const optB = (data.options && data.options[1]) || 'option b';
  el.innerHTML = `
    <div class="paper tape-top question-card">
      ${data.qLabel ? `<div class="q-label">${data.qLabel}</div>` : ''}
      <div class="q-text">${data.question || ''}</div>
    </div>
    <div class="options">
      <div class="paper option coral">${optA}</div>
      <div class="paper option blue">${optB}</div>
    </div>
    ${data.footer ? `<div class="footer">${data.footer}</div>` : ''}
  `;
  return el;
}

function renderQuote(data) {
  const el = document.createElement('div');
  el.className = 'tpl-quote';
  el.innerHTML = `
    <div class="mark">&ldquo;</div>
    <div class="quote">${data.quote || ''}</div>
    ${data.attribution ? `<div class="attribution">${data.attribution}</div>` : ''}
  `;
  return el;
}

function renderStat(data) {
  const el = document.createElement('div');
  el.className = 'tpl-stat';
  el.innerHTML = `
    ${data.eyebrow ? `<div class="eyebrow">${data.eyebrow}</div>` : ''}
    <div class="number">${data.number || ''}</div>
    ${data.label ? `<div class="label">${data.label}</div>` : ''}
  `;
  return el;
}

function renderList(data) {
  const el = document.createElement('div');
  el.className = 'tpl-list';
  if ((data.items || []).length >= 6) el.classList.add('dense');
  const items = (data.items || []).map(i => `<div class="item">${i}</div>`).join('');
  el.innerHTML = `
    ${data.title ? `<div class="title">${data.title}</div>` : ''}
    ${items}
    ${data.footer ? `<div class="footer">${data.footer}</div>` : ''}
  `;
  return el;
}

function renderCover(data) {
  const el = document.createElement('div');
  el.className = 'tpl-cover';
  el.innerHTML = `
    ${data.eyebrow ? `<div class="eyebrow">${data.eyebrow}</div>` : ''}
    <div class="title">${data.title || ''}</div>
    ${data.subtitle ? `<div class="subtitle">${data.subtitle}</div>` : ''}
    ${data.swipe !== false ? `<div class="swipe-cue">${data.swipeText || 'swipe →'}</div>` : ''}
  `;
  return el;
}

const TEMPLATES = {
  headline: renderHeadline,
  quiz: renderQuiz,
  quote: renderQuote,
  stat: renderStat,
  list: renderList,
  cover: renderCover,
};

function renderPost(post) {
  stage.innerHTML = '';
  const fn = TEMPLATES[post.template];
  if (!fn) {
    stage.innerHTML = `<div style="padding:40px;color:red;">Unknown template: ${post.template}</div>`;
    return;
  }
  stage.appendChild(fn(post.data || {}));
  scatterDoodles(stage);
  const brand = document.createElement('div');
  brand.className = 'brand-mark';
  brand.textContent = post.brand || 'theusquiz.com';
  stage.appendChild(brand);
}

async function load() {
  if (testMode) {
    renderPost({
      id: 'test',
      template: 'headline',
      data: {
        eyebrow: 'the couples quiz',
        headline: 'you know their <span class="accent-coral-word">coffee order</span>.<br/>do you know <span class="accent-blue-word">the rest?</span>',
        body: 'a quiz built for couples who text more than they touch.',
        tag: '→ theusquiz.com',
      },
    });
    window.__IG_READY__ = true;
    return;
  }
  const res = await fetch('./posts.json');
  const { posts } = await res.json();
  const post = posts.find(p => p.id === postId);
  if (!post) {
    stage.innerHTML = `<div style="padding:40px;color:red;">post ${postId} not found</div>`;
    return;
  }
  renderPost(post);
  window.__IG_READY__ = true;
}

load();
