/* NonSense Repacks — весь сайт на одном файле.
   Данные лежат в data/releases.json, его генерирует Repack Studio.
   Маршруты через хеш: GitHub Pages не умеет переписывать адреса,
   а «#/» работает везде и не ломается при обновлении страницы. */

const view = document.getElementById('view');
const search = document.getElementById('search');

let releases = [];
let query = '';

/* ------------------------------------------------------------- утилиты */

const esc = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// Названия игр латиницей, а ищут их часто кириллицей: «амонг» вместо
// «among». Приводим и запрос, и название к латинице — тогда совпадёт.
const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const simplify = (text) => String(text ?? '')
  .toLowerCase()
  .replace(/[а-яё]/g, (c) => TRANSLIT[c] ?? c)
  .replace(/[^a-z0-9]/g, '');

function versionLabel(release) {
  const parts = [];
  if (release.version) parts.push('v' + release.version);
  if (release.revision > 1) parts.push('репак r' + release.revision);
  return parts.join(' · ');
}

/* ------------------------------------------------------------- каталог */

function catalogView() {
  const found = releases.filter((r) => {
    if (!query) return true;
    const key = simplify(query);
    return simplify(r.title).includes(key) || simplify(r.slug).includes(key);
  });

  if (!releases.length) {
    return `<p class="empty">Пока ни одного репака. Скоро появятся.</p>`;
  }
  if (!found.length) {
    return `<h2 class="section-title">Репаки</h2>
            <p class="empty">По запросу «${esc(query)}» ничего не нашлось.</p>`;
  }

  const cards = found.map((r) => {
    const size = r.sizes?.repack ? `<span class="tag solid">${esc(r.sizes.repack)}</span>` : '';
    const genres = (r.genres || []).slice(0, 2)
      .map((g) => `<span class="tag">${esc(g)}</span>`).join('');
    const cover = r.cover
      ? `<img class="cover" src="${esc(r.cover)}" alt="" loading="lazy">`
      : `<div class="cover"></div>`;

    return `<a class="card" href="#/r/${esc(r.slug)}">
      ${cover}
      <div class="body">
        <h3>${esc(r.title)}</h3>
        <div class="muted" style="font-size:13px">${esc(versionLabel(r))}</div>
        <div class="line">${size}${genres}</div>
      </div>
    </a>`;
  }).join('');

  const counter = query ? `<span>найдено: ${found.length}</span>`
                        : `<span>всего: ${releases.length}</span>`;
  return `<h2 class="section-title">Репаки ${counter}</h2>
          <div class="grid">${cards}</div>`;
}

/* ------------------------------------------------------------- релиз */

function releaseView(slug) {
  const r = releases.find((item) => item.slug === slug);
  if (!r) {
    return `<a class="back" href="#/">← ко всем репакам</a>
            <p class="empty">Такого репака нет.</p>`;
  }

  const facts = [
    ['Разработчик', r.developer],
    ['Издатель', r.publisher],
    ['Вышла', r.released],
    ['Жанр', (r.genres || []).join(', ')],
    ['Оригинал', r.sizes?.original],
    ['Репак', r.sizes?.repack],
  ].filter(([, value]) => value)
   .map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`)
   .join('');

  const magnet = r.downloads?.magnet
    ? `<a class="btn primary" href="${esc(r.downloads.magnet)}">Скачать торрент</a>`
    : `<span class="btn primary off">Ссылка скоро появится</span>`;

  const mirrors = (r.downloads?.mirrors || [])
    .map((m) => `<a class="btn" href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.label)}</a>`)
    .join('');

  const store = r.store
    ? `<a class="btn" href="${esc(r.store)}" target="_blank" rel="noopener">Купить в Steam</a>`
    : '';

  const features = (r.features || []).length
    ? `<div class="block"><h2>Что в репаке</h2>
         <ul class="features">${r.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
       </div>`
    : '';

  const reqBlock = (title, list) => (list || []).length
    ? `<section><h3>${title}</h3><ul>${list.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></section>`
    : '';

  const reqs = (r.requirements?.minimum || r.requirements?.recommended)
    ? `<div class="block"><h2>Системные требования</h2>
         <div class="reqs">
           ${reqBlock('Минимальные', r.requirements.minimum)}
           ${reqBlock('Рекомендуемые', r.requirements.recommended)}
         </div>
       </div>`
    : '';

  const shots = (r.screenshots || []).length
    ? `<div class="block"><h2>Скриншоты</h2>
         <div class="shots">${r.screenshots
           .map((s) => `<img src="${esc(s)}" alt="" loading="lazy">`).join('')}</div>
       </div>`
    : '';

  return `<a class="back" href="#/">← ко всем репакам</a>
    <div class="release-head">
      ${r.cover ? `<img src="${esc(r.cover)}" alt="">` : '<div></div>'}
      <div>
        <h1>${esc(r.title)}</h1>
        <p class="sub">${esc(versionLabel(r))}</p>
        ${r.description ? `<p class="desc">${esc(r.description)}</p>` : ''}
        <dl class="facts">${facts}</dl>
        <div class="downloads">${magnet}${mirrors}${store}</div>
      </div>
    </div>
    ${features}${reqs}${shots}`;
}

/* ------------------------------------------------------------- about */

function aboutView() {
  return `<div class="prose">
    <h1>О репаках</h1>
    <p>Это небольшая коллекция репаков от NonSense. Игры собраны так, чтобы их
       можно было поставить и играть, не разбираясь в кряках и патчах.</p>

    <p>Что именно сделано с конкретной игрой — написано на её странице
       в разделе «Что в репаке». У каждого репака это своё.</p>

    <h2>Как ставить</h2>
    <ul>
      <li>Скачай раздачу целиком: <code>setup.exe</code> и все файлы рядом с ним.</li>
      <li>Запусти <code>setup.exe</code> и следуй шагам.</li>
      <li>Если антивирус ругается на кряк — это ожидаемо, решай сам.</li>
    </ul>

    <h2>Честно про деньги</h2>
    <p>Репаки бесплатные, донатов нет. Если игра понравилась — купите её,
       разработчики этого заслуживают. Ссылка на магазин есть на странице
       каждого репака.</p>
  </div>`;
}

/* ------------------------------------------------------------- маршруты */

function render() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [section, slug] = hash.split('/');

  let html;
  let active = 'catalog';
  if (section === 'about') {
    html = aboutView();
    active = 'about';
  } else if (section === 'r' && slug) {
    html = releaseView(decodeURIComponent(slug));
  } else {
    html = catalogView();
  }

  view.innerHTML = html;
  document.querySelectorAll('.nav a').forEach((link) => {
    link.classList.toggle('active', link.dataset.route === active);
  });
  // Поиск нужен только в каталоге — на странице релиза он сбивает с толку.
  search.parentElement.style.visibility = active === 'catalog' ? 'visible' : 'hidden';
  window.scrollTo(0, 0);
}

search.addEventListener('input', () => {
  query = search.value.trim();
  // Если человек начал искать не из каталога — возвращаем его в каталог,
  // hashchange сам вызовет отрисовку.
  if (!/^#\/?$/.test(location.hash || '#/')) {
    location.hash = '#/';
    return;
  }
  render();
});

window.addEventListener('hashchange', render);

// Скриншот по клику разворачивается на весь экран.
document.addEventListener('click', (event) => {
  const shot = event.target.closest('.shots img');
  if (shot) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = `<img src="${shot.src}" alt="">`;
    box.addEventListener('click', () => box.remove());
    document.body.appendChild(box);
    return;
  }
  const open = document.querySelector('.lightbox');
  if (open && !event.target.closest('.lightbox')) open.remove();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') document.querySelector('.lightbox')?.remove();
});

fetch('data/releases.json', { cache: 'no-cache' })
  .then((response) => response.json())
  .then((payload) => { releases = payload.releases || []; })
  .catch(() => { releases = []; })
  .finally(render);
