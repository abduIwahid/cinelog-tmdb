'use strict';
/*
 * CineLog — movie finder + watchlist on the TMDB API. Vanilla JS.
 * Token by design: the visitor's own free TMDB Read Access Token, pasted
 * into the setup panel, stored ONLY in localStorage, sent ONLY to
 * api.themoviedb.org as `Authorization: Bearer <token>`. No token exists
 * anywhere in this codebase.
 * API response -> mapper (mapMovie / mapMovieDetail) -> state -> render.
 * Pagination: IntersectionObserver infinite scroll; stops at total_pages
 * (TMDB also hard-caps page at 500).
 */
const API = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';
const LS_TOKEN = 'cinelog:token';
const LS_WATCHLIST = 'cinelog:watchlist';
const PAGE_CAP = 500;

const state = {
  mode: 'trending',        // 'trending' | 'search'
  query: '',
  genreId: null,
  genres: new Map(),       // id -> name
  page: 0,
  totalPages: 1,
  loading: false,
  view: 'all',             // 'all' | 'watchlist'
  movies: [],              // mapped movies currently displayed (all view)
  listController: null,
};

const el = {
  setup: document.getElementById('setup-panel'),
  setupError: document.getElementById('setup-error'),
  tokenInput: document.getElementById('token-input'),
  app: document.getElementById('app-panel'),
  search: document.getElementById('search-input'),
  clearSearch: document.getElementById('clear-search'),
  genreChips: document.getElementById('genre-chips'),
  heading: document.getElementById('list-heading'),
  status: document.getElementById('status-region'),
  grid: document.getElementById('grid'),
  empty: document.getElementById('empty-state'),
  emptyTitle: document.getElementById('empty-title'),
  emptyText: document.getElementById('empty-text'),
  error: document.getElementById('error-state'),
  errorText: document.getElementById('error-text'),
  sentinel: document.getElementById('scroll-sentinel'),
  endNote: document.getElementById('end-note'),
  viewAll: document.getElementById('view-all'),
  viewWatchlist: document.getElementById('view-watchlist'),
  overlay: document.getElementById('detail-overlay'),
  detailBody: document.getElementById('detail-body'),
  offline: document.getElementById('offline-banner'),
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
function getToken() {
  try { return localStorage.getItem(LS_TOKEN) || ''; } catch (e) { return ''; }
}

/* ---------- watchlist (localStorage) ---------- */
function getWatchlist() {
  try { return JSON.parse(localStorage.getItem(LS_WATCHLIST) || '[]'); } catch (e) { return []; }
}
function setWatchlist(list) {
  try { localStorage.setItem(LS_WATCHLIST, JSON.stringify(list)); } catch (e) { /* ignore */ }
}
function inWatchlist(id) { return getWatchlist().some((m) => m.id === id); }
function toggleWatchlist(movie) {
  const list = getWatchlist();
  const idx = list.findIndex((m) => m.id === movie.id);
  if (idx >= 0) list.splice(idx, 1); else list.unshift(movie);
  setWatchlist(list);
  refreshWatchlistButtons();
  if (state.view === 'watchlist') renderWatchlist();
}
function refreshWatchlistButtons() {
  document.querySelectorAll('[data-watchlist-id]').forEach((b) => {
    const id = Number(b.dataset.watchlistId);
    b.textContent = inWatchlist(id) ? 'In watchlist ✓' : '+ Watchlist';
  });
}

/* ---------- mapper layer ---------- */
function mapMovie(raw) {
  return {
    id: raw.id,
    title: raw.title || 'Untitled',
    year: raw.release_date ? raw.release_date.slice(0, 4) : '—',
    rating: typeof raw.vote_average === 'number' ? raw.vote_average.toFixed(1) : '—',
    posterUrl: raw.poster_path ? IMG + raw.poster_path : null, // null -> placeholder block
    genreNames: (raw.genre_ids || []).map((id) => state.genres.get(id)).filter(Boolean),
    overview: raw.overview || '',
  };
}
function mapMovieDetail(raw) {
  const base = {
    id: raw.id,
    title: raw.title || 'Untitled',
    year: raw.release_date ? raw.release_date.slice(0, 4) : '—',
    rating: typeof raw.vote_average === 'number' ? raw.vote_average.toFixed(1) : '—',
    posterUrl: raw.poster_path ? IMG + raw.poster_path : null,
    genreNames: (raw.genres || []).map((g) => g.name),
    overview: raw.overview || 'No overview available.',
  };
  const credits = raw.credits || {};
  const cast = (credits.cast || []).slice(0, 5).map((c) => ({ name: c.name, character: c.character || '' }));
  const videos = raw.videos || {};
  const trailer = (videos.results || []).find((v) => v.site === 'YouTube' && v.type === 'Trailer') || null;
  return Object.assign(base, {
    runtime: raw.runtime || null,
    cast,
    trailerKey: trailer ? trailer.key : null,
  });
}

/* ---------- TMDB fetch ---------- */
async function tmdb(path, signal) {
  const res = await fetch(API + path, {
    headers: { 'Authorization': 'Bearer ' + getToken(), 'Accept': 'application/json' },
    signal: signal || undefined,
  });
  if (res.status === 401) {
    const err = new Error('TMDB rejected the token (401).');
    err.status = 401;
    throw err;
  }
  if (res.status === 429) {
    const err = new Error('TMDB rate limit (429). Wait a few seconds and try again.');
    err.status = 429;
    throw err;
  }
  if (!res.ok) {
    const err = new Error('TMDB request failed (HTTP ' + res.status + ').');
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/* ---------- list loading (trending / search) ---------- */
function listPath(page) {
  if (state.mode === 'search') {
    return '/search/movie?query=' + encodeURIComponent(state.query) + '&page=' + page;
  }
  return '/trending/movie/week?page=' + page;
}
async function loadFirstPage() {
  if (state.listController) state.listController.abort();
  state.listController = new AbortController();
  state.page = 0;
  state.movies = [];
  el.grid.innerHTML = '';
  el.endNote.hidden = true;
  hideStates();
  showSkeletons(8);
  el.status.textContent = state.mode === 'search' ? 'Searching for "' + state.query + '"…' : 'Loading trending movies…';
  await loadNextPage(true);
}
async function loadNextPage(first) {
  if (state.loading) return;
  if (state.page >= Math.min(state.totalPages, PAGE_CAP) && !first) return;
  state.loading = true;
  try {
    const data = await tmdb(listPath(state.page + 1), state.listController ? state.listController.signal : undefined);
    state.page = data.page;
    state.totalPages = data.total_pages;
    const mapped = data.results.map((raw) => {
      const m = mapMovie(raw);
      m.genreIds = raw.genre_ids || [];
      return m;
    });
    state.movies.push(...mapped);
    if (first) el.grid.innerHTML = '';
    appendCards(mapped);
    applyGenreVisibility();
    const done = state.page >= Math.min(state.totalPages, PAGE_CAP);
    el.endNote.hidden = !done || state.movies.length === 0;
    el.status.textContent = state.movies.length + ' movies loaded.';
  } catch (err) {
    if (err.name === 'AbortError') { state.loading = false; return; }
    if (first) el.grid.innerHTML = '';
    if (err.status === 401) {
      showError('TMDB rejected the saved token (401). Use "Change token" to paste a valid Read Access Token.');
    } else {
      showError(err.message + ' Check your connection and try again.');
    }
    el.status.textContent = '';
  }
  state.loading = false;
}
function applyGenreVisibility() {
  const cards = el.grid.children;
  let visible = 0;
  for (const card of cards) {
    const id = Number(card.dataset.movieId);
    const movie = state.movies.find((m) => m.id === id);
    const show = !state.genreId || (movie && movie.genreIds.includes(state.genreId));
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  }
  if (state.movies.length > 0 && visible === 0) {
    el.emptyTitle.textContent = 'No movies in this genre yet';
    el.emptyText.textContent = 'None of the loaded movies match the selected genre. Scroll to load more, or clear the genre filter.';
    el.empty.hidden = false;
  } else {
    el.empty.hidden = true;
    if (state.movies.length === 0 && !state.loading) {
      el.emptyTitle.textContent = 'No movies found';
      el.emptyText.textContent = 'Nothing matches that search. Try a different title.';
      el.empty.hidden = false;
    }
  }
}

/* ---------- render ---------- */
function hideStates() { el.empty.hidden = true; el.error.hidden = true; }
function showError(msg) {
  hideStates();
  el.errorText.textContent = msg;
  el.error.hidden = false;
}
function showSkeletons(n) {
  el.grid.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'skeleton';
    d.innerHTML = '<div class="skel-poster"></div><div class="skel-line"></div><div class="skel-line short"></div>';
    el.grid.appendChild(d);
  }
}
function posterHtml(m, cls) {
  if (m.posterUrl) return '<img class="' + cls + '" src="' + esc(m.posterUrl) + '" alt="Poster for ' + esc(m.title) + '" loading="lazy">';
  return '<div class="poster-placeholder" aria-label="No poster available for ' + esc(m.title) + '">' + esc(m.title) + '</div>';
}
function cardHtml(m) {
  return '<button type="button" class="poster-btn" data-open-id="' + m.id + '" aria-label="View details for ' + esc(m.title) + '">' +
    posterHtml(m, 'poster') + '</button>' +
    '<div class="card-body">' +
    '<p class="card-title">' + esc(m.title) + '</p>' +
    '<p class="card-meta">' + esc(m.year) + '</p>' +
    (m.genreNames.length ? '<p class="card-genres">' + esc(m.genreNames.slice(0, 3).join(' · ')) + '</p>' : '') +
    '<p class="card-rating">★ ' + esc(m.rating) + '</p>' +
    '<div class="card-actions">' +
    '<button type="button" class="btn btn-secondary btn-small" data-watchlist-id="' + m.id + '">' + (inWatchlist(m.id) ? 'In watchlist ✓' : '+ Watchlist') + '</button>' +
    '</div></div>';
}
function appendCards(movies) {
  for (const m of movies) {
    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.movieId = m.id;
    article.innerHTML = cardHtml(m);
    el.grid.appendChild(article);
  }
  wireCardButtons(el.grid);
}
function wireCardButtons(scope) {
  scope.querySelectorAll('[data-open-id]').forEach((b) => {
    if (b.dataset.wired) return;
    b.dataset.wired = '1';
    b.addEventListener('click', () => openDetail(Number(b.dataset.openId)));
  });
  scope.querySelectorAll('[data-watchlist-id]').forEach((b) => {
    if (b.dataset.wired) return;
    b.dataset.wired = '1';
    b.addEventListener('click', () => {
      const id = Number(b.dataset.watchlistId);
      const movie = state.movies.find((m) => m.id === id) || getWatchlist().find((m) => m.id === id);
      if (movie) toggleWatchlist(movie);
    });
  });
}
function renderWatchlist() {
  const list = getWatchlist();
  el.grid.innerHTML = '';
  el.endNote.hidden = true;
  hideStates();
  if (list.length === 0) {
    el.emptyTitle.textContent = 'Your watchlist is empty';
    el.emptyText.textContent = 'Add movies with the "+ Watchlist" button and they will live here — stored only in this browser.';
    el.empty.hidden = false;
    el.status.textContent = '';
    return;
  }
  state.movies = list.slice();
  appendCards(list);
  applyGenreVisibility();
  el.status.textContent = list.length + ' movie' + (list.length > 1 ? 's' : '') + ' in your watchlist.';
}

/* ---------- genres ---------- */
async function loadGenres() {
  try {
    const data = await tmdb('/genre/movie/list');
    state.genres = new Map(data.genres.map((g) => [g.id, g.name]));
    buildGenreChips(data.genres);
  } catch (e) { /* chips are an enhancement; browsing works without them */ }
}
function buildGenreChips(genres) {
  el.genreChips.innerHTML = '';
  const all = document.createElement('button');
  all.type = 'button';
  all.className = 'chip';
  all.textContent = 'All genres';
  all.setAttribute('aria-pressed', 'true');
  all.addEventListener('click', () => setGenre(null));
  el.genreChips.appendChild(all);
  for (const g of genres) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = g.name;
    b.dataset.genreId = g.id;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => setGenre(state.genreId === g.id ? null : g.id));
    el.genreChips.appendChild(b);
  }
}
function setGenre(id) {
  state.genreId = id;
  el.genreChips.querySelectorAll('.chip').forEach((c) => {
    const cid = c.dataset.genreId ? Number(c.dataset.genreId) : null;
    c.setAttribute('aria-pressed', cid === id ? 'true' : 'false');
  });
  if (state.view === 'all') applyGenreVisibility();
  else renderWatchlist();
}

/* ---------- detail modal ---------- */
async function openDetail(id) {
  el.overlay.hidden = false;
  el.detailBody.innerHTML = '<p>Loading details…</p>';
  try {
    // One request instead of three: credits + videos ride along.
    const raw = await tmdb('/movie/' + id + '?append_to_response=credits,videos');
    const d = mapMovieDetail(raw);
    const castHtml = d.cast.length
      ? '<ul class="cast-list">' + d.cast.map((c) => '<li><b>' + esc(c.name) + '</b>' + (c.character ? ' as ' + esc(c.character) : '') + '</li>').join('') + '</ul>'
      : '<p>No cast data.</p>';
    const trailerHtml = d.trailerKey
      ? '<h3>Trailer</h3><iframe class="trailer-frame" src="https://www.youtube.com/embed/' + esc(d.trailerKey) + '" title="Trailer for ' + esc(d.title) + '" allowfullscreen></iframe>'
      : '<p>No YouTube trailer available.</p>';
    el.detailBody.innerHTML =
      '<div class="detail-layout"><div>' + posterHtml(d, 'poster') + '</div>' +
      '<div><h2 id="detail-title">' + esc(d.title) + '</h2>' +
      '<p class="detail-meta">' + esc(d.year) + (d.runtime ? ' · ' + d.runtime + ' min' : '') + ' · ★ ' + esc(d.rating) + '/10' +
      (d.genreNames.length ? ' · ' + esc(d.genreNames.join(' · ')) : '') + '</p>' +
      '<p class="detail-overview">' + esc(d.overview) + '</p>' +
      '<button type="button" class="btn" data-watchlist-id="' + d.id + '">' + (inWatchlist(d.id) ? 'In watchlist ✓' : '+ Watchlist') + '</button>' +
      '<h3>Top cast</h3>' + castHtml +
      trailerHtml +
      '</div></div>';
    const wb = el.detailBody.querySelector('[data-watchlist-id]');
    wb.addEventListener('click', () => {
      const movie = state.movies.find((m) => m.id === d.id) || d;
      toggleWatchlist(movie);
      wb.textContent = inWatchlist(d.id) ? 'In watchlist ✓' : '+ Watchlist';
    });
  } catch (err) {
    el.detailBody.innerHTML = '<p>' + esc(err.message) + ' Close this and try again.</p>';
  }
}
function closeDetail() { el.overlay.hidden = true; el.detailBody.innerHTML = ''; }

/* ---------- search + view wiring ---------- */
const debouncedSearch = debounce((v) => {
  const q = v.trim();
  if (!q) {
    state.mode = 'trending';
    state.query = '';
    el.clearSearch.hidden = true;
    el.heading.textContent = 'Trending this week';
  } else {
    state.mode = 'search';
    state.query = q;
    el.clearSearch.hidden = false;
    el.heading.textContent = 'Results for "' + q + '"';
  }
  if (state.view === 'all') loadFirstPage();
}, 350);
el.search.addEventListener('input', (e) => debouncedSearch(e.target.value));
el.clearSearch.addEventListener('click', () => {
  el.search.value = '';
  debouncedSearch('');
});
document.getElementById('empty-reset').addEventListener('click', () => {
  el.search.value = '';
  setGenre(null);
  debouncedSearch('');
  if (state.view === 'watchlist') setView('all');
});
document.getElementById('error-retry').addEventListener('click', () => {
  if (state.view === 'watchlist') renderWatchlist(); else loadFirstPage();
});
function setView(view) {
  state.view = view;
  el.viewAll.setAttribute('aria-pressed', view === 'all' ? 'true' : 'false');
  el.viewWatchlist.setAttribute('aria-pressed', view === 'watchlist' ? 'true' : 'false');
  if (view === 'watchlist') {
    el.heading.textContent = 'My watchlist';
    renderWatchlist();
  } else {
    el.heading.textContent = state.mode === 'search' ? 'Results for "' + state.query + '"' : 'Trending this week';
    loadFirstPage();
  }
}
el.viewAll.addEventListener('click', () => setView('all'));
el.viewWatchlist.addEventListener('click', () => setView('watchlist'));
document.getElementById('detail-close').addEventListener('click', closeDetail);
el.overlay.addEventListener('click', (e) => { if (e.target === el.overlay) closeDetail(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });

/* Infinite scroll: load the next page when the sentinel approaches. */
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && state.view === 'all' && !state.loading) loadNextPage(false);
}, { rootMargin: '400px' });
observer.observe(el.sentinel);

/* ---------- token setup flow ---------- */
async function validateAndStart(token) {
  try { localStorage.setItem(LS_TOKEN, token); } catch (e) { /* ignore */ }
  try {
    // Cheapest authenticated call — and it doubles as the genre-map load.
    const data = await tmdb('/genre/movie/list');
    state.genres = new Map(data.genres.map((g) => [g.id, g.name]));
    buildGenreChips(data.genres);
    el.setup.hidden = true;
    el.app.hidden = false;
    el.setupError.textContent = '';
    loadFirstPage();
  } catch (err) {
    try { localStorage.removeItem(LS_TOKEN); } catch (e) { /* ignore */ }
    el.setup.hidden = false;
    el.app.hidden = true;
    el.setupError.textContent = 'That token was rejected by TMDB. Paste the "API Read Access Token" (the long one) from Settings \u2192 API and try again.';
  }
}
document.getElementById('token-save').addEventListener('click', () => {
  const v = el.tokenInput.value.trim();
  if (!v) { el.setupError.textContent = 'Paste your token first.'; return; }
  el.setupError.textContent = '';
  validateAndStart(v);
});
document.getElementById('change-token').addEventListener('click', () => {
  el.app.hidden = true;
  el.setup.hidden = false;
  el.tokenInput.value = '';
  el.setupError.textContent = '';
});

function updateOffline() { el.offline.hidden = navigator.onLine; }
window.addEventListener('online', updateOffline);
window.addEventListener('offline', updateOffline);

/* ---------- boot ---------- */
updateOffline();
if (getToken()) {
  el.setup.hidden = true;
  el.app.hidden = false;
  loadGenres().then(() => loadFirstPage());
} else {
  el.setup.hidden = false;
  el.app.hidden = true;
}
