/* NonSense Repacks — на клиенте осталось только то, что действительно
   нужно на клиенте. Сами страницы генерируются заранее (site_build.py),
   поэтому и поисковик, и человек без JavaScript видят весь текст. */

/* --------------------------------------------------------- поиск в каталоге */

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

// Названия игр латиницей, а ищут их часто кириллицей: «амонг» вместо «among».
const simplify = (text) => String(text ?? '')
  .toLowerCase()
  .replace(/[а-яё]/g, (c) => TRANSLIT[c] ?? c)
  .replace(/[^a-z0-9]/g, '');

const search = document.getElementById('search');
const grid = document.getElementById('grid');

if (search && grid) {
  const cards = [...grid.querySelectorAll('.card')];
  const counter = document.getElementById('count');
  const nothing = document.getElementById('nothing');

  search.addEventListener('input', () => {
    const key = simplify(search.value);
    let shown = 0;

    cards.forEach((card) => {
      const hit = !key || card.dataset.key.includes(key);
      card.hidden = !hit;
      if (hit) shown += 1;
    });

    counter.textContent = key ? `найдено: ${shown}` : `всего: ${cards.length}`;
    nothing.hidden = shown > 0;
    grid.hidden = shown === 0;
  });
}

/* ------------------------------------------------------ скриншот во весь экран */

document.addEventListener('click', (event) => {
  const shot = event.target.closest('.shots img');
  if (shot) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    const full = document.createElement('img');
    full.src = shot.src;
    box.appendChild(full);
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
