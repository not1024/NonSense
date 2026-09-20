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

/* ------------------------------------------------------------- копирование

   Отпечаток ключа и адрес кошелька переписывать руками невозможно —
   сорок символов без единой ошибки никто не наберёт.                         */

document.addEventListener('click', async (event) => {
  const button = event.target.closest('.copy');
  if (!button) return;

  try {
    await navigator.clipboard.writeText(button.dataset.copy || '');
    const was = button.title;
    button.classList.add('done');
    button.title = 'Скопировано';
    setTimeout(() => {
      button.classList.remove('done');
      button.title = was;
    }, 1500);
  } catch {
    // Буфер обмена доступен не везде — по http и в старых браузерах его нет.
    // Тогда просто выделяем текст, чтобы скопировать вручную.
    const code = button.parentElement?.querySelector('code');
    if (code) getSelection().selectAllChildren(code);
  }
});

/* --------------------------------------------------- музыка из установщика

   Плеер подгружается только по клику. Обычный встроенный ролик тянет около
   мегабайта скриптов и ставит счётчики каждому, кто просто открыл страницу, —
   за песню, которую он, может, и слушать не собирался.                       */

document.querySelector('.tune')?.addEventListener('click', function load() {
  const frame = document.createElement('iframe');
  frame.src = `https://www.youtube-nocookie.com/embed/${this.dataset.video}`
    + '?autoplay=1&rel=0';
  frame.title = 'Aphex Twin — Xtal';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture';
  frame.allowFullscreen = true;
  this.replaceChildren(frame);
}, { once: true });

/* ------------------------------------------------- проверка скачанного файла

   Считаем SHA-256 прямо здесь и сравниваем с тем, что записано на странице.
   Файл читается с диска локально и никуда не уходит — это важно и человеку
   про это написано прямо в разметке.

   Смысл проверки в том, что эталон берётся с сайта, а не из раздачи: тот,
   кто перезалил репак, правит торрент, но не эту страницу.                  */

const verify = document.getElementById('verify');

if (verify && window.crypto?.subtle) {
  const verdict = document.getElementById('verdict');
  const known = JSON.parse(verify.dataset.known || '{}');
  // Список отпечатков и подпись отпечатка не имеют — по природе вещей.
  // Без этой оговорки страница обвиняла собственные файлы в подделке.
  const special = JSON.parse(verify.dataset.special || '{}');

  const say = (text, kind) => {
    verdict.textContent = text;
    verdict.className = `verdict ${kind}`;
    verdict.hidden = false;
  };

  const digest = async (file) => {
    const buffer = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(hash)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const check = async (file) => {
    if (special[file.name]) {
      say(`«${file.name}» отпечатком не проверяется. ${special[file.name]}`, 'warn');
      return;
    }

    // Гигабайтные .bin браузер читает целиком в память. Про setup.exe этого
    // достаточно: он маленький и ручается за остальные файлы раздачи.
    if (file.size > 1_500_000_000) {
      say('Файл слишком большой для проверки в браузере. Проверьте setup.exe — '
        + 'если он настоящий, чужие .bin он не примет.', 'warn');
      return;
    }

    say(`Считаю отпечаток «${file.name}», это может занять время…`, 'wait');
    try {
      const hash = await digest(file);
      if (known[hash]) {
        const same = known[hash] === file.name;
        say(same
          ? `✓ Это настоящий «${file.name}» из моей раздачи`
          : `✓ Файл настоящий — у меня он называется «${known[hash]}»`, 'ok');
      } else {
        say(`✗ «${file.name}» не совпадает ни с одним файлом этой раздачи. `
          + 'Либо файл побился при скачивании, либо это не мой репак.', 'bad');
      }
    } catch (error) {
      say(`Не вышло прочитать файл: ${error.message}`, 'warn');
    }
  };

  ['dragenter', 'dragover'].forEach((name) => {
    verify.addEventListener(name, (event) => {
      event.preventDefault();
      verify.classList.add('over');
    });
  });

  ['dragleave', 'drop'].forEach((name) => {
    verify.addEventListener(name, () => verify.classList.remove('over'));
  });

  verify.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) check(file);
  });

  // Перетаскивание работает не у всех — на телефоне его нет вовсе.
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.hidden = true;
  picker.addEventListener('change', () => {
    if (picker.files[0]) check(picker.files[0]);
  });
  verify.appendChild(picker);
  verify.addEventListener('click', () => picker.click());
}
