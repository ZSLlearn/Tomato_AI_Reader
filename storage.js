/**
 * 数据持久化存储模块
 * - localStorage: 元数据、配置、对话（小数据）
 * - IndexedDB: 文档内容、PDF二进制数据（大数据）
 * 同时兼容浏览器和 Electron 环境
 */
const TomatoStorage = (() => {
    const DB_NAME = 'TomatoReaderDB';
    const DB_VERSION = 1;
    const STORE_DOC_CONTENTS = 'docContents';
    const STORE_DOC_BLOBS = 'docBlobs';

    const LS_KEYS = {
        DOCUMENTS: 'aireader_documents',
        SHELVES: 'aireader_shelves',
        CHATS: 'aireader_chats',
        READING_POSITIONS: 'aireader_reading_positions',
        SETTINGS: 'aireader_settings',
        TOKEN_USAGE: 'aireader_token_usage',
        OPEN_DOCS: 'aireader_open_docs',
        ACTIVE_DOC_ID: 'aireader_active_doc_id'
    };

    let db = null;
    let dbReady = null;

    function getDB() {
        if (dbReady) return dbReady;
        dbReady = new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn('IndexedDB not available, falling back to localStorage only');
                db = null;
                resolve(null);
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                if (!database.objectStoreNames.contains(STORE_DOC_CONTENTS)) {
                    database.createObjectStore(STORE_DOC_CONTENTS, { keyPath: 'id' });
                }
                if (!database.objectStoreNames.contains(STORE_DOC_BLOBS)) {
                    database.createObjectStore(STORE_DOC_BLOBS, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };

            request.onerror = (event) => {
                console.error('IndexedDB open error:', event.target.error);
                db = null;
                resolve(null);
            };
        });
        return dbReady;
    }

    async function idbPut(storeName, data) {
        const database = await getDB();
        if (!database) return false;
        return new Promise((resolve, reject) => {
            const tx = database.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
        });
    }

    async function idbGet(storeName, id) {
        const database = await getDB();
        if (!database) return null;
        return new Promise((resolve, reject) => {
            const tx = database.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    }

    async function idbDelete(storeName, id) {
        const database = await getDB();
        if (!database) return false;
        return new Promise((resolve, reject) => {
            const tx = database.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
        });
    }

    async function idbGetAll(storeName) {
        const database = await getDB();
        if (!database) return [];
        return new Promise((resolve, reject) => {
            const tx = database.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });
    }

    function lsGet(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function lsSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('localStorage set error:', e);
            return false;
        }
    }

    function lsRemove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {}
    }

    // ==================== 文档元数据 ====================
    function saveDocuments(documents) {
        const slim = documents.map(d => ({
            id: d.id,
            name: d.name,
            type: d.type,
            shelf: d.shelf,
            date: d.date,
            size: d.size,
            pages: d.pages,
            pageCount: d.pageCount,
            content: d.content,
            contentId: d.contentId,
            lastRead: d.lastRead,
            author: d.author,
            title: d.title,
            toc: d.toc
        }));
        return lsSet(LS_KEYS.DOCUMENTS, slim);
    }

    function loadDocuments() {
        return lsGet(LS_KEYS.DOCUMENTS) || [];
    }

    // ==================== 书架 ====================
    function saveShelves(shelves) {
        return lsSet(LS_KEYS.SHELVES, shelves);
    }

    function loadShelves() {
        return lsGet(LS_KEYS.SHELVES) || [
            { id: 'all', name: '全部文档', system: true },
            { id: 'recent', name: '最近阅读', system: true }
        ];
    }

    // ==================== 对话 ====================
    function saveChats(chats) {
        return lsSet(LS_KEYS.CHATS, chats);
    }

    function loadChats() {
        return lsGet(LS_KEYS.CHATS) || {};
    }

    // ==================== 阅读位置 ====================
    function saveReadingPositions(positions) {
        return lsSet(LS_KEYS.READING_POSITIONS, positions);
    }

    function loadReadingPositions() {
        return lsGet(LS_KEYS.READING_POSITIONS) || {};
    }

    // ==================== 用户设置 ====================
    function saveSettings(settings) {
        return lsSet(LS_KEYS.SETTINGS, settings);
    }

    function loadSettings() {
        return lsGet(LS_KEYS.SETTINGS) || {
            theme: 'light',
            highlightColor: '#fef3c7',
            answerLength: 'medium',
            viewMode: 'grid',
            zoom: 100,
            pageMode: 'single',
            aiPanelCollapsed: false
        };
    }

    // ==================== Token使用统计 ====================
    function saveTokenUsage(usage) {
        return lsSet(LS_KEYS.TOKEN_USAGE, usage);
    }

    function loadTokenUsage() {
        return lsGet(LS_KEYS.TOKEN_USAGE) || { prompt: 0, completion: 0, total: 0 };
    }

    // ==================== 打开的文档标签页 ====================
    function saveOpenDocs(openDocs, activeDocId) {
        const data = { openDocs, activeDocId, timestamp: Date.now() };
        return lsSet(LS_KEYS.OPEN_DOCS, data);
    }

    function loadOpenDocs() {
        const data = lsGet(LS_KEYS.OPEN_DOCS);
        if (!data) return { openDocs: [], activeDocId: null };

        const maxAge = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - data.timestamp > maxAge) {
            lsRemove(LS_KEYS.OPEN_DOCS);
            return { openDocs: [], activeDocId: null };
        }

        return { openDocs: data.openDocs || [], activeDocId: data.activeDocId || null };
    }

    // ==================== 文档内容（IndexedDB） ====================
    async function saveDocContent(docId, content) {
        const data = {
            id: docId,
            pages: content.pages || [],
            html: content.html || null,
            title: content.title || '',
            author: content.author || '',
            toc: content.toc || [],
            slides: content.slides || null,
            fullText: content.fullText || null,
            updatedAt: Date.now()
        };
        return await idbPut(STORE_DOC_CONTENTS, data);
    }

    async function loadDocContent(docId) {
        const result = await idbGet(STORE_DOC_CONTENTS, docId);
        if (!result) return null;
        return {
            pages: result.pages,
            html: result.html,
            title: result.title,
            author: result.author,
            toc: result.toc,
            slides: result.slides,
            fullText: result.fullText
        };
    }

    async function deleteDocContent(docId) {
        await idbDelete(STORE_DOC_CONTENTS, docId);
        await idbDelete(STORE_DOC_BLOBS, docId);
    }

    // ==================== PDF二进制数据（IndexedDB） ====================
    async function saveDocBlob(docId, pdfData) {
        const data = {
            id: docId,
            pdfData: pdfData,
            updatedAt: Date.now()
        };
        return await idbPut(STORE_DOC_BLOBS, data);
    }

    async function loadDocBlob(docId) {
        const result = await idbGet(STORE_DOC_BLOBS, docId);
        return result ? result.pdfData : null;
    }

    // ==================== 批量保存 ====================
    async function saveAll(appState) {
        // 同步保存元数据
        saveDocuments(appState.documents);
        saveShelves(appState.shelves);
        saveChats(appState.chats);
        saveReadingPositions(appState.readingPositions);
        saveSettings({
            theme: appState.theme,
            highlightColor: appState.highlightColor,
            answerLength: appState.answerLength,
            viewMode: appState.viewMode,
            zoom: appState.zoom,
            pageMode: appState.pageMode,
            aiPanelCollapsed: appState.aiPanelCollapsed
        });
        saveTokenUsage(appState.tokenUsage);
        saveOpenDocs(appState.openDocs, appState.activeDocId);

        // 异步保存文档内容到IndexedDB
        const contentPromises = [];
        for (const docId in appState.docContents) {
            const content = appState.docContents[docId];
            if (content) {
                contentPromises.push(saveDocContent(docId, content));
                if (content.pdfData) {
                    contentPromises.push(saveDocBlob(docId, content.pdfData));
                }
            }
        }
        await Promise.allSettled(contentPromises);
    }

    // ==================== 批量加载 ====================
    async function loadAll() {
        const documents = loadDocuments();
        const shelves = loadShelves();
        const chats = loadChats();
        const readingPositions = loadReadingPositions();
        const settings = loadSettings();
        const tokenUsage = loadTokenUsage();
        const openDocsData = loadOpenDocs();

        const docContents = {};
        const loadPromises = documents.map(async (doc) => {
            const contentId = doc.content || doc.contentId || doc.id;
            const content = await loadDocContent(contentId);
            if (content) {
                const blobData = await loadDocBlob(contentId);
                if (blobData) {
                    content.pdfData = blobData;
                }
                docContents[contentId] = content;
            }
        });
        await Promise.allSettled(loadPromises);

        return {
            documents,
            shelves,
            chats,
            readingPositions,
            docContents,
            settings,
            tokenUsage,
            openDocs: openDocsData.openDocs,
            activeDocId: openDocsData.activeDocId
        };
    }

    // ==================== 清空所有数据 ====================
    async function clearAll() {
        Object.values(LS_KEYS).forEach(key => lsRemove(key));
        const database = await getDB();
        if (database) {
            const tx = database.transaction([STORE_DOC_CONTENTS, STORE_DOC_BLOBS], 'readwrite');
            tx.objectStore(STORE_DOC_CONTENTS).clear();
            tx.objectStore(STORE_DOC_BLOBS).clear();
        }
    }

    return {
        saveAll,
        loadAll,
        saveDocuments,
        loadDocuments,
        saveShelves,
        loadShelves,
        saveChats,
        loadChats,
        saveReadingPositions,
        loadReadingPositions,
        saveSettings,
        loadSettings,
        saveDocContent,
        loadDocContent,
        saveDocBlob,
        loadDocBlob,
        deleteDocContent,
        clearAll,
        getDB
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TomatoStorage;
}
