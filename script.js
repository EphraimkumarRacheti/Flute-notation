/**
 * script.js — Flute Notation Website
 *
 * Shared JavaScript for all pages with Supabase Database integration.
 */

'use strict';

/* ============================================================
   CONFIG & SUPABASE CREDENTIALS
   ============================================================ */
const CONFIG = {
  songsDataUrl: 'songs.json',
  animationDelay: 80, // ms stagger between card animations
  // Supabase URL & Anon Key
  supabaseUrl: localStorage.getItem('flute_supabase_url') || 'https://kjmqfkhngvuvivtqmjko.supabase.co',
  supabaseKey: localStorage.getItem('flute_supabase_key') || 'sb_publishable_EN8LhNtlouiD9fkAZ8QF-g_Amo1OU0Q',
};

/* ============================================================
   INLINE SONG DATA (Local Fallback)
   ============================================================ */
/* ============================================================
   INLINE SONG DATA (Local Fallback)
   ============================================================ */
const SONGS_FALLBACK = [
  {
    "id": 1,
    "songName": "Kannuladha",
    "artist": "Anirudh Ravichander",
    "movie": "3 (Three)",
    "scale": "G Major",
    "fluteType": "Bansuri G Natural",
    "difficulty": "Beginner",
    "lyrics": [
      "Kannuladha",
      "Aasaladha",
      "Buggaladha",
      "Mudduladha"
    ],
    "notation": [
      { "line": "DA GA GA DA DA", "lyric": "Kannuladha" },
      { "line": "DA GA GA DA PA", "lyric": "Aasaladha" },
      { "line": "DA GA GA DA DA", "lyric": "Buggaladha" },
      { "line": "DA GA GA DA PA", "lyric": "Mudduladha" }
    ]
  },
  {
    "id": 2,
    "songName": "Priyatama",
    "artist": "Anirudh Ravichander",
    "movie": "3 (Three)",
    "scale": "C Major",
    "fluteType": "6-Hole Flute C Middle",
    "difficulty": "Beginner",
    "lyrics": [
      "Priyatama priyatama",
      "Palikinadi",
      "Hrudayame",
      "Sarigama"
    ],
    "notation": [
      { "line": "GA MA PA DA | GA MA PA DA", "lyric": "Priyatama priyatama" },
      { "line": "GA MA GA RI SA", "lyric": "Palikinadi" },
      { "line": "NI SA RE RE", "lyric": "Hrudayame" },
      { "line": "NI SA MA GA", "lyric": "Sarigama" }
    ]
  },
  {
    "id": 3,
    "songName": "Kesariya",
    "artist": "Arijit Singh",
    "movie": "Brahmastra",
    "scale": "C Major",
    "fluteType": "Bansuri C Middle",
    "difficulty": "Intermediate",
    "lyrics": [
      "Mujhko itna bataaye koi",
      "Kaise tujhse dil na lagaaye koi",
      "Kesariya tera ishq hai piya",
      "Rang jaaun jo main haath lagaun"
    ],
    "notation": [
      { "line": "Sa Re Ga Ma Pa | Pa Ma Ga Re Sa", "lyric": "Mujhko itna bataaye koi" },
      { "line": "Sa Re Ga Ma Pa | Pa Dha Pa Ma Ga", "lyric": "Kaise tujhse dil na lagaaye koi" },
      { "line": "Pa Dha Ni Sa' | Sa' Ni Dha Pa Ma", "lyric": "Kesariya tera ishq hai piya" },
      { "line": "Pa Dha Ni Sa' Re' | Sa' Ni Dha Pa", "lyric": "Rang jaaun jo main haath lagaun" }
    ]
  },
  {
    "id": 4,
    "songName": "River Song",
    "artist": "Hariprasad Chaurasia",
    "movie": "Flowing Waters",
    "scale": "G Major",
    "fluteType": "6-Hole Classical Bansuri",
    "difficulty": "Intermediate",
    "lyrics": [
      "Flowing waters, singing free,",
      "Dancing waves for you and me,",
      "Under skies of blue and gold,",
      "Stories by the river told."
    ],
    "notation": [
      { "line": "Pa Pa Dha | Ni Sa' Ni | Dha Pa Ma | Ga Ma Pa", "lyric": "Flow-ing wa-ters, sing-ing free," },
      { "line": "Pa Ma Ga | Re Ga Ma | Ma Ga Re | Sa -- --", "lyric": "Dan-cing waves for you and me," },
      { "line": "Sa Re Ga | Ma Pa Dha | Ni Dha Pa | Ma Ga Re", "lyric": "Un-der skies of blue and gold," },
      { "line": "Re Ma Ga | Re Sa Ni | Sa Re Ga | Sa -- --", "lyric": "Sto-ries by the ri-ver told." }
    ]
  },
  {
    "id": 5,
    "songName": "Twilight Melody",
    "artist": "Shivkumar Sharma",
    "movie": "Evening Raga",
    "scale": "D Minor",
    "fluteType": "6-Hole Bamboo Flute",
    "difficulty": "Advanced",
    "lyrics": [
      "As twilight fades and stars appear,",
      "A melody drifts soft and clear,",
      "The flute sings out across the night,",
      "Filling the world with golden light."
    ],
    "notation": [
      { "line": "Ga Ma Dha | Ni Sa' Re' | Sa' Ni Dha | Pa Ma Ga", "lyric": "As twi-light fades and stars ap-pear," },
      { "line": "Ma Ga Re | Sa Ni Dha | Pa Ma Ga | Re Sa --", "lyric": "A me-lo-dy drifts soft and clear," },
      { "line": "Sa Re Ma | Ga Ma Pa | Dha Ni Sa' | Ni Dha Pa", "lyric": "The flute sings out a-cross the night," },
      { "line": "Ma Pa Dha | Ni Sa' -- | Re' Sa' Ni | Sa' -- --", "lyric": "Fill-ing the world with gold-en light." }
    ]
  }
];

/* ============================================================
   SUPABASE CLIENT HELPERS & DATA NORMALIZATION
   ============================================================ */
let _supabaseClient = null;

function getSupabaseClient() {
  const url = localStorage.getItem('flute_supabase_url') || CONFIG.supabaseUrl;
  const key = localStorage.getItem('flute_supabase_key') || CONFIG.supabaseKey;

  if (!url || !key) return null;

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    if (!_supabaseClient || _supabaseClient._url !== url) {
      _supabaseClient = window.supabase.createClient(url, key);
      _supabaseClient._url = url;
    }
    return _supabaseClient;
  }
  return null;
}

/**
 * Execute query against candidate Supabase tables ('Songs', 'songs', 'Song', 'song', etc.)
 */
async function querySupabaseTable(client, buildQuery) {
  const candidateTables = ['Songs', 'songs', 'Song', 'song', 'flute_songs', 'flutesongs'];
  for (const tableName of candidateTables) {
    try {
      const res = await buildQuery(client.from(tableName));
      if (!res.error && res.data) {
        return res;
      }
    } catch (_e) {}
  }
  return { data: null, error: new Error('Table not found in Supabase schema.') };
}

/**
 * Normalizes database rows matching user's specific columns (case-insensitive):
 * - Id
 * - Song_name
 * - Movie
 * - Flute_type
 * - Lyrics
 * - Notations
 */
function normalizeSong(row, index) {
  if (!row) return null;

  // Case-insensitive & symbol-insensitive key dictionary
  const obj = {};
  for (const key in row) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const cleanKey = key.toLowerCase().replace(/[\s_]+/g, '');
      obj[cleanKey] = row[key];
    }
  }

  const songName = obj.songname || obj.name || obj.title || obj.song || 'Untitled Song';
  const fluteType = obj.flutetype || obj.flute || obj.type || '6-Hole Flute';
  const movie = obj.movie || obj.film || obj.album || '';
  const artist = obj.artist || obj.singer || movie || '';
  const scale = obj.scale || obj.key || 'G Major';
  const difficulty = obj.difficulty || obj.level || 'Intermediate';

  // Process raw lyrics (array or multiline string or JSON)
  let rawLyrics = obj.lyrics || obj.lyric || obj.lyricstext || obj.songlyrics || obj.words || obj.lines || [];
  let lyrics = [];
  if (typeof rawLyrics === 'string') {
    try {
      const parsed = JSON.parse(rawLyrics);
      if (Array.isArray(parsed)) lyrics = parsed;
    } catch (_e) {
      lyrics = rawLyrics.split(/\r?\n/).filter(line => line.trim() !== '');
    }
  } else if (Array.isArray(rawLyrics)) {
    lyrics = rawLyrics;
  }
  if (!Array.isArray(lyrics)) {
    lyrics = typeof rawLyrics === 'string' && rawLyrics.trim() ? [rawLyrics] : [];
  }

  // Process raw notation (array, JSON string, or multiline string)
  let rawNotation = obj.notations || obj.notation || obj.notes || obj.sargam ||
                    obj.flutenotes || obj.flutenotation || obj.sargamnotes ||
                    obj.songnotes || obj.note || obj.music || obj.sargamnotation ||
                    obj.notestext || obj.notationtext || [];
  let notation = [];

  if (typeof rawNotation === 'string') {
    try {
      const parsed = JSON.parse(rawNotation);
      if (Array.isArray(parsed)) {
        rawNotation = parsed;
      }
    } catch (_e) {
      notation = rawNotation.split(/\r?\n/).map(line => {
        const parts = line.split(':');
        if (parts.length > 1) {
          return { lyric: parts[0].trim(), line: parts.slice(1).join(':').trim() };
        }
        return { lyric: '', line: line.trim() };
      }).filter(n => n.line !== '' || n.lyric !== '');
    }
  }

  if (Array.isArray(rawNotation)) {
    notation = rawNotation.map(item => {
      if (typeof item === 'string') return { lyric: '', line: item };
      if (item && typeof item === 'object') {
        const lyricText = item.lyric || item.lyrics || item.line_lyric || item.words || item.text_lyric || '';
        let lineText = item.line || item.notes || item.sargam || item.notation || item.notations ||
                       item.note || item.flute_notes || item.sargam_notes || item.text || item.content || item.value || '';
        if (!lineText) {
          for (const k in item) {
            const cleanK = k.toLowerCase();
            if (!cleanK.includes('lyric') && !cleanK.includes('word') && typeof item[k] === 'string') {
              lineText = item[k];
              break;
            }
          }
        }
        return { lyric: lyricText, line: lineText };
      }
      return { lyric: '', line: '' };
    });
  }

  return {
    id: obj.id || row.Id || (index != null ? index + 1 : Math.floor(Math.random() * 10000)),
    songName: songName,
    fluteType: fluteType,
    movie: movie,
    artist: artist,
    scale: scale,
    difficulty: difficulty,
    lyrics: lyrics,
    notation: notation
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ============================================================
   SongService
   Primary Data Layer for Supabase Queries & Fallback Data
   ============================================================ */
const SongService = {
  _cache: null,

  isSupabaseActive() {
    return !!getSupabaseClient();
  },

  /**
   * Fetch all songs from Supabase (tables 'Songs' or 'songs').
   */
  async getAll() {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await querySupabaseTable(client, tbl => tbl.select('*'));

        if (!error && Array.isArray(data)) {
          if (data.length > 0) {
            this._cache = data.map(normalizeSong);
            return this._cache;
          } else {
            console.info('Supabase table exists but returned 0 rows. Check RLS public SELECT policy if songs were added.');
          }
        }
      } catch (err) {
        console.warn('Supabase getAll query notice:', err);
      }
    }

    if (this._cache) return this._cache;

    try {
      const response = await fetch(`${CONFIG.songsDataUrl}?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Non-200 response');
      const json = await response.json();
      this._cache = json.map(normalizeSong);
    } catch (_err) {
      console.info('Using local song fallback data.');
      this._cache = SONGS_FALLBACK.map(normalizeSong);
    }
    return this._cache;
  },

  /**
   * Flexible multi-field search across songName, artist, movie, scale, fluteType, and lyrics.
   */
  async search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await querySupabaseTable(client, tbl => tbl.select('*'));

        if (!error && Array.isArray(data) && data.length > 0) {
          const allSongs = data.map(normalizeSong);
          const matches = allSongs.filter(s =>
            (s.songName && s.songName.toLowerCase().includes(q)) ||
            (s.artist && s.artist.toLowerCase().includes(q)) ||
            (s.movie && s.movie.toLowerCase().includes(q)) ||
            (s.fluteType && s.fluteType.toLowerCase().includes(q)) ||
            (Array.isArray(s.lyrics) && s.lyrics.some(l => String(l).toLowerCase().includes(q)))
          );
          return matches;
        }
      } catch (err) {
        console.warn('Supabase search notice:', err);
      }
    }

    // Local search fallback
    const songs = await this.getAll();
    return songs.filter(s =>
      (s.songName && s.songName.toLowerCase().includes(q)) ||
      (s.artist && s.artist.toLowerCase().includes(q)) ||
      (s.movie && s.movie.toLowerCase().includes(q))
    );
  },

  /**
   * Get single song by ID.
   */
  async getById(id) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await querySupabaseTable(client, tbl => tbl.select('*'));
        if (!error && Array.isArray(data)) {
          const found = data.map(normalizeSong).find(s => String(s.id) === String(id));
          if (found) return found;
        }
      } catch (err) {
        console.warn('Supabase getById query notice:', err);
      }
    }

    const songs = await this.getAll();
    return songs.find(s => String(s.id) === String(id)) || null;
  }
};

/* ============================================================
   NAVIGATION & UI HELPERS
   ============================================================ */

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const drawer = document.getElementById('mobile-nav');
  if (!btn || !drawer) return;
  btn.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
  });
  drawer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      drawer.classList.remove('open');
      btn.classList.remove('open');
    });
  });
}

function markActiveNavLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ============================================================
   SUPABASE CONFIGURATION MODAL HANDLER
   ============================================================ */
function initSupabaseModal() {
  const modal = document.getElementById('supabase-modal');
  const openBtns = [
    document.getElementById('supabase-config-btn'),
    document.getElementById('mobile-supabase-config-btn')
  ].filter(Boolean);
  const closeBtn = document.getElementById('modal-close-btn');
  const form = document.getElementById('supabase-form');
  const urlInput = document.getElementById('supabase-url-input');
  const keyInput = document.getElementById('supabase-key-input');
  const statusMsg = document.getElementById('supabase-status-msg');
  const disconnectBtn = document.getElementById('supabase-disconnect-btn');

  function updateStatusUI() {
    const isConnected = SongService.isSupabaseActive();
    openBtns.forEach(btn => {
      if (btn.tagName === 'BUTTON') {
        btn.innerHTML = isConnected ? '⚡ Supabase: Live' : '⚡ Supabase';
        btn.classList.toggle('connected', isConnected);
      } else {
        btn.textContent = isConnected ? '⚡ Supabase: Live' : '⚡ Supabase Setup';
      }
    });

    const dbStatTag = document.getElementById('db-status-tag');
    if (dbStatTag) {
      dbStatTag.textContent = isConnected ? '⚡ Live DB' : '📁 Local DB';
    }
  }

  function openModal() {
    if (!modal) return;
    urlInput.value = localStorage.getItem('flute_supabase_url') || CONFIG.supabaseUrl || '';
    keyInput.value = localStorage.getItem('flute_supabase_key') || CONFIG.supabaseKey || '';
    if (statusMsg) statusMsg.style.display = 'none';
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }

  openBtns.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  }));

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = urlInput.value.trim();
      const key = keyInput.value.trim();

      if (!statusMsg) return;
      statusMsg.style.display = 'block';
      statusMsg.className = 'status-msg';
      statusMsg.textContent = 'Verifying connection to Supabase database...';

      try {
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
          throw new Error('Supabase client SDK not loaded.');
        }

        const tempClient = window.supabase.createClient(url, key);
        const { error } = await tempClient.from('songs').select('count', { count: 'exact', head: true });
        if (error) throw error;

        localStorage.setItem('flute_supabase_url', url);
        localStorage.setItem('flute_supabase_key', key);
        CONFIG.supabaseUrl = url;
        CONFIG.supabaseKey = key;
        _supabaseClient = null;
        SongService._cache = null;

        statusMsg.className = 'status-msg success';
        statusMsg.textContent = 'Successfully connected to Supabase!';
        updateStatusUI();

        setTimeout(() => {
          closeModal();
          window.location.reload();
        }, 700);
      } catch (err) {
        statusMsg.className = 'status-msg error';
        statusMsg.textContent = 'Connection error: ' + (err.message || 'Failed to connect. Check URL/Key.');
      }
    });
  }

  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
      localStorage.removeItem('flute_supabase_url');
      localStorage.removeItem('flute_supabase_key');
      CONFIG.supabaseUrl = '';
      CONFIG.supabaseKey = '';
      _supabaseClient = null;
      SongService._cache = null;

      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'status-msg success';
        statusMsg.textContent = 'Supabase credentials cleared. Active mode: Local Backup.';
      }
      updateStatusUI();
      setTimeout(closeModal, 800);
    });
  }

  updateStatusUI();
}

/* ============================================================
   CARD & DETAIL BUILDERS
   ============================================================ */
const CARD_ICONS = ['🎵', '🎶', '🎷', '🎼', '🎤', '🎹'];

function buildSongCard(song, index) {
  const icon = CARD_ICONS[index % CARD_ICONS.length];
  const delay = (index * CONFIG.animationDelay) + 'ms';
  const subText = song.artist && song.movie && song.artist !== song.movie
    ? `${escapeHtml(song.artist)} • ${escapeHtml(song.movie)}`
    : escapeHtml(song.artist || song.movie || 'Flute Notation');

  const fluteBadge = `<span class="badge badge-teal">&#9675; ${escapeHtml(song.fluteType)}</span>`;

  return `
    <article
      class="song-card animate-fade-up"
      style="animation-delay:${delay}"
      data-song-id="${song.id}"
      role="button"
      tabindex="0"
      aria-label="View notation for ${escapeHtml(song.songName)}"
    >
      <div class="song-card-header">
        <div>
          <div class="song-card-title">${escapeHtml(song.songName)}</div>
          <div class="song-card-artist">${subText}</div>
        </div>
        <div class="song-card-icon">${icon}</div>
      </div>
      <div class="song-card-meta">
        ${fluteBadge}
      </div>
      <div class="song-card-footer">
        <button class="btn btn-primary" style="font-size:0.85rem;padding:0.5rem 1.2rem">
          View Notation &rarr;
        </button>
      </div>
    </article>`;
}

/* ============================================================
   FLUTE AUDIO SYNTHESIZER (Web Audio API)
   ============================================================ */
const FluteAudio = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  playNote(freq) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const gain2 = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now);
      gain2.gain.setValueAtTime(0.2, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3.5, now);

      osc1.connect(filter);
      osc2.connect(gain2);
      gain2.connect(filter);

      filter.connect(gain);
      gain.connect(this.ctx.destination);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.15, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.9);
      osc2.stop(now + 0.9);
    } catch (e) {
      console.warn('Audio note play note:', e);
    }
  }
};

/* ============================================================
   6-HOLE FLUTE FINGER CHART DATA
   Configured:
   Sa: First 3 holes close (● ● ● ○ ○ ○)
   Re: Two holes close (● ● ○ ○ ○ ○)
   Ga: One hole close (● ○ ○ ○ ○ ○)
   Ma: All open (○ ○ ○ ○ ○ ○)
   Pa: All close (● ● ● ● ● ●)
   Da: First five close (● ● ● ● ● ○)
   Ni: First four close (● ● ● ● ○ ○)
   Sa': First 3 close (High blow) (● ● ● ○ ○ ○)
   ============================================================ */
const FINGER_CHART_ITEMS = [
  {
    note: 'Sa',
    holes: [1, 1, 1, 0, 0, 0],
    desc: 'First 3 holes close',
    sub: 'Holes 1, 2, 3 closed',
    freq: 261.63,
  },
  {
    note: 'Re',
    holes: [1, 1, 0, 0, 0, 0],
    desc: 'Two holes close',
    sub: 'Holes 1, 2 closed',
    freq: 293.66,
  },
  {
    note: 'Ga',
    holes: [1, 0, 0, 0, 0, 0],
    desc: 'One hole close',
    sub: 'Hole 1 closed',
    freq: 329.63,
  },
  {
    note: 'Ma',
    holes: [0, 0, 0, 0, 0, 0],
    desc: 'All open',
    sub: 'All 6 holes open',
    freq: 349.23,
  },
  {
    note: 'Pa',
    holes: [1, 1, 1, 1, 1, 1],
    desc: 'All close',
    sub: 'All 6 holes closed',
    freq: 392.00,
  },
  {
    note: 'Da',
    holes: [1, 1, 1, 1, 1, 0],
    desc: 'First five close',
    sub: 'Holes 1 to 5 closed (Hole 6 open)',
    altHoles: [0, 0, 0, 0, 0, 1],
    altDesc: 'First five open',
    altSub: 'Holes 1 to 5 open (Hole 6 closed)',
    freq: 440.00,
  },
  {
    note: 'Ni',
    holes: [1, 1, 1, 1, 0, 0],
    desc: 'First four close',
    sub: 'Holes 1 to 4 closed (Holes 5 & 6 open)',
    altHoles: [0, 0, 0, 0, 1, 1],
    altDesc: 'First four open',
    altSub: 'Holes 1 to 4 open (Holes 5 & 6 closed)',
    freq: 493.88,
  },
  {
    note: "Sa'",
    holes: [1, 1, 1, 0, 0, 0],
    desc: 'First 3 close (High)',
    sub: 'Upper Octave (Faster air blow)',
    freq: 523.25,
  },
];

/**
 * Renders an interactive 6-hole flute finger chart inside any container element.
 */
function renderFingerChartComponent(container, scopeId = 'chart') {
  if (!container) return;

  let currentMode = 'closed'; // 'closed' (First 5/4 Close) or 'open' (First 5/4 Open)
  let activeIndex = 0; // Default: Sa

  function getHoles(item) {
    if (currentMode === 'open' && item.altHoles) {
      return item.altHoles;
    }
    return item.holes;
  }

  function getDesc(item) {
    if (currentMode === 'open' && item.altDesc) {
      return item.altDesc;
    }
    return item.desc;
  }

  function getSub(item) {
    if (currentMode === 'open' && item.altSub) {
      return item.altSub;
    }
    return item.sub;
  }

  function formatHoleDots(holes) {
    return holes.map(h => (h ? '●' : '○')).join(' ');
  }

  function render() {
    const activeItem = FINGER_CHART_ITEMS[activeIndex];
    const currentHoles = getHoles(activeItem);

    container.innerHTML = `
      <div class="finger-guide-box">
        <div class="finger-guide-header">
          <div class="finger-guide-title">
            <span>🕳️ 6-Hole Flute Sargam Finger Chart</span>
          </div>
          <div class="finger-mode-toggle" role="group" aria-label="Fingering Style">
            <button type="button" class="mode-btn ${currentMode === 'closed' ? 'active' : ''}" data-mode="closed" title="First 5 Close (Da) & First 4 Close (Ni)">
              ⭐ First 5/4 Close
            </button>
            <button type="button" class="mode-btn ${currentMode === 'open' ? 'active' : ''}" data-mode="open" title="Alternate: First 5 Open (Da) & First 4 Open (Ni)">
              🎶 First 5/4 Open Variant
            </button>
          </div>
        </div>

        <!-- Flute Visualizer Stage -->
        <div class="flute-stage">
          <div class="flute-note-display">
            <div class="active-note-badge">
              <span>🎵</span>
              <span class="active-note-text">${escapeHtml(activeItem.note)}</span>
            </div>
            <div class="active-note-desc">
              <strong>${escapeHtml(getDesc(activeItem))}</strong> &bull; ${escapeHtml(getSub(activeItem))}
            </div>
            <button type="button" class="flute-play-tone-btn" id="${scopeId}-play-tone" aria-label="Play sound for ${escapeHtml(activeItem.note)}">
              🔊 Play Note Tone
            </button>
          </div>

          <!-- Bamboo Flute Body Graphic -->
          <div class="flute-body-wrap">
            <div class="flute-body" role="img" aria-label="6-Hole flute diagram for note ${escapeHtml(activeItem.note)}">
              <!-- Embouchure Blow Hole -->
              <div class="flute-embouchure" title="Blowing Hole (Embouchure)"></div>
              <span class="flute-embouchure-label">Blow</span>
              <div class="flute-thread-mid"></div>

              <!-- Finger Holes Cluster -->
              <div class="flute-holes-cluster">
                <!-- Left Hand (Holes 1, 2, 3) -->
                <div class="flute-hand-group">
                  <div class="flute-hole-unit">
                    <div class="flute-hole-circle ${currentHoles[0] ? 'closed' : 'open'}" data-hole="0" title="Hole 1: ${currentHoles[0] ? 'Closed' : 'Open'}"></div>
                  </div>
                  <div class="flute-hole-unit">
                    <div class="flute-hole-circle ${currentHoles[1] ? 'closed' : 'open'}" data-hole="1" title="Hole 2: ${currentHoles[1] ? 'Closed' : 'Open'}"></div>
                  </div>
                  <div class="flute-hole-unit">
                    <div class="flute-hole-circle ${currentHoles[2] ? 'closed' : 'open'}" data-hole="2" title="Hole 3: ${currentHoles[2] ? 'Closed' : 'Open'}"></div>
                  </div>
                </div>

                <div class="flute-hand-divider"></div>

                <!-- Right Hand (Holes 4, 5, 6) -->
                <div class="flute-hand-group">
                  <div class="flute-hole-unit">
                    <div class="flute-hole-circle ${currentHoles[3] ? 'closed' : 'open'}" data-hole="3" title="Hole 4: ${currentHoles[3] ? 'Closed' : 'Open'}"></div>
                  </div>
                  <div class="flute-hole-unit">
                    <div class="flute-hole-circle ${currentHoles[4] ? 'closed' : 'open'}" data-hole="4" title="Hole 5: ${currentHoles[4] ? 'Closed' : 'Open'}"></div>
                  </div>
                  <div class="flute-hole-unit">
                    <div class="flute-hole-circle ${currentHoles[5] ? 'closed' : 'open'}" data-hole="5" title="Hole 6: ${currentHoles[5] ? 'Closed' : 'Open'}"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Hole Numbers -->
            <div class="flute-labels-row">
              <div class="flute-labels-cluster">
                <div class="flute-hand-label-group">
                  <div class="flute-hole-meta"><span class="flute-hole-num">1</span></div>
                  <div class="flute-hole-meta"><span class="flute-hole-num">2</span></div>
                  <div class="flute-hole-meta"><span class="flute-hole-num">3</span></div>
                </div>
                <div style="width:20px;"></div>
                <div class="flute-hand-label-group">
                  <div class="flute-hole-meta"><span class="flute-hole-num">4</span></div>
                  <div class="flute-hole-meta"><span class="flute-hole-num">5</span></div>
                  <div class="flute-hole-meta"><span class="flute-hole-num">6</span></div>
                </div>
              </div>
            </div>

            <!-- Hand Brackets -->
            <div class="hand-bracket-row">
              <div class="hand-bracket-cluster">
                <div class="hand-bracket hand-bracket-lh">Left Hand (LH)</div>
                <div style="width:20px;"></div>
                <div class="hand-bracket hand-bracket-rh">Right Hand (RH)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 8 Interactive Note Cards Grid -->
        <div class="finger-grid" role="list">
          ${FINGER_CHART_ITEMS.map((item, idx) => {
            const h = getHoles(item);
            const d = getDesc(item);
            const s = getSub(item);
            const isActive = idx === activeIndex;
            return `
              <div class="finger-item ${isActive ? 'active' : ''}" data-index="${idx}" tabindex="0" role="listitem" aria-label="Play ${escapeHtml(item.note)}: ${escapeHtml(d)}">
                <div class="finger-item-head">
                  <strong>${escapeHtml(item.note)}</strong>
                  <span class="play-icon" title="Hear note">🔊</span>
                </div>
                <span class="holes-dots">${formatHoleDots(h)}</span>
                <small class="desc-main">${escapeHtml(d)}</small>
                <small class="desc-sub">${escapeHtml(s)}</small>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Mode buttons
    const modeButtons = container.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        currentMode = btn.dataset.mode;
        render();
        FluteAudio.playNote(FINGER_CHART_ITEMS[activeIndex].freq);
      });
    });

    // Note card clicks
    const noteCards = container.querySelectorAll('.finger-item');
    noteCards.forEach(card => {
      const idx = parseInt(card.dataset.index, 10);
      const onSelect = () => {
        activeIndex = idx;
        render();
        FluteAudio.playNote(FINGER_CHART_ITEMS[idx].freq);
      };
      card.addEventListener('click', onSelect);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      });
    });

    // Play tone button
    const playBtn = container.querySelector(`#${scopeId}-play-tone`);
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        FluteAudio.playNote(activeItem.freq);
      });
    }

    // Hole circles click to sound
    const holesCircles = container.querySelectorAll('.flute-hole-circle');
    holesCircles.forEach(circle => {
      circle.addEventListener('click', () => {
        FluteAudio.playNote(activeItem.freq);
      });
    });
  }

  render();
}

/**
 * Initializes the Quick Finger Chart modal for navbar and mobile drawer triggers.
 */
function initChartModal() {
  const modal = document.getElementById('chart-modal');
  const container = document.getElementById('modal-finger-chart-container');
  const closeBtn = document.getElementById('chart-modal-close-btn');
  const navBtn = document.getElementById('nav-chart-btn');
  const mobileBtn = document.getElementById('mobile-chart-btn');

  function openModal() {
    if (!modal) return;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    if (container && !container.dataset.rendered) {
      renderFingerChartComponent(container, 'modal');
      container.dataset.rendered = 'true';
    }
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) mobileNav.classList.remove('open');
    const hamburger = document.getElementById('hamburger-btn');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
  }

  function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }

  if (navBtn) {
    navBtn.addEventListener('click', e => {
      e.preventDefault();
      const chartSec = document.getElementById('chart-section');
      const detailSec = document.getElementById('detail-section');
      if (chartSec && (!detailSec || detailSec.style.display === 'none')) {
        chartSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        openModal();
      }
    });
  }

  if (mobileBtn) {
    mobileBtn.addEventListener('click', e => {
      e.preventDefault();
      const chartSec = document.getElementById('chart-section');
      const detailSec = document.getElementById('detail-section');
      if (chartSec && (!detailSec || detailSec.style.display === 'none')) {
        chartSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const mobileNav = document.getElementById('mobile-nav');
        if (mobileNav) mobileNav.classList.remove('open');
      } else {
        openModal();
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal();
    });
  }
}

/**
 * Initializes the embedded Finger Chart on index.html.
 */
function initHomeFingerChart() {
  const homeContainer = document.getElementById('interactive-finger-chart-container');
  if (homeContainer && !homeContainer.dataset.rendered) {
    renderFingerChartComponent(homeContainer, 'home');
    homeContainer.dataset.rendered = 'true';
  }
}

function buildSongDetail(song) {
  const lyricsList = song.lyrics || [];
  const notationList = song.notation || [];
  const maxLines = Math.max(lyricsList.length, notationList.length);
  const pairedRows = [];

  for (let i = 0; i < maxLines; i++) {
    let lyricLine = lyricsList[i] || '';
    let noteLine = '';

    if (notationList[i]) {
      const n = notationList[i];
      if (typeof n === 'string') {
        noteLine = n;
      } else if (n && typeof n === 'object') {
        noteLine = n.line || n.notes || n.notation || n.sargam || n.note || n.text || '';
        if (!lyricLine && n.lyric) {
          lyricLine = n.lyric;
        }
      }
    }

    if (lyricLine || noteLine) {
      pairedRows.push(`
        <div class="notation-pair">
          ${lyricLine ? `<div class="notation-lyric">${escapeHtml(lyricLine)}</div>` : ''}
          ${noteLine ? `<div class="notation-notes">${escapeHtml(noteLine)}</div>` : ''}
        </div>
      `);
    }
  }

  const subTitle = song.artist && song.movie && song.artist !== song.movie
    ? `${escapeHtml(song.artist)} &bull; ${escapeHtml(song.movie)}`
    : escapeHtml(song.artist || song.movie || 'Flute Sargam');

  const difficultyBadge = song.difficulty ? `<span class="badge badge-bronze">⭐ ${escapeHtml(song.difficulty)}</span>` : '';

  return `
    <div class="back-row" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
      <button class="back-btn" id="back-btn">&#8592; Back to Search</button>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-outline" id="copy-notes-btn" style="font-size:0.85rem;padding:0.45rem 1rem;">
          📋 Copy Sargam Notes
        </button>
        <button class="btn btn-ghost" id="toggle-fingers-btn" style="font-size:0.85rem;padding:0.45rem 1rem;">
          🕳️ Finger Guide
        </button>
      </div>
    </div>

    <div class="detail-panel">
      <div class="detail-header">
        <div>
          <div class="detail-eyebrow">🎼 Classical Flute Notation Sheet</div>
          <h2 class="detail-title">${escapeHtml(song.songName)}</h2>
          <div class="detail-subtitle">${subTitle}</div>
          <div class="detail-meta-tags">
            <span class="badge badge-teal">&#9675; ${escapeHtml(song.fluteType)}</span>
            ${difficultyBadge}
            <span class="badge badge-purple">&#127926; 6-Hole Flute</span>
          </div>
        </div>
      </div>

      <div class="detail-body">
        <div class="flute-indicator">
          <span class="flute-holes-icon">● ● ● ● ● ●</span>
          <div>
            <strong>6-Hole Flute Guide (${escapeHtml(song.fluteType)})</strong> &mdash; Play line-by-line using standard Sargam notes.
          </div>
        </div>

        <!-- Collapsible Finger Guide Chart -->
        <div id="finger-guide-chart" style="display:none;margin-bottom:1.5rem;">
          <div id="detail-finger-chart-container"></div>
        </div>

        <div class="notation-sheet">
          <div class="notation-sheet-header">
            <h3>🎵 Lyrics &amp; Sargam Notations</h3>
          </div>
          <div class="notation-pair-list">
            ${pairedRows.join('') || '<div style="padding:1rem;color:var(--clr-text-muted)">No lyrics or notation available for this song.</div>'}
          </div>
        </div>

        <div class="notation-key-legend">
          <strong>Sargam Note Key:</strong>
          <span>Sa = Shadja</span> &bull;
          <span>Re = Rishabh</span> &bull;
          <span>Ga = Gandhar</span> &bull;
          <span>Ma = Madhyam</span> &bull;
          <span>Pa = Pancham</span> &bull;
          <span>Da / Dha = Dhaivat</span> &bull;
          <span>Ni = Nishad</span> &bull;
          <span>Sa' = Upper Octave</span> &bull;
          <span>-- = Hold Note</span>
        </div>
      </div>
    </div>`;
}

function bindDetailActions(song) {
  const copyBtn = document.getElementById('copy-notes-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const lyricsList = song.lyrics || [];
      const notationList = song.notation || [];
      const maxLines = Math.max(lyricsList.length, notationList.length);
      const lines = [];

      for (let i = 0; i < maxLines; i++) {
        const lyric = lyricsList[i] || (notationList[i] && notationList[i].lyric ? notationList[i].lyric : '');
        let note = '';
        if (notationList[i]) {
          const n = notationList[i];
          note = typeof n === 'string' ? n : (n.line || n.notes || n.notation || n.sargam || n.note || '');
        }
        if (lyric) lines.push(lyric);
        if (note) lines.push(note);
        if (lyric || note) lines.push('');
      }

      navigator.clipboard.writeText(lines.join('\n')).then(() => {
        copyBtn.textContent = '✅ Copied Notes!';
        setTimeout(() => { copyBtn.textContent = '📋 Copy Sargam Notes'; }, 2000);
      }).catch(() => {
        alert('Notes copied to clipboard!');
      });
    });
  }

  const toggleFingersBtn = document.getElementById('toggle-fingers-btn');
  const fingerChart = document.getElementById('finger-guide-chart');
  const detailChartContainer = document.getElementById('detail-finger-chart-container');
  if (toggleFingersBtn && fingerChart) {
    toggleFingersBtn.addEventListener('click', () => {
      const isHidden = fingerChart.style.display === 'none';
      fingerChart.style.display = isHidden ? 'block' : 'none';
      toggleFingersBtn.textContent = isHidden ? '❌ Close Chart' : '🕳️ Finger Guide';
      if (isHidden && detailChartContainer && !detailChartContainer.dataset.rendered) {
        renderFingerChartComponent(detailChartContainer, 'detail');
        detailChartContainer.dataset.rendered = 'true';
      }
    });
  }
}

function buildResultsHeader(count, query) {
  if (query) {
    return `<div class="results-header">
      <div class="results-count">
        Found <strong>${count}</strong> song${count !== 1 ? 's' : ''} for "<strong>${escapeHtml(query)}</strong>" in database
      </div>
      <button class="btn btn-ghost" id="clear-search-btn" style="font-size:0.82rem;padding:0.4rem 1rem">
        &#10005; Clear
      </button>
    </div>`;
  }
  return `<div class="results-header">
    <div class="results-count">Showing all <strong>${count}</strong> song${count !== 1 ? 's' : ''} in database</div>
  </div>`;
}

/**
 * Builds the "No results found" empty state when a searched song is not in the database.
 */
function buildNotAvailableState(query) {
  const safeQuery = escapeHtml(query);
  return `
    <div class="empty-state animate-fade-up">
      <div class="empty-icon">&#127926;</div>
      <h3>No results found</h3>
      <p>Sorry, notation for "<strong>${safeQuery}</strong>" is not available in our database. Try a different name!</p>
      <div style="margin-top:1.25rem;">
        <button class="btn btn-ghost" id="clear-search-btn" style="font-size:0.82rem;padding:0.4rem 1rem">
          &#10005; Clear Search
        </button>
      </div>
    </div>`;
}

/* ============================================================
   DECORATIVE FLOATING NOTES
   ============================================================ */
function initFloatingNotes() {
  const container = document.querySelector('.notes-deco');
  if (!container) return;
  const notes = ['♩', '♪', '♫', '♬', '𝄞', '𝄢'];
  const count = 12;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'note';
    el.textContent = notes[i % notes.length];
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      top:  ${Math.random() * 100}%;
      font-size: ${1 + Math.random() * 2}rem;
      animation-duration: ${4 + Math.random() * 6}s;
      animation-delay: ${-Math.random() * 6}s;
    `;
    container.appendChild(el);
  }
}

/* ============================================================
   SHARED INITIALIZATION
   ============================================================ */
function sharedInit() {
  initNavbar();
  initHamburger();
  markActiveNavLink();
  initFloatingNotes();
  initSupabaseModal();
  initChartModal();
}

/* ============================================================
   PAGE: index.html — HOME PAGE
   ============================================================ */
async function initHomePage() {
  sharedInit();

  const searchInput = document.getElementById('hero-search-input');
  const searchBtn = document.getElementById('hero-search-btn');
  const popularSection = document.getElementById('popular-section');
  const chartSection = document.getElementById('chart-section');
  const resultsSection = document.getElementById('results-section');
  const resultsArea = document.getElementById('results-area');
  const detailSection = document.getElementById('detail-section');
  const detailArea = document.getElementById('detail-area');
  const statSongs = document.getElementById('stat-songs');

  function showSkeleton() {
    resultsArea.innerHTML = `
      <div class="cards-grid">
        ${[1, 2, 3].map(() => `<div class="song-card skeleton" style="height:160px;"></div>`).join('')}
      </div>`;
  }

  function renderCards(songs, query) {
    if (songs.length === 0) {
      resultsArea.innerHTML = buildNotAvailableState(query);

      const requestBtn = document.getElementById('request-song-btn');
      if (requestBtn) {
        requestBtn.addEventListener('click', () => {
          alert(`Thank you! Request for "${query}" notation has been logged.`);
        });
      }

      const clearBtn = document.getElementById('clear-search-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          searchInput.value = '';
          showAllPopular();
        });
      }
      return;
    }

    resultsArea.innerHTML = buildResultsHeader(songs.length, query);
    const grid = document.createElement('div');
    grid.className = 'cards-grid';
    grid.innerHTML = songs.map((s, i) => buildSongCard(s, i)).join('');
    resultsArea.appendChild(grid);

    const clearBtn = document.getElementById('clear-search-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        showAllPopular();
      });
    }

    bindCardEvents(resultsArea);
  }

  async function showAllPopular() {
    popularSection.style.display = '';
    if (chartSection) chartSection.style.display = '';
    resultsSection.style.display = 'none';
    detailSection.style.display = 'none';

    const popularGrid = document.getElementById('popular-grid');
    if (popularGrid) {
      try {
        const songs = await SongService.getAll();
        if (statSongs) statSongs.textContent = songs.length;
        popularGrid.innerHTML = songs.map((s, i) => buildSongCard(s, i)).join('');
        bindCardEvents(popularGrid);
      } catch (err) {
        popularGrid.innerHTML = `<p style="color:var(--clr-text-dim)">Could not load songs from database.</p>`;
        console.error(err);
      }
    }
  }

  async function doSearch() {
    const query = searchInput.value.trim();
    if (!query) {
      showAllPopular();
      return;
    }

    popularSection.style.display = 'none';
    if (chartSection) chartSection.style.display = 'none';
    detailSection.style.display = 'none';
    resultsSection.style.display = '';

    showSkeleton();

    try {
      const results = await SongService.search(query);
      renderCards(results, query);
    } catch (err) {
      resultsArea.innerHTML = `<p style="color:var(--clr-text-muted)">Error searching database. Please try again.</p>`;
      console.error(err);
    }
  }

  async function showDetail(songId) {
    popularSection.style.display = 'none';
    if (chartSection) chartSection.style.display = 'none';
    resultsSection.style.display = 'none';
    detailSection.style.display = '';
    detailArea.innerHTML = '<div class="empty-state"><div class="empty-icon">&#127925;</div><p>Loading notation from database…</p></div>';

    try {
      const song = await SongService.getById(songId);
      if (!song) throw new Error('Song not found in database');
      detailArea.innerHTML = buildSongDetail(song);
      bindDetailActions(song);

      document.getElementById('back-btn').addEventListener('click', () => {
        if (searchInput.value.trim()) {
          doSearch();
        } else {
          showAllPopular();
        }
      });
    } catch (err) {
      detailArea.innerHTML = `<p style="color:var(--clr-text-muted)">Could not load song notation from database.</p>`;
      console.error(err);
    }
  }

  function bindCardEvents(container) {
    container.querySelectorAll('.song-card').forEach(card => {
      const handler = () => showDetail(card.dataset.songId);
      card.addEventListener('click', handler);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
    });
  }

  if (searchBtn) searchBtn.addEventListener('click', doSearch);
  if (searchInput) searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  showAllPopular();
  initHomeFingerChart();
}

/* ============================================================
   PAGE: songs.html — ALL SONGS PAGE
   ============================================================ */
async function initSongsPage() {
  sharedInit();

  const searchInput = document.getElementById('songs-search-input');
  const searchBtn = document.getElementById('songs-search-btn');
  const songsArea = document.getElementById('songs-area');
  const detailArea = document.getElementById('detail-area');
  const detailSec = document.getElementById('detail-section');
  const songsSec = document.getElementById('songs-section');

  function showSkeleton() {
    songsArea.innerHTML = `
      <div class="cards-grid">
        ${[1, 2, 3].map(() => `<div class="song-card skeleton" style="height:160px;"></div>`).join('')}
      </div>`;
  }

  function renderCards(songs, query) {
    if (songs.length === 0) {
      songsArea.innerHTML = buildNotAvailableState(query);

      const requestBtn = document.getElementById('request-song-btn');
      if (requestBtn) {
        requestBtn.addEventListener('click', () => {
          alert(`Thank you! Request for "${query}" notation has been logged.`);
        });
      }

      const clearBtn = document.getElementById('clear-search-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          searchInput.value = '';
          loadAll();
        });
      }
      return;
    }

    songsArea.innerHTML = buildResultsHeader(songs.length, query);
    const grid = document.createElement('div');
    grid.className = 'cards-grid';
    grid.innerHTML = songs.map((s, i) => buildSongCard(s, i)).join('');
    songsArea.appendChild(grid);

    const clearBtn = document.getElementById('clear-search-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        loadAll();
      });
    }

    bindCardEvents(grid);
  }

  async function loadAll() {
    showSkeleton();
    try {
      const songs = await SongService.getAll();
      renderCards(songs, '');
    } catch (err) {
      songsArea.innerHTML = `<p style="color:var(--clr-text-muted)">Error loading songs from database.</p>`;
      console.error(err);
    }
  }

  async function doSearch() {
    const query = searchInput.value.trim();
    showSkeleton();
    try {
      const results = await SongService.search(query);
      renderCards(results, query);
    } catch (err) {
      songsArea.innerHTML = `<p style="color:var(--clr-text-muted)">Error querying database.</p>`;
      console.error(err);
    }
  }

  async function showDetail(songId) {
    songsSec.style.display = 'none';
    detailSec.style.display = '';
    detailArea.innerHTML = '<div class="empty-state"><div class="empty-icon">&#127925;</div><p>Loading notation from database…</p></div>';

    try {
      const song = await SongService.getById(songId);
      if (!song) throw new Error('Song not found in database');
      detailArea.innerHTML = buildSongDetail(song);
      bindDetailActions(song);

      document.getElementById('back-btn').addEventListener('click', () => {
        songsSec.style.display = '';
        detailSec.style.display = 'none';
      });
    } catch (err) {
      detailArea.innerHTML = `<p style="color:var(--clr-text-muted)">Could not load song details from database.</p>`;
    }
  }

  function bindCardEvents(container) {
    container.querySelectorAll('.song-card').forEach(card => {
      const handler = () => showDetail(card.dataset.songId);
      card.addEventListener('click', handler);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
    });
  }

  if (searchBtn) searchBtn.addEventListener('click', doSearch);
  if (searchInput) searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  loadAll();
}

/* ============================================================
   PAGE: about.html — ABOUT PAGE
   ============================================================ */
function initAboutPage() {
  sharedInit();
}

/* ============================================================
   PAGE ROUTER INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '') {
    initHomePage();
  } else if (page === 'songs.html') {
    initSongsPage();
  } else if (page === 'about.html') {
    initAboutPage();
  }
});
