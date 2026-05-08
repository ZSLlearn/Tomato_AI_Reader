/**
 * AI智能阅读器 - 主应用逻辑
 * 实现PRD中所有交互功能
 */

// ==================== 数据状态 ====================
const AppState = {
    currentPage: 'library',
    currentDoc: null,
    currentChat: null,
    theme: 'light',
    highlightColor: '#fef3c7',
    answerLength: 'medium',
    viewMode: 'grid',
    zoom: 100,
    aiPanelCollapsed: false,
    pageMode: 'single',
    contextTarget: null,
    confirmCallback: null,

    openDocs: [],
    activeDocId: null,
    readingPositions: {},
    renderedDocs: {},

    shelves: [
        { id: 'all', name: '全部文档', system: true },
        { id: 'recent', name: '最近阅读', system: true }
    ],

    documents: [],

    chats: {},

    docContents: {},

    pdfBlobUrls: {},
    pdfViewerReady: false,

    // 新增：引用列表（临时上下文，切换文档/对话时清空）
    quoteList: [],

    // 新增：当前选中文字信息
    _currentSelection: null,
    _floatingWindowTimer: null,
    _pendingAIRequest: null,

    // 新增：Token使用统计
    tokenUsage: { prompt: 0, completion: 0, total: 0 },

    // 新增：API配置状态
    _apiConfigured: null
};

// ==================== DOM 元素缓存 ====================
const DOM = {};

function cacheDOM() {
    DOM.pageLibrary = document.getElementById('pageLibrary');
    DOM.pageReader = document.getElementById('pageReader');
    DOM.docsContainer = document.getElementById('docsContainer');
    DOM.bookshelfTabs = document.getElementById('bookshelfTabs');
    DOM.viewToggle = document.getElementById('viewToggle');
    DOM.searchInput = document.getElementById('searchInput');
    DOM.docCount = document.getElementById('docCount');
    DOM.btnImport = document.getElementById('btnImport');
    DOM.btnNewFolder = document.getElementById('btnNewFolder');
    DOM.btnSettings = document.getElementById('btnSettings');
    DOM.userAvatar = document.getElementById('userAvatar');
    DOM.sidebarMenu = document.getElementById('sidebarMenu');

    DOM.docTabsScroll = document.getElementById('docTabsScroll');
    DOM.docTabsContainer = document.getElementById('docTabsContainer');
    DOM.readerMain = document.getElementById('readerMain');
    DOM.documentPages = document.getElementById('documentPages');
    DOM.documentViewport = document.getElementById('documentViewport');
    DOM.pdfViewerFrame = document.getElementById('pdfViewerFrame');
    DOM.zoomDisplay = document.getElementById('zoomDisplay');
    DOM.aiPanel = document.getElementById('aiPanel');
    DOM.aiPanelTitle = document.getElementById('aiPanelTitle');
    DOM.aiChatArea = document.getElementById('aiChatArea');
    DOM.aiInput = document.getElementById('aiInput');
    DOM.aiSendBtn = document.getElementById('aiSendBtn');
    DOM.chatDropdown = document.getElementById('chatDropdown');
    DOM.chatList = document.getElementById('chatList');
    DOM.chatHistoryBtn = document.getElementById('chatHistoryBtn');
    DOM.newChatBtn = document.getElementById('newChatBtn');
    DOM.aiPanelCloseBtn = document.getElementById('aiPanelCloseBtn');
    DOM.quickActions = document.getElementById('quickActions');

    DOM.importModal = document.getElementById('importModal');
    DOM.dropZone = document.getElementById('dropZone');
    DOM.fileInput = document.getElementById('fileInput');
    DOM.importProgress = document.getElementById('importProgress');
    DOM.progressFill = document.getElementById('progressFill');
    DOM.progressText = document.getElementById('progressText');

    DOM.newShelfModal = document.getElementById('newShelfModal');
    DOM.newShelfName = document.getElementById('newShelfName');
    DOM.renameModal = document.getElementById('renameModal');
    DOM.renameInput = document.getElementById('renameInput');
    DOM.moveModal = document.getElementById('moveModal');
    DOM.shelfList = document.getElementById('shelfList');
    DOM.confirmModal = document.getElementById('confirmModal');
    DOM.confirmTitle = document.getElementById('confirmTitle');
    DOM.confirmMessage = document.getElementById('confirmMessage');
    DOM.confirmOk = document.getElementById('confirmOk');
    DOM.settingsModal = document.getElementById('settingsModal');

    DOM.contextMenu = document.getElementById('contextMenu');
    DOM.selectionMenu = document.getElementById('selectionMenu');
    DOM.toast = document.getElementById('toast');
    DOM.toastIcon = document.getElementById('toastIcon');
    DOM.toastMessage = document.getElementById('toastMessage');

    // 新增：悬浮窗相关
    DOM.floatingWindow = document.getElementById('floatingWindow');
    DOM.fwDragHandle = document.getElementById('fwDragHandle');
    DOM.fwLogo = document.getElementById('fwLogo');
    DOM.fwQuoteBtn = document.getElementById('fwQuoteBtn');
    DOM.fwExplainBtn = document.getElementById('fwExplainBtn');
    DOM.fwTranslateBtn = document.getElementById('fwTranslateBtn');
    DOM.fwExplainPanel = document.getElementById('fwExplainPanel');
    DOM.fwExplainBody = document.getElementById('fwExplainBody');
    DOM.fwExplainClose = document.getElementById('fwExplainClose');
    DOM.fwExplainRefBtn = document.getElementById('fwExplainRefBtn');
    DOM.fwTranslatePanel = document.getElementById('fwTranslatePanel');
    DOM.fwTranslateBody = document.getElementById('fwTranslateBody');
    DOM.fwTranslateClose = document.getElementById('fwTranslateClose');
    DOM.fwTranslateRefBtn = document.getElementById('fwTranslateRefBtn');

    // 新增：引用列表相关
    DOM.quoteListSection = document.getElementById('quoteListSection');
    DOM.quoteListBody = document.getElementById('quoteListBody');
    DOM.quoteListEmpty = document.getElementById('quoteListEmpty');
    DOM.quoteCountBadge = document.getElementById('quoteCountBadge');
    DOM.quoteClearBtn = document.getElementById('quoteClearBtn');
    DOM.quoteToggleBtn = document.getElementById('quoteToggleBtn');
    DOM.quoteToggleIcon = document.getElementById('quoteToggleIcon');
    DOM.quoteListHeader = document.getElementById('quoteListHeader');

    // 新增：API配置相关
    DOM.apiKeyInput = document.getElementById('apiKeyInput');
    DOM.apiKeyToggle = document.getElementById('apiKeyToggle');
    DOM.apiProvider = document.getElementById('apiProvider');
    DOM.apiEndpoint = document.getElementById('apiEndpoint');
    DOM.apiModel = document.getElementById('apiModel');
    DOM.apiTestBtn = document.getElementById('apiTestBtn');
    DOM.apiTestBtnText = document.getElementById('apiTestBtnText');
    DOM.apiTestStatus = document.getElementById('apiTestStatus');
    DOM.settingsPanelGeneral = document.getElementById('settingsPanelGeneral');
    DOM.settingsPanelApi = document.getElementById('settingsPanelApi');
    DOM.apiConfigGuide = document.getElementById('apiConfigGuide');

    // 新增：折叠态AI按钮
    DOM.aiCollapsedBadge = document.getElementById('aiCollapsedBadge');
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    cacheDOM();
    initLibrary();
    initEventListeners();
    initReaderEvents();
    initKeyboardShortcuts();
    initPdfViewer();
});

function initPdfViewer() {
    window.addEventListener('message', handlePdfViewerMessage);
}

function handlePdfViewerMessage(event) {
    if (!event.data || typeof event.data !== 'object') return;
    
    const { type, data } = event.data;
    
    switch (type) {
        case 'pdfViewerReady':
            AppState.pdfViewerReady = true;
            setupPdfTextSelection();
            break;
        case 'pageChange':
            if (AppState.activeDocId) {
                AppState.readingPositions[AppState.activeDocId] = {
                    ...AppState.readingPositions[AppState.activeDocId],
                    currentPage: data.page
                };
            }
            break;
        case 'zoomChange':
            AppState.zoom = data.zoom;
            DOM.zoomDisplay.textContent = `${data.zoom}%`;
            break;
    }
}

function setupPdfTextSelection() {
    try {
        const iframeDoc = DOM.pdfViewerFrame.contentDocument;
        if (iframeDoc && !AppState._pdfSelectionSetup) {
            AppState._pdfSelectionSetup = true;
            iframeDoc.addEventListener('mouseup', handlePdfTextSelection);
            iframeDoc.addEventListener('mousedown', handlePdfMouseDown);
        }
    } catch (e) {
        AppState._pdfSelectionSetup = false;
    }
}

function handlePdfTextSelection(e) {
    if (AppState._floatingWindowTimer) {
        clearTimeout(AppState._floatingWindowTimer);
    }

    try {
        const iframeDoc = DOM.pdfViewerFrame.contentDocument;
        if (!iframeDoc) return;
        const selection = iframeDoc.getSelection();
        const text = selection.toString().trim();

        if (text.length >= 2) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const iframeRect = DOM.pdfViewerFrame.getBoundingClientRect();

            const adjustedRect = {
                left: rect.left + iframeRect.left,
                right: rect.right + iframeRect.left,
                top: rect.top + iframeRect.top,
                bottom: rect.bottom + iframeRect.top,
                width: rect.width,
                height: rect.height
            };

            AppState._currentSelection = {
                text: text,
                rect: adjustedRect,
                pageInfo: getPdfPageInfo()
            };

            AppState._floatingWindowTimer = setTimeout(() => {
                showFloatingWindow(adjustedRect);
            }, 200);

            DOM.selectionMenu.classList.add('hidden');
        } else {
            hideFloatingWindow();
            DOM.selectionMenu.classList.add('hidden');
        }
    } catch (err) {}
}

function handlePdfMouseDown(e) {
    if (AppState._currentSelection) {
        var iframeRect = DOM.pdfViewerFrame.getBoundingClientRect();
        var absX = e.clientX + iframeRect.left;
        var absY = e.clientY + iframeRect.top;
        var selRect = AppState._currentSelection.rect;
        if (selRect &&
            absX >= selRect.left && absX <= selRect.right &&
            absY >= selRect.top && absY <= selRect.bottom) {
            startDragFromSelection(e, AppState._currentSelection.text, AppState._currentSelection.pageInfo);
        }
    }
}

function getPdfPageInfo() {
    try {
        var iframeDoc = DOM.pdfViewerFrame.contentDocument;
        if (!iframeDoc) return { page: null, chapter: null };
        var pageInput = iframeDoc.getElementById('pageNumber');
        var page = pageInput ? parseInt(pageInput.value) || null : null;
        return { page: page, chapter: null };
    } catch (e) {
        return { page: null, chapter: null };
    }
}

// ==================== 书架/文档管理 ====================
function initLibrary() {
    renderDocs();
    updateDocCount();
}

function renderDocs(filter = '') {
    const activeShelf = document.querySelector('.tab-item.active')?.dataset.shelf || 'all';
    let docs = AppState.documents;

    if (activeShelf !== 'all') {
        docs = docs.filter(d => d.shelf === activeShelf || (activeShelf === 'recent' && d.lastRead));
    }

    if (filter) {
        const lower = filter.toLowerCase();
        docs = docs.filter(d => d.name.toLowerCase().includes(lower));
    }

    DOM.docsContainer.innerHTML = '';

    docs.forEach(doc => {
        const card = createDocCard(doc);
        DOM.docsContainer.appendChild(card);
    });

    // 添加新建卡片
    const addCard = document.createElement('div');
    addCard.className = `doc-card card-add-new ${AppState.viewMode === 'list' ? 'list-view' : ''}`;
    addCard.innerHTML = `
        <div class="add-icon">+</div>
        <div class="add-text">导入新文档</div>
    `;
    addCard.addEventListener('click', () => openModal('importModal'));
    DOM.docsContainer.appendChild(addCard);
}

function createDocCard(doc) {
    const card = document.createElement('div');
    card.className = 'doc-card';
    card.dataset.docId = doc.id;

    const typeColors = {
        pdf: '#ea4335',
        pptx: '#ff6d01',
        docx: '#1a73e8',
        epub: '#34a853',
        txt: '#5f6368'
    };
    const color = typeColors[doc.type] || '#5f6368';
    const icons = { pdf: '📄', pptx: '📊', docx: '📘', epub: '📖', txt: '📝' };

    if (AppState.viewMode === 'grid') {
        card.innerHTML = `
            <div class="doc-thumbnail" style="background: linear-gradient(135deg, ${color}15 0%, ${color}08 100%);">
                <span class="file-type-badge" style="background:${color};">${doc.type.toUpperCase()}</span>
                <span class="doc-thumbnail-icon" style="color:${color};">${icons[doc.type] || '📄'}</span>
            </div>
            <div class="doc-info">
                <div class="doc-name">${doc.name}</div>
                <div class="doc-meta">
                    <span>${doc.date} 导入</span>
                    <span class="doc-format" style="color:${color};">${doc.type.toUpperCase()}</span>
                </div>
            </div>
        `;
    } else {
        card.innerHTML = `
            <div class="doc-thumbnail" style="background: linear-gradient(135deg, ${color}15 0%, ${color}08 100%);">
                <span class="doc-thumbnail-icon" style="color:${color};">${icons[doc.type] || '📄'}</span>
            </div>
            <div class="doc-info">
                <div class="doc-name">${doc.name}</div>
                <div class="doc-meta">
                    <span>${doc.date} · ${doc.size}</span>
                    <span class="doc-format" style="color:${color};">${doc.type.toUpperCase()}</span>
                </div>
            </div>
        `;
    }

    card.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu')) {
            openDocument(doc.id);
        }
    });

    card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        AppState.contextTarget = doc;
        showContextMenu(e, 'doc');
    });

    return card;
}

function updateDocCount() {
    const activeShelf = document.querySelector('.tab-item.active')?.dataset.shelf || 'all';
    let count = AppState.documents.length;
    if (activeShelf !== 'all') {
        count = AppState.documents.filter(d => d.shelf === activeShelf || (activeShelf === 'recent' && d.lastRead)).length;
    }
    DOM.docCount.textContent = `${count} 个文档`;
}

// ==================== 事件监听 ====================
function initEventListeners() {
    // 书架标签切换
    DOM.bookshelfTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab-item');
        if (!tab) return;
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderDocs(DOM.searchInput.value);
        updateDocCount();
    });

    // 视图切换
    DOM.viewToggle.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-btn');
        if (!btn) return;
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        AppState.viewMode = btn.dataset.view;
        DOM.docsContainer.className = `docs-container ${AppState.viewMode}-view`;
        renderDocs(DOM.searchInput.value);
    });

    // 搜索
    DOM.searchInput.addEventListener('input', (e) => {
        renderDocs(e.target.value);
    });

    // 导入按钮
    DOM.btnImport.addEventListener('click', () => openModal('importModal'));

    // 新建文件夹/书架
    DOM.btnNewFolder.addEventListener('click', () => openModal('newShelfModal'));

    // 设置
    DOM.btnSettings.addEventListener('click', openSettings);

    // 文件导入
    DOM.fileInput.addEventListener('change', handleFileImport);

    // 拖拽导入
    DOM.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        DOM.dropZone.classList.add('dragover');
    });
    DOM.dropZone.addEventListener('dragleave', () => {
        DOM.dropZone.classList.remove('dragover');
    });
    DOM.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        DOM.dropZone.classList.remove('dragover');
        handleFileImport({ target: { files: e.dataTransfer.files } });
    });

    // 侧边栏菜单
    DOM.sidebarMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.menu-item');
        if (!item) return;
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
    });

    // 点击空白关闭菜单
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu')) {
            hideContextMenus();
        }
    });
}

// ==================== 阅读器事件 ====================
function initPanelResize() {
    const handle = document.getElementById('panelResizeHandle');
    const panel = DOM.aiPanel;
    const readerLayout = panel && panel.parentElement;
    if (!handle || !panel || !readerLayout) return;

    let startX, startWidth, rafId, lastClientX;

    function lockLayout() {
        readerLayout.style.contain = 'layout style';
        readerLayout.style.pointerEvents = 'none';
        panel.style.transition = 'none';
        panel.style.willChange = 'width';
        panel.style.contain = 'layout style';
    }

    function unlockLayout() {
        readerLayout.style.contain = '';
        readerLayout.style.pointerEvents = '';
        panel.style.transition = '';
        panel.style.willChange = '';
        panel.style.contain = '';
    }

    handle.addEventListener('mousedown', (e) => {
        if (panel.classList.contains('collapsed')) return;
        e.preventDefault();
        startX = e.clientX;
        lastClientX = e.clientX;
        startWidth = panel.getBoundingClientRect().width;
        handle.classList.add('active');
        lockLayout();
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function applyWidth(clientX) {
        const delta = startX - clientX;
        let newWidth = startWidth + delta;
        newWidth = Math.max(280, Math.min(newWidth, window.innerWidth * 0.65));
        panel.style.width = newWidth + 'px';
    }

    function onMouseMove(e) {
        lastClientX = e.clientX;
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            rafId = null;
            applyWidth(lastClientX);
        });
    }

    function onMouseUp() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        applyWidth(lastClientX);
        handle.classList.remove('active');
        unlockLayout();
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}

function initReaderEvents() {
    // AI面板折叠
    DOM.aiPanelCloseBtn.addEventListener('click', () => {
        AppState.aiPanelCollapsed = !AppState.aiPanelCollapsed;
        const panel = DOM.aiPanel;
        const handle = document.getElementById('panelResizeHandle');

        if (AppState.aiPanelCollapsed) {
            AppState._savedPanelWidth = panel.style.width || getComputedStyle(panel).width;
            panel.style.width = '0px';
            panel.classList.add('collapsed');
        } else {
            panel.classList.remove('collapsed');
            panel.style.width = AppState._savedPanelWidth || '380px';
        }
        if (handle) handle.classList.toggle('hidden', AppState.aiPanelCollapsed);
    });

    // AI面板宽度拖拽调节
    initPanelResize();

    // 缩放
    document.getElementById('zoomInBtn').addEventListener('click', () => changeZoom(10));
    document.getElementById('zoomOutBtn').addEventListener('click', () => changeZoom(-10));
    document.getElementById('fitWidthBtn').addEventListener('click', fitWidth);

    // 页面模式
    document.getElementById('singlePageBtn').addEventListener('click', () => setPageMode('single'));
    document.getElementById('doublePageBtn').addEventListener('click', () => setPageMode('double'));

    // 主题切换
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

    // AI发送
    DOM.aiSendBtn.addEventListener('click', sendMessage);
    DOM.aiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // 快捷操作
    DOM.quickActions.addEventListener('click', (e) => {
        const btn = e.target.closest('.quick-action-btn');
        if (!btn) return;
        const action = btn.dataset.action;
        const prompts = {
            summarize: '请总结本文档的核心要点',
            explain: '请解释当前页面的主要内容',
            compare: '请对比分析文档中的关键数据'
        };
        DOM.aiInput.value = prompts[action] || '';
        DOM.aiInput.focus();
    });

    // 历史对话下拉
    DOM.chatHistoryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.chatDropdown.classList.toggle('hidden');
        if (!DOM.chatDropdown.classList.contains('hidden')) {
            renderChatList();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.chat-dropdown') && !e.target.closest('#chatHistoryBtn')) {
            DOM.chatDropdown.classList.add('hidden');
        }
    });

    // 选中文字菜单 - 监听整个document，同时处理PDF iframe内的选择
    document.addEventListener('mouseup', handleTextSelection);

    // 选中文字拖拽检测
    DOM.documentViewport.addEventListener('mousedown', handleViewportMouseDown);

    // 悬浮窗事件
    initFloatingWindowEvents();

    // 引用列表事件
    initQuoteListEvents();

    // 引用列表作为拖放目标
    setupQuoteListDropTarget();

    // 右键显示传统菜单
    DOM.documentViewport.addEventListener('contextmenu', (e) => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (text.length > 0) {
            e.preventDefault();
            hideFloatingWindow();
            showSelectionMenu(e.clientX, e.clientY);
        }
    });

    // 滚动位置保存（防抖）
    let scrollDebounceTimer = null;
    DOM.documentViewport.addEventListener('scroll', () => {
        if (AppState._suppressScrollSave) return;
        if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer);
        scrollDebounceTimer = setTimeout(() => {
            if (AppState.activeDocId && !AppState._suppressScrollSave) {
                saveReadingPosition(AppState.activeDocId);
            }
        }, 500);
    });
}

// ==================== 键盘快捷键 ====================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '+':
                case '=':
                    e.preventDefault();
                    changeZoom(10);
                    break;
                case '-':
                    e.preventDefault();
                    changeZoom(-10);
                    break;
                case '1':
                    e.preventDefault();
                    fitWidth();
                    break;
                case 'q':
                    e.preventDefault();
                    // Ctrl+Q AI提问选中文字
                    const selection = window.getSelection().toString();
                    if (selection && AppState.currentPage === 'reader') {
                        askAIAboutSelection(selection);
                    }
                    break;
                case 'n':
                    e.preventDefault();
                    newChat();
                    break;
                case 'f':
                    e.preventDefault();
                    if (AppState.currentPage === 'library') {
                        DOM.searchInput.focus();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    toggleSidebar();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    toggleAIPanel();
                    break;
            }
        }
    });
}

// ==================== 页面切换 ====================
function showPage(page) {
    AppState.currentPage = page;
    if (page === 'library') {
        DOM.pageLibrary.classList.remove('hidden');
        DOM.pageReader.classList.add('hidden');
        document.body.style.background = '';
        renderDocs();
    } else if (page === 'reader') {
        DOM.pageLibrary.classList.add('hidden');
        DOM.pageReader.classList.remove('hidden');
    }
}

function goToLibrary() {
    AppState._suppressScrollSave = true;
    if (AppState.activeDocId) {
        saveReadingPosition(AppState.activeDocId);
        const doc = AppState.documents.find(d => d.id === AppState.activeDocId);
        if (doc && doc.type !== 'pdf') {
            cacheRenderedContent(AppState.activeDocId);
        }
    }
    DOM.pdfViewerFrame.classList.add('hidden');
    document.getElementById('readerToolbar')?.classList.remove('hidden');
    showPage('library');
}

function openDocument(docId) {
    AppState._suppressScrollSave = true;

    const doc = AppState.documents.find(d => d.id === docId);
    if (!doc) {
        AppState._suppressScrollSave = false;
        return;
    }

    const content = AppState.docContents[doc.content];
    if (!content) {
        DOM.documentPages.innerHTML = '<div class="empty-state"><p>文档内容未找到</p></div>';
        AppState._suppressScrollSave = false;
        return;
    }

    if (AppState.activeDocId && AppState.activeDocId !== docId) {
        saveReadingPosition(AppState.activeDocId);
        const prevDoc = AppState.documents.find(d => d.id === AppState.activeDocId);
        if (prevDoc && prevDoc.type !== 'pdf') {
            cacheRenderedContent(AppState.activeDocId);
        }
    }

    const isNewOpen = !AppState.openDocs.includes(docId);
    if (isNewOpen) {
        AppState.openDocs.push(docId);
    }

    AppState.activeDocId = docId;
    AppState.currentDoc = doc;
    doc.lastRead = new Date().toISOString().split('T')[0];

    showPage('reader');
    renderDocTabs();
    initChat(docId);

    if (doc.type === 'pdf') {
        renderDocument(doc, () => {
            restoreReadingPosition(docId);
        });
    } else if (!isNewOpen && AppState.renderedDocs[docId]) {
        DOM.pdfViewerFrame.classList.add('hidden');
        document.getElementById('readerToolbar')?.classList.remove('hidden');
        restoreRenderedContent(docId);
        restoreReadingPosition(docId);
    } else {
        renderDocument(doc, () => {
            cacheRenderedContent(docId);
            restoreReadingPosition(docId);
        });
    }
}

function switchDocTab(docId) {
    if (docId === AppState.activeDocId) return;

    AppState._suppressScrollSave = true;
    
    if (AppState.activeDocId) {
        saveReadingPosition(AppState.activeDocId);
        const prevDoc = AppState.documents.find(d => d.id === AppState.activeDocId);
        if (prevDoc && prevDoc.type !== 'pdf') {
            cacheRenderedContent(AppState.activeDocId);
        }
    }

    const doc = AppState.documents.find(d => d.id === docId);
    if (!doc) { AppState._suppressScrollSave = false; return; }

    const content = AppState.docContents[doc.content];
    if (!content) { AppState._suppressScrollSave = false; return; }

    AppState.activeDocId = docId;
    AppState.currentDoc = doc;
    doc.lastRead = new Date().toISOString().split('T')[0];

    renderDocTabs();
    initChat(docId);

    if (doc.type === 'pdf') {
        renderDocument(doc, () => {
            restoreReadingPosition(docId);
        });
    } else if (AppState.renderedDocs[docId]) {
        DOM.pdfViewerFrame.classList.add('hidden');
        document.getElementById('readerToolbar')?.classList.remove('hidden');
        restoreRenderedContent(docId);
        restoreReadingPosition(docId);
    } else {
        renderDocument(doc, () => {
            cacheRenderedContent(docId);
            restoreReadingPosition(docId);
        });
    }
}

function cacheRenderedContent(docId) {
    if (!docId || !DOM.documentPages) return;
    
    const childCount = DOM.documentPages.children.length;
    
    const existingContainer = AppState.renderedDocs[docId];
    if (existingContainer && existingContainer.parentNode) {
        existingContainer.dataset.zoom = AppState.zoom;
        existingContainer.dataset.pageMode = AppState.pageMode;
        
        let moved = 0;
        while (DOM.documentPages.firstChild) {
            existingContainer.appendChild(DOM.documentPages.firstChild);
            moved++;
        }
        return;
    }

    const container = document.createElement('div');
    container.className = DOM.documentPages.className;
    container.id = 'rendered-' + docId;
    container.dataset.zoom = AppState.zoom;
    container.dataset.pageMode = AppState.pageMode;
    
    let moved = 0;
    while (DOM.documentPages.firstChild) {
        container.appendChild(DOM.documentPages.firstChild);
        moved++;
    }
    
    container.style.display = 'none';
    DOM.documentViewport.appendChild(container);
    
    
    AppState.renderedDocs[docId] = container;
}

function restoreRenderedContent(docId) {
    const cachedContainer = AppState.renderedDocs[docId];
    if (!cachedContainer || !cachedContainer.parentNode) {
        return false;
    }


    document.querySelectorAll('#documentViewport > [id^="rendered-"]').forEach(el => {
        if (el.id !== cachedContainer.id) {
            el.style.display = 'none';
        }
    });

    DOM.documentPages.className = cachedContainer.className;
    DOM.documentPages.innerHTML = '';
    
    let moved = 0;
    while (cachedContainer.firstChild) {
        DOM.documentPages.appendChild(cachedContainer.firstChild);
        moved++;
    }
    
    
    const zoom = parseFloat(cachedContainer.dataset.zoom) || 100;
    const pageMode = cachedContainer.dataset.pageMode || 'single';
    
    if (zoom !== AppState.zoom) {
        AppState.zoom = zoom;
        updateZoom();
    }
    if (pageMode !== AppState.pageMode) {
        AppState.pageMode = pageMode;
        document.getElementById('singlePageBtn').classList.toggle('active', pageMode === 'single');
        document.getElementById('doublePageBtn').classList.toggle('active', pageMode === 'double');
        DOM.documentPages.classList.toggle('double-page', pageMode === 'double');
    }
    
    return true;
}

function closeDocTab(docId) {
    saveReadingPosition(docId);

    const idx = AppState.openDocs.indexOf(docId);
    if (idx > -1) {
        AppState.openDocs.splice(idx, 1);
    }

    const cachedContainer = AppState.renderedDocs[docId];
    if (cachedContainer && cachedContainer.parentNode) {
        cachedContainer.parentNode.removeChild(cachedContainer);
    }
    delete AppState.renderedDocs[docId];

    if (AppState.pdfBlobUrls[docId]) {
        URL.revokeObjectURL(AppState.pdfBlobUrls[docId]);
        delete AppState.pdfBlobUrls[docId];
    }

    if (AppState.openDocs.length === 0) {
        AppState.activeDocId = null;
        AppState.currentDoc = null;
        AppState.currentChat = null;
        DOM.pdfViewerFrame.classList.add('hidden');
        showPage('library');
        return;
    }

    if (AppState.activeDocId === docId) {
        const newIdx = Math.min(idx, AppState.openDocs.length - 1);
        switchDocTab(AppState.openDocs[newIdx]);
    } else {
        renderDocTabs();
    }
}

function saveReadingPosition(docId) {
    if (!docId) return;

    const viewport = DOM.documentViewport;
    if (!viewport) return;

    const scrollTop = viewport.scrollTop;
    const pages = viewport.querySelectorAll('.pdf-page, .docx-page, .pptx-slide, .epub-page, .txt-page');

    let currentPage = 1;
    let offsetInPage = 0;

    if (pages.length > 0) {
        for (let i = 0; i < pages.length; i++) {
            const pageTop = pages[i].offsetTop;
            const pageBottom = pageTop + pages[i].offsetHeight;
            if (scrollTop >= pageTop && scrollTop < pageBottom) {
                currentPage = i + 1;
                offsetInPage = scrollTop - pageTop;
                break;
            }
            if (pageTop > scrollTop) {
                currentPage = i + 1;
                offsetInPage = 0;
                break;
            }
        }
    }

    const zoomFactor = AppState.zoom / 100;
    const normalizedOffset = offsetInPage / zoomFactor;

    AppState.readingPositions[docId] = {
        currentPage,
        offsetInPage: normalizedOffset,
        zoom: AppState.zoom,
        pageMode: AppState.pageMode,
    };
}

function restoreReadingPosition(docId) {
    if (docId !== AppState.activeDocId) {
        AppState._suppressScrollSave = false;
        return;
    }

    const pos = AppState.readingPositions[docId];
    if (!pos) {
        AppState._suppressScrollSave = false;
        return;
    }

    let needsZoomUpdate = false;
    if (pos.zoom && pos.zoom !== AppState.zoom) {
        AppState.zoom = pos.zoom;
        needsZoomUpdate = true;
    }
    if (pos.pageMode && pos.pageMode !== AppState.pageMode) {
        AppState.pageMode = pos.pageMode;
        document.getElementById('singlePageBtn').classList.toggle('active', pos.pageMode === 'single');
        document.getElementById('doublePageBtn').classList.toggle('active', pos.pageMode === 'double');
        DOM.documentPages.classList.toggle('double-page', pos.pageMode === 'double');
    }
    if (needsZoomUpdate) {
        updateZoom();
    }

    const doRestore = () => {
        if (docId !== AppState.activeDocId) {
            AppState._suppressScrollSave = false;
            return;
        }

        const pages = DOM.documentViewport.querySelectorAll('.pdf-page, .docx-page, .pptx-slide, .epub-page, .txt-page');
        if (pages.length === 0 || !pos.currentPage) {
            AppState._suppressScrollSave = false;
            return;
        }

        const idx = Math.min(pos.currentPage - 1, pages.length - 1);
        const target = pages[idx];
        if (!target) {
            AppState._suppressScrollSave = false;
            return;
        }

        const zoomFactor = AppState.zoom / 100;
        const targetTop = target.offsetTop;
        const offset = (pos.offsetInPage || 0) * zoomFactor;
        DOM.documentViewport.scrollTop = targetTop + offset;
        
        setTimeout(() => {
            AppState._suppressScrollSave = false;
        }, 100);
    };

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            doRestore();
        });
    });
}

// ==================== 文档标签页渲染 ====================
function renderDocTabs() {
    if (!DOM.docTabsScroll) return;

    let html = '';
    AppState.openDocs.forEach(docId => {
        const doc = AppState.documents.find(d => d.id === docId);
        if (!doc) return;
        const isActive = docId === AppState.activeDocId;
        const typeIcons = { pdf: '📄', pptx: '📊', docx: '📘', epub: '📖', txt: '📝' };
        const icon = typeIcons[doc.type] || '📄';
        html += `
            <div class="doc-tab ${isActive ? 'active' : ''}" data-doc-id="${docId}" onclick="switchDocTab('${docId}')">
                <span class="doc-tab-icon">${icon}</span>
                <span class="doc-tab-name" title="${escapeHtml(doc.name)}">${escapeHtml(doc.name)}</span>
                <button class="doc-tab-close" onclick="event.stopPropagation();closeDocTab('${docId}')" title="关闭">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
        `;
    });

    DOM.docTabsScroll.innerHTML = html;

    if (AppState.openDocs.length === 0) {
        DOM.docTabsContainer.classList.add('empty');
    } else {
        DOM.docTabsContainer.classList.remove('empty');
    }

    const activeTab = DOM.docTabsScroll.querySelector('.doc-tab.active');
    if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
}

// ==================== 阅读器渲染 ====================

function renderDocument(doc, onRenderComplete) {
    const content = AppState.docContents[doc.content];
    if (!content) {
        DOM.documentPages.innerHTML = '<div class="empty-state"><p>无法加载文档内容</p></div>';
        AppState._suppressScrollSave = false;
        if (onRenderComplete) onRenderComplete();
        return;
    }

    AppState._renderGeneration = (AppState._renderGeneration || 0) + 1;
    const generation = AppState._renderGeneration;

    AppState._suppressScrollSave = true;

    DOM.documentPages.innerHTML = '';
    DOM.documentViewport.scrollTop = 0;

    function isCurrent() { return AppState._renderGeneration === generation; }

    const done = () => {
        if (!isCurrent()) return;
        updateZoom();
        if (onRenderComplete) onRenderComplete();
    };

    const safeCallback = () => {
        if (isCurrent()) done();
    };

    switch (doc.type) {
        case 'pdf':
            renderPDFWithViewer(doc, content, safeCallback);
            break;
        case 'docx':
            DOM.pdfViewerFrame.classList.add('hidden');
            document.getElementById('readerToolbar')?.classList.remove('hidden');
            renderDOCXDocument(doc, content);
            done();
            break;
        case 'pptx':
            DOM.pdfViewerFrame.classList.add('hidden');
            document.getElementById('readerToolbar')?.classList.remove('hidden');
            renderPPTXDocument(doc, content);
            done();
            break;
        case 'epub':
            DOM.pdfViewerFrame.classList.add('hidden');
            document.getElementById('readerToolbar')?.classList.remove('hidden');
            renderEPubDocument(doc, content);
            done();
            break;
        case 'txt':
        default:
            DOM.pdfViewerFrame.classList.add('hidden');
            document.getElementById('readerToolbar')?.classList.remove('hidden');
            renderTextDocument(doc, content);
            done();
            break;
    }
}

function renderPDFWithViewer(doc, content, onRenderComplete) {
    const pdfDataLength = content.pdfData?.byteLength || content.pdfData?.length || 0;

    if (!content.pdfData || pdfDataLength === 0) {
        DOM.pdfViewerFrame.classList.add('hidden');
        document.getElementById('readerToolbar')?.classList.remove('hidden');
        if (content.pages && content.pages.length > 0) {
            renderTextDocument(doc, content);
        } else {
            DOM.documentPages.innerHTML = '<div class="empty-state"><p>PDF数据未加载</p></div>';
        }
        if (onRenderComplete) onRenderComplete();
        return;
    }

    if (AppState.pdfBlobUrls[doc.id]) {
        URL.revokeObjectURL(AppState.pdfBlobUrls[doc.id]);
    }

    const blob = new Blob([content.pdfData], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    AppState.pdfBlobUrls[doc.id] = blobUrl;

    document.getElementById('readerToolbar')?.classList.add('hidden');
    DOM.pdfViewerFrame.classList.remove('hidden');

    if (AppState._pdfReadyCheckInterval) {
        clearInterval(AppState._pdfReadyCheckInterval);
        AppState._pdfReadyCheckInterval = null;
    }

    const sendPdf = () => {
        const viewerWindow = DOM.pdfViewerFrame.contentWindow;
        if (viewerWindow) {
            viewerWindow.postMessage({ type: 'loadPdf', url: blobUrl }, '*');
        }
    };

    const viewerAlreadyLoaded = DOM.pdfViewerFrame.src && DOM.pdfViewerFrame.src.includes('viewer.html');

    if (viewerAlreadyLoaded && AppState.pdfViewerReady) {
        sendPdf();
        if (onRenderComplete) onRenderComplete();
        return;
    }

    AppState.pdfViewerReady = false;

    const maxWait = 15000;
    const startTime = Date.now();

    AppState._pdfReadyCheckInterval = setInterval(() => {
        if (AppState.pdfViewerReady) {
            clearInterval(AppState._pdfReadyCheckInterval);
            AppState._pdfReadyCheckInterval = null;
            sendPdf();
            if (onRenderComplete) onRenderComplete();
        } else if (Date.now() - startTime > maxWait) {
            clearInterval(AppState._pdfReadyCheckInterval);
            AppState._pdfReadyCheckInterval = null;
            sendPdf();
            if (onRenderComplete) onRenderComplete();
        }
    }, 100);

    if (!viewerAlreadyLoaded) {
        AppState._pdfSelectionSetup = false;
        DOM.pdfViewerFrame.src = 'web/viewer.html';
    }
}

// ==================== 原生格式渲染函数 ====================

function transformMatrix(m1, m2) {
    return [
        m1[0] * m2[0] + m1[2] * m2[1],
        m1[1] * m2[0] + m1[3] * m2[1],
        m1[0] * m2[2] + m1[2] * m2[3],
        m1[1] * m2[2] + m1[3] * m2[3],
        m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
        m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
    ];
}

function buildTextLayer(textContent, textLayerDiv, viewport) {
    if (!textContent || !textContent.items) return;

    const fontInfo = {};
    if (textContent.styles) {
        for (const [fontName, style] of Object.entries(textContent.styles)) {
            fontInfo[fontName] = {
                fontFamily: style.fontFamily || 'sans-serif',
                ascent: typeof style.ascent === 'number' ? style.ascent : 0.9,
                descent: typeof style.descent === 'number' ? Math.abs(style.descent) : 0.3
            };
        }
    }

    textContent.items.forEach(item => {
        if (!item.str) return;

        const tx = transformMatrix(viewport.transform, item.transform);

        let fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
        if (fontHeight <= 0) fontHeight = 1;

        const info = fontInfo[item.fontName] || { fontFamily: 'sans-serif', ascent: 0.9, descent: 0.3 };
        const total = info.ascent + info.descent;
        const ascentRatio = total > 0 ? info.ascent / total : 0.75;

        const span = document.createElement('span');
        span.textContent = item.str;
        span.style.position = 'absolute';
        span.style.left = Math.floor(tx[4]) + 'px';
        span.style.top = Math.floor(tx[5] - fontHeight * ascentRatio) + 'px';
        span.style.fontSize = Math.round(fontHeight) + 'px';
        span.style.fontFamily = info.fontFamily;
        span.style.color = 'transparent';
        span.style.whiteSpace = 'pre';
        span.style.cursor = 'text';
        span.style.transformOrigin = '0% 0%';
        span.style.pointerEvents = 'auto';

        if (item.width && item.width > 0) {
            span.style.display = 'inline-block';
            span.style.maxWidth = Math.ceil(item.width * viewport.scale) + 'px';
        }

        textLayerDiv.appendChild(span);
    });
}

function renderPDFDocument(doc, content, generation, onRenderComplete) {
    const container = DOM.documentPages;

    function isCurrent() { return AppState._renderGeneration === generation; }

    if (typeof pdfjsLib === 'undefined') {
        container.innerHTML = '<div class="empty-state"><p>PDF渲染库未加载，请检查网络连接</p></div>';
        if (onRenderComplete) onRenderComplete();
        return;
    }

    if (!content.pdfData || content.pdfData.byteLength === 0) {
        if (content.pages && content.pages.length > 0) {
            renderTextDocument(doc, content);
        } else {
            container.innerHTML = '<div class="empty-state"><p>PDF数据未加载</p></div>';
        }
        if (onRenderComplete) onRenderComplete();
        return;
    }

    container.innerHTML = '<div class="pdf-loading">正在渲染PDF...</div>';

    pdfjsLib.GlobalWorkerOptions.workerSrc = './build/pdf.worker.mjs';

    const renderData = content.pdfData.slice(0);
    const loadingTask = pdfjsLib.getDocument({ data: renderData });

    loadingTask.onPassword = function(callback) {
        callback(prompt('请输入PDF密码:') || '', false);
    };

    loadingTask.onProgress = function(progress) {
        if (!isCurrent()) return;
        const total = progress.total;
        const loaded = progress.loaded;
        if (total) {
            const percent = Math.round((loaded / total) * 100);
            container.innerHTML = `<div class="pdf-loading">正在加载PDF... ${percent}%</div>`;
        }
    };

    loadingTask.promise.then(async pdf => {
        if (!isCurrent()) return;

        const numPages = pdf.numPages;

        if (!isCurrent()) return;
        container.innerHTML = '';
        container.className = 'document-pages pdf-container';

        for (let i = 1; i <= numPages; i++) {
            if (!isCurrent()) return;

            const pageContainer = document.createElement('div');
            pageContainer.className = 'pdf-page';
            pageContainer.dataset.page = i;

            const pageWrapper = document.createElement('div');
            pageWrapper.className = 'pdf-page-wrapper';

            const canvas = document.createElement('canvas');
            canvas.className = 'pdf-canvas';
            pageWrapper.appendChild(canvas);

            const textLayerDiv = document.createElement('div');
            textLayerDiv.className = 'pdf-text-layer';
            pageWrapper.appendChild(textLayerDiv);

            pageContainer.appendChild(pageWrapper);
            container.appendChild(pageContainer);

            try {
                const page = await pdf.getPage(i);
                if (!isCurrent()) return;

                const scale = 1.5;
                const viewport = page.getViewport({ scale: scale });
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                textLayerDiv.style.width = viewport.width + 'px';
                textLayerDiv.style.height = viewport.height + 'px';
                textLayerDiv.innerHTML = '';

                const context = canvas.getContext('2d');
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                if (!isCurrent()) return;

                const textContent = await page.getTextContent();
                if (!isCurrent()) return;

                const textLayer = new pdfjsLib.TextLayer({
                    textContentSource: textContent,
                    container: textLayerDiv,
                    viewport: viewport
                });
                textLayer.render();
            } catch (err) {
                if (!isCurrent()) return;
                canvas.style.display = 'none';
                pageContainer.innerHTML += `<p style="color:var(--text-tertiary);text-align:center;padding:40px;">第 ${i} 页渲染失败</p>`;
            }
        }

        if (!isCurrent()) return;
        if (onRenderComplete) onRenderComplete();
    }).catch(error => {
        if (!isCurrent()) return;
        container.innerHTML = `<div class="empty-state"><p>PDF渲染失败: ${escapeHtml(error.message)}</p></div>`;
        if (onRenderComplete) onRenderComplete();
    });
}

// 渲染DOCX文档（保留格式）
function renderDOCXDocument(doc, content) {
    const container = DOM.documentPages;

    if (content.html) {
        container.className = 'document-pages docx-container';
        container.innerHTML = `<div class="docx-content">${content.html}</div>`;
    } else if (content.pages) {
        container.className = 'document-pages';
        container.innerHTML = '';
        content.pages.forEach((page, i) => {
            const pageContainer = document.createElement('div');
            pageContainer.className = 'docx-page';
            pageContainer.dataset.page = i + 1;
            pageContainer.innerHTML = page.body;
            container.appendChild(pageContainer);
        });
    } else {
        container.innerHTML = '<div class="empty-state"><p>文档内容为空</p></div>';
    }
}

// 渲染PPTX文档（幻灯片预览）
function renderPPTXDocument(doc, content) {
    const container = DOM.documentPages;
    const slides = content.slides || content.pages;

    if (!slides || slides.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>暂无幻灯片内容</p></div>';
        return;
    }

    container.innerHTML = '';
    container.className = 'document-pages pptx-container';

    slides.forEach((slide, i) => {
        const slideContainer = document.createElement('div');
        slideContainer.className = 'pptx-slide';
        slideContainer.dataset.slide = i + 1;
        slideContainer.innerHTML = `
            <div class="slide-header">幻灯片 ${slide.num || (i + 1)}</div>
            <div class="slide-content">${slide.body || ''}</div>
        `;
        container.appendChild(slideContainer);
    });
}

// 渲染EPUB文档
function renderEPubDocument(doc, content) {
    const container = DOM.documentPages;
    container.className = 'document-pages epub-container';

    if (content.pages) {
        content.pages.forEach((page, i) => {
            const pageContainer = document.createElement('div');
            pageContainer.className = 'epub-page';
            pageContainer.dataset.page = i + 1;
            pageContainer.innerHTML = page.body;
            container.appendChild(pageContainer);
        });
    } else {
        container.innerHTML = '<div class="empty-state"><p>EPUB内容为空</p></div>';
    }
}

// 渲染文本文档
function renderTextDocument(doc, content) {
    const container = DOM.documentPages;
    container.className = 'document-pages txt-container';

    if (content.pages && content.pages.length > 0) {
        container.innerHTML = '';
        content.pages.forEach((page, i) => {
            const pageContainer = document.createElement('div');
            pageContainer.className = 'txt-page';
            pageContainer.dataset.page = i + 1;
            pageContainer.innerHTML = `
                ${i === 0 ? `<h1>${escapeHtml(content.title || '')}</h1><p class="meta-line">作者：${escapeHtml(content.author || '')}</p>` : ''}
                ${page.body}
            `;
            container.appendChild(pageContainer);
        });
    } else {
        container.innerHTML = '<div class="empty-state"><p>文本文档内容为空</p></div>';
    }
}

// ==================== 页面跳转 ====================
function jumpToPage(pageNum) {
    const pages = document.querySelectorAll('.pdf-page, .docx-page, .pptx-slide, .epub-page, .txt-page');
    const target = pages[pageNum - 1];
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function generateTOC() {
    showToast('正在基于文档标题生成目录...', 'success');
    setTimeout(() => {
        showToast('目录生成完成', 'success');
    }, 1000);
}

// ==================== 缩放控制 ====================
function changeZoom(delta) {
    AppState._suppressScrollSave = true;
    AppState.zoom = Math.max(50, Math.min(200, AppState.zoom + delta));
    updateZoom();
    if (AppState.activeDocId) saveReadingPosition(AppState.activeDocId);
    showToast(`缩放: ${AppState.zoom}%`, 'success');
    setTimeout(() => { AppState._suppressScrollSave = false; }, 300);
}

function fitWidth() {
    AppState._suppressScrollSave = true;
    AppState.zoom = 100;
    updateZoom();
    if (AppState.activeDocId) saveReadingPosition(AppState.activeDocId);
    showToast('已适配宽度', 'success');
    setTimeout(() => { AppState._suppressScrollSave = false; }, 300);
}

function updateZoom() {
    DOM.zoomDisplay.textContent = `${AppState.zoom}%`;
    DOM.documentPages.style.zoom = AppState.zoom / 100;
}

function setPageMode(mode) {
    AppState._suppressScrollSave = true;
    AppState.pageMode = mode;
    document.getElementById('singlePageBtn').classList.toggle('active', mode === 'single');
    document.getElementById('doublePageBtn').classList.toggle('active', mode === 'double');
    DOM.documentPages.classList.toggle('double-page', mode === 'double');
    if (AppState.activeDocId) saveReadingPosition(AppState.activeDocId);
    setTimeout(() => { AppState._suppressScrollSave = false; }, 300);
}

// ==================== 侧边栏/AI面板控制 ====================
function toggleAIPanel() {
    AppState.aiPanelCollapsed = !AppState.aiPanelCollapsed;
    DOM.aiPanel.classList.toggle('collapsed', AppState.aiPanelCollapsed);
}

// ==================== 主题切换 ====================
function toggleTheme() {
    const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    AppState.theme = theme;
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        // auto
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    // 更新设置弹窗中的选中状态
    document.querySelectorAll('.setting-option[data-theme]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

function setHighlightColor(color) {
    AppState.highlightColor = color;
    document.documentElement.style.setProperty('--highlight-color', color);
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === color);
    });
}

function setAnswerLength(length) {
    AppState.answerLength = length;
    document.querySelectorAll('.setting-option[data-length]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.length === length);
    });
}

// ==================== AI对话 ====================
function initChat(docId) {
    const chats = AppState.chats[docId] || [];
    if (chats.length > 0) {
        AppState.currentChat = chats[chats.length - 1];
    } else {
        AppState.currentChat = null;
    }
    // 切换文档时清空引用列表
    AppState.quoteList = [];
    renderChatMessages();
    renderQuoteList();
}

function renderChatMessages() {
    if (!DOM.aiChatArea) return;
    DOM.aiChatArea.innerHTML = '';

    const isConfigured = AIService.isConfigured();

    if (!isConfigured) {
        DOM.aiChatArea.innerHTML = `
            <div class="chat-welcome" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                <p style="margin-bottom:8px;font-weight:600;">🔑 请先配置AI服务</p>
                <p style="font-size:12px;opacity:0.9;">前往设置 → AI服务，配置DeepSeek API Key 即可开始使用AI对话功能</p>
                <button class="btn-primary" style="margin-top:10px;font-size:12px;padding:6px 14px;" onclick="openSettings()">前往设置</button>
            </div>
        `;
        return;
    }

    if (!AppState.currentChat || !AppState.currentChat.messages || AppState.currentChat.messages.length === 0) {
        DOM.aiChatArea.innerHTML = `
            <div class="chat-welcome">
                <p style="margin-bottom:6px;font-size:14px;">👋 欢迎提问！</p>
                <p style="font-size:12px;opacity:0.85;">可选中文字点击「引用」收集片段，或直接输入问题</p>
            </div>
        `;
        return;
    }

    AppState.currentChat.messages.forEach((msg, idx) => {
        const msgEl = document.createElement('div');
        msgEl.className = 'chat-message';

        if (msg.role === 'user') {
            var refsHtml = '';
            if (msg.references && msg.references.length > 0) {
                var refItems = msg.references.map(function(ref) {
                    var typeIcon = { selection: '💬', explanation: '💡', translation: '🔍' }[ref.type] || '💬';
                    var pageStr = ref.pageNumber ? '第' + ref.pageNumber + '页' : '';
                    var displayText = ref.type === 'explanation' && ref.aiContent
                        ? ref.aiContent : (ref.type === 'translation' && ref.aiContent
                            ? ref.aiContent : ref.text);
                    displayText = escapeHtml((displayText || ref.text || '').substring(0, 80));
                    return '<div class="msg-ref-item msg-ref-' + ref.type + '">' +
                        '<span class="msg-ref-icon">' + typeIcon + '</span>' +
                        '<div class="msg-ref-body">' +
                        '<span class="msg-ref-text">' + displayText + '</span>' +
                        (pageStr ? '<span class="msg-ref-page">' + pageStr + '</span>' : '') +
                        '</div></div>';
                }).join('');
                refsHtml = '<div class="message-references">' +
                    '<div class="message-references-label">📎 引用内容 (' + msg.references.length + ')</div>' +
                    refItems + '</div>';
            }
            msgEl.innerHTML = `
                <div class="message-user">
                    ${refsHtml}
                    <div class="message-user-content">${escapeHtml(msg.content)}</div>
                    <div class="message-time">${msg.time || ''}</div>
                </div>
            `;
        } else {
            let sourceHtml = '';
            if (msg.source) {
                sourceHtml = `<div class="message-source-badge" title="点击跳转到来源位置">📍 ${escapeHtml(msg.source)}</div>`;
            }
            msgEl.innerHTML = `
                <div class="message-ai">
                    <div class="message-ai-header">
                        <img class="msg-ai-logo" src="logo.png" alt="AI" draggable="false">
                        <span class="message-ai-label">AI 助手</span>
                    </div>
                    ${sourceHtml}
                    <div class="message-ai-content">${formatAIContent(msg.content)}</div>
                    ${msg.tokens ? `<div style="font-size:10px;color:var(--text-disabled);margin-top:4px;">Token: ${msg.tokens.prompt}↑ ${msg.tokens.completion}↓</div>` : ''}
                    <div class="message-time">${msg.time || ''}</div>
                </div>
            `;
        }
        DOM.aiChatArea.appendChild(msgEl);
    });

    DOM.aiChatArea.scrollTop = DOM.aiChatArea.scrollHeight;
}

function formatAIContent(content) {
    if (!content) return '';

    const placeholders = [];
    let placeholderIndex = 0;

    function savePlaceholder(html) {
        const key = '%%P' + (placeholderIndex++) + '%%';
        placeholders.push(html);
        return key;
    }

    function restorePlaceholders(html) {
        placeholders.forEach(function(val, i) {
            html = html.replace('%%P' + i + '%%', val);
        });
        return html;
    }

    var text = content;

    text = text.replace(/```(\w*)\s*\n([\s\S]*?)```/g, function(match, lang, code) {
        var langClass = lang ? ' class="language-' + escapeHtml(lang) + '"' : '';
        var langLabel = lang ? '<div class="code-lang-label">' + escapeHtml(lang) + '</div>' : '';
        var escapedCode = escapeHtml(code.replace(/^\n+/, '').replace(/\n+$/, ''));
        return savePlaceholder(
            '<div class="code-block-wrapper">' + langLabel +
            '<pre' + langClass + '><code>' + escapedCode + '</code></pre>' +
            '</div>'
        );
    });

    text = text.replace(/`([^`]+)`/g, function(match, code) {
        return savePlaceholder('<code class="inline-code">' + escapeHtml(code) + '</code>');
    });

    var lines = text.split('\n');
    var result = [];
    var i = 0;
    var inTable = false;
    var tableRows = [];
    var tableAligns = [];

    function flushParagraph() {
        var para = result[result.length - 1];
        if (para && !para.match(/^<\/?(h[1-6]|ul|ol|li|blockquote|table|thead|tbody|tr|th|td|hr|div|pre|code|br)/)) {
            result.push('</p>');
        }
    }

    function flushList() {
        var last = result[result.length - 1];
        if (last === '</ul>' || last === '</ol>') return;
        var inUl = false;
        var inOl = false;
        for (var j = result.length - 1; j >= 0; j--) {
            if (result[j] === '</ul>') { inUl = false; break; }
            if (result[j] === '<ul>') { inUl = true; break; }
            if (result[j] === '</ol>') { inOl = false; break; }
            if (result[j] === '<ol>') { inOl = true; break; }
        }
        if (inUl) result.push('</ul>');
        if (inOl) result.push('</ol>');
    }

    while (i < lines.length) {
        var line = lines[i];

        if (/^\|.*\|$/.test(line) && line.replace(/\|/g, '').trim().length > 0) {
            if (/^\|[\s\-:]+\|[\s\-:]+\|/.test(line) && tableRows.length > 0) {
                var cells = line.split('|').filter(function(c) { return c.trim() !== '' || c === line.split('|')[0]; });
                if (cells.length === 0) {
                    cells = line.split('|').slice(1, -1);
                } else {
                    cells = line.split('|').filter(function(c, idx, arr) {
                        return idx > 0 && idx < arr.length - 1;
                    });
                }
                tableAligns = cells.map(function(c) {
                    c = c.trim();
                    if (/^:-+:$/.test(c)) return 'center';
                    if (/^-+:$/.test(c)) return 'right';
                    return 'left';
                });
                i++;
                continue;
            }

            if (!inTable) {
                flushList();
                flushParagraph();
                inTable = true;
                tableRows = [];
                tableAligns = [];
            }

            var rawCells = line.split('|');
            var contentCells;
            if (rawCells[0].trim() === '' && rawCells[rawCells.length - 1].trim() === '') {
                contentCells = rawCells.slice(1, -1);
            } else {
                contentCells = rawCells;
            }
            tableRows.push(contentCells.map(function(c) { return c.trim(); }));
            i++;
            continue;
        } else if (inTable) {
            inTable = false;
            renderTable();
            continue;
        }

        if (/^#{1,6}\s/.test(line)) {
            flushList();
            flushParagraph();
            var level = line.match(/^(#{1,6})/)[1].length;
            var headingText = line.replace(/^#{1,6}\s+/, '');
            result.push('<h' + level + ' class="ai-heading">' + headingText + '</h' + level + '>');
            i++;
            continue;
        }

        if (/^>\s?/.test(line)) {
            flushList();
            flushParagraph();
            var quoteLines = [];
            while (i < lines.length && /^>\s?/.test(lines[i])) {
                quoteLines.push(lines[i].replace(/^>\s?/, ''));
                i++;
            }
            result.push('<blockquote class="ai-blockquote">' + quoteLines.join('<br>') + '</blockquote>');
            continue;
        }

        if (/^---+\s*$/.test(line) || /^\*\*\*+\s*$/.test(line)) {
            flushList();
            flushParagraph();
            result.push('<hr class="ai-hr">');
            i++;
            continue;
        }

        var ulMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
        if (ulMatch) {
            var indent = ulMatch[1].length;
            var liText = ulMatch[2];
            var lastTag = result[result.length - 1];
            if (lastTag !== '<ul>') {
                flushParagraph();
                result.push('<ul>');
            }
            result.push('<li>' + liText + '</li>');
            i++;
            continue;
        }

        var olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
        if (olMatch) {
            var olText = olMatch[3];
            var lastTag2 = result[result.length - 1];
            if (lastTag2 !== '<ol>') {
                flushParagraph();
                result.push('<ol>');
            }
            result.push('<li>' + olText + '</li>');
            i++;
            continue;
        }

        if (line.trim() === '') {
            flushList();
            flushParagraph();
            result.push('<br>');
            i++;
            continue;
        }

        result.push(line);
        i++;
    }

    if (inTable) {
        renderTable();
    }
    flushList();
    flushParagraph();

    function renderTable() {
        if (tableRows.length === 0) return;
        var isHeader = tableRows.length > 1 && /^[\s\-:|]+$/.test(tableRows[0].join(''));
        var headerRow, bodyRows;
        if (isHeader) {
            headerRow = tableRows[0];
            bodyRows = tableRows.slice(2);
        } else {
            headerRow = tableRows[0];
            bodyRows = tableRows.slice(1);
        }
        if (tableAligns.length === 0) {
            tableAligns = headerRow.map(function() { return 'left'; });
        }
        var tableHtml = '<div class="ai-table-wrapper"><table class="ai-table"><thead><tr>';
        for (var k = 0; k < headerRow.length; k++) {
            tableHtml += '<th style="text-align:' + tableAligns[k] + '">' + headerRow[k] + '</th>';
        }
        tableHtml += '</tr></thead><tbody>';
        for (var r = 0; r < bodyRows.length; r++) {
            tableHtml += '<tr>';
            for (var c = 0; c < bodyRows[r].length; c++) {
                var align = tableAligns[c] || 'left';
                tableHtml += '<td style="text-align:' + align + '">' + bodyRows[r][c] + '</td>';
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table></div>';
        result.push(tableHtml);
    }

    var html = result.join('\n');

    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\b_([^_]+)_\b/g, '<em>$1</em>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    html = restorePlaceholders(html);

    return html;
}

async function sendMessage() {
    const text = DOM.aiInput.value.trim();
    if (!text) return;

    const docId = AppState.currentDoc?.id;
    if (!docId) return;

    if (!AIService.isConfigured()) {
        showToast('请先在设置中配置API Key', 'error');
        openSettings();
        return;
    }

    // 创建或获取当前对话
    if (!AppState.currentChat) {
        const newChat = {
            id: `chat-${docId}-${Date.now()}`,
            title: `对话 ${(AppState.chats[docId]?.length || 0) + 1}`,
            date: new Date().toISOString().split('T')[0],
            messages: []
        };
        if (!AppState.chats[docId]) AppState.chats[docId] = [];
        AppState.chats[docId].push(newChat);
        AppState.currentChat = newChat;
    }

    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    // 收集引用列表中的引用
    const references = AppState.quoteList.length > 0 ? [...AppState.quoteList] : [];

    // 添加用户消息
    const userMsg = {
        role: 'user',
        content: text,
        time,
        references: references
    };

    AppState.currentChat.messages.push(userMsg);

    // 发送消息后清空引用列表
    AppState.quoteList = [];

    DOM.aiInput.value = '';
    renderChatMessages();
    renderQuoteList();

    // 显示思考中
    showTypingIndicator();

    // 检查防死循环
    if (AIService.checkRepeatedUserInput(AppState.currentChat.messages.filter(m => m.role === 'user'))) {
        removeTypingIndicator();
        const loopMsg = {
            role: 'ai',
            content: '⚠️ 检测到重复提问。我已经基于文档内容回答了您的问题，如果您需要更详细的信息，请尝试换个角度提问或指明具体章节。',
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            tokens: { prompt: 0, completion: 0 }
        };
        AppState.currentChat.messages.push(loopMsg);
        renderChatMessages();
        return;
    }

    try {
        // 构建文档上下文
        const docContext = buildDocumentContext();

        // 构建消息列表（只发送最近的消息，避免超过token限制）
        const recentMessages = buildRecentMessages(AppState.currentChat.messages);

        // 调用AI
        const result = await AIService.sendChatMessage(recentMessages, docContext, {
            answerLength: AppState.answerLength,
            maxRounds: 20
        });

        removeTypingIndicator();

        const aiMsg = {
            role: 'ai',
            content: result.content,
            source: extractSourceInfo(result.content, docContext),
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            tokens: result.tokens
        };
        AppState.currentChat.messages.push(aiMsg);

        // 更新token统计
        if (result.tokens) {
            AppState.tokenUsage = {
                prompt: AppState.tokenUsage.prompt + result.tokens.prompt,
                completion: AppState.tokenUsage.completion + result.tokens.completion,
                total: AppState.tokenUsage.total + result.tokens.total
            };
        }
    } catch (err) {
        removeTypingIndicator();
        const errorMsg = {
            role: 'ai',
            content: `❌ ${err.message || 'AI调用失败，请重试'}`,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };
        AppState.currentChat.messages.push(errorMsg);
    }

    renderChatMessages();
}

function buildDocumentContext() {
    const doc = AppState.currentDoc;
    if (!doc) return null;

    const content = AppState.docContents[doc.content || doc.id];
    if (!content) return null;

    // 提取全文
    let fullText = '';
    if (content.pages) {
        fullText = content.pages.map(p => {
            const text = stripHtmlTags(p.body || '');
            return text;
        }).join('\n\n');
    } else if (content.fullText) {
        fullText = content.fullText;
    }

    // 提取目录
    let toc = content.toc || [];
    if (!toc || toc.length === 0) {
        toc = extractTOCFromText(
            (content.pages || []).map(p => ({ text: stripHtmlTags(p.body || '') }))
        );
        toc = buildTOCTree(toc);
    }

    return {
        title: content.title || doc.name,
        type: doc.type,
        totalPages: content.pages?.length || 1,
        toc: toc,
        fullText: fullText
    };
}

function buildRecentMessages(messages) {
    const MAX_RECENT = 10;
    const allMessages = messages.filter(m => m.role === 'user' || m.role === 'ai');
    const recent = allMessages.slice(-MAX_RECENT);

    return recent.map(m => ({
        role: m.role === 'ai' ? 'assistant' : m.role,
        content: m.content,
        references: m.references
    }));
}

function extractSourceInfo(content, docContext) {
    if (!docContext) return null;
    const title = docContext.title || '文档';
    return `基于《${title}》全文`;
}

function stripHtmlTags(html) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'chat-message typing-indicator-container';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <span>&nbsp; AI 思考中...</span>
        </div>
    `;
    DOM.aiChatArea.appendChild(indicator);
    DOM.aiChatArea.scrollTop = DOM.aiChatArea.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

function newChat() {
    const docId = AppState.currentDoc?.id;
    if (!docId) return;

    const newChat = {
        id: `chat-${docId}-${Date.now()}`,
        title: `对话 ${(AppState.chats[docId]?.length || 0) + 1}`,
        date: new Date().toISOString().split('T')[0],
        messages: []
    };
    if (!AppState.chats[docId]) AppState.chats[docId] = [];
    AppState.chats[docId].push(newChat);
    AppState.currentChat = newChat;
    AppState.quoteList = [];
    renderChatMessages();
    renderQuoteList();
    showToast('新建对话成功', 'success');
}

function renderChatList() {
    const docId = AppState.currentDoc?.id;
    const chats = AppState.chats[docId] || [];

    if (chats.length === 0) {
        DOM.chatList.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-tertiary);font-size:12px;">暂无历史对话</div>';
        return;
    }

    DOM.chatList.innerHTML = chats.map(chat => `
        <div class="chat-list-item ${AppState.currentChat?.id === chat.id ? 'active' : ''}" onclick="switchChat('${chat.id}')">
            <span>${escapeHtml(chat.title)}</span>
            <span style="font-size:10px;color:var(--text-tertiary);">${chat.messages?.length || 0} 条消息</span>
            <button class="chat-delete-btn" onclick="event.stopPropagation();deleteChat('${chat.id}')">✕</button>
        </div>
    `).join('');
}

function switchChat(chatId) {
    const docId = AppState.currentDoc?.id;
    const chats = AppState.chats[docId] || [];
    AppState.currentChat = chats.find(c => c.id === chatId) || null;
    AppState.quoteList = [];
    renderChatMessages();
    renderQuoteList();
    DOM.chatDropdown.classList.add('hidden');
}

function deleteChat(chatId) {
    showConfirm('删除对话', '是否删除该对话？此操作不可恢复。', () => {
        const docId = AppState.currentDoc?.id;
        if (!docId) return;
        AppState.chats[docId] = (AppState.chats[docId] || []).filter(c => c.id !== chatId);
        if (AppState.currentChat?.id === chatId) {
            AppState.currentChat = null;
        }
        renderChatMessages();
        renderChatList();
        showToast('对话已删除', 'success');
    });
}

function askAIAboutSelection(text) {
    DOM.aiInput.value = `请解释这段文字：${text}`;
    DOM.aiInput.focus();
    showToast('已将选中文字填充到输入框', 'success');
}

// ==================== 引用列表管理 ====================
function initQuoteListEvents() {
    DOM.quoteToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleQuoteList();
    });
    DOM.quoteListHeader.addEventListener('click', (e) => {
        if (e.target.closest('.quote-list-action-btn')) return;
        toggleQuoteList();
    });
    DOM.quoteClearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearQuoteList();
    });
}

function addQuoteToList(text, type, pageInfo, aiContent) {
    const quoteItem = {
        id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type: type,
        text: text,
        aiContent: aiContent || null,
        pageNumber: pageInfo?.page || null,
        chapterTitle: pageInfo?.chapter || null,
        timestamp: new Date().toISOString()
    };

    AppState.quoteList.unshift(quoteItem);
    renderQuoteList();

    if (DOM.quoteListSection.classList.contains('collapsed')) {
        DOM.quoteListSection.classList.remove('collapsed');
        DOM.quoteToggleIcon.innerHTML = '<polyline points="18 15 12 9 6 15"/>';
    }

    showToast('已添加到引用列表', 'success');
}

function renderQuoteList() {
    if (!DOM.quoteListBody) return;

    const count = AppState.quoteList.length;
    DOM.quoteCountBadge.textContent = count;

    if (count === 0) {
        DOM.quoteListEmpty.classList.remove('hidden');
        DOM.quoteListBody.querySelectorAll('.quote-item').forEach(el => el.remove());
        return;
    }

    DOM.quoteListEmpty.classList.add('hidden');

    // 移除旧的项
    DOM.quoteListBody.querySelectorAll('.quote-item').forEach(el => el.remove());

    AppState.quoteList.forEach((item, idx) => {
        const el = document.createElement('div');
        el.className = `quote-item quote-item-type-${item.type}`;

        const icons = {
            selection: '💬',
            explanation: '💡',
            translation: '🔍'
        };

        const typeLabels = {
            selection: '原文',
            explanation: '解释',
            translation: '翻译'
        };

        let displayText = item.text;
        if (item.type === 'explanation' && item.aiContent) {
            displayText = item.aiContent;
        } else if (item.type === 'translation' && item.aiContent) {
            displayText = item.aiContent;
        }

        el.innerHTML = `
            <div class="quote-item-icon">${icons[item.type] || '💬'}</div>
            <div class="quote-item-content">
                <div class="quote-item-text">${escapeHtml(displayText.substring(0, 100))}</div>
                <div class="quote-item-meta">
                    <span class="quote-item-type">${typeLabels[item.type] || item.type}</span>
                    ${item.pageNumber ? `<span class="quote-item-page">第${item.pageNumber}页</span>` : ''}
                    ${item.chapterTitle ? `<span>${escapeHtml(item.chapterTitle)}</span>` : ''}
                </div>
            </div>
            <button class="quote-item-delete" onclick="removeQuoteItem('${item.id}')" title="删除">&times;</button>
        `;

        el.addEventListener('click', (e) => {
            if (e.target.closest('.quote-item-delete')) return;
            if (item.pageNumber) {
                jumpToPage(item.pageNumber);
            }
        });

        DOM.quoteListBody.appendChild(el);
    });
}

function removeQuoteItem(id) {
    AppState.quoteList = AppState.quoteList.filter(item => item.id !== id);
    renderQuoteList();
}

function clearQuoteList() {
    if (AppState.quoteList.length === 0) return;
    showConfirm('清空引用列表', '确定要清空所有引用项吗？', () => {
        AppState.quoteList = [];
        renderQuoteList();
        showToast('引用列表已清空', 'success');
    });
}

function toggleQuoteList() {
    const collapsed = DOM.quoteListSection.classList.toggle('collapsed');
    DOM.quoteToggleIcon.innerHTML = collapsed
        ? '<polyline points="6 9 12 15 18 9"/>'
        : '<polyline points="18 15 12 9 6 15"/>';
}

function setupQuoteListDropTarget() {
    if (!DOM.quoteListSection) return;

    DOM.quoteListSection.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        DOM.quoteListSection.classList.add('quote-drop-active');
    });

    DOM.quoteListSection.addEventListener('dragleave', function(e) {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            DOM.quoteListSection.classList.remove('quote-drop-active');
        }
    });

    DOM.quoteListSection.addEventListener('drop', function(e) {
        e.preventDefault();
        DOM.quoteListSection.classList.remove('quote-drop-active');

        var text = e.dataTransfer.getData('text/plain');
        if (!text && AppState._dragData) {
            text = AppState._dragData.text;
        }
        if (!text) return;

        var pageInfo = (AppState._dragData && AppState._dragData.pageInfo) || getPageInfo();
        addQuoteToList(text, 'selection', pageInfo);
        hideFloatingWindow();
        AppState._dragData = null;
        showToast('已添加到引用列表', 'success');
    });
}

// ==================== 悬浮窗功能 ====================
function initFloatingWindowDrag() {
    var handle = DOM.fwDragHandle;
    var logo = DOM.fwLogo;
    if (!handle) return;

    var startX, startY, startLeft, startTop, rafId, lastClientX, lastClientY;

    function getActiveExpandPanel() {
        if (DOM.fwExplainPanel && !DOM.fwExplainPanel.classList.contains('hidden')) {
            return DOM.fwExplainPanel;
        }
        if (DOM.fwTranslatePanel && !DOM.fwTranslatePanel.classList.contains('hidden')) {
            return DOM.fwTranslatePanel;
        }
        return null;
    }

    function syncExpandPanel() {
        var panel = getActiveExpandPanel();
        if (!panel) return;
        var fwRect = DOM.floatingWindow.getBoundingClientRect();
        panel.style.left = fwRect.left + 'px';
        panel.style.top = fwRect.bottom + 'px';
        panel.style.width = Math.max(340, fwRect.width) + 'px';
    }

    function applyPosition(clientX, clientY) {
        var newLeft = startLeft + (clientX - startX);
        var newTop = startTop + (clientY - startY);
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - DOM.floatingWindow.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - DOM.floatingWindow.offsetHeight));
        DOM.floatingWindow.style.left = newLeft + 'px';
        DOM.floatingWindow.style.top = newTop + 'px';
        syncExpandPanel();
    }

    function bindDragStart(el) {
        el.addEventListener('mousedown', function(e) {
            if (DOM.floatingWindow.classList.contains('hidden')) return;
            e.preventDefault();
            e.stopPropagation();
            startX = e.clientX;
            startY = e.clientY;
            lastClientX = e.clientX;
            lastClientY = e.clientY;
            var rect = DOM.floatingWindow.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            handle.classList.add('dragging');
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'grabbing';

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }

    function onMove(e) {
        lastClientX = e.clientX;
        lastClientY = e.clientY;
        if (rafId) return;
        rafId = requestAnimationFrame(function() {
            rafId = null;
            applyPosition(lastClientX, lastClientY);
        });
    }

    function onUp() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        applyPosition(lastClientX, lastClientY);
        handle.classList.remove('dragging');
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
    }

    bindDragStart(handle);
    if (logo) bindDragStart(logo);
}

function initFloatingWindowEvents() {
    DOM.fwQuoteBtn.addEventListener('click', () => handleQuoteAction());

    DOM.fwQuoteBtn.draggable = true;
    DOM.fwQuoteBtn.addEventListener('dragstart', function(e) {
        var sel = AppState._currentSelection;
        if (!sel) { e.preventDefault(); return; }
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', sel.text);
        var ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.textContent = sel.text.length > 50 ? sel.text.substring(0, 50) + '...' : sel.text;
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
        setTimeout(function() { ghost.remove(); }, 0);
        AppState._dragData = { text: sel.text, pageInfo: sel.pageInfo };
    });
    DOM.fwQuoteBtn.addEventListener('dragend', function() {
        AppState._dragData = null;
    });

    DOM.fwExplainBtn.addEventListener('click', () => handleExplainAction());
    DOM.fwTranslateBtn.addEventListener('click', () => handleTranslateAction());

    // 悬浮窗拖拽
    initFloatingWindowDrag();

    // 关闭按钮事件
    DOM.fwExplainClose.addEventListener('click', hideExplainPanel);
    DOM.fwTranslateClose.addEventListener('click', hideTranslatePanel);

    // 引用到对话按钮
    DOM.fwExplainRefBtn.addEventListener('click', () => {
        const sel = AppState._currentSelection;
        if (sel) {
            addQuoteToList(sel.text, 'explanation', getPageInfo(), sel._explainResult);
            hideFloatingWindow();
            showToast('解释已添加到引用列表', 'success');
        }
    });

    DOM.fwTranslateRefBtn.addEventListener('click', () => {
        const sel = AppState._currentSelection;
        if (sel) {
            addQuoteToList(sel.text, 'translation', getPageInfo(), sel._translateResult);
            hideFloatingWindow();
            showToast('翻译已添加到引用列表', 'success');
        }
    });

    // 点击悬浮窗外关闭
    document.addEventListener('mousedown', (e) => {
        if (DOM.floatingWindow && !DOM.floatingWindow.classList.contains('hidden')) {
            const insideFw = e.target.closest('.floating-window');
            const insidePanel = e.target.closest('.fw-expand-panel');
            if (!insideFw && !insidePanel) {
                hideFloatingWindow();
            }
        }
    });

    // Esc键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideFloatingWindow();
        }
    });

    // 滚动时关闭
    DOM.documentViewport?.addEventListener('scroll', () => {
        if (DOM.floatingWindow && !DOM.floatingWindow.classList.contains('hidden')) {
            hideFloatingWindow();
        }
    }, { passive: true });
}

function handleTextSelection(e) {
    if (AppState.currentPage !== 'reader') return;

    var insideFw = e.target.closest('.floating-window');
    var insidePanel = e.target.closest('.fw-expand-panel');
    if (insideFw || insidePanel) return;

    if (AppState._floatingWindowTimer) {
        clearTimeout(AppState._floatingWindowTimer);
    }

    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length >= 2) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        var viewportRect = DOM.documentViewport.getBoundingClientRect();
        if (rect.bottom < viewportRect.top || rect.top > viewportRect.bottom ||
            rect.right < viewportRect.left || rect.left > viewportRect.right) {
            return;
        }

        AppState._currentSelection = {
            text: text,
            rect: rect,
            pageInfo: getPageInfo()
        };

        AppState._floatingWindowTimer = setTimeout(() => {
            showFloatingWindow(rect);
        }, 200);

        DOM.selectionMenu.classList.add('hidden');
    } else {
        hideFloatingWindow();
        DOM.selectionMenu.classList.add('hidden');
    }
}

function handleViewportMouseDown(e) {
    if (AppState._currentSelection) {
        var selRect = AppState._currentSelection.rect;
        if (selRect &&
            e.clientX >= selRect.left && e.clientX <= selRect.right &&
            e.clientY >= selRect.top && e.clientY <= selRect.bottom) {
            startDragFromSelection(e, AppState._currentSelection.text, AppState._currentSelection.pageInfo);
        }
    }
}

var _dragCleanup = null;
function startDragFromSelection(e, text, pageInfo) {
    cleanupDragOverlay();

    var startX = e.clientX;
    var startY = e.clientY;
    var isDragging = false;
    var dragElement = null;

    function onMouseMove(ev) {
        if (isDragging) return;
        var dx = ev.clientX - startX;
        var dy = ev.clientY - startY;
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        isDragging = true;

        dragElement = document.createElement('div');
        dragElement.draggable = true;
        dragElement.className = 'drag-ghost-init';
        dragElement.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;';
        document.body.appendChild(dragElement);

        dragElement.addEventListener('dragstart', function(de) {
            de.dataTransfer.effectAllowed = 'copy';
            de.dataTransfer.setData('text/plain', text);

            var ghost = document.createElement('div');
            ghost.className = 'drag-ghost';
            ghost.textContent = text.length > 50 ? text.substring(0, 50) + '...' : text;
            document.body.appendChild(ghost);
            de.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
            setTimeout(function() { ghost.remove(); }, 0);

            AppState._dragData = { text: text, pageInfo: pageInfo };
        });

        dragElement.addEventListener('dragend', function() {
            cleanupDragOverlay();
            AppState._dragData = null;
        });

        var fakeEvent = new MouseEvent('mousedown', {
            clientX: ev.clientX,
            clientY: ev.clientY,
            bubbles: true
        });
        dragElement.dispatchEvent(fakeEvent);
    }

    function onMouseUp() {
        cleanupDragOverlay();
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp, { once: true });

    _dragCleanup = function() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (dragElement && dragElement.parentNode) {
            dragElement.remove();
        }
        _dragCleanup = null;
    };
}

function cleanupDragOverlay() {
    if (_dragCleanup) {
        _dragCleanup();
        _dragCleanup = null;
    }
}

function showFloatingWindow(rect) {
    if (!DOM.floatingWindow) return;

    cleanupDragOverlay();

    const isConfigured = AIService.isConfigured();

    // 更新按钮状态
    if (!isConfigured) {
        DOM.fwExplainBtn.classList.add('disabled');
        DOM.fwTranslateBtn.classList.add('disabled');
        DOM.fwExplainBtn.title = '需要配置API Key';
        DOM.fwTranslateBtn.title = '需要配置API Key';
    } else {
        DOM.fwExplainBtn.classList.remove('disabled');
        DOM.fwTranslateBtn.classList.remove('disabled');
        DOM.fwExplainBtn.title = 'AI解释';
        DOM.fwTranslateBtn.title = 'AI翻译';
    }

    // 定位悬浮窗
    const x = rect.left + rect.width / 2;
    let y = rect.top - 50;

    // 如果上方空间不足，放在下方
    if (y < 10) {
        y = rect.bottom + 10;
    }

    DOM.floatingWindow.style.left = `${Math.max(10, x - 125)}px`;
    DOM.floatingWindow.style.top = `${y}px`;
    DOM.floatingWindow.classList.remove('hidden');

    // 隐藏展开面板
    hideExplainPanel();
    hideTranslatePanel();

    // 重置按钮状态
    DOM.fwExplainBtn.classList.remove('active');
    DOM.fwTranslateBtn.classList.remove('active');
}

function hideFloatingWindow() {
    DOM.floatingWindow?.classList.add('hidden');
    hideExplainPanel();
    hideTranslatePanel();
    AppState._currentSelection = null;
    AppState._dragData = null;
    cleanupDragOverlay();
}

function handleQuoteAction() {
    const sel = AppState._currentSelection;
    if (!sel) return;

    addQuoteToList(sel.text, 'selection', sel.pageInfo);

    // 按钮闪烁反馈
    DOM.fwQuoteBtn.classList.add('flash');
    setTimeout(() => DOM.fwQuoteBtn.classList.remove('flash'), 300);

    hideFloatingWindow();
}

async function handleExplainAction() {
    const sel = AppState._currentSelection;
    if (!sel) return;

    if (!AIService.isConfigured()) {
        showToast('请先在设置中配置API Key', 'error');
        openSettings();
        return;
    }

    // 关闭翻译面板，激活解释按钮
    hideTranslatePanel();
    DOM.fwExplainBtn.classList.add('active');
    DOM.fwTranslateBtn.classList.remove('active');

    // 定位并显示解释面板
    showExpandPanel(DOM.fwExplainPanel, DOM.fwExplainBody);

    try {
        const result = await AIService.explainText(sel.text);
        sel._explainResult = result.content;
        DOM.fwExplainBody.innerHTML = `<div style="white-space:pre-wrap;">${escapeHtml(result.content)}</div>`;
    } catch (err) {
        DOM.fwExplainBody.innerHTML = `<div class="fw-error">❌ ${escapeHtml(err.message || '解释失败')}</div>`;
    }
}

async function handleTranslateAction() {
    const sel = AppState._currentSelection;
    if (!sel) return;

    if (!AIService.isConfigured()) {
        showToast('请先在设置中配置API Key', 'error');
        openSettings();
        return;
    }

    // 关闭解释面板，激活翻译按钮
    hideExplainPanel();
    DOM.fwTranslateBtn.classList.add('active');
    DOM.fwExplainBtn.classList.remove('active');

    // 检测语言
    const isChinese = /[\u4e00-\u9fff]/.test(sel.text);
    const targetLang = isChinese ? 'en' : 'zh';

    // 定位并显示翻译面板
    showExpandPanel(DOM.fwTranslatePanel, DOM.fwTranslateBody);

    try {
        const result = await AIService.translateText(sel.text, targetLang);
        sel._translateResult = result.content;
        DOM.fwTranslateBody.innerHTML = `
            <div class="original-text"><strong>原文：</strong>${escapeHtml(sel.text)}</div>
            <div class="translated-text">${escapeHtml(result.content)}</div>
        `;
    } catch (err) {
        DOM.fwTranslateBody.innerHTML = `<div class="fw-error">❌ ${escapeHtml(err.message || '翻译失败')}</div>`;
    }
}

function showExpandPanel(panel, body) {
    const fwRect = DOM.floatingWindow.getBoundingClientRect();
    panel.style.left = `${fwRect.left}px`;
    panel.style.top = `${fwRect.bottom}px`;
    panel.style.width = `${Math.max(340, fwRect.width)}px`;
    panel.classList.remove('hidden');

    // 重置为加载状态
    body.innerHTML = `
        <div class="fw-loading">
            <div class="fw-loading-dot"></div>
            <div class="fw-loading-dot"></div>
            <div class="fw-loading-dot"></div>
            <span>AI 思考中...</span>
        </div>
    `;
}

function hideExplainPanel() {
    DOM.fwExplainPanel?.classList.add('hidden');
    DOM.fwExplainBtn?.classList.remove('active');
}

function hideTranslatePanel() {
    DOM.fwTranslatePanel?.classList.add('hidden');
    DOM.fwTranslateBtn?.classList.remove('active');
}

function getPageInfo() {
    const viewport = DOM.documentViewport;
    if (!viewport) return { page: null, chapter: null };

    const pages = viewport.querySelectorAll('.pdf-page, .docx-page, .pptx-slide, .epub-page, .txt-page');
    const scrollTop = viewport.scrollTop;

    let currentPage = null;
    for (let i = 0; i < pages.length; i++) {
        const pageTop = pages[i].offsetTop;
        const pageBottom = pageTop + pages[i].offsetHeight;
        if (scrollTop >= pageTop && scrollTop < pageBottom) {
            currentPage = i + 1;
            break;
        }
    }

    return { page: currentPage, chapter: null };
}

// ==================== API配置 ====================
function openSettings() {
    openModal('settingsModal');
    loadAPIConfigToForm();

    // 默认显示通用标签
    DOM.settingsPanelGeneral.classList.remove('hidden');
    DOM.settingsPanelApi.classList.add('hidden');
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.settings-tab[data-tab="general"]')?.classList.add('active');

    // 设置标签切换
    initSettingsTabs();
}

function initSettingsTabs() {
    const tabs = document.querySelectorAll('.settings-tab');
    tabs.forEach(tab => {
        tab.onclick = (e) => {
            const tabName = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            DOM.settingsPanelGeneral.classList.add('hidden');
            DOM.settingsPanelApi.classList.add('hidden');

            if (tabName === 'general') {
                DOM.settingsPanelGeneral.classList.remove('hidden');
            } else if (tabName === 'api') {
                DOM.settingsPanelApi.classList.remove('hidden');
                loadAPIConfigToForm();
            }
        };
    });
}

function loadAPIConfigToForm() {
    const config = AIService.getAPIConfig();
    if (!config) return;

    if (DOM.apiKeyInput && config.apiKey) {
        DOM.apiKeyInput.value = config.apiKey;
        DOM.apiKeyInput.type = 'password';
    }
    if (DOM.apiProvider && config.provider) {
        DOM.apiProvider.value = config.provider;
    }
    if (DOM.apiEndpoint && config.endpoint) {
        DOM.apiEndpoint.value = config.endpoint;
    }
    if (DOM.apiModel && config.model) {
        DOM.apiModel.value = config.model;
    }
}

function toggleApiKeyVisibility() {
    if (!DOM.apiKeyInput) return;
    const isPassword = DOM.apiKeyInput.type === 'password';
    DOM.apiKeyInput.type = isPassword ? 'text' : 'password';
    DOM.apiKeyToggle.innerHTML = isPassword
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}

async function testApiConnection() {
    const apiKey = DOM.apiKeyInput?.value?.trim();
    if (!apiKey) {
        DOM.apiTestStatus.textContent = '请先输入API Key';
        DOM.apiTestStatus.className = 'api-test-status error';
        return;
    }

    DOM.apiTestBtnText.textContent = '⏳ 测试中...';
    DOM.apiTestStatus.textContent = '';
    DOM.apiTestStatus.className = 'api-test-status';

    const config = {
        provider: DOM.apiProvider?.value || 'deepseek',
        apiKey: apiKey,
        endpoint: DOM.apiEndpoint?.value || 'https://api.deepseek.com/v1/chat/completions',
        model: DOM.apiModel?.value || 'deepseek-chat'
    };

    const result = await AIService.testConnection(config);

    if (result.success) {
        DOM.apiTestBtnText.textContent = '🟢 连接正常';
        DOM.apiTestStatus.textContent = '测试通过，模型可用';
        DOM.apiTestStatus.className = 'api-test-status success';
    } else {
        DOM.apiTestBtnText.textContent = '🔴 连接失败';
        DOM.apiTestStatus.textContent = result.message;
        DOM.apiTestStatus.className = 'api-test-status error';
    }
}

function saveAPIConfigHandler() {
    const apiKey = DOM.apiKeyInput?.value?.trim();
    if (!apiKey) {
        showToast('请输入API Key', 'error');
        return;
    }

    const config = {
        provider: DOM.apiProvider?.value || 'deepseek',
        apiKey: apiKey,
        endpoint: DOM.apiEndpoint?.value || 'https://api.deepseek.com/v1/chat/completions',
        model: DOM.apiModel?.value || 'deepseek-chat',
        updatedAt: new Date().toISOString()
    };

    AIService.saveAPIConfig(config);
    AppState._apiConfigured = true;

    closeModal('settingsModal');
    showToast('API配置已保存', 'success');

    // 刷新对话区域
    renderChatMessages();
}

function onProviderChange() {
    const provider = DOM.apiProvider?.value;
}

// ==================== 选中文字处理 ====================
function handleTextSelectionOld(e) {
    // 旧的右键菜单逻辑保留
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        showSelectionMenu(rect.left + rect.width / 2, rect.bottom + 8);
    } else {
        DOM.selectionMenu.classList.add('hidden');
    }
}

function showSelectionMenu(x, y) {
    DOM.selectionMenu.style.left = `${Math.min(x - 80, window.innerWidth - 180)}px`;
    DOM.selectionMenu.style.top = `${Math.min(y, window.innerHeight - 120)}px`;
    DOM.selectionMenu.classList.remove('hidden');
}

function handleSelectionAction(action) {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    switch (action) {
        case 'copy':
            navigator.clipboard.writeText(text).then(() => {
                showToast('已复制到剪贴板', 'success');
            });
            break;
        case 'ask':
            askAIAboutSelection(text);
            break;
        case 'annotate':
            showToast('已添加标注', 'success');
            break;
    }
    DOM.selectionMenu.classList.add('hidden');
    selection.removeAllRanges();
}

// ==================== 右键菜单 ====================
function showContextMenu(e, type) {
    const menu = type === 'doc' ? DOM.contextMenu : DOM.selectionMenu;
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    menu.classList.remove('hidden');
}

function hideContextMenus() {
    DOM.contextMenu.classList.add('hidden');
    DOM.selectionMenu.classList.add('hidden');
}

function handleContextAction(action) {
    const doc = AppState.contextTarget;
    if (!doc) return;

    switch (action) {
        case 'open':
            openDocument(doc.id);
            break;
        case 'rename':
            DOM.renameInput.value = doc.name;
            openModal('renameModal');
            break;
        case 'move':
            renderShelfList();
            openModal('moveModal');
            break;
        case 'delete':
            showConfirm('删除文档', `是否删除「${doc.name}」？`, () => {
                AppState.documents = AppState.documents.filter(d => d.id !== doc.id);
                renderDocs();
                updateDocCount();
                showToast('文档已删除', 'success');
            });
            break;
    }
    hideContextMenus();
}

function renderShelfList() {
    const shelves = AppState.shelves.filter(s => !s.system || s.id === 'all');
    DOM.shelfList.innerHTML = shelves.map(shelf => `
        <div class="shelf-list-item" onclick="moveToShelf('${shelf.id}')">
            <span>📁</span>
            <span>${shelf.name}</span>
        </div>
    `).join('');
}

function moveToShelf(shelfId) {
    const doc = AppState.contextTarget;
    if (!doc) return;
    doc.shelf = shelfId;
    closeModal('moveModal');
    renderDocs();
    showToast(`已移动到「${AppState.shelves.find(s => s.id === shelfId)?.name}」`, 'success');
}

function confirmRename() {
    const newName = DOM.renameInput.value.trim();
    if (!newName) return;
    const doc = AppState.contextTarget;
    if (doc) {
        doc.name = newName;
        renderDocs();
        showToast('重命名成功', 'success');
    }
    closeModal('renameModal');
}

// ==================== 书架管理 ====================
function createShelf() {
    const name = DOM.newShelfName.value.trim();
    if (!name) {
        showToast('请输入书架名称', 'error');
        return;
    }

    const id = 'shelf-' + Date.now();
    AppState.shelves.push({ id, name, system: false });

    // 添加新标签
    const tab = document.createElement('div');
    tab.className = 'tab-item';
    tab.dataset.shelf = id;
    tab.textContent = name;
    DOM.bookshelfTabs.appendChild(tab);

    DOM.newShelfName.value = '';
    closeModal('newShelfModal');
    showToast('书架创建成功', 'success');
}

// ==================== 文件导入 ====================
const SUPPORTED_TYPES = {
    pdf: { parser: 'pdf', label: 'PDF文档' },
    docx: { parser: 'docx', label: 'Word文档' },
    pptx: { parser: 'pptx', label: 'PowerPoint演示' },
    epub: { parser: 'epub', label: 'EPUB电子书' },
    txt: { parser: 'txt', label: '文本文件' }
};

function handleFileImport(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    DOM.importProgress.classList.remove('hidden');
    DOM.progressFill.style.width = '0%';
    let processed = 0;
    const total = files.length;
    let successCount = 0;
    let failCount = 0;

    const updateProgress = (current, statusMsg) => {
        const progress = (current / total) * 100;
        DOM.progressFill.style.width = `${progress}%`;
        DOM.progressText.textContent = statusMsg || `导入中：${current}/${total} 个文件`;
    };

    const processFile = async (index) => {
        if (index >= files.length) {
            setTimeout(() => {
                closeModal('importModal');
                DOM.importProgress.classList.add('hidden');
                DOM.progressFill.style.width = '0%';
                if (failCount === 0) {
                    showToast(`${successCount} 个文件导入成功`, 'success');
                } else {
                    showToast(`${successCount} 个导入成功，${failCount} 个失败`, 'error');
                }
                renderDocs();
                updateDocCount();
            }, 500);
            return;
        }

        const file = files[index];
        const ext = file.name.split('.').pop().toLowerCase();
        const typeInfo = SUPPORTED_TYPES[ext];

        if (!typeInfo) {
            failCount++;
            processed++;
            updateProgress(processed, `不支持的格式：${file.name}`);
            processFile(index + 1);
            return;
        }

        updateProgress(processed, `正在导入：${file.name}`);

        try {
            const content = await parseDocument(file, ext);
            const docId = 'doc-' + Date.now() + '-' + index;
            const newDoc = {
                id: docId,
                name: file.name,
                type: ext,
                shelf: 'all',
                date: new Date().toISOString().split('T')[0],
                size: formatFileSize(file.size),
                pages: content.pages?.length || 1,
                pageCount: content.pages?.length || 1,
                content: docId,
                contentId: docId,
                lastRead: null,
                author: content.author || '',
                title: content.title || file.name.replace(/\.[^/.]+$/, ''),
                toc: content.toc || []
            };

            newDoc.content = newDoc.id;
            AppState.docContents[newDoc.id] = content;
            AppState.documents.unshift(newDoc);
            successCount++;
        } catch (err) {
            console.error(`导入失败: ${file.name}`, err);
            failCount++;
        }

        processed++;
        updateProgress(processed);
        processFile(index + 1);
    };

    processFile(0);
}

async function parseDocument(file, type) {
    switch (type) {
        case 'pdf':
            return await parsePDF(file);
        case 'docx':
            return await parseDOCX(file);
        case 'pptx':
            return await parsePPTX(file);
        case 'epub':
            return await parseEPUB(file);
        case 'txt':
            return await parseTXT(file);
        default:
            throw new Error(`不支持的格式: ${type}`);
    }
}

async function parsePDF(file) {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error('PDF.js库未加载，请检查网络连接后刷新重试');
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = './build/pdf.worker.mjs';

    const arrayBuffer = await file.arrayBuffer();

    const pdfData = new Uint8Array(arrayBuffer).slice(0);

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const pages = [];
    let title = '';
    let author = '';
    let toc = [];

    try {
        const metadata = await pdf.getMetadata();
        if (metadata.info) {
            title = metadata.info.Title || '';
            author = metadata.info.Author || '';
        }
    } catch (e) {}

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(' ');

        pages.push({
            num: i,
            body: `<div class="pdf-page" data-page="${i}">${escapeHtml(text) || `<p style="color:#999;text-align:center;">第 ${i} 页</p>`}</div>`
        });
    }

    toc = buildTOCTree(extractTOCFromText(pages.map(p => ({ text: p.body.replace(/<[^>]*>/g, '') }))));

    return {
        title: title || file.name.replace(/\.pdf$/i, ''),
        author,
        pages,
        toc,
        pdfData
    };
}

async function parseDOCX(file) {
    const arrayBuffer = await file.arrayBuffer();

    if (typeof mammoth === 'undefined') {
        throw new Error('DOCX解析库未加载');
    }

    const result = await mammoth.convertToHtml({ arrayBuffer });
    const textResult = await mammoth.extractRawText({ arrayBuffer });

    const html = result.value || '';
    const title = extractDOCXTitle(html) || file.name.replace(/\.docx$/i, '');

    // 提取纯文本用于分页显示（保留HTML用于格式渲染）
    const fullText = textResult.value || html.replace(/<[^>]*>/g, ' ');
    const paragraphs = fullText.split(/\n\s*\n|\r\n\s*\r\n/).filter(p => p.trim());
    const pages = [];

    let currentPageContent = '';
    let pageNum = 1;

    paragraphs.forEach((para, i) => {
        currentPageContent += '<p>' + escapeHtml(para.trim()) + '</p>';
        if (currentPageContent.length > 3000 || i === paragraphs.length - 1) {
            pages.push({ num: pageNum++, body: currentPageContent });
            currentPageContent = '';
        }
    });

    // 从HTML中提取标题作为目录
    const headings = extractHeadingsFromHTML(html);
    const flatToc = headings.map(h => ({
        title: h.text,
        page: Math.max(1, Math.ceil((h.index / Math.max(paragraphs.length, 1)) * (pages.length || 1))),
        level: h.level
    }));

    return {
        title,
        author: '',
        pages: pages.length > 0 ? pages : [{ num: 1, body: html }],
        html: html,
        toc: buildTOCTree(flatToc)
    };
}

async function parsePPTX(file) {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slides = [];
    const tocItems = [];

    const slideFiles = Object.keys(zip.files)
        .filter(name => /^ppt\/slides\/slide[0-9]+\.xml$/i.test(name))
        .sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)/i)[1]);
            const numB = parseInt(b.match(/slide(\d+)/i)[1]);
            return numA - numB;
        });

    for (let i = 0; i < slideFiles.length; i++) {
        const slideContent = await zip.file(slideFiles[i]).async('string');
        const text = extractTextFromPPTXSlide(slideContent);
        const titleMatch = text.match(/^(.+?)[\n\r]/);

        slides.push({
            num: i + 1,
            title: titleMatch ? titleMatch[1].substring(0, 30) : `幻灯片 ${i + 1}`,
            body: `<div class="pptx-slide" data-slide="${i + 1}">${escapeHtml(text)}</div>`,
            color: ['#ea4335', '#ff6d01', '#1a73e8', '#34a853', '#9334e6'][i % 5]
        });

        if (titleMatch) {
            tocItems.push({
                title: titleMatch[1].substring(0, 50),
                page: i + 1,
                level: 1
            });
        }
    }

    return {
        title: file.name.replace(/\.pptx$/i, ''),
        author: '',
        pages: slides,
        slides: slides,
        toc: buildTOCTree(tocItems),
        isSlides: true
    };
}

async function parseEPUB(file) {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    let title = file.name.replace(/\.epub$/i, '');
    let author = '';
    const pages = [];
    let tocItems = [];

    const containerXML = await zip.file('META-INF/container.xml').async('string');
    const rootfileMatch = containerXML.match(/full-path="([^"]+)"/);
    if (!rootfileMatch) {
        return { title, author, pages: [{ num: 1, body: '<p>无法解析EPUB结构</p>' }], toc: [] };
    }

    const opfPath = rootfileMatch[1];
    const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
    const opfContent = await zip.file(opfPath).async('string');

    const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
    if (titleMatch) title = titleMatch[1];

    const authorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
    if (authorMatch) author = authorMatch[1];

    const spineMatch = opfContent.match(/<spine[^>]*>([\s\S]*?)<\/spine>/i);
    if (spineMatch) {
        const itemRefs = spineMatch[1].match(/<itemref[^>]*>/gi) || [];
        let pageContent = '';
        let pageNum = 1;

        for (const itemRef of itemRefs) {
            const idrefMatch = itemRef.match(/idref="([^"]+)"/);
            if (!idrefMatch) continue;

            const idref = idrefMatch[1];
            const itemMatch = opfContent.match(new RegExp(`<item[^>]+id="${idref}"[^>]+href="([^"]+)"`, 'i'));
            if (!itemMatch) continue;

            const href = opfDir + itemMatch[1];
            const chapterContent = await zip.file(href).async('string');
            const text = stripHTMLTags(chapterContent);
            const chapterTitle = extractChapterTitle(chapterContent) || `第 ${pageNum} 章`;

            pageContent += `<h3>${escapeHtml(chapterTitle)}</h3><p>${escapeHtml(text.substring(0, 500))}</p>`;

            tocItems.push({
                title: chapterTitle,
                page: pageNum,
                level: 1
            });

            if (pageContent.length > 3000) {
                pages.push({ num: pageNum++, body: pageContent });
                pageContent = '';
            }
        }

        if (pageContent || pages.length === 0) {
            pages.push({ num: pages.length + 1, body: pageContent || '<p>空内容</p>' });
        }
    }

    return { title, author, pages, toc: buildTOCTree(tocItems) };
}

async function parseTXT(file) {
    const text = await file.text();
    const title = file.name.replace(/\.txt$/i, '');
    const lines = text.split(/\r?\n/);
    const pages = [];
    const tocItems = [];

    let currentPage = '';
    let pageNum = 1;
    let currentChapter = null;
    let lineInPage = 0;

    lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (/^[第一二三四五六七八九十百千万\d]+[章节篇卷]/.test(trimmed)) {
            if (currentChapter) {
                tocItems.push({
                    title: currentChapter,
                    page: pageNum,
                    level: 1
                });
            }
            currentChapter = trimmed.substring(0, 50);
        }

        currentPage += `<p>${escapeHtml(trimmed) || '&nbsp;'}</p>`;
        lineInPage++;

        if (lineInPage >= 30 || i === lines.length - 1) {
            pages.push({ num: pageNum++, body: currentPage });
            currentPage = '';
            lineInPage = 0;
        }
    });

    return { title, author: '', pages, toc: buildTOCTree(tocItems) };
}

function extractTOCFromText(pagesWithText) {
    const toc = [];
    const chapterPatterns = [
        /^[第一二三四五六七八九十百千万\d]+[章节篇卷]/,
        /^(Chapter|Section|Part)\s+\d+/i,
        /^\d+\.\s+\S/,
        /^[A-Z][A-Z\s]+$/
    ];

    pagesWithText.forEach((page, idx) => {
        const lines = page.text.split(/\n/).filter(l => l.trim());
        lines.forEach(line => {
            const trimmed = line.trim();
            if (chapterPatterns.some(p => p.test(trimmed))) {
                toc.push({
                    title: trimmed.substring(0, 60),
                    page: idx + 1,
                    level: trimmed.length < 20 ? 1 : 2
                });
            }
        });
    });

    return toc;
}

function buildTOCTree(tocItems) {
    if (!tocItems || tocItems.length === 0) return [];

    const tree = [];
    const stack = [{ level: 0, children: tree }];

    tocItems.forEach(item => {
        const node = { ...item, children: [] };

        while (stack.length > 1 && stack[stack.length - 1].level >= item.level) {
            stack.pop();
        }

        stack[stack.length - 1].children.push(node);
        stack.push(node);
    });

    return tree;
}

function extractDOCXTitle(html) {
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) return h1Match[1];
    const titleMatch = html.match(/<p[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/p>/i);
    if (titleMatch) return titleMatch[1];
    return null;
}

function extractHeadingsFromHTML(html) {
    const headings = [];
    const hRegex = /<h([1-6])[^>]*>([^<]+)<\/h\1>/gi;
    let match;
    while ((match = hRegex.exec(html)) !== null) {
        headings.push({
            level: parseInt(match[1]),
            text: match[2].trim(),
            index: headings.length
        });
    }
    return headings;
}

function extractTextFromPPTXSlide(slideXML) {
    const textMatches = slideXML.match(/<a:t[^>]*>([^<]+)<\/a:t>/gi) || [];
    return textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').trim();
}

function extractChapterTitle(html) {
    const hMatch = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
    if (hMatch) return hMatch[1].trim();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) return titleMatch[1].trim();
    return null;
}

function stripHTMLTags(html) {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ==================== 弹窗控制 ====================
function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showConfirm(title, message, callback) {
    DOM.confirmTitle.textContent = title;
    DOM.confirmMessage.textContent = message;
    AppState.confirmCallback = callback;
    openModal('confirmModal');
}

function confirmAction() {
    if (AppState.confirmCallback) {
        AppState.confirmCallback();
        AppState.confirmCallback = null;
    }
    closeModal('confirmModal');
}

// ==================== Toast提示 ====================
let toastTimer = null;
function showToast(message, type = 'success') {
    DOM.toastMessage.textContent = message;
    DOM.toast.className = `toast toast-${type}`;
    DOM.toastIcon.textContent = type === 'success' ? '✓' : '✕';
    DOM.toast.classList.remove('hidden');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        DOM.toast.classList.add('hidden');
    }, 3000);
}

// ==================== 全局函数暴露 ====================
window.showPage = showPage;
window.goToLibrary = goToLibrary;
window.openDocument = openDocument;
window.switchDocTab = switchDocTab;
window.closeDocTab = closeDocTab;
window.jumpToPage = jumpToPage;
window.generateTOC = generateTOC;
window.newChat = newChat;
window.switchChat = switchChat;
window.deleteChat = deleteChat;
window.handleContextAction = handleContextAction;
window.handleSelectionAction = handleSelectionAction;
window.moveToShelf = moveToShelf;
window.confirmRename = confirmRename;
window.createShelf = createShelf;
window.confirmAction = confirmAction;
window.openSettings = openSettings;
window.setTheme = setTheme;
window.setHighlightColor = setHighlightColor;
window.setAnswerLength = setAnswerLength;
window.closeModal = closeModal;
window.toggleApiKeyVisibility = toggleApiKeyVisibility;
window.testApiConnection = testApiConnection;
window.saveAPIConfigHandler = saveAPIConfigHandler;
window.onProviderChange = onProviderChange;
window.removeQuoteItem = removeQuoteItem;
window.toggleQuoteList = toggleQuoteList;
window.clearQuoteList = clearQuoteList;
