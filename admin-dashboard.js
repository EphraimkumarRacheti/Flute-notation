/**
 * admin-dashboard.js — Flute Notation Admin Panel
 *
 * Professional song management dashboard integrating directly with Supabase table: public."Songs"
 * Database schema columns:
 *   - Id (bigint / primary key)
 *   - Song_name (text)
 *   - Movie (text)
 *   - Flute_type (text)
 *   - Lyrics (text)
 *   - Notations (text)
 */

'use strict';

(function () {
  const SUPABASE_PROJECT_URL = 'https://kjmqfkhngvuvivtqmjko.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_EN8LhNtlouiD9fkAZ8QF-g_Amo1OU0Q';

  // Application State
  const state = {
    allSongs: [],       // Master list of all songs loaded from Supabase public."Songs"
    filteredSongs: [],  // Songs currently displayed after search filter
    totalCount: 0,      // Total count of songs in database
    currentSearch: '',  // Active search query
    isLoading: false,
    pendingDeleteId: null,
    currentViewingSongId: null,
    debounceTimer: null,
    toastTimer: null,
    user: null,
  };

  /* ============================================================
     DOM ELEMENT REFERENCES
     ============================================================ */
  // Navigation & User
  const navAdminEmail = document.getElementById('nav-admin-email');
  const logoutBtn = document.getElementById('logout-btn');

  // Stats
  const totalSongsStat = document.getElementById('total-songs-stat');
  const showingSongsStat = document.getElementById('showing-songs-stat');
  const filterStatusBadge = document.getElementById('filter-status-badge');
  const searchSubtext = document.getElementById('search-subtext');

  // Search & Toolbar
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const activeSearchIndicator = document.getElementById('active-search-indicator');
  const activeSearchTerm = document.getElementById('active-search-term');
  const resetFilterBtn = document.getElementById('reset-filter-btn');

  // Add Song Triggers
  const addSongTopBtn = document.getElementById('add-song-top-btn');
  const addSongToolbarBtn = document.getElementById('add-song-toolbar-btn');
  const quickAddBtn = document.getElementById('quick-add-btn');
  const emptyAddBtn = document.getElementById('empty-add-btn');

  // Table & States
  const songsTbody = document.getElementById('songs-tbody');
  const loadingState = document.getElementById('loading-state');
  const emptyState = document.getElementById('empty-state');
  const emptyTitle = document.getElementById('empty-title');
  const emptyMessage = document.getElementById('empty-message');
  const emptyClearBtn = document.getElementById('empty-clear-btn');
  const tableStatusText = document.getElementById('table-status-text');

  // Add / Edit Modal
  const songModal = document.getElementById('song-modal');
  const songModalBackdrop = document.getElementById('song-modal-backdrop');
  const modalTitle = document.getElementById('modal-title');
  const modalModeBadge = document.getElementById('modal-mode-badge');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelModalBtn = document.getElementById('cancel-modal-btn');
  const songForm = document.getElementById('song-form');
  const songIdInput = document.getElementById('song-id');
  const songNameInput = document.getElementById('song-name');
  const songMovieInput = document.getElementById('song-movie');
  const songFluteTypeInput = document.getElementById('song-flute-type');
  const songLyricsInput = document.getElementById('song-lyrics');
  const songNotationsInput = document.getElementById('song-notations');
  const saveSongBtn = document.getElementById('save-song-btn');
  const saveBtnText = document.getElementById('save-btn-text');
  const saveBtnSpinner = document.getElementById('save-btn-spinner');
  const saveBtnIcon = document.getElementById('save-btn-icon');
  const modalAlert = document.getElementById('modal-alert');
  const modalAlertText = document.getElementById('modal-alert-text');

  // Delete Modal
  const deleteModal = document.getElementById('delete-modal');
  const deleteModalBackdrop = document.getElementById('delete-modal-backdrop');
  const closeDeleteModalBtn = document.getElementById('close-delete-modal-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const deleteSongName = document.getElementById('delete-song-name');
  const deleteSongMovie = document.getElementById('delete-song-movie');
  const deleteBtnText = document.getElementById('delete-btn-text');
  const deleteBtnSpinner = document.getElementById('delete-btn-spinner');

  // View Preview Modal
  const viewModal = document.getElementById('view-modal');
  const viewModalBackdrop = document.getElementById('view-modal-backdrop');
  const closeViewModalBtn = document.getElementById('close-view-modal-btn');
  const closeViewBtn = document.getElementById('close-view-btn');
  const editFromViewBtn = document.getElementById('edit-from-view-btn');
  const viewModalTitle = document.getElementById('view-modal-title');
  const viewMovie = document.getElementById('view-movie');
  const viewFluteType = document.getElementById('view-flute-type');
  const viewId = document.getElementById('view-id');
  const viewLyrics = document.getElementById('view-lyrics');
  const viewNotations = document.getElementById('view-notations');

  // Toast Notifications
  const toastContainer = document.getElementById('toast-container');
  const dashboardToast = document.getElementById('dashboard-toast');
  const toastIcon = document.getElementById('toast-icon');
  const toastMessage = document.getElementById('toast-message');
  const toastCloseBtn = document.getElementById('toast-close-btn');

  /* ============================================================
     SUPABASE CLIENT GETTER
     ============================================================ */
  async function waitForSupabase() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      return true;
    }
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 80));
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        return true;
      }
    }
    return false;
  }

  function getSupabase() {
    if (window.AdminAuth && typeof window.AdminAuth.getClient === 'function') {
      const client = window.AdminAuth.getClient();
      if (client) return client;
    }
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      return window.supabase.createClient(
        SUPABASE_PROJECT_URL,
        SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        }
      );
    }
    console.error('[Admin Dashboard] Supabase SDK is not available on window.');
    return null;
  }

  /**
   * Verify active Supabase session before performing write operations
   */
  async function verifyAdminSession() {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Admin session:', session);
      console.log('Admin user ID:', session?.user?.id);

      if (error || !session || !session.user) {
        console.warn('[Admin Dashboard] No authenticated session found:', error);
        return null;
      }
      return session;
    } catch (err) {
      console.error('[Admin Dashboard] verifyAdminSession error:', err);
      return null;
    }
  }

  /* ============================================================
     TOAST NOTIFICATIONS
     ============================================================ */
  function showToast(message, type = 'success') {
    if (!dashboardToast || !toastMessage) return;

    if (state.toastTimer) {
      clearTimeout(state.toastTimer);
    }

    toastMessage.textContent = message;
    dashboardToast.className = `admin-toast ${type} show`;

    if (toastIcon) {
      if (type === 'success') toastIcon.textContent = '✓';
      else if (type === 'error') toastIcon.textContent = '✕';
      else toastIcon.textContent = 'ℹ️';
    }

    if (toastContainer) toastContainer.style.display = 'block';

    state.toastTimer = setTimeout(() => {
      hideToast();
    }, 4000);
  }

  function hideToast() {
    if (dashboardToast) {
      dashboardToast.classList.remove('show');
      setTimeout(() => {
        if (!dashboardToast.classList.contains('show') && toastContainer) {
          toastContainer.style.display = 'none';
        }
      }, 300);
    }
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function cleanFluteType(rawType) {
    if (!rawType) return '6 Hole';
    return String(rawType).replace(/^['"]|['"]$/g, '').trim() || '6 Hole';
  }

  function updateStatsUI() {
    if (totalSongsStat) {
      // TOTAL SONGS always represents the actual database song count
      totalSongsStat.textContent = String(state.totalCount);
    }

    if (showingSongsStat) {
      // SONGS DISPLAYED represents search results count
      showingSongsStat.textContent = String(state.filteredSongs.length);
    }

    if (filterStatusBadge && searchSubtext) {
      if (state.currentSearch) {
        filterStatusBadge.textContent = 'Filtered';
        filterStatusBadge.className = 'admin-metric-badge warning';
        searchSubtext.textContent = `Matching "${state.currentSearch}"`;
      } else {
        filterStatusBadge.textContent = 'All Songs';
        filterStatusBadge.className = 'admin-metric-badge info';
        searchSubtext.textContent = 'Showing full catalog';
      }
    }
  }

  /* ============================================================
     DATABASE OPERATIONS: Supabase public."Songs"
     ============================================================ */

  /**
   * Fetch all songs directly from Supabase table: public."Songs"
   * Uses query: supabase.from('Songs').select('*').order('Song_name', { ascending: true })
   */
  async function fetchSongsFromDatabase() {
    console.log('[Admin Dashboard] Querying Supabase public."Songs"...');
    const supabase = getSupabase();
    if (!supabase) {
      console.error('[Admin Dashboard] Supabase client missing');
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('Songs')
      .select('*')
      .order('Song_name', { ascending: true });

    if (error) {
      console.error('Songs load error:', error);
      throw error;
    }

    if (Array.isArray(data)) {
      return data;
    }

    return [];
  }

  /**
   * Insert a new song into public."Songs"
   * @param {object} payload
   */
  async function insertSongToDatabase(payload) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client is not connected.');

    // Exact database column mapping: Id, Song_name, Movie, Flute_type, Lyrics, Notations
    const record = {
      Song_name: payload.Song_name,
      Movie: payload.Movie || '',
      Flute_type: payload.Flute_type || "'6 Hole'",
      Lyrics: payload.Lyrics || '',
      Notations: payload.Notations || '',
    };

    console.log('[Admin Dashboard] Inserting song into public."Songs":', record);

    const { data, error } = await supabase
      .from('Songs')
      .insert([record])
      .select();

    if (error) {
      console.error('[Admin Dashboard] Supabase INSERT error:', error);
      throw error;
    }

    console.log('[Admin Dashboard] Successfully inserted song:', data);
    return data && data[0] ? data[0] : record;
  }

  /**
   * Update an existing song in public."Songs" by Id
   * @param {number|string} id
   * @param {object} payload
   */
  async function updateSongInDatabase(id, payload) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client is not connected.');

    const record = {
      Song_name: payload.Song_name,
      Movie: payload.Movie || '',
      Flute_type: payload.Flute_type || "'6 Hole'",
      Lyrics: payload.Lyrics || '',
      Notations: payload.Notations || '',
    };

    console.log(`[Admin Dashboard] Updating song Id #${id} in public."Songs":`, record);

    const { data, error } = await supabase
      .from('Songs')
      .update(record)
      .eq('Id', id)
      .select();

    if (error) {
      console.error('[Admin Dashboard] Supabase UPDATE error:', error);
      throw error;
    }

    console.log('[Admin Dashboard] Successfully updated song:', data);
    return data && data[0] ? data[0] : record;
  }

  /**
   * Delete a song from public."Songs" by Id
   * @param {number|string} id
   */
  async function deleteSongFromDatabase(id) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client is not connected.');

    console.log(`[Admin Dashboard] Deleting song Id #${id} from public."Songs"...`);

    const { error } = await supabase
      .from('Songs')
      .delete()
      .eq('Id', id);

    if (error) {
      console.error('[Admin Dashboard] Supabase DELETE error:', error);
      throw error;
    }

    console.log(`[Admin Dashboard] Successfully deleted song Id #${id}`);
    return true;
  }

  /* ============================================================
     TABLE RENDERING
     ============================================================ */

  function renderSongRows(songs) {
    if (!songsTbody) {
      console.error('[Admin Dashboard] Critical: #songs-tbody element not found in DOM.');
      return;
    }

    songsTbody.innerHTML = '';

    // Condition A & B: Zero songs to display
    if (!songs || songs.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';

      if (state.currentSearch) {
        if (emptyTitle) emptyTitle.textContent = 'No matching songs found';
        if (emptyMessage) emptyMessage.textContent = `No songs found matching "${escapeHtml(state.currentSearch)}".`;
        if (emptyClearBtn) emptyClearBtn.style.display = 'inline-flex';
      } else {
        if (emptyTitle) emptyTitle.textContent = 'No songs in your database';
        if (emptyMessage) emptyMessage.textContent = 'Your Supabase public."Songs" table currently has 0 rows.';
        if (emptyClearBtn) emptyClearBtn.style.display = 'none';
      }

      if (tableStatusText) {
        tableStatusText.textContent = state.currentSearch
          ? `0 matching results for "${state.currentSearch}"`
          : '0 songs in database';
      }
      return;
    }

    // Condition C: Database returned songs
    if (emptyState) emptyState.style.display = 'none';

    const fragment = document.createDocumentFragment();

    songs.forEach((song) => {
      // Explicit database column mapping: Id, Song_name, Movie, Flute_type, Lyrics, Notations
      const id = song.Id;
      const songName = song.Song_name || 'Untitled Song';
      const movie = song.Movie || '';
      const fluteType = cleanFluteType(song.Flute_type);

      const tr = document.createElement('tr');
      tr.className = 'admin-song-row';
      tr.setAttribute('data-song-id', String(id));

      const displayMovie = movie ? escapeHtml(movie) : '<span class="text-dim">—</span>';

      tr.innerHTML = `
        <td class="cell-song-name">
          <div class="song-title-group">
            <span class="song-table-title">${escapeHtml(songName)}</span>
            <span class="song-id-pill" title="Supabase Database ID">ID #${escapeHtml(id)}</span>
          </div>
        </td>
        <td class="cell-movie">
          <span class="song-movie-text">${displayMovie}</span>
        </td>
        <td class="cell-flute">
          <span class="flute-type-chip">${escapeHtml(fluteType)}</span>
        </td>
        <td class="cell-actions">
          <div class="action-buttons-group">
            <button
              type="button"
              class="btn-action-view"
              data-id="${escapeHtml(id)}"
              title="Preview lyrics and notations"
            >
              <span aria-hidden="true">👁️</span>
              <span class="action-btn-label">View</span>
            </button>
            <button
              type="button"
              class="btn-action-edit"
              data-id="${escapeHtml(id)}"
              title="Edit song details"
            >
              <span aria-hidden="true">✏️</span>
              <span class="action-btn-label">Edit</span>
            </button>
            <button
              type="button"
              class="btn-action-delete"
              data-id="${escapeHtml(id)}"
              title="Delete song"
            >
              <span aria-hidden="true">🗑️</span>
              <span class="action-btn-label">Delete</span>
            </button>
          </div>
        </td>
      `;

      fragment.appendChild(tr);
    });

    songsTbody.appendChild(fragment);

    if (tableStatusText) {
      if (state.currentSearch) {
        tableStatusText.textContent = `Showing ${songs.length} matching song${songs.length === 1 ? '' : 's'} for "${state.currentSearch}"`;
      } else {
        tableStatusText.textContent = `Showing all ${songs.length} song${songs.length === 1 ? '' : 's'} from Supabase`;
      }
    }
  }

  /* ============================================================
     SEARCH FILTERING
     ============================================================ */

  /**
   * Applies case-insensitive partial match search against Song_name on allSongs,
   * modifying filteredSongs NOT allSongs.
   * @param {string} searchTerm
   */
  function applySearchFilter(searchTerm = '') {
    state.currentSearch = (searchTerm || '').trim();

    // Toggle clear search button visibility
    if (clearSearchBtn) {
      clearSearchBtn.style.display = state.currentSearch ? 'inline-flex' : 'none';
    }

    // Toggle active filter pill
    if (activeSearchIndicator) {
      if (state.currentSearch) {
        if (activeSearchTerm) activeSearchTerm.textContent = state.currentSearch;
        activeSearchIndicator.style.display = 'flex';
      } else {
        activeSearchIndicator.style.display = 'none';
      }
    }

    if (!state.currentSearch) {
      // Empty search shows all songs from master database array
      state.filteredSongs = [...state.allSongs];
    } else {
      const termLower = state.currentSearch.toLowerCase();
      state.filteredSongs = state.allSongs.filter((song) => {
        const songName = (song.Song_name || '').toLowerCase();
        const movie = (song.Movie || '').toLowerCase();
        return songName.includes(termLower) || movie.includes(termLower);
      });
    }

    // Render search results while keeping allSongs and totalCount intact
    renderSongRows(state.filteredSongs);
    updateStatsUI();
  }

  /* ============================================================
     LOAD SONGS ORCHESTRATOR
     ============================================================ */

  /**
   * Loads fresh song list from Supabase and applies the current search filter.
   * @param {string} maintainSearchTerm - Optional search term to preserve after reload
   */
  async function loadSongs(maintainSearchTerm = '') {
    state.isLoading = true;

    if (loadingState) loadingState.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';

    try {
      const songs = await fetchSongsFromDatabase();

      if (Array.isArray(songs)) {
        state.allSongs = songs;
        state.totalCount = state.allSongs.length;
        console.log('[Admin Dashboard] Songs successfully loaded from Supabase:', state.allSongs.length);
      }

      // Apply search filter (preserves user's query or shows all)
      const query = (maintainSearchTerm !== undefined && maintainSearchTerm !== null)
        ? maintainSearchTerm
        : state.currentSearch;

      applySearchFilter(query);
    } catch (err) {
      console.error('Songs load error:', err);
      if (emptyState) emptyState.style.display = 'none';
      showToast(err.message || 'Failed to load songs from Supabase.', 'error');

      if (songsTbody) {
        songsTbody.innerHTML = `
          <tr>
            <td colspan="4" class="admin-table-error">
              <div class="table-error-box">
                <span class="table-error-icon">⚠️</span>
                <h4>Database Request Failed</h4>
                <p>${escapeHtml(err.message || 'Error communicating with Supabase table public."Songs"')}</p>
                <button id="retry-load-btn" class="admin-secondary-btn btn-sm" style="margin-top: 0.5rem;" type="button">
                  Retry Connection
                </button>
              </div>
            </td>
          </tr>
        `;
        const retryBtn = document.getElementById('retry-load-btn');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => loadSongs(state.currentSearch));
        }
      }
    } finally {
      state.isLoading = false;
      if (loadingState) loadingState.style.display = 'none';
    }
  }

  /* ============================================================
     MODAL MANAGEMENT
     ============================================================ */

  function hideModalAlert() {
    if (modalAlert) {
      modalAlert.style.display = 'none';
      if (modalAlertText) modalAlertText.textContent = '';
    }
  }

  function showModalAlert(message) {
    if (modalAlert && modalAlertText) {
      modalAlertText.textContent = message;
      modalAlert.style.display = 'flex';
    }
  }

  function openAddModal() {
    hideModalAlert();
    if (songForm) songForm.reset();
    if (songIdInput) songIdInput.value = '';

    if (modalTitle) modalTitle.textContent = 'Add New Song';
    if (modalModeBadge) modalModeBadge.textContent = 'New Supabase Record';
    if (saveBtnText) saveBtnText.textContent = 'Add Song';
    if (saveBtnIcon) saveBtnIcon.textContent = '＋';

    // Default flute type hint
    if (songFluteTypeInput) songFluteTypeInput.value = '6 Hole';

    if (songModal) {
      songModal.classList.add('active');
      songModal.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('modal-open');

    if (songNameInput) {
      setTimeout(() => songNameInput.focus(), 100);
    }
  }

  function openEditModal(songId) {
    hideModalAlert();
    if (songForm) songForm.reset();

    const song = state.allSongs.find((s) => String(s.Id) === String(songId));
    if (!song) {
      showToast('Song details could not be found.', 'error');
      return;
    }

    if (songIdInput) songIdInput.value = song.Id;
    if (songNameInput) songNameInput.value = song.Song_name || '';
    if (songMovieInput) songMovieInput.value = song.Movie || '';
    if (songFluteTypeInput) songFluteTypeInput.value = cleanFluteType(song.Flute_type);
    if (songLyricsInput) songLyricsInput.value = song.Lyrics || '';
    if (songNotationsInput) songNotationsInput.value = song.Notations || '';

    if (modalTitle) modalTitle.textContent = `Edit Song: ${song.Song_name}`;
    if (modalModeBadge) modalModeBadge.textContent = `Editing ID #${song.Id}`;
    if (saveBtnText) saveBtnText.textContent = 'Save Changes';
    if (saveBtnIcon) saveBtnIcon.textContent = '💾';

    if (songModal) {
      songModal.classList.add('active');
      songModal.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('modal-open');

    if (songNameInput) {
      setTimeout(() => songNameInput.focus(), 100);
    }
  }

  function closeSongModal() {
    if (songModal) {
      songModal.classList.remove('active');
      songModal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('modal-open');
    if (songForm) songForm.reset();
    hideModalAlert();
  }

  function openDeleteModal(songId) {
    const song = state.allSongs.find((s) => String(s.Id) === String(songId));
    if (!song) {
      showToast('Song details could not be found.', 'error');
      return;
    }

    state.pendingDeleteId = song.Id;
    if (deleteSongName) deleteSongName.textContent = song.Song_name;
    if (deleteSongMovie) deleteSongMovie.textContent = song.Movie ? `(Movie: ${song.Movie})` : '';

    if (deleteModal) {
      deleteModal.classList.add('active');
      deleteModal.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('modal-open');

    if (confirmDeleteBtn) confirmDeleteBtn.focus();
  }

  function closeDeleteModal() {
    if (deleteModal) {
      deleteModal.classList.remove('active');
      deleteModal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('modal-open');
    state.pendingDeleteId = null;
  }

  function openViewModal(songId) {
    const song = state.allSongs.find((s) => String(s.Id) === String(songId));
    if (!song) return;

    state.currentViewingSongId = song.Id;
    if (viewModalTitle) viewModalTitle.textContent = song.Song_name;
    if (viewMovie) viewMovie.textContent = song.Movie || 'Not specified';
    if (viewFluteType) viewFluteType.textContent = cleanFluteType(song.Flute_type);
    if (viewId) viewId.textContent = `#${song.Id}`;
    if (viewLyrics) viewLyrics.textContent = song.Lyrics || '(No lyrics recorded)';
    if (viewNotations) viewNotations.textContent = song.Notations || '(No notations recorded)';

    if (viewModal) {
      viewModal.classList.add('active');
      viewModal.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('modal-open');
  }

  function closeViewModal() {
    if (viewModal) {
      viewModal.classList.remove('active');
      viewModal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('modal-open');
    state.currentViewingSongId = null;
  }

  /* ============================================================
     FORM SUBMISSIONS (ADD / EDIT / DELETE)
     ============================================================ */

  // Add / Edit Song Form Submission
  if (songForm) {
    songForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideModalAlert();

      // 1. Verify authenticated Supabase session before write
      const session = await verifyAdminSession();
      if (!session) {
        const expiredMsg = 'Your admin session has expired. Please log in again.';
        showModalAlert(expiredMsg);
        showToast(expiredMsg, 'error');
        setTimeout(() => {
          window.location.replace('admin-login.html');
        }, 1800);
        return;
      }

      const name = songNameInput ? songNameInput.value.trim() : '';
      const movie = songMovieInput ? songMovieInput.value.trim() : '';
      const fluteType = songFluteTypeInput ? songFluteTypeInput.value.trim() : '';
      const lyrics = songLyricsInput ? songLyricsInput.value : '';
      const notations = songNotationsInput ? songNotationsInput.value : '';
      const id = songIdInput ? songIdInput.value.trim() : '';

      if (!name) {
        showModalAlert('Please enter a song name.');
        if (songNameInput) songNameInput.focus();
        return;
      }

      const payload = {
        Song_name: name,
        Movie: movie,
        Flute_type: fluteType || "'6 Hole'",
        Lyrics: lyrics,
        Notations: notations,
      };

      // UI Loading state
      if (saveSongBtn) saveSongBtn.disabled = true;
      if (saveBtnSpinner) saveBtnSpinner.style.display = 'inline-block';
      if (saveBtnIcon) saveBtnIcon.style.display = 'none';

      try {
        if (id) {
          // Update existing song using its unique Id
          await updateSongInDatabase(id, payload);
          showToast(`"${name}" updated successfully.`, 'success');
        } else {
          // Insert new song
          await insertSongToDatabase(payload);
          showToast(`"${name}" added successfully.`, 'success');
        }

        // Close modal and clear form
        closeSongModal();
        if (songForm) songForm.reset();

        // Reload fresh data from Supabase to show newly added song immediately & update total count
        await loadSongs(state.currentSearch);
      } catch (err) {
        console.error('[Admin Dashboard] Form submit error:', err);
        const errMessage = err.message || (id ? 'Failed to update song.' : 'Failed to add song.');
        showModalAlert(errMessage);
      } finally {
        if (saveSongBtn) saveSongBtn.disabled = false;
        if (saveBtnSpinner) saveBtnSpinner.style.display = 'none';
        if (saveBtnIcon) saveBtnIcon.style.display = 'inline';
      }
    });
  }

  // Confirm Deletion Click
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async function () {
      if (!state.pendingDeleteId) return;

      // 1. Verify authenticated Supabase session before write
      const session = await verifyAdminSession();
      if (!session) {
        const expiredMsg = 'Your admin session has expired. Please log in again.';
        showToast(expiredMsg, 'error');
        setTimeout(() => {
          window.location.replace('admin-login.html');
        }, 1800);
        return;
      }

      const id = state.pendingDeleteId;
      const song = state.allSongs.find((s) => String(s.Id) === String(id));
      const songTitle = song ? song.Song_name : 'Song';

      confirmDeleteBtn.disabled = true;
      if (deleteBtnSpinner) deleteBtnSpinner.style.display = 'inline-block';
      if (deleteBtnText) deleteBtnText.textContent = 'Deleting...';

      try {
        await deleteSongFromDatabase(id);
        closeDeleteModal();
        showToast(`"${songTitle}" deleted successfully.`, 'success');
        // Re-fetch from Supabase and update total count
        await loadSongs(state.currentSearch);
      } catch (err) {
        console.error('[Admin Dashboard] Delete error:', err);
        showToast(err.message || 'Failed to delete song from Supabase.', 'error');
      } finally {
        confirmDeleteBtn.disabled = false;
        if (deleteBtnSpinner) deleteBtnSpinner.style.display = 'none';
        if (deleteBtnText) deleteBtnText.textContent = 'Delete Song';
      }
    });
  }

  /* ============================================================
     EVENT LISTENERS & DELEGATION
     ============================================================ */

  function registerEventListeners() {
    // 1. Table action buttons delegation (View / Edit / Delete)
    if (songsTbody) {
      songsTbody.addEventListener('click', function (e) {
        const viewBtn = e.target.closest('.btn-action-view');
        const editBtn = e.target.closest('.btn-action-edit');
        const deleteBtn = e.target.closest('.btn-action-delete');

        if (viewBtn) {
          const id = viewBtn.getAttribute('data-id');
          if (id) openViewModal(id);
        } else if (editBtn) {
          const id = editBtn.getAttribute('data-id');
          if (id) openEditModal(id);
        } else if (deleteBtn) {
          const id = deleteBtn.getAttribute('data-id');
          if (id) openDeleteModal(id);
        }
      });
    }

    // 2. Add Song triggers across the dashboard
    if (addSongTopBtn) addSongTopBtn.addEventListener('click', openAddModal);
    if (addSongToolbarBtn) addSongToolbarBtn.addEventListener('click', openAddModal);
    if (quickAddBtn) quickAddBtn.addEventListener('click', openAddModal);
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', openAddModal);

    // 3. Modal close handlers
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeSongModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeSongModal);
    if (songModalBackdrop) songModalBackdrop.addEventListener('click', closeSongModal);

    if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (deleteModalBackdrop) deleteModalBackdrop.addEventListener('click', closeDeleteModal);

    if (closeViewModalBtn) closeViewModalBtn.addEventListener('click', closeViewModal);
    if (closeViewBtn) closeViewBtn.addEventListener('click', closeViewModal);
    if (viewModalBackdrop) viewModalBackdrop.addEventListener('click', closeViewModal);

    if (editFromViewBtn) {
      editFromViewBtn.addEventListener('click', function () {
        const idToEdit = state.currentViewingSongId;
        closeViewModal();
        if (idToEdit) openEditModal(idToEdit);
      });
    }

    // 4. Keyboard accessibility: Escape key closes active modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (songModal && songModal.classList.contains('active')) closeSongModal();
        if (deleteModal && deleteModal.classList.contains('active')) closeDeleteModal();
        if (viewModal && viewModal.classList.contains('active')) closeViewModal();
      }
    });

    // 5. Search input: Debounced real-time filter + Instant on Enter
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        const term = searchInput.value;
        clearTimeout(state.debounceTimer);
        state.debounceTimer = setTimeout(() => {
          applySearchFilter(term);
        }, 180);
      });

      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          clearTimeout(state.debounceTimer);
          applySearchFilter(searchInput.value);
        }
      });
    }

    // Search button
    if (searchBtn) {
      searchBtn.addEventListener('click', function () {
        clearTimeout(state.debounceTimer);
        applySearchFilter(searchInput ? searchInput.value : '');
      });
    }

    // Clear search buttons
    function clearSearch() {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      applySearchFilter('');
    }

    if (clearSearchBtn) clearSearchBtn.addEventListener('click', clearSearch);
    if (resetFilterBtn) resetFilterBtn.addEventListener('click', clearSearch);
    if (emptyClearBtn) emptyClearBtn.addEventListener('click', clearSearch);

    // 6. Refresh button: re-fetches all songs from Supabase public."Songs"
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async function () {
        refreshBtn.disabled = true;
        const icon = refreshBtn.querySelector('.btn-icon');
        if (icon) icon.classList.add('admin-spin');

        try {
          await loadSongs(searchInput ? searchInput.value : '');
          showToast('Catalog refreshed from Supabase.', 'info');
        } finally {
          refreshBtn.disabled = false;
          if (icon) icon.classList.remove('admin-spin');
        }
      });
    }

    // 7. Toast close button
    if (toastCloseBtn) {
      toastCloseBtn.addEventListener('click', hideToast);
    }

    // 8. Logout action
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function () {
        if (confirm('Are you sure you want to log out?')) {
          if (window.AdminAuth && typeof window.AdminAuth.logout === 'function') {
            await window.AdminAuth.logout();
          } else {
            const supabase = getSupabase();
            if (supabase) await supabase.auth.signOut();
            window.location.replace('admin-login.html');
          }
        }
      });
    }
  }

  /* ============================================================
     INITIALIZATION & SESSION CHECK
     ============================================================ */
  async function init() {
    console.log('[Admin Dashboard] Initializing...');

    // 1. Immediately wire up all interactive event listeners
    registerEventListeners();

    // 2. Wait for Supabase SDK to be ready
    await waitForSupabase();

    // 3. Immediately query Supabase public."Songs" and render table + stats
    await loadSongs('');

    // 4. Verify admin auth session
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[Admin Dashboard] Initial session:', session);
        if (session && session.user) {
          state.user = session.user;
          if (navAdminEmail) {
            navAdminEmail.textContent = session.user.email || 'Admin';
          }
        }
      } catch (e) {
        console.warn('[Admin Dashboard] Session check notice:', e);
      }
    }

    // 5. Admin session verification listener
    if (window.AdminAuth && typeof window.AdminAuth.requireSession === 'function') {
      window.AdminAuth.requireSession(function (user) {
        state.user = user;
        if (navAdminEmail && user && user.email) {
          navAdminEmail.textContent = user.email;
        }
      });
    }
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
