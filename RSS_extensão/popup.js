document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  const syncBtn = document.getElementById('sync-btn');
  const syncIcon = document.getElementById('sync-icon');
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const newsList = document.getElementById('news-list');
  const skeletons = document.getElementById('skeletons');
  const emptyState = document.getElementById('empty-state');
  const emptySyncBtn = document.getElementById('empty-sync-btn');
  const brandLink = document.getElementById('brand-link');

  // Elementos do Leitor Overlay
  const readerOverlay = document.getElementById('reader-overlay');
  const readerCloseBtn = document.getElementById('reader-close-btn');
  const readerBookmarkBtn = document.getElementById('reader-bookmark-btn');
  const readerCategoryBadge = document.getElementById('reader-category-badge');
  const readerPubDate = document.getElementById('reader-pub-date');
  const readerTitleContent = document.getElementById('reader-title-content');
  const readerTextContent = document.getElementById('reader-text-content');
  const readerOriginalLink = document.getElementById('reader-original-link');
  const readerTagsContainer = document.getElementById('reader-tags');
  const readerProgressBar = document.getElementById('reader-progress-bar');
  
  // Elementos Extras do Leitor
  const readerSpeakBtn = document.getElementById('reader-speak-btn');
  const readerSpeakRate = document.getElementById('reader-speak-rate');
  const readerExportTxtBtn = document.getElementById('reader-export-txt-btn');
  const readerZenBtn = document.getElementById('reader-zen-btn');

  // Elementos de Configurações
  const settingsBtn = document.getElementById('settings-btn');
  const openTabBtn = document.getElementById('open-tab-btn');
  const settingsOverlay = document.getElementById('settings-overlay');
  const settingsCloseBtn = document.getElementById('settings-close-btn');
  
  // Controles de Visualização
  const settingViewMode = document.getElementById('setting-view-mode');
  const settingSortOrder = document.getElementById('setting-sort-order');
  const settingFontSize = document.getElementById('setting-font-size');
  const settingFontFamily = document.getElementById('setting-font-family');
  const settingSyncInterval = document.getElementById('setting-sync-interval');

  // Controles de Feeds RSS
  const feedNameInput = document.getElementById('feed-name-input');
  const feedUrlInput = document.getElementById('feed-url-input');
  const feedCategorySelect = document.getElementById('feed-category-select');
  const addFeedBtn = document.getElementById('add-feed-btn');
  const addFeedStatus = document.getElementById('add-feed-status');
  const feedsList = document.getElementById('feeds-list');
  
  // Elementos do Gerenciador de Pastas
  const categoryNameInput = document.getElementById('category-name-input');
  const addCategoryBtn = document.getElementById('add-category-btn');
  const addCategoryStatus = document.getElementById('add-category-status');
  const categoriesList = document.getElementById('categories-list');
  const categoriesNav = document.getElementById('categories-nav');

  // Controles de Backup
  const exportOpmlBtn = document.getElementById('export-opml-btn');
  const importOpmlBtn = document.getElementById('import-opml-btn');
  const opmlFileInput = document.getElementById('opml-file-input');
  const opmlStatus = document.getElementById('opml-status');

  // Filtro de Datas
  const settingDateShortcut = document.getElementById('setting-date-shortcut');
  const customDateContainer = document.getElementById('custom-date-container');
  const customDatePicker = document.getElementById('custom-date-picker');

  // Marcar todas como lidas
  const markAllReadBtn = document.getElementById('mark-all-read-btn');

  // Dashboard de Estatísticas & Histórico
  const statsTotalRead = document.getElementById('stats-total-read');
  const statsTimeSaved = document.getElementById('stats-time-saved');
  const statsActiveFeeds = document.getElementById('stats-active-feeds');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  // Dicionário do Glossário Econômico (Wow Factor)
  const GLOSSARY = {
    'selic': 'Taxa básica de juros da economia brasileira, definida pelo Copom.',
    'copom': 'Comitê de Política Monetária do BCB, responsável por definir a taxa Selic.',
    'ptax': 'Taxa média de câmbio calculada diariamente pelo Banco Central do Brasil.',
    'ipca': 'Índice de Preços ao Consumidor Amplo, o indicador oficial da inflação no Brasil.',
    'pix': 'Meio de pagamento eletrônico instantâneo criado pelo Banco Central do Brasil.',
    'ted': 'Transferência Eletrônica Disponível, transação bancária enviada no mesmo dia.',
    'bacen': 'Apelido comum para o Banco Central do Brasil.',
    'bcb': 'Banco Central do Brasil, a autoridade monetária do país.',
    'pib': 'Produto Interno Bruto, soma de todos os bens e serviços produzidos no país.',
    'inflação': 'Aumento persistente e generalizado dos preços de bens e serviços.'
  };

  // Palavras de alto impacto financeiro (Filtro Relevância)
  const HIGH_RELEVANCE_WORDS = ['selic', 'copom', 'ptax', 'taxa juros', 'pib', 'inflação', 'câmbio', 'dólar', 'resolução'];

  // Estado Local da Extensão
  let state = {
    feeds: [],
    categories: [],
    newsItems: [],
    readIds: new Set(),
    bookmarkedIds: new Set(),
    history: [],
    activeCategory: 'all',
    searchQuery: '',
    dateShortcut: 'all',
    customDate: '',
    currentReaderItem: null,
    isSpeaking: false,
    utterance: null,
    settings: {
      theme: 'editorial-sepia',
      viewMode: 'list',
      sortOrder: 'date-desc',
      fontSize: 'text-md',
      fontFamily: 'font-sans',
      syncInterval: 15,
      totalReadCount: 0,
      totalMinutesSaved: 0
    }
  };

  // Inicialização
  init();

  async function init() {
    checkViewportMode();
    await loadStateFromStorage();
    
    renderCategoriesSelect();
    renderCategoriesList();
    renderCategoriesTabs();
    applyTheme(state.settings.theme);
    applyReadingPreferences();
    updateStatsDashboard();

    setupEventListeners();
    renderFeed();

    if (state.newsItems.length === 0) {
      triggerSync();
    }
  }

  function renderCategoriesTabs() {
    if (state.activeCategory !== 'all' && state.activeCategory !== 'saved') {
      const activeCatExistsAndHasFeeds = state.categories.some(cat => 
        cat.id === state.activeCategory && state.feeds.some(f => f.id.startsWith(cat.id) && !f.disabled)
      );
      if (!activeCatExistsAndHasFeeds) {
        state.activeCategory = 'all';
      }
    }

    categoriesNav.innerHTML = '';

    // 1. Botão "Todos"
    const tabAll = document.createElement('button');
    tabAll.className = `tab-btn${state.activeCategory === 'all' ? ' active' : ''}`;
    tabAll.id = 'tab-all';
    tabAll.dataset.category = 'all';
    tabAll.textContent = 'Todos';
    tabAll.addEventListener('click', () => handleTabClick('all', tabAll));
    categoriesNav.appendChild(tabAll);

    // 2. Abas de Categorias dinâmicas
    state.categories.forEach(cat => {
      const hasActiveFeed = state.feeds.some(f => f.id.startsWith(cat.id) && !f.disabled);
      if (!hasActiveFeed) return;

      const btn = document.createElement('button');
      btn.className = `tab-btn${state.activeCategory === cat.id ? ' active' : ''}`;
      btn.id = `tab-${cat.id}`;
      btn.dataset.category = cat.id;
      btn.textContent = cat.name;
      btn.addEventListener('click', () => handleTabClick(cat.id, btn));
      categoriesNav.appendChild(btn);
    });

    // 3. Botão "★ Salvos"
    const tabSaved = document.createElement('button');
    tabSaved.className = `tab-btn${state.activeCategory === 'saved' ? ' active' : ''}`;
    tabSaved.id = 'tab-saved';
    tabSaved.dataset.category = 'saved';
    tabSaved.textContent = '★ Salvos';
    tabSaved.addEventListener('click', () => handleTabClick('saved', tabSaved));
    categoriesNav.appendChild(tabSaved);
  }

  function handleTabClick(categoryId, tabBtn) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('active');
    state.activeCategory = categoryId;
    renderFeed();
  }

  function checkViewportMode() {
    if (window.innerWidth > 600) {
      body.classList.add('full-tab');
      if (openTabBtn) openTabBtn.style.display = 'none';
    } else {
      body.classList.remove('full-tab');
      if (openTabBtn) openTabBtn.style.display = 'flex';
    }
  }

  async function loadStateFromStorage() {
    const data = await chrome.storage.local.get(['feeds', 'categories', 'newsItems', 'readIds', 'bookmarkedIds', 'settings', 'history']);
    state.feeds = data.feeds || [];
    state.newsItems = data.newsItems || [];
    state.readIds = new Set(data.readIds || []);
    state.bookmarkedIds = new Set(data.bookmarkedIds || []);
    state.history = data.history || [];
    
    // Inicializa pastas/categorias se estiver vazio
    state.categories = data.categories || [
      { id: 'noticias', name: 'Notícias' },
      { id: 'notastecnicas', name: 'Notas Técnicas' },
      { id: 'comunicados', name: 'Comunicados' },
      { id: 'normativos', name: 'Normativos' }
    ];
    if (!data.categories) {
      await chrome.storage.local.set({ categories: state.categories });
    }

    state.settings = {
      theme: 'editorial-sepia',
      viewMode: 'list',
      sortOrder: 'date-desc',
      fontSize: 'text-md',
      fontFamily: 'font-sans',
      syncInterval: 15,
      totalReadCount: 0,
      totalMinutesSaved: 0,
      ...data.settings
    };
  }

  async function saveStateToStorage(keys = ['feeds', 'categories', 'readIds', 'bookmarkedIds', 'settings', 'history']) {
    const saveData = {};
    if (keys.includes('feeds')) saveData.feeds = state.feeds;
    if (keys.includes('categories')) saveData.categories = state.categories;
    if (keys.includes('readIds')) saveData.readIds = Array.from(state.readIds);
    if (keys.includes('bookmarkedIds')) saveData.bookmarkedIds = Array.from(state.bookmarkedIds);
    if (keys.includes('settings')) saveData.settings = state.settings;
    if (keys.includes('history')) saveData.history = state.history;
    await chrome.storage.local.set(saveData);
  }

  function applyReadingPreferences() {
    if (state.settings.viewMode === 'grid') {
      newsList.classList.add('grid-mode');
      settingViewMode.value = 'grid';
    } else {
      newsList.classList.remove('grid-mode');
      settingViewMode.value = 'list';
    }

    settingSortOrder.value = state.settings.sortOrder;
    settingFontSize.value = state.settings.fontSize;
    updateFontSizeClass();

    settingFontFamily.value = state.settings.fontFamily;
    updateFontFamilyClass();

    settingSyncInterval.value = state.settings.syncInterval;
  }

  function updateFontSizeClass() {
    readerOverlay.classList.remove('text-sm', 'text-md', 'text-lg');
    newsList.classList.remove('text-sm', 'text-md', 'text-lg');
    readerOverlay.classList.add(state.settings.fontSize);
    newsList.classList.add(state.settings.fontSize);
  }

  function updateFontFamilyClass() {
    readerOverlay.classList.remove('font-serif', 'font-sans');
    readerOverlay.classList.add(state.settings.fontFamily);
  }

  function updateStatsDashboard() {
    statsTotalRead.textContent = state.settings.totalReadCount || 0;
    statsTimeSaved.textContent = `${state.settings.totalMinutesSaved || 0}m`;
    
    // Conta feeds ativos (não desativados)
    const activeFeedsCount = state.feeds.filter(f => !f.disabled).length;
    statsActiveFeeds.textContent = activeFeedsCount;
  }

  function setupEventListeners() {
    window.addEventListener('resize', checkViewportMode);

    brandLink.addEventListener('click', () => {
      state.searchQuery = '';
      searchInput.value = '';
      searchClearBtn.style.display = 'none';
      
      settingDateShortcut.value = 'all';
      customDateContainer.style.display = 'none';
      state.dateShortcut = 'all';
      
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      const tabAll = document.getElementById('tab-all');
      if (tabAll) tabAll.classList.add('active');
      state.activeCategory = 'all';
      
      renderFeed();
    });

    if (openTabBtn) {
      openTabBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
      });
    }

    themeToggle.addEventListener('click', () => {
      const themes = ['editorial-sepia', 'light', 'dark'];
      let currentIndex = themes.indexOf(state.settings.theme);
      let nextIndex = (currentIndex + 1) % themes.length;
      state.settings.theme = themes[nextIndex];
      applyTheme(state.settings.theme);
      saveStateToStorage(['settings']);
    });

    // Filtros de Data
    settingDateShortcut.addEventListener('change', (e) => {
      state.dateShortcut = e.target.value;
      if (state.dateShortcut === 'custom') {
        customDateContainer.style.display = 'block';
      } else {
        customDateContainer.style.display = 'none';
      }
      renderFeed();
    });

    customDatePicker.addEventListener('change', (e) => {
      state.customDate = e.target.value; // Formato YYYY-MM-DD
      renderFeed();
    });

    // Configurações e preferências
    settingsBtn.addEventListener('click', openSettingsPanel);
    settingsCloseBtn.addEventListener('click', closeSettingsPanel);

    settingViewMode.addEventListener('change', (e) => {
      state.settings.viewMode = e.target.value;
      applyReadingPreferences();
      saveStateToStorage(['settings']);
    });

    settingSortOrder.addEventListener('change', (e) => {
      state.settings.sortOrder = e.target.value;
      saveStateToStorage(['settings']);
      renderFeed();
    });

    settingFontSize.addEventListener('change', (e) => {
      state.settings.fontSize = e.target.value;
      applyReadingPreferences();
      saveStateToStorage(['settings']);
    });

    settingFontFamily.addEventListener('change', (e) => {
      state.settings.fontFamily = e.target.value;
      applyReadingPreferences();
      saveStateToStorage(['settings']);
    });

    settingSyncInterval.addEventListener('change', (e) => {
      state.settings.syncInterval = Number(e.target.value);
      saveStateToStorage(['settings']);
    });

    // Adição, exclusão e limpeza de feeds
    addFeedBtn.addEventListener('click', handleAddFeed);
    exportOpmlBtn.addEventListener('click', handleExportOPML);
    importOpmlBtn.addEventListener('click', () => opmlFileInput.click());
    opmlFileInput.addEventListener('change', handleImportOPML);

    // Limpeza de histórico
    clearHistoryBtn.addEventListener('click', handleClearHistory);

    // Ouvir Notícia (Text-to-Speech)
    readerSpeakBtn.addEventListener('click', handleToggleSpeak);
    readerSpeakRate.addEventListener('change', () => {
      if (state.isSpeaking) {
        // Reinicia fala com velocidade alterada
        stopSpeak();
        startSpeak();
      }
    });

    // Exportar notícia TXT e Zen Mode
    readerExportTxtBtn.addEventListener('click', handleExportNewsTxt);
    readerZenBtn.addEventListener('click', handleToggleZenMode);

    // Scroll progress bar in reader
    readerOverlay.querySelector('.reader-body').addEventListener('scroll', handleReaderScroll);

    // Sincronização
    syncBtn.addEventListener('click', triggerSync);
    emptySyncBtn.addEventListener('click', triggerSync);
    markAllReadBtn.addEventListener('click', handleMarkAllAsRead);

    addCategoryBtn.addEventListener('click', handleAddCategory);

    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
      renderFeed();
    });

    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      searchClearBtn.style.display = 'none';
      renderFeed();
      searchInput.focus();
    });

    readerCloseBtn.addEventListener('click', closeReader);

    readerBookmarkBtn.addEventListener('click', () => {
      if (!state.currentReaderItem) return;
      toggleBookmark(state.currentReaderItem.guid);
      updateReaderBookmarkState();
    });
  }

  function applyTheme(theme) {
    body.classList.remove('editorial-sepia', 'light', 'dark');
    body.classList.add(theme);
  }

  function openSettingsPanel() {
    renderCategoriesSelect();
    renderCategoriesList();
    renderFeedsList();
    renderHistoryList();
    updateStatsDashboard();
    
    settingsOverlay.style.display = 'flex';
    settingsOverlay.setAttribute('aria-hidden', 'false');
    addFeedStatus.textContent = '';
    opmlStatus.textContent = '';
    
    setTimeout(() => {
      settingsOverlay.classList.add('active');
    }, 10);
  }

  function closeSettingsPanel() {
    settingsOverlay.classList.remove('active');
    settingsOverlay.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      settingsOverlay.style.display = 'none';
    }, 300);
  }

  // ==========================================================================
  // GERENCIADOR DE PASTAS (CATEGORIAS DINÂMICAS)
  // ==========================================================================
  function renderCategoriesSelect() {
    feedCategorySelect.innerHTML = '';
    state.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      feedCategorySelect.appendChild(opt);
    });
  }

  function renderCategoriesList() {
    categoriesList.innerHTML = '';
    state.categories.forEach((cat, index) => {
      const li = document.createElement('li');
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'feed-title-txt';
      nameSpan.textContent = cat.name;
      li.appendChild(nameSpan);

      const actions = document.createElement('div');
      actions.className = 'feed-item-actions';

      // Botão Renomear / Editar
      const editBtn = document.createElement('button');
      editBtn.className = 'category-edit-btn';
      editBtn.textContent = 'Renomear';
      editBtn.addEventListener('click', () => handleEditCategory(index));
      actions.appendChild(editBtn);

      // Botão Excluir Pasta (exige pelo menos 1 pasta ativa)
      const delBtn = document.createElement('button');
      delBtn.className = 'feed-delete-btn';
      delBtn.innerHTML = '&times;';
      delBtn.setAttribute('title', 'Remover esta pasta');
      delBtn.addEventListener('click', () => handleDeleteCategory(index));
      actions.appendChild(delBtn);

      li.appendChild(actions);
      categoriesList.appendChild(li);
    });
  }

  async function handleAddCategory() {
    const name = categoryNameInput.value.trim();
    if (!name) {
      showStatus(addCategoryStatus, 'Por favor, digite o nome da pasta.', 'error');
      return;
    }

    const cleanName = name.replace(/[^a-zA-Z0-9\sáéíóúâêôãõç]/g, '');
    const id = cleanName.toLowerCase()
      .replace(/\s+/g, '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove acentos do ID

    if (!id) {
      showStatus(addCategoryStatus, 'Nome de pasta inválido.', 'error');
      return;
    }

    if (state.categories.some(c => c.id === id)) {
      showStatus(addCategoryStatus, 'Esta pasta já existe.', 'error');
      return;
    }

    state.categories.push({ id, name: name });
    await saveStateToStorage(['categories']);
    
    categoryNameInput.value = '';
    showStatus(addCategoryStatus, `Pasta "${name}" criada com sucesso!`, 'success');
    
    renderCategoriesSelect();
    renderCategoriesList();
    renderCategoriesTabs();
    renderFeed();
  }

  async function handleEditCategory(index) {
    const cat = state.categories[index];
    const newName = prompt(`Digite o novo nome para a pasta "${cat.name}":`, cat.name);
    if (newName === null) return;
    
    const trimmed = newName.trim();
    if (!trimmed) {
      alert('O nome da pasta não pode ser vazio.');
      return;
    }

    if (validateSecurityChallenge(`Renomear pasta de "${cat.name}" para "${trimmed}"`)) {
      cat.name = trimmed;
      await saveStateToStorage(['categories']);
      
      renderCategoriesSelect();
      renderCategoriesList();
      renderCategoriesTabs();
      renderFeed();
    }
  }

  async function handleDeleteCategory(index) {
    if (state.categories.length <= 1) {
      alert('Você deve manter pelo menos uma pasta cadastrada.');
      return;
    }

    const cat = state.categories[index];
    const feedsInCat = state.feeds.filter(f => f.id.startsWith(cat.id));

    let confirmMsg = `Excluir a pasta "${cat.name}"`;
    if (feedsInCat.length > 0) {
      confirmMsg += ` (e remover também todos os ${feedsInCat.length} canais de feed atrelados a ela!)`;
    }

    if (validateSecurityChallenge(confirmMsg)) {
      state.feeds = state.feeds.filter(f => !f.id.startsWith(cat.id));
      const feedIds = new Set(feedsInCat.map(f => f.id));
      state.newsItems = state.newsItems.filter(item => !feedIds.has(item.feedId));

      state.categories.splice(index, 1);

      await saveStateToStorage(['categories', 'feeds']);
      await chrome.storage.local.set({ newsItems: state.newsItems });

      renderCategoriesSelect();
      renderCategoriesList();
      renderFeedsList();
      renderCategoriesTabs();
      updateStatsDashboard();
      renderFeed();
    }
  }

  // ==========================================================================
  // DRAG & DROP & TOGGLE FEEDS LIST
  // ==========================================================================
  let dragSourceEl = null;

  function renderFeedsList() {
    feedsList.innerHTML = '';
    state.feeds.forEach((feed, idx) => {
      const li = document.createElement('li');
      li.setAttribute('draggable', 'true');
      li.dataset.index = idx;
      
      // Handle de arrastar
      const dragHandle = document.createElement('span');
      dragHandle.className = 'feed-drag-handle';
      dragHandle.innerHTML = '☰';
      li.appendChild(dragHandle);

      // Informações do feed
      const info = document.createElement('div');
      info.className = 'feed-info';
      
      const title = document.createElement('span');
      title.className = 'feed-title-txt';
      title.textContent = feed.name;
      if (feed.disabled) {
        title.style.textDecoration = 'line-through';
        title.style.opacity = '0.5';
      }
      
      const url = document.createElement('span');
      url.className = 'feed-url-txt';
      url.textContent = feed.url;

      info.appendChild(title);
      info.appendChild(url);
      li.appendChild(info);

      const actions = document.createElement('div');
      actions.className = 'feed-item-actions';

      // Toggle Switch (Ligar / Desligar)
      const toggleLabel = document.createElement('label');
      toggleLabel.className = 'switch';
      toggleLabel.setAttribute('title', feed.disabled ? 'Ativar feed' : 'Inativar feed');
      
      const toggleInput = document.createElement('input');
      toggleInput.type = 'checkbox';
      toggleInput.checked = !feed.disabled;
      
      toggleInput.addEventListener('change', () => {
        handleToggleFeed(idx);
      });

      const toggleSlider = document.createElement('span');
      toggleSlider.className = 'slider';

      toggleLabel.appendChild(toggleInput);
      toggleLabel.appendChild(toggleSlider);
      actions.appendChild(toggleLabel);

      // Qualquer feed pode ser excluído
      const delBtn = document.createElement('button');
      delBtn.className = 'feed-delete-btn';
      delBtn.innerHTML = '&times;';
      delBtn.setAttribute('title', 'Remover este feed');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteFeed(feed.id);
      });
      actions.appendChild(delBtn);

      li.appendChild(actions);

      // Eventos de Drag & Drop HTML5
      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragover', handleDragOver);
      li.addEventListener('dragleave', handleDragLeave);
      li.addEventListener('drop', handleDrop);
      li.addEventListener('dragend', handleDragEnd);

      feedsList.appendChild(li);
    });
  }

  // Liga/Desliga o feed
  async function handleToggleFeed(index) {
    const feed = state.feeds[index];
    feed.disabled = !feed.disabled;
    await saveStateToStorage(['feeds']);
    renderFeedsList();
    updateStatsDashboard();
    renderFeed();
  }

  // Drag and Drop Handlers
  function handleDragStart(e) {
    this.style.opacity = '0.4';
    dragSourceEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    this.classList.add('drag-over');
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  function handleDragLeave() {
    this.classList.remove('drag-over');
  }

  async function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    
    this.classList.remove('drag-over');

    if (dragSourceEl !== this) {
      const srcIdx = Number(dragSourceEl.dataset.index);
      const targetIdx = Number(this.dataset.index);

      // Reordena o array de feeds na memória
      const temp = state.feeds[srcIdx];
      state.feeds.splice(srcIdx, 1);
      state.feeds.splice(targetIdx, 0, temp);

      // Persiste a nova ordem no storage
      await saveStateToStorage(['feeds']);
      renderFeedsList();
      renderFeed();
    }
    return false;
  }

  function handleDragEnd() {
    this.style.opacity = '1';
    const items = feedsList.querySelectorAll('li');
    items.forEach(item => item.classList.remove('drag-over'));
  }

  async function handleDeleteFeed(feedId) {
    const feed = state.feeds.find(f => f.id === feedId);
    const feedName = feed ? feed.name : 'este feed';
    
    if (validateSecurityChallenge(`Excluir o canal de feed "${feedName}" (todas as notícias vinculadas a ele serão apagadas)`)) {
      state.feeds = state.feeds.filter(f => f.id !== feedId);
      state.newsItems = state.newsItems.filter(item => item.feedId !== feedId);
      await saveStateToStorage(['feeds']);
      await chrome.storage.local.set({ newsItems: state.newsItems });
      
      renderFeedsList();
      updateStatsDashboard();
      renderFeed();
    }
  }

  // ==========================================================================
  // FEED ADD & VALIDATION
  // ==========================================================================
  async function handleAddFeed() {
    const name = feedNameInput.value.trim();
    const url = feedUrlInput.value.trim();
    const category = feedCategorySelect.value;

    if (!name || !url) {
      showStatus(addFeedStatus, 'Por favor, preencha todos os campos.', 'error');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      showStatus(addFeedStatus, 'A URL do feed deve começar com http:// ou https://', 'error');
      return;
    }

    addFeedBtn.setAttribute('disabled', 'true');
    showStatus(addFeedStatus, 'Validando conexão com o feed...', 'success');

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const xmlText = await response.text();
      
      const isValid = xmlText.includes('<rss') || xmlText.includes('<feed') || xmlText.includes('<xml');
      if (!isValid) throw new Error('A URL respondeu, mas não retornou um feed XML válido.');

      const newFeed = {
        id: category + '_' + Date.now(),
        name: name,
        url: url,
        custom: true,
        disabled: false
      };

      state.feeds.push(newFeed);
      await saveStateToStorage(['feeds']);

      feedNameInput.value = '';
      feedUrlInput.value = '';
      
      showStatus(addFeedStatus, `Feed "${name}" adicionado! Sincronizando...`, 'success');
      renderFeedsList();
      updateStatsDashboard();
      triggerSync();
    } catch (err) {
      showStatus(addFeedStatus, `Falha: ${err.message}`, 'error');
    } finally {
      addFeedBtn.removeAttribute('disabled');
    }
  }

  // ==========================================================================
  // TEXT-TO-SPEECH (TTS) - OUVIR NOTÍCIA
  // ==========================================================================
  function handleToggleSpeak() {
    if (state.isSpeaking) {
      stopSpeak();
    } else {
      startSpeak();
    }
  }

  function startSpeak() {
    if (!state.currentReaderItem) return;

    const title = state.currentReaderItem.title;
    const descText = (state.currentReaderItem.description || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();

    const textToSpeak = `${title}. ${descText}`;

    state.utterance = new SpeechSynthesisUtterance(textToSpeak);
    state.utterance.lang = 'pt-BR';
    state.utterance.rate = Number(readerSpeakRate.value);

    // Ajusta visual
    readerSpeakBtn.classList.add('playing');
    readerSpeakBtn.setAttribute('title', 'Pausar áudio');
    state.isSpeaking = true;

    state.utterance.onend = () => {
      resetSpeakBtn();
    };

    state.utterance.onerror = () => {
      resetSpeakBtn();
    };

    window.speechSynthesis.speak(state.utterance);
  }

  function stopSpeak() {
    window.speechSynthesis.cancel();
    resetSpeakBtn();
  }

  function resetSpeakBtn() {
    readerSpeakBtn.classList.remove('playing');
    readerSpeakBtn.setAttribute('title', 'Ouvir notícia');
    state.isSpeaking = false;
  }

  // ==========================================================================
  // GLOSSÁRIO ECONÔMICO (INTELLIGENT TOOLTIPS)
  // ==========================================================================
  function applyGlossaryMarkup(text) {
    let markedText = text;
    
    // Ordena chaves por tamanho decrescente para evitar substituições parciais em termos parecidos (ex: "Selic" antes de "Se")
    const sortedKeys = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

    sortedKeys.forEach(term => {
      const tooltip = GLOSSARY[term];
      // Regex que substitui a palavra inteira de forma case-insensitive
      const regex = new RegExp(`\\b(${term}s?)\\b`, 'gi');
      
      // Envelopa a palavra correspondente na tag .glossary-term
      markedText = markedText.replace(regex, `<span class="glossary-term" data-tooltip="${tooltip}">$1</span>`);
    });

    return markedText;
  }

  // Gerencia ativação manual do tooltip via JS para evitar vazamentos visuais
  function setupGlossaryTooltips() {
    const terms = readerTextContent.querySelectorAll('.glossary-term');
    terms.forEach(term => {
      term.addEventListener('mouseenter', function() {
        const desc = this.getAttribute('data-tooltip');
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-box';
        tooltip.textContent = desc;
        
        this.appendChild(tooltip);
      });

      term.addEventListener('mouseleave', function() {
        const box = this.querySelector('.tooltip-box');
        if (box) box.remove();
      });
    });
  }

  // ==========================================================================
  // ESTATÍSTICAS & HISTÓRICO
  // ==========================================================================
  async function recordArticleReading(item) {
    // 1. Evita contabilizar duplicados
    if (state.readIds.has(item.guid)) return;

    // Marca como lido
    state.readIds.add(item.guid);
    
    // Contabiliza métricas
    state.settings.totalReadCount = (state.settings.totalReadCount || 0) + 1;
    
    // Calcula tempo de leitura (150 palavras por minuto)
    const textLength = (item.title + ' ' + (item.description || '')).split(/\s+/).length;
    const readTime = Math.max(1, Math.round(textLength / 150));
    state.settings.totalMinutesSaved = (state.settings.totalMinutesSaved || 0) + readTime;

    // 2. Grava no Histórico
    const historyItem = {
      guid: item.guid,
      title: item.title,
      date: Date.now()
    };

    // Remove do histórico se já existia (joga pro topo)
    state.history = state.history.filter(h => h.guid !== item.guid);
    state.history.unshift(historyItem);
    
    // Limita histórico a 20 registros
    if (state.history.length > 20) {
      state.history.pop();
    }

    await saveStateToStorage(['readIds', 'settings', 'history']);
    updateStatsDashboard();
  }

  function renderHistoryList() {
    historyList.innerHTML = '';
    if (state.history.length === 0) {
      const li = document.createElement('li');
      li.style.color = 'var(--text-secondary)';
      li.style.fontStyle = 'italic';
      li.textContent = 'Histórico vazio.';
      historyList.appendChild(li);
      return;
    }

    state.history.slice(0, 5).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.title;
      li.setAttribute('title', item.title);
      historyList.appendChild(li);
    });
  }

  async function handleClearHistory() {
    if (validateSecurityChallenge('Limpar histórico de leitura recente e zerar estatísticas')) {
      state.history = [];
      state.settings.totalReadCount = 0;
      state.settings.totalMinutesSaved = 0;
      await saveStateToStorage(['settings', 'history']);
      
      renderHistoryList();
      updateStatsDashboard();
    }
  }

  // ==========================================================================
  // ZEN MODE & SCROLL PROGRESS BAR
  // ==========================================================================
  function handleToggleZenMode() {
    const isZen = readerOverlay.classList.toggle('zen-mode');
    readerZenBtn.classList.toggle('active', isZen);
  }

  function handleReaderScroll(e) {
    const target = e.target;
    const scrollPercent = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
    readerProgressBar.style.width = `${scrollPercent}%`;
  }

  // Exportar notícia em TXT
  function handleExportNewsTxt() {
    if (!state.currentReaderItem) return;
    
    const item = state.currentReaderItem;
    const plainDesc = (item.description || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();

    let txt = `==================================================\n`;
    txt += `  RSS Reader - Exportação de Notícia\n`;
    txt += `==================================================\n\n`;
    txt += `Título: ${item.title}\n`;
    txt += `Canal: ${item.feedName || 'BCB'}\n`;
    txt += `Data de Publicação: ${new Date(item.pubDate).toLocaleString('pt-BR')}\n`;
    txt += `Link Original: ${item.link}\n\n`;
    txt += `--------------------------------------------------\n`;
    txt += `${plainDesc}\n`;
    txt += `--------------------------------------------------\n\n`;
    txt += `Exportado em: ${new Date().toLocaleString('pt-BR')}\n`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    // Nome do arquivo seguro
    const safeTitle = item.title.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `noticia_${safeTitle}.txt`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  }

  // ==========================================================================
  // BACKUP EXPORT & IMPORT OPML
  // ==========================================================================
  function handleExportOPML() {
    try {
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<opml version="2.0">\n`;
      xml += `  <head>\n`;
      xml += `    <title>Feeds RSS Exportados</title>\n`;
      xml += `  </head>\n`;
      xml += `  <body>\n`;
      xml += `    <outline text="Minhas Assinaturas">\n`;
      
      state.feeds.forEach(feed => {
        const cleanName = feed.name.replace(/"/g, '&quot;');
        const cleanUrl = feed.url.replace(/"/g, '&quot;');
        const cleanCat = feed.id.split('_')[0];
        
        xml += `      <outline type="rss" text="${cleanName}" xmlUrl="${cleanUrl}" category="${cleanCat}" />\n`;
      });

      xml += `    </outline>\n`;
      xml += `  </body>\n`;
      xml += `</opml>`;

      const blob = new Blob([xml], { type: 'text/xml' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'rss_reader_feeds.opml';
      a.click();
      URL.revokeObjectURL(downloadUrl);
      
      showStatus(opmlStatus, 'Backup exportado com sucesso!', 'success');
    } catch (e) {
      showStatus(opmlStatus, `Falha ao exportar: ${e.message}`, 'error');
    }
  }

  function handleImportOPML(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const xmlText = event.target.result;
        const outlineRegex = /<outline[^>]*xmlUrl=["']([^"']+)["'][^>]*>/g;
        let match;
        let count = 0;
        
        const currentUrls = new Set(state.feeds.map(f => f.url.toLowerCase()));

        while ((match = outlineRegex.exec(xmlText)) !== null) {
          const tag = match[0];
          const url = match[1];

          if (currentUrls.has(url.toLowerCase())) continue;

          const textMatch = tag.match(/text=["']([^"']+)["']/i) || tag.match(/title=["']([^"']+)["']/i);
          const name = textMatch ? textMatch[1] : 'Feed Importado';

          const catMatch = tag.match(/category=["']([^"']+)["']/i);
          const category = catMatch ? catMatch[1] : 'noticias';

          // Garante que a categoria exista no gerenciador de pastas
          if (!state.categories.some(c => c.id === category)) {
            const catName = category.charAt(0).toUpperCase() + category.slice(1);
            state.categories.push({ id: category, name: catName });
          }

          state.feeds.push({
            id: category + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: name,
            url: url,
            custom: true,
            disabled: false
          });
          count++;
        }

        if (count > 0) {
          await saveStateToStorage(['feeds', 'categories']);
          renderCategoriesSelect();
          renderCategoriesList();
          renderCategoriesTabs();
          renderFeedsList();
          updateStatsDashboard();
          showStatus(opmlStatus, `${count} canais importados! Sincronizando...`, 'success');
          triggerSync();
        } else {
          showStatus(opmlStatus, 'Nenhum canal novo encontrado no arquivo OPML.', 'error');
        }
      } catch (err) {
        showStatus(opmlStatus, `Falha na importação: ${err.message}`, 'error');
      } finally {
        opmlFileInput.value = '';
      }
    };
    reader.readAsText(file);
  }

  // ==========================================================================
  // INBOX ZERO & FEED SYNCING
  // ==========================================================================
  async function handleMarkAllAsRead() {
    let visibleItems = filterNewsItems(state.newsItems);
    if (visibleItems.length === 0) return;

    if (confirm(`Marcar todas as ${visibleItems.length} notícias visíveis como lidas?`)) {
      visibleItems.forEach(item => {
        state.readIds.add(item.guid);
      });
      await saveStateToStorage(['readIds']);
      
      // Notifica o background service worker para sincronizar o contador de badges
      chrome.runtime.sendMessage({ action: 'sync' });
      renderFeed();
    }
  }

  function triggerSync() {
    syncBtn.classList.add('syncing');
    syncBtn.setAttribute('disabled', 'true');
    newsList.style.display = 'none';
    skeletons.style.display = 'flex';
    emptyState.style.display = 'none';

    const applySyncResult = async (response) => {
      syncBtn.classList.remove('syncing');
      syncBtn.removeAttribute('disabled');
      await loadStateFromStorage();
      renderFeed();

      const meta = window.__rssWebMeta;
      if ((!response || !response.success) && state.newsItems.length === 0) {
        const emptyTitle = emptyState.querySelector('h3');
        const emptyDesc = emptyState.querySelector('p');
        emptyTitle.textContent = 'Não foi possível sincronizar';
        if (meta && meta.isFileProtocol) {
          emptyDesc.innerHTML = 'O app foi aberto via <b>file://</b>, e o navegador bloqueia a rede.<br>Execute <b>iniciar.bat</b> na pasta do projeto e use <b>http://127.0.0.1:8765</b>.';
        } else {
          emptyDesc.textContent = (response && response.error) || (meta && meta.lastSyncError) || 'Verifique a conexão e tente novamente.';
        }
        emptyState.style.display = 'flex';
        skeletons.style.display = 'none';
        newsList.style.display = 'none';
      }
    };

    chrome.runtime.sendMessage({ action: 'sync' }, (response) => {
      setTimeout(() => applySyncResult(response), 400);
    });
  }

  // Filtra as notícias com base em categorias, busca, datas e feeds ativos
  function filterNewsItems(items) {
    let filtered = items;

    // 1. Filtra por Feeds Ativos (ignora feeds com disabled: true)
    const disabledFeedIds = new Set(state.feeds.filter(f => f.disabled).map(f => f.id));
    filtered = filtered.filter(item => !disabledFeedIds.has(item.feedId));

    // 2. Filtros de Categorias/Abas
    if (state.activeCategory === 'saved') {
      filtered = filtered.filter(item => state.bookmarkedIds.has(item.guid));
    } else if (state.activeCategory !== 'all') {
      filtered = filtered.filter(item => item.feedId.startsWith(state.activeCategory));
    }

    // 3. Filtro Temporal (Datas)
    if (state.dateShortcut !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const oneWeekAgo = startOfToday - (7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      filtered = filtered.filter(item => {
        const itemTime = item.pubTimestamp;
        if (state.dateShortcut === 'today') {
          return itemTime >= startOfToday;
        } else if (state.dateShortcut === 'week') {
          return itemTime >= oneWeekAgo;
        } else if (state.dateShortcut === 'month') {
          return itemTime >= startOfMonth;
        } else if (state.dateShortcut === 'custom' && state.customDate) {
          // Compara apenas o ano, mês e dia da notícia
          const itemDateObj = new Date(itemTime);
          const itemDateString = itemDateObj.toISOString().split('T')[0];
          return itemDateString === state.customDate;
        }
        return true;
      });
    }

    // 4. Filtro de Busca Textual
    if (state.searchQuery) {
      filtered = filtered.filter(item => 
        (item.title && item.title.toLowerCase().includes(state.searchQuery)) ||
        (item.description && item.description.toLowerCase().includes(state.searchQuery))
      );
    }

    return filtered;
  }

  // Ordena as notícias de acordo com as preferências selecionadas
  function sortNewsItems(items) {
    if (state.settings.sortOrder === 'date-asc') {
      return items.sort((a, b) => a.pubTimestamp - b.pubTimestamp);
    } else if (state.settings.sortOrder === 'feed-order') {
      // Ordenação prioritária baseada no rank do canal na lista de feeds
      const feedPositions = {};
      state.feeds.forEach((feed, index) => {
        feedPositions[feed.id] = index;
      });
      
      return items.sort((a, b) => {
        const posA = feedPositions[a.feedId] !== undefined ? feedPositions[a.feedId] : 999;
        const posB = feedPositions[b.feedId] !== undefined ? feedPositions[b.feedId] : 999;
        if (posA !== posB) return posA - posB;
        // Critério de desempate: mais recente primeiro
        return b.pubTimestamp - a.pubTimestamp;
      });
    } else {
      // Padrão: mais recentes primeiro (date-desc)
      return items.sort((a, b) => b.pubTimestamp - a.pubTimestamp);
    }
  }

  // Extrai tags/palavras-chave locais com base em repetição de palavras
  function extractLocalTags(item) {
    const text = `${item.title} ${item.description || ''}`.toLowerCase();
    const cleanWords = text
      .replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['para', 'com', 'uma', 'como', 'mais', 'sobre', 'este', 'pelo', 'pela', 'esta', 'tudo', 'onde', 'seus', 'suas', 'quando', 'onde', 'quem'].includes(w));
    
    // Contagem de frequências
    const freq = {};
    cleanWords.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });

    // Ordena as palavras mais repetidas
    return Object.keys(freq)
      .sort((a, b) => freq[b] - freq[a])
      .slice(0, 4); // Extrai as 4 principais tags
  }

  // Verifica se uma notícia é de alta relevância/impacto econômico
  function isHighRelevance(item) {
    const titleAndDesc = `${item.title} ${item.description || ''}`.toLowerCase();
    return HIGH_RELEVANCE_WORDS.some(word => titleAndDesc.includes(word));
  }

  // Renderização final do feed principal
  function renderFeed() {
    renderCategoriesTabs();
    newsList.innerHTML = '';
    
    const filteredItems = filterNewsItems(state.newsItems);
    const sortedItems = sortNewsItems(filteredItems);

    if (sortedItems.length === 0) {
      newsList.style.display = 'none';
      skeletons.style.display = 'none';
      emptyState.style.display = 'flex';
      
      const emptyTitle = emptyState.querySelector('h3');
      const emptyDesc = emptyState.querySelector('p');
      if (state.searchQuery) {
        emptyTitle.textContent = 'Sem resultados para a busca';
        emptyDesc.textContent = 'Nenhuma notícia corresponde aos termos pesquisados. Tente outra palavra.';
      } else if (state.activeCategory === 'saved') {
        emptyTitle.textContent = 'Nenhum item salvo';
        emptyDesc.textContent = 'Notícias marcadas com a estrela aparecerão aqui para leitura offline.';
      } else {
        emptyTitle.textContent = 'Nenhuma notícia por aqui';
        emptyDesc.textContent = 'Clique no botão abaixo para sincronizar seus feeds de notícias.';
      }
      return;
    }

    emptyState.style.display = 'none';
    skeletons.style.display = 'none';
    newsList.style.display = state.settings.viewMode === 'grid' ? 'grid' : 'flex';

    sortedItems.forEach(item => {
      const card = document.createElement('article');
      card.className = `news-card${state.readIds.has(item.guid) ? ' read' : ''}`;
      
      // Adiciona estilo para alta relevância
      if (isHighRelevance(item)) {
        card.classList.add('high-relevance');
      }
      
      card.id = `card-${item.guid.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Tempo de leitura
      const textLength = (item.title + ' ' + (item.description || '')).split(/\s+/).length;
      const readTime = Math.max(1, Math.round(textLength / 150));

      const isBookmarked = state.bookmarkedIds.has(item.guid);
      const friendlyDate = formatFriendlyDate(item.pubDate);

      const plainDescription = (item.description || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();

      const cardHeader = document.createElement('div');
      cardHeader.className = 'news-card-header';
      
      const headerLeft = document.createElement('div');
      headerLeft.className = 'card-header-left';
      
      const badge = document.createElement('span');
      badge.className = 'card-category';
      badge.textContent = item.feedName || 'Feed';
      badge.setAttribute('title', item.feedName || 'Feed');
      headerLeft.appendChild(badge);

      if (isHighRelevance(item)) {
        const relevanceBadge = document.createElement('span');
        relevanceBadge.className = 'relevance-badge';
        relevanceBadge.textContent = '★ Importante';
        headerLeft.appendChild(relevanceBadge);
      }
      
      const date = document.createElement('span');
      date.className = 'card-date';
      date.textContent = friendlyDate;

      cardHeader.appendChild(headerLeft);
      cardHeader.appendChild(date);

      const title = document.createElement('h2');
      title.textContent = item.title;

      const excerpt = document.createElement('p');
      excerpt.className = 'card-excerpt';
      excerpt.textContent = plainDescription || 'Clique para ler os detalhes da notícia.';

      const cardFooter = document.createElement('div');
      cardFooter.className = 'news-card-footer';

      const readTimeBadge = document.createElement('span');
      readTimeBadge.className = 'read-time-badge';
      readTimeBadge.innerHTML = `
        <svg viewBox="0 0 24 24" width="12" height="12" style="vertical-align: middle;">
          <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
        ${readTime} min
      `;

      const cardActions = document.createElement('div');
      cardActions.className = 'card-actions';

      // Botão Favoritar
      const bookmarkBtn = document.createElement('button');
      bookmarkBtn.className = `card-action-btn${isBookmarked ? ' active' : ''}`;
      bookmarkBtn.setAttribute('title', isBookmarked ? 'Remover dos salvos' : 'Salvar para depois');
      bookmarkBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      `;

      bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBookmark(item.guid);
        renderFeed();
      });

      cardActions.appendChild(bookmarkBtn);
      cardFooter.appendChild(readTimeBadge);
      cardFooter.appendChild(cardActions);

      card.appendChild(cardHeader);
      card.appendChild(title);
      card.appendChild(excerpt);
      card.appendChild(cardFooter);

      card.addEventListener('click', () => {
        openReader(item);
      });

      newsList.appendChild(card);
    });
  }

  function toggleBookmark(guid) {
    if (state.bookmarkedIds.has(guid)) {
      state.bookmarkedIds.delete(guid);
    } else {
      state.bookmarkedIds.add(guid);
    }
    saveStateToStorage(['bookmarkedIds']);
  }

  // Visualização Detalhada da Notícia
  function openReader(item) {
    state.currentReaderItem = item;
    
    // Registra leitura para estatísticas
    recordArticleReading(item);

    const readCard = document.getElementById(`card-${item.guid.replace(/[^a-zA-Z0-9]/g, '_')}`);
    if (readCard) {
      readCard.classList.add('read');
    }

    readerCategoryBadge.textContent = item.feedName || 'Feed';
    readerPubDate.textContent = formatFriendlyDate(item.pubDate);
    readerTitleContent.textContent = item.title;

    readerTextContent.textContent = '';
    const descriptionText = item.description || '';
    
    // Remove tags HTML limpando espaços
    const cleanText = descriptionText
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();

    // 1. Aplica o Glossário Econômico com Tooltips (Wow Factor)
    const processedTextWithGlossary = applyGlossaryMarkup(cleanText);

    // Divide em parágrafos preservando o HTML do glossário
    const paragraphs = processedTextWithGlossary.split('\n').filter(p => p.trim() !== '');
    
    if (paragraphs.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'Sem descrição detalhada disponível no feed RSS.';
      readerTextContent.appendChild(p);
    } else {
      paragraphs.forEach(para => {
        const p = document.createElement('p');
        // Sanitize com DOMPurify: permite apenas tags seguras do glossário
        if (typeof DOMPurify !== 'undefined') {
          p.innerHTML = DOMPurify.sanitize(para, {
            ALLOWED_TAGS: ['span', 'strong', 'em', 'b', 'i', 'br', 'a'],
            ALLOWED_ATTR: ['class', 'data-tooltip', 'href', 'title', 'target', 'rel']
          });
        } else {
          p.textContent = para.replace(/<[^>]*>/g, ''); // Fallback: texto puro
        }
        readerTextContent.appendChild(p);
      });
    }

    // Configura os tooltips flutuantes dos termos
    setupGlossaryTooltips();

    // 2. Extrai e renderiza as Tags/Tópicos Automáticos (Wow Factor)
    readerTagsContainer.innerHTML = '';
    const tags = extractLocalTags(item);
    tags.forEach(tag => {
      const tagBadge = document.createElement('span');
      tagBadge.className = 'tag-badge';
      tagBadge.textContent = `#${tag}`;
      
      // Ao clicar na tag, executa a busca por ela
      tagBadge.addEventListener('click', () => {
        closeReader();
        searchInput.value = tag;
        state.searchQuery = tag;
        searchClearBtn.style.display = 'block';
        renderFeed();
      });

      readerTagsContainer.appendChild(tagBadge);
    });

    const cleanUrl = (item.link || '')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    readerOriginalLink.setAttribute('href', cleanUrl);
    updateReaderBookmarkState();

    // Reseta progresso de scroll
    readerProgressBar.style.width = '0%';

    readerOverlay.style.display = 'flex';
    readerOverlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      readerOverlay.classList.add('active');
    }, 10);
  }

  function closeReader() {
    stopSpeak(); // Interrompe áudio se ativo
    readerOverlay.classList.remove('zen-mode');
    readerZenBtn.classList.remove('active');
    readerOverlay.classList.remove('active');
    readerOverlay.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      readerOverlay.style.display = 'none';
      state.currentReaderItem = null;
      renderFeed();
    }, 300);
  }

  function updateReaderBookmarkState() {
    if (!state.currentReaderItem) return;
    const isBookmarked = state.bookmarkedIds.has(state.currentReaderItem.guid);
    readerBookmarkBtn.classList.toggle('active', isBookmarked);
    readerBookmarkBtn.setAttribute('title', isBookmarked ? 'Remover dos salvos' : 'Salvar para depois');
  }

  function showStatus(element, text, type) {
    element.textContent = text;
    element.className = `status-msg ${type}`;
  }

  function formatFriendlyDate(dateString) {
    if (!dateString) return 'Data desconhecida';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const hoursOptions = { hour: '2-digit', minute: '2-digit' };
      const formattedTime = date.toLocaleTimeString('pt-BR', hoursOptions);

      if (diffDays === 0 && now.getDate() === date.getDate()) {
        return `Hoje, às ${formattedTime}`;
      } else if (diffDays <= 1 && now.getDate() - date.getDate() === 1) {
        return `Ontem, às ${formattedTime}`;
      } else if (diffDays < 7) {
        const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        return `${weekDays[date.getDay()]}, às ${formattedTime}`;
      } else {
        const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('pt-BR', dateOptions);
      }
    } catch (e) {
      return dateString;
    }
  }

  // Validação de segurança com desafio de 4 dígitos para ações destrutivas ou edição
  function validateSecurityChallenge(actionDescription) {
    const code = Math.floor(1000 + Math.random() * 9000); // 4 dígitos aleatórios (1000 a 9999)
    const userInput = prompt(`[CONFIRMAÇÃO DE SEGURANÇA]\n\nPara confirmar a ação:\n"${actionDescription}"\n\nPor favor, digite o código de 4 dígitos abaixo para validar:\n👉 ${code}`);
    
    if (userInput === null) {
      return false; // Cancelou
    }
    
    if (userInput.trim() === String(code)) {
      return true; // Sucesso
    } else {
      alert('Código incorreto! Ação cancelada por segurança.');
      return false;
    }
  }
});
