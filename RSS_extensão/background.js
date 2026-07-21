// Configurações e feeds padrão do Banco Central do Brasil
// Usa o ano corrente para feeds que exigem o parâmetro ?ano=
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

const DEFAULT_FEEDS = getDefaultFeeds();

// Instalação da extensão
chrome.runtime.onInstalled.addListener(async () => {
  console.log('RSS Feed BCB instalado com sucesso.');
  
  // Carrega estado existente para inicializar campos faltantes
  const data = await chrome.storage.local.get(['feeds', 'categories', 'newsItems', 'readIds', 'bookmarkedIds', 'settings']);

  // Inicializa os feeds se for a primeira vez
  if (!data.feeds) {
    await chrome.storage.local.set({ feeds: getDefaultFeeds() });
  }

  // Inicializa as categorias padrão se for a primeira vez
  if (!data.categories) {
    const defaultCategories = [
      { id: 'noticias', name: 'Notícias' },
      { id: 'notastecnicas', name: 'Notas Técnicas' },
      { id: 'comunicados', name: 'Comunicados' },
      { id: 'normativos', name: 'Normativos' }
    ];
    await chrome.storage.local.set({ categories: defaultCategories });
  }

  if (!data.newsItems) {
    await chrome.storage.local.set({ newsItems: [] });
  }
  if (!data.readIds) {
    await chrome.storage.local.set({ readIds: [] });
  }
  if (!data.bookmarkedIds) {
    await chrome.storage.local.set({ bookmarkedIds: [] });
  }
  if (!data.settings) {
    await chrome.storage.local.set({
      settings: {
        syncInterval: 15, // minutos
        notificationsEnabled: true,
        theme: 'editorial-sepia' // editorial-sepia, light, dark
      }
    });
  }

  // Configura o alarme para sincronização periódica (15 minutos padrão)
  const syncInterval = data.settings?.syncInterval || 15;
  chrome.alarms.create('sync-rss-feeds', { periodInMinutes: syncInterval });
  
  // Sincroniza imediatamente após a instalação
  syncFeeds();
});

// Listener de alarmes
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync-rss-feeds') {
    syncFeeds();
  }
});

// Listener de mensagens do popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sync') {
    syncFeeds()
      .then((newItemsCount) => sendResponse({ success: true, newItemsCount }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Mantém o canal de resposta assíncrono aberto
  }
});

// Função para fazer o parse manual do XML no Service Worker (sem DOMParser)
// Suporta tanto o padrão RSS (<item>) quanto o padrão Atom (<entry>)
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

  // Verifica se o feed é Atom (contém tags <entry>) ou RSS comum (contém tags <item>)
  const isAtom = xmlText.includes('<entry>') || xmlText.includes('<feed');

  if (isAtom) {
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xmlText)) !== null) {
      const entryContent = match[1];
      const title = getTagValue(entryContent, 'title');
      
      // No Atom, a URL fica em <link rel="alternate" href="url" /> ou <link href="url" />
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
          guid,
          title,
          link,
          description,
          pubDate: pubDateStr,
          pubTimestamp: pubDateStr ? new Date(pubDateStr).getTime() : Date.now(),
          feedId,
          feedName,
          fetchedAt: Date.now()
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
          guid,
          title,
          link,
          description,
          pubDate: pubDateStr,
          pubTimestamp: pubDateStr ? new Date(pubDateStr).getTime() : Date.now(),
          feedId,
          feedName,
          fetchedAt: Date.now()
        });
      }
    }
  }
  
  return items;
}

// Função principal de sincronização
async function syncFeeds() {
  try {
    const data = await chrome.storage.local.get(['feeds', 'newsItems', 'readIds', 'settings']);
    const feeds = data.feeds || DEFAULT_FEEDS;
    const existingItems = data.newsItems || [];
    const readIds = data.readIds || [];
    const settings = data.settings || { notificationsEnabled: true };

    let allFetchedItems = [];

    for (const feed of feeds) {
      if (feed.disabled) {
        console.log(`Sincronização pulada para o feed desativado: ${feed.name}`);
        continue;
      }
      try {
        console.log(`Buscando feed: ${feed.name} (${feed.url})`);
        const response = await fetch(feed.url, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!response.ok) throw new Error(`Status ${response.status}`);
        
        const xmlText = await response.text();
        const items = parseRSS(xmlText, feed.id, feed.name);
        allFetchedItems = allFetchedItems.concat(items);
      } catch (err) {
        console.error(`Erro ao carregar feed ${feed.name}:`, err);
      }
    }

    if (allFetchedItems.length === 0) return 0;

    // Combina e remove duplicatas (com base no guid)
    const itemMap = new Map();
    // Adiciona os novos primeiro para priorizar dados atualizados
    allFetchedItems.forEach(item => itemMap.set(item.guid, item));
    // Adiciona os antigos se não existirem nos novos
    existingItems.forEach(item => {
      if (!itemMap.has(item.guid)) {
        itemMap.set(item.guid, item);
      }
    });

    // Converte de volta para array e ordena por pubTimestamp decrescente
    const updatedItems = Array.from(itemMap.values())
      .sort((a, b) => b.pubTimestamp - a.pubTimestamp)
      // Mantém no máximo 200 notícias no storage para não estourar limite
      .slice(0, 200);

    // Identifica itens realmente novos para notificações
    const existingGuids = new Set(existingItems.map(i => i.guid));
    const newItems = allFetchedItems.filter(item => !existingGuids.has(item.guid));

    // Salva no storage local
    await chrome.storage.local.set({ newsItems: updatedItems });

    // Atualiza o badge de não lidas
    updateBadge(updatedItems, readIds);

    // Dispara notificação se houver novos itens e a configuração permitir
    if (newItems.length > 0 && settings.notificationsEnabled) {
      const firstNewItem = newItems[0];
      const notificationTitle = newItems.length === 1 
        ? 'Nova notícia do Banco Central'
        : `${newItems.length} novas atualizações do BCB`;
      
      const notificationMessage = newItems.length === 1
        ? firstNewItem.title
        : `Acesse o leitor para ver as últimas novidades de: "${firstNewItem.feedName}" e outros.`;

      chrome.notifications.create('new-bcb-articles', {
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: notificationTitle,
        message: notificationMessage,
        priority: 1
      });
    }

    return newItems.length;
  } catch (error) {
    console.error('Falha geral na sincronização:', error);
    return 0;
  }
}

// Atualiza o contador de notícias não lidas no ícone
function updateBadge(items, readIds) {
  const readSet = new Set(readIds);
  const unreadCount = items.filter(item => !readSet.has(item.guid)).length;

  if (unreadCount > 0) {
    chrome.action.setBadgeText({ text: unreadCount > 99 ? '99+' : unreadCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#025c75' }); // Azul institucional do BCB
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Monitora mudanças nas configurações para reconfigurar alarmes dinamicamente
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) {
    const oldVal = changes.settings.oldValue;
    const newVal = changes.settings.newValue;
    if (newVal && newVal.syncInterval !== oldVal?.syncInterval) {
      console.log(`Reconfigurando intervalo de sincronização para: ${newVal.syncInterval} minutos.`);
      chrome.alarms.clear('sync-rss-feeds', () => {
        if (newVal.syncInterval > 0) {
          chrome.alarms.create('sync-rss-feeds', { periodInMinutes: Number(newVal.syncInterval) });
        }
      });
    }
  }
});
