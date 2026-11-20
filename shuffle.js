// Shows a few items at a time, always choosing the items this viewer has seen
// the fewest times (ties broken at random). So no item is shown n + 1 times
// before every item has been shown n times. Counts are saved in localStorage
// and keyed by each item's text, so removing or reordering items never resets
// or scrambles a viewer's progress. A new item (or one whose text was edited)
// joins at the viewer's current lowest count, so it turns up once in the
// current round instead of being shown on every draw until it catches up.
// Items from the previous draw are picked last among ties, so a new round
// doesn't open by repeating what was just on screen.
function setupShuffle(opts) {
  var items = opts.items || [];
  var box = opts.box;
  if (!items.length || !box) return function () { return []; };

  var perDraw = Math.min(opts.perDraw, items.length);

  function keyOf(item) { return item.text; }

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(opts.key));
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) return saved;
    } catch (e) {}
    return {};
  }

  function loadLast() {
    try {
      var saved = JSON.parse(localStorage.getItem(opts.key + ':last'));
      if (Array.isArray(saved)) return saved;
    } catch (e) {}
    return [];
  }

  function save(counts, lastShown) {
    // Only keep counts for items that still exist.
    var kept = {};
    items.forEach(function (item) { kept[keyOf(item)] = counts[keyOf(item)]; });
    try {
      localStorage.setItem(opts.key, JSON.stringify(kept));
      localStorage.setItem(opts.key + ':last', JSON.stringify(lastShown));
    } catch (e) {}
  }

  function draw() {
    // Re-read on every draw so several open tabs share one tally.
    var counts = load();
    var last = loadLast();

    // Items with no saved count start at the lowest count among known items.
    var floor = Infinity;
    items.forEach(function (item) {
      var c = counts[keyOf(item)];
      if (typeof c === 'number' && c < floor) floor = c;
    });
    if (floor === Infinity) floor = 0;
    items.forEach(function (item) {
      if (typeof counts[keyOf(item)] !== 'number') counts[keyOf(item)] = floor;
    });

    var order = items.map(function (item, id) {
      return {
        id: id,
        count: counts[keyOf(item)],
        justShown: last.indexOf(keyOf(item)) >= 0 ? 1 : 0,
        tiebreak: Math.random()
      };
    });
    order.sort(function (a, b) {
      return a.count - b.count || a.justShown - b.justShown || a.tiebreak - b.tiebreak;
    });
    var picked = order.slice(0, perDraw).map(function (o) { return o.id; });

    picked.forEach(function (id) { counts[keyOf(items[id])] += 1; });
    save(counts, picked.map(function (id) { return keyOf(items[id]); }));

    box.innerHTML = '';
    var shown = picked.slice();
    if (opts.order) shown.sort(function (a, b) { return opts.order(items[a], items[b]); });
    shown.forEach(function (id) { box.appendChild(opts.render(items[id])); });
    return picked;
  }

  if (opts.button) opts.button.addEventListener('click', draw);
  draw();
  return draw;
}

function renderQuote(q) {
  var card = document.createElement('div');
  card.className = 'quote-card';
  card.innerHTML = '<blockquote>"' + q.text + '"</blockquote><cite>' + q.cite + '</cite>';
  return card;
}

function renderMemory(m) {
  var el = document.createElement('div');
  el.className = 'memory';
  el.innerHTML = '<time datetime="' + m.datetime + '">' + m.date + '</time><p>' + m.text + '</p>';
  return el;
}

// Most recent memory first.
function byNewest(a, b) {
  return a.datetime < b.datetime ? 1 : a.datetime > b.datetime ? -1 : 0;
}
