/* ===== Связь планера с «Утром» =====
   Отправляет задачи планера на сервер «Утра», чтобы утренний брифинг их зачитывал.
   Подключается одной строкой перед </body> в index.html:
     <script src="utro-sync.js"></script>
   При первом запуске спросит ключ — его присылает Telegram-бот «Утра» по команде /planner.
   Ключ хранится только на этом устройстве. Им можно лишь отправить задачи, прочитать брифинг нельзя. */
(function () {
  var URL = 'https://concierge-vl.ru/utro/planner';
  var K = 'planner.utro.key', OFF = 'planner.utro.off';
  var timer = null;

  function ls(get, k, v) {
    try { if (get) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }
    catch (e) { return null; }
  }

  function askKey() {
    if (ls(true, K) || ls(true, OFF)) return;
    var k = prompt('Связать планер с «Утром»?\n\nВставь ключ из Telegram-бота (команда /planner).\nОтмена — больше не спрашивать.');
    if (k && k.trim()) { ls(false, K, k.trim()); push(); if (typeof toast === 'function') toast('Планер связан с «Утром»'); }
    else ls(false, OFF, '1');
  }

  function push() {
    var key = ls(true, K);
    if (!key || typeof S === 'undefined') return;
    var tasks = (S.tasks || []).map(function (t) {
      return { title: t.title, date: t.date, time: t.time, prio: t.prio, done: t.done, tag: t.tag, repeat: t.repeat };
    });
    fetch(URL + '?k=' + encodeURIComponent(key), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tasks: tasks })
    }).then(function (r) {
      if (r.status === 403) { ls(false, K, null); ls(false, OFF, null); if (typeof toast === 'function') toast('Ключ «Утра» не подошёл'); }
    }).catch(function () {});
  }

  if (typeof save === 'function') {
    var orig = save;
    save = function () { var res = orig.apply(this, arguments); clearTimeout(timer); timer = setTimeout(push, 3000); return res; };
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) push(); });
  // Сбросить связь: открыть планер с #utro-reset
  if (location.hash === '#utro-reset') { ls(false, K, null); ls(false, OFF, null); history.replaceState(null, '', location.pathname); }
  setTimeout(function () { askKey(); push(); }, 1500);
})();
