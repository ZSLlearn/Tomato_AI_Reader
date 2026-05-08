/**
 * AI智能阅读器 - AI服务层
 * 处理API Key管理、提示词工程、DeepSeek API通信
 */

// ==================== API Key安全存储 ====================
const AIService = {
    _apiKeyMemory: null,
    _abortControllers: {},

    // 设备指纹（用于XOR混淆）
    _deviceFingerprint: null,

    getDeviceFingerprint() {
        if (this._deviceFingerprint) return this._deviceFingerprint;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('AIREADER', 2, 2);
        const fp = canvas.toDataURL().substring(0, 100)
            + navigator.hardwareConcurrency
            + navigator.language
            + screen.colorDepth;
        this._deviceFingerprint = btoa(fp).substring(0, 32);
        return this._deviceFingerprint;
    },

    // XOR混淆
    _xorString(str, key) {
        let result = '';
        for (let i = 0; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    },

    // 安全存储API配置
    saveAPIConfig(config) {
        const key = this.getDeviceFingerprint();
        const plain = JSON.stringify(config);
        const obfuscated = this._xorString(plain, key);
        const encoded = btoa(obfuscated);
        localStorage.setItem('aireader_api_config', encoded);
        this._apiKeyMemory = config.apiKey || null;
    },

    // 安全读取API配置
    loadAPIConfig() {
        const encoded = localStorage.getItem('aireader_api_config');
        if (!encoded) return null;
        try {
            const key = this.getDeviceFingerprint();
            const obfuscated = atob(encoded);
            const plain = this._xorString(obfuscated, key);
            const config = JSON.parse(plain);
            this._apiKeyMemory = config.apiKey || null;
            return config;
        } catch (e) {
            localStorage.removeItem('aireader_api_config');
            return null;
        }
    },

    // 获取API Key（仅内存）
    getApiKey() {
        if (this._apiKeyMemory) return this._apiKeyMemory;
        const config = this.loadAPIConfig();
        return config?.apiKey || null;
    },

    // 获取完整API配置
    getAPIConfig() {
        const config = this.loadAPIConfig();
        if (!config) {
            return {
                provider: 'deepseek',
                endpoint: 'https://api.deepseek.com/v1/chat/completions',
                model: 'deepseek-chat',
                apiKey: ''
            };
        }
        return config;
    },

    // 检查是否已配置
    isConfigured() {
        return !!this.getApiKey();
    },

    // 清除API配置
    clearAPIConfig() {
        localStorage.removeItem('aireader_api_config');
        this._apiKeyMemory = null;
    },

    // ==================== API通信 ====================

    // 测试API连接
    async testConnection(config) {
        const testMessages = [
            { role: 'user', content: '回复"OK"' }
        ];
        try {
            const response = await this._callAPI(config, testMessages, 50);
            return { success: true, message: '连接正常' };
        } catch (err) {
            return { success: false, message: err.message || '连接失败' };
        }
    },

    // 发送消息到AI（L2层 - 带文档全文上下文）
    async sendChatMessage(messages, documentContext, options = {}) {
        const config = this.getAPIConfig();
        if (!config.apiKey) {
            throw new Error('请先配置API Key');
        }

        const systemPrompt = this._buildSystemPrompt(documentContext, options);
        const fullMessages = this._buildMessageList(systemPrompt, messages, options);

        const { maxTokens, maxRounds } = this._calculateTokenBudget(
            fullMessages,
            config.model,
            options
        );

        return this._callAPI(config, fullMessages, maxTokens, options.signal);
    },

    // L1层 - AI解释（不携带文档全文）
    async explainText(text, options = {}) {
        const config = this.getAPIConfig();
        if (!config.apiKey) {
            throw new Error('请先配置API Key');
        }

        const messages = [
            {
                role: 'system',
                content: '你是一个专业的知识解释助手。请用通俗易懂的语言解释用户提供的文字，要求：简洁清晰、逻辑分明、适合阅读理解。如果原文是外文，请用中文解释并用中文回答。'
            },
            {
                role: 'user',
                content: `请解释以下文字：\n\n${text}`
            }
        ];

        return this._callAPI(config, messages, 1024, options.signal);
    },

    // L1层 - AI翻译
    async translateText(text, targetLang, options = {}) {
        const config = this.getAPIConfig();
        if (!config.apiKey) {
            throw new Error('请先配置API Key');
        }

        const langHint = targetLang === 'zh' ? '中文' :
                         targetLang === 'en' ? '英文' :
                         targetLang === 'ja' ? '日文' :
                         targetLang === 'ko' ? '韩文' : targetLang;

        const messages = [
            {
                role: 'system',
                content: `你是一个专业的翻译助手。请将用户提供的文字翻译为${langHint}。要求：翻译准确、语句通顺自然、保留原文语气和风格。如果原文已经是${langHint}，则翻译为英文。只输出译文，不要解释。`
            },
            {
                role: 'user',
                content: `请将以下文字翻译为${langHint}：\n\n${text}`
            }
        ];

        return this._callAPI(config, messages, 1024, options.signal);
    },

    // 实际API调用
    async _callAPI(config, messages, maxTokens = 4096, signal = null) {
        const controller = new AbortController();
        const requestId = Date.now().toString();
        this._abortControllers[requestId] = controller;

        // 合并外部signal
        if (signal) {
            signal.addEventListener('abort', () => controller.abort());
        }

        try {
            const response = await fetch(config.endpoint || 'https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.model || 'deepseek-chat',
                    messages: messages,
                    max_tokens: maxTokens,
                    temperature: 0.7,
                    top_p: 0.9,
                    stream: false
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                const errorBody = await response.text();
                let errorMsg;
                try {
                    const errorJson = JSON.parse(errorBody);
                    errorMsg = errorJson.error?.message || errorJson.message || `HTTP ${response.status}`;
                } catch {
                    errorMsg = `HTTP ${response.status}: ${errorBody.substring(0, 100)}`;
                }

                if (response.status === 401) {
                    throw new Error('API Key无效或已过期，请重新配置');
                } else if (response.status === 429) {
                    throw new Error('请求过于频繁，请稍后重试');
                } else if (response.status === 402) {
                    throw new Error('API余额不足，请充值');
                } else {
                    throw new Error(`AI服务错误: ${errorMsg}`);
                }
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';

            if (!content || content.trim().length === 0) {
                throw new Error('AI返回了空内容，请重试');
            }

            return {
                content: content.trim(),
                tokens: {
                    prompt: data.usage?.prompt_tokens || 0,
                    completion: data.usage?.completion_tokens || 0,
                    total: data.usage?.total_tokens || 0
                },
                model: data.model || config.model,
                finishReason: data.choices?.[0]?.finish_reason || 'stop'
            };
        } catch (err) {
            if (err.name === 'AbortError') {
                throw new Error('请求已取消');
            }
            throw err;
        } finally {
            delete this._abortControllers[requestId];
        }
    },

    // 取消请求
    cancelRequest(requestId) {
        if (this._abortControllers[requestId]) {
            this._abortControllers[requestId].abort();
            delete this._abortControllers[requestId];
        }
    },

    // 取消所有请求
    cancelAll() {
        Object.values(this._abortControllers).forEach(c => c.abort());
        this._abortControllers = {};
    },

    // ==================== 提示词工程 ====================

    // 构建系统提示词
    _buildSystemPrompt(docContext, options) {
        const parts = [];

        // 1. 角色设定
        parts.push(`你是一个专业的AI阅读助手，帮助用户理解和分析文档内容。
你的回答应该：
- 准确：严格基于文档内容，不编造信息
- 清晰：使用通俗易懂的语言解释复杂概念
- 结构化：使用列表、分点等方式组织回答
- 可追溯：每个观点都标注在文档中的来源位置`);

        // 2. 文档上下文
        if (docContext) {
            parts.push('');
            parts.push('【当前文档信息】');
            parts.push(`文档标题：${docContext.title || '未知文档'}`);
            parts.push(`文档类型：${(docContext.type || 'txt').toUpperCase()}`);
            parts.push(`总页数：${docContext.totalPages || '未知'}`);

            if (docContext.toc && docContext.toc.length > 0) {
                parts.push('');
                parts.push('【文档目录结构】');
                parts.push(this._formatTOCForPrompt(docContext.toc));
            }

            if (docContext.fullText) {
                parts.push('');
                parts.push('【文档全文内容】');
                const truncated = this._truncateDocumentText(docContext.fullText, options);
                parts.push(truncated);

                if (truncated.length < docContext.fullText.length) {
                    parts.push('');
                    parts.push('（注：文档过长，以上为前部分内容。如需分析后续内容，请具体指明页码范围。）');
                }
            }
        }

        // 3. 回答规则
        const lengthLimit = options.answerLength || 'medium';
        const lengthMap = { short: 150, medium: 400, long: 800 };
        parts.push('');
        parts.push('【回答规则】');
        parts.push(`1. 每个观点后标注来源，格式："（见第X章，第Y页）"`);
        parts.push(`2. 如果文档中找不到相关信息，明确说"文档中未提及此内容"`);
        parts.push(`3. 如需补充通用知识，先声明"以下为通用知识补充："`);
        parts.push(`4. 回答长度控制在${lengthMap[lengthLimit]}字以内`);
        parts.push(`5. 使用Markdown格式化回答`);
        parts.push(`6. 如果用户要求总结，请给出结构化的总结`);
        parts.push(`7. 如果用户要求对比，请使用表格形式展示`);

        return parts.join('\n');
    },

    // 格式化目录为提示词用
    _formatTOCForPrompt(toc, indent = 0) {
        if (!toc || toc.length === 0) return '';
        let result = '';
        const prefix = '  '.repeat(indent);
        toc.forEach(item => {
            result += `${prefix}- ${item.title}`;
            if (item.page) result += `（第${item.page}页）`;
            result += '\n';
            if (item.children && item.children.length > 0) {
                result += this._formatTOCForPrompt(item.children, indent + 1);
            }
        });
        return result;
    },

    // 截断过长文档文本
    _truncateDocumentText(fullText, options) {
        const MAX_CHARS = 40000;
        if (fullText.length <= MAX_CHARS) return fullText;

        // 保留前MAX_CHARS字符
        return fullText.substring(0, MAX_CHARS);
    },

    // 构建消息列表（注入引用内容）
    _buildMessageList(systemPrompt, messages, options) {
        const result = [{ role: 'system', content: systemPrompt }];

        // 处理消息中的引用内容
        messages.forEach((msg, idx) => {
            if (msg.role === 'user' && msg.references && msg.references.length > 0) {
                let content = '';

                content += '【用户引用的文档片段】\n';
                content += '---\n';
                msg.references.forEach((ref, i) => {
                    const typeLabel = ref.type === 'explanation' ? 'AI解释' :
                                     ref.type === 'translation' ? 'AI翻译' : '原文引用';
                    content += `[片段${i + 1}] ${typeLabel}`;
                    if (ref.pageNumber) content += `（第${ref.pageNumber}页`;
                    if (ref.chapterTitle) content += `，${ref.chapterTitle}`;
                    if (ref.pageNumber || ref.chapterTitle) content += `）`;
                    content += `：\n${ref.text}\n`;

                    if (ref.aiContent) {
                        content += `（${typeLabel}结果：${ref.aiContent}）\n`;
                    }
                    content += '---\n';
                });

                content += '\n【用户问题】\n';
                content += msg.content;

                result.push({ role: 'user', content });
            } else {
                result.push(msg);
            }
        });

        return result;
    },

    // ==================== Token预算管理 ====================

    // 估算文本的token数量（粗略：中文1字≈1token，英文1词≈1.3token）
    estimateTokens(text) {
        if (!text) return 0;
        let count = 0;
        for (const char of text) {
            if (/[\u4e00-\u9fff]/.test(char)) {
                count += 1; // 中文字符
            } else if (/[a-zA-Z]/.test(char)) {
                count += 0.3; // 英文字母
            } else {
                count += 0.5; // 其他字符
            }
        }
        return Math.ceil(count);
    },

    // 计算token预算分配
    _calculateTokenBudget(messages, model, options = {}) {
        const CONTEXT_LIMIT = model === 'deepseek-reasoner' ? 64000 : 64000;

        let totalEstimated = 0;
        messages.forEach(msg => {
            totalEstimated += this.estimateTokens(msg.content);
        });

        const maxTokens = Math.max(256, Math.min(4096, CONTEXT_LIMIT - totalEstimated - 500));
        const maxRounds = Math.min(options.maxRounds || 20, 20); // 最多20轮对话

        return { maxTokens, maxRounds };
    },

    // ==================== 反死循环机制 ====================

    // 检查消息是否可能导致循环
    checkForLoop(messages) {
        if (messages.length < 4) return false;

        // 检查最近2轮对话是否完全一致
        const recent = messages.slice(-4);
        const texts = recent.map(m => m.content?.trim() || '');

        // 完全相同的user消息
        if (texts[0] === texts[2] && texts[1] === texts[3]) {
            return true;
        }

        // 检查最近6条AI消息是否有高度重复
        const aiMessages = messages.filter(m => m.role === 'ai').slice(-6);
        if (aiMessages.length >= 4) {
            const contents = aiMessages.map(m => m.content?.substring(0, 100) || '');
            const unique = new Set(contents);
            if (unique.size <= 2 && aiMessages.length >= 4) {
                return true;
            }
        }

        return false;
    },

    // 检查user消息是否过于重复
    checkRepeatedUserInput(messages) {
        const userMessages = messages.filter(m => m.role === 'user');
        if (userMessages.length < 3) return false;

        const lastThree = userMessages.slice(-3);
        const texts = lastThree.map(m => m.content?.trim()?.substring(0, 50));
        const unique = new Set(texts);
        return unique.size === 1; // 最后3条完全相同
    }
};

// 全局暴露
window.AIService = AIService;
