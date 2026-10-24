// Deals a few items at a time from a shuffled deck, so no item repeats until
// every item has been shown. The deck persists across visits in localStorage.
function setupShuffle(opts) {
  var items = opts.items || [];
  var box = opts.box;
  if (!items.length || !box) return function () { return []; };

  var total = items.length;
  var perDraw = Math.min(opts.perDraw, total);
  var deck = load();

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // New cycle of every item. Items already in the current draw are kept
  // out of the first `skip` slots so a draw never shows the same item twice.
  function newCycle(current, skip) {
    var rest = [];
    for (var i = 0; i < total; i++) if (current.indexOf(i) < 0) rest.push(i);
    shuffle(rest);
    current.forEach(function (id) {
      var at = skip + Math.floor(Math.random() * (rest.length - skip + 1));
      rest.splice(at, 0, id);
    });
    return rest;
  }

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(opts.key));
      if (saved && saved.total === total && Array.isArray(saved.deck) &&
          saved.deck.every(function (id) { return id >= 0 && id < total; })) {
        return saved.deck;
      }
    } catch (e) {}
    return [];
  }

  function save() {
    try { localStorage.setItem(opts.key, JSON.stringify({ total: total, deck: deck })); } catch (e) {}
  }

  function draw() {
    var picked = deck.splice(0, perDraw);
    if (picked.length < perDraw) {
      var need = perDraw - picked.length;
      deck = newCycle(picked, need);
      picked = picked.concat(deck.splice(0, need));
    }
    save();
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
