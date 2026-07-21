/**
 * Adaptador web para o RSS Reader.
 * Permite rodar fora da extensão Chrome (ex.: iframe no Canivete Suíço)
 * usando localStorage no lugar de chrome.storage e sync local.
 *
 * Importante: abrir via file:// bloqueia fetch/CORS. Use iniciar.bat
 * (http://127.0.0.1:8765) para o RSS funcionar.
 */
(function () {
  const STORAGE_KEY = 'rss_reader_devtools_state';
  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
  const isFileProtocol = location.protocol === 'file:';

  if (isExtension) return;

  window.__rssWebMeta = {
    isFileProtocol,
    lastSyncError: null,
    lastSyncOk: false
  };

  function getCurrentYear() {
    return new Date().getFullYear();
  }

  function getDefaultFeeds() {
    const ano = getCurrentYear();
    return [
      { id: 'noticias', name: 'Notícias', url: `https://www.bcb.gov.br/api/feed/sitebcb/sitefeeds/noticias?ano=${ano}` },
      { id: 'notastecnicas', name: 'Notas Técnicas', url: 'https://www.bcb.gov.br/api/feed/sitebcb/sitefeeds/notastecnicas' },
      { id: 'comunicados', name: 'Comunicados', url: `https://www.bcb.gov.br/api/feed/app/demaisnormativos/atosecomunicados?ano=${ano}` },
      { id: 'normativos', name: 'Normativos', url: `https://www.bcb.gov.br/api/feed/app/normativos/normativos?ano=${ano}` }
    ];
  }

  function getDefaultCategories() {
    return [
      { id: 'noticias', name: 'Notícias' },
      { id: 'notastecnicas', name: 'Notas Técnicas' },
      { id: 'comunicados', name: 'Comunicados' },
      { id: 'normativos', name: 'Normativos' }
    ];
  }

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function writeStore(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function ensureDefaults() {
    const store = readStore();
    let changed = false;

    if (!store.feeds) {
      store.feeds = getDefaultFeeds();
      changed = true;
    }
    if (!store.categories) {
      store.categories = getDefaultCategories();
      changed = true;
    }
    if (!store.newsItems) {
      store.newsItems = [];
      changed = true;
    }
    if (!store.readIds) {
      store.readIds = [];
      changed = true;
    }
    if (!store.bookmarkedIds) {
      store.bookmarkedIds = [];
      changed = true;
    }
    if (!store.history) {
      store.history = [];
      changed = true;
    }
    if (!store.settings) {
      store.settings = {
        syncInterval: 15,
        notificationsEnabled: false,
        theme: 'dark',
        viewMode: 'list',
        sortOrder: 'date-desc',
        fontSize: 'text-md',
        fontFamily: 'font-sans',
        totalReadCount: 0,
        totalMinutesSaved: 0
      };
      changed = true;
    }

    if (changed) writeStore(store);
    return store;
  }

  ensureDefaults();

  window.chrome = window.chrome || {};

  chrome.storage = chrome.storage || {};
  chrome.storage.local = {
    get(keys) {
      const store = ensureDefaults();
      const result = {};

      if (Array.isArray(keys)) {
        keys.forEach((k) => {
          if (store[k] !== undefined) result[k] = store[k];
        });
      } else if (keys && typeof keys === 'object') {
        Object.keys(keys).forEach((k) => {
          result[k] = store[k] !== undefined ? store[k] : keys[k];
        });
      } else {
        Object.assign(result, store);
      }

      return Promise.resolve(result);
    },
    set(items) {
      const store = ensureDefaults();
      Object.assign(store, items);
      writeStore(store);
      return Promise.resolve();
    },
    remove(keys) {
      const store = ensureDefaults();
      const keyList = Array.isArray(keys) ? keys : [keys];
      keyList.forEach((k) => delete store[k]);
      writeStore(store);
      return Promise.resolve();
    }
  };

  chrome.runtime = chrome.runtime || {};
  chrome.runtime.id = undefined;
  chrome.runtime.getURL = (path) => path;
  chrome.runtime.sendMessage = (message, callback) => {
    if (message && message.action === 'sync') {
      syncFeeds()
        .then((newItemsCount) => {
          if (typeof callback === 'function') callback({ success: true, newItemsCount });
        })
        .catch((error) => {
          window.__rssWebMeta.lastSyncError = error.message;
          if (typeof callback === 'function') callback({ success: false, error: error.message });
        });
      return true;
    }
    if (typeof callback === 'function') callback({ success: false });
    return false;
  };

  chrome.tabs = chrome.tabs || {};
  chrome.tabs.create = ({ url }) => {
    window.open(url || 'popup.html', '_blank');
    return Promise.resolve();
  };

  chrome.notifications = chrome.notifications || {};
  chrome.notifications.create = () => {};

  chrome.action = chrome.action || {};
  chrome.action.setBadgeText = () => {};
  chrome.action.setBadgeBackgroundColor = () => {};

  chrome.alarms = chrome.alarms || {};
  chrome.alarms.create = () => {};
  chrome.alarms.clear = (_name, cb) => { if (cb) cb(); };
  chrome.alarms.onAlarm = { addListener: () => {} };

  function parseRSS(xmlText, feedId, feedName) {
    const items = [];

    const cleanCDATA = (str) => {
      if (!str) return '';
      return str
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim();
    };

    const getTagValue = (itemStr, tagName) => {
      const tagRegex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
      const tagMatch = itemStr.match(tagRegex);
      return tagMatch ? cleanCDATA(tagMatch[1]) : '';
    };

    const isAtom = xmlText.includes('<entry>') || xmlText.includes('<feed');

    if (isAtom) {
      const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/g;
      let match;
      while ((match = entryRegex.exec(xmlText)) !== null) {
        const entryContent = match[1];
        const title = getTagValue(entryContent, 'title');
        let link = '';
        const linkMatch = entryContent.match(/<link[^>]*href=["']([^"']+)["']/i);
        if (linkMatch) {
          link = cleanCDATA(linkMatch[1]);
        } else {
          link = getTagValue(entryContent, 'link');
        }
        const description = getTagValue(entryContent, 'content') || getTagValue(entryContent, 'summary');
        const pubDateStr = getTagValue(entryContent, 'updated') || getTagValue(entryContent, 'published');
        const guid = getTagValue(entryContent, 'id') || link;

        if (title && link) {
          items.push({
            guid, title, link, description,
            pubDate: pubDateStr,
            pubTimestamp: pubDateStr ? new Date(pubDateStr).getTime() : Date.now(),
            feedId, feedName, fetchedAt: Date.now()
          });
        }
      }
    } else {
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];
        const title = getTagValue(itemContent, 'title');
        const link = getTagValue(itemContent, 'link');
        const description = getTagValue(itemContent, 'description');
        const pubDateStr = getTagValue(itemContent, 'pubDate');
        const guid = getTagValue(itemContent, 'guid') || link;

        if (title && link) {
          items.push({
            guid, title, link, description,
            pubDate: pubDateStr,
            pubTimestamp: pubDateStr ? new Date(pubDateStr).getTime() : Date.now(),
            feedId, feedName, fetchedAt: Date.now()
          });
        }
      }
    }

    return items;
  }

  async function tryFetchText(requestUrl) {
    const response = await fetch(requestUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }

  async function fetchFeedText(url) {
    if (isFileProtocol) {
      throw new Error(
        'Modo file:// bloqueia rede. Execute iniciar.bat e abra http://127.0.0.1:8765'
      );
    }

    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const candidates = [];

    // 1) Se estiver no servidor local, usar proxy local primeiro
    if (isLocalhost && location.origin && location.origin !== 'null') {
      candidates.push(`${location.origin}/api/proxy?url=${encodeURIComponent(url)}`);
    }

    // 2) Tentativa direta (funciona se o servidor liberar CORS, ex: bcb.gov.br)
    candidates.push(url);

    // 3) Proxies públicos (fallback)
    candidates.push(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    candidates.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);

    let lastError = null;
    for (const candidate of candidates) {
      try {
        const text = await tryFetchText(candidate);
        if (text && (text.includes('<') || text.includes('rss') || text.includes('feed'))) {
          return text;
        }
        if (text && text.length > 20) return text;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Falha ao buscar feed');
  }

  async function syncFeeds() {
    window.__rssWebMeta.lastSyncError = null;
    window.__rssWebMeta.lastSyncOk = false;

    if (isFileProtocol) {
      const msg = 'Abra o app com iniciar.bat (servidor local). O modo file:// bloqueia o RSS.';
      window.__rssWebMeta.lastSyncError = msg;
      throw new Error(msg);
    }

    const data = await chrome.storage.local.get(['feeds', 'newsItems', 'readIds', 'settings']);
    const feeds = data.feeds || getDefaultFeeds();
    const existingItems = data.newsItems || [];
    let allFetchedItems = [];
    const feedErrors = [];

    for (const feed of feeds) {
      if (feed.disabled) continue;
      try {
        const xmlText = await fetchFeedText(feed.url);
        const items = parseRSS(xmlText, feed.id, feed.name);
        allFetchedItems = allFetchedItems.concat(items);
      } catch (err) {
        console.error(`Erro ao carregar feed ${feed.name}:`, err);
        feedErrors.push(`${feed.name}: ${err.message}`);
      }
    }

    if (allFetchedItems.length === 0) {
      const msg = feedErrors[0] || 'Nenhum feed retornou dados. Verifique a conexão ou o servidor local.';
      window.__rssWebMeta.lastSyncError = msg;
      throw new Error(msg);
    }

    const itemMap = new Map();
    allFetchedItems.forEach((item) => itemMap.set(item.guid, item));
    existingItems.forEach((item) => {
      if (!itemMap.has(item.guid)) itemMap.set(item.guid, item);
    });

    const updatedItems = Array.from(itemMap.values())
      .sort((a, b) => b.pubTimestamp - a.pubTimestamp)
      .slice(0, 200);

    await chrome.storage.local.set({ newsItems: updatedItems });

    const existingGuids = new Set(existingItems.map((i) => i.guid));
    const newCount = allFetchedItems.filter((item) => !existingGuids.has(item.guid)).length;
    window.__rssWebMeta.lastSyncOk = true;
    return newCount;
  }

  window.__rssWebSync = syncFeeds;
})();
