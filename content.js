// 极蜂自动点击器 - 内容脚本
// 处理元素选择和自动点击功能

class JiFengAutoClicker {
    constructor() {
        this.isRunning = false;          // 是否正在运行
        this.clickInterval = null;       // 点击定时器
        this.clickCount = 0;            // 点击次数
        this.settings = null;           // 设置参数
        this.targetElement = null;      // 目标元素
        this.isSelecting = false;       // 是否正在选择元素
        this.highlightedElement = null; // 高亮的元素
        this.refreshTimer = null;       // 刷新定时器
        this.startTime = null;          // 开始时间
        this.lastClickTime = null;      // 上次点击时间
        this.nextRefreshTime = null;    // 下次刷新时间

        this.initializeMessageListener();
        this.initializeElementSelection();
    }

    // 初始化消息监听器
    initializeMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'startAutoClick':
                    this.startAutoClick(message.settings);
                    sendResponse({ success: true });
                    break;
                case 'stopAutoClick':
                    this.stopAutoClick();
                    sendResponse({ success: true });
                    break;
                case 'getStatus':
                    sendResponse({
                        isRunning: this.isRunning,
                        clickCount: this.clickCount
                    });
                    break;
                case 'startElementSelection':
                    this.startElementSelection();
                    sendResponse({ success: true });
                    break;
                case 'testSelector':
                    this.testSelector(message.selector, sendResponse);
                    break;
                case 'highlightElements':
                    this.highlightElements(message.selector);
                    sendResponse({ success: true });
                    break;
            }
        });
    }

    // 测试选择器
    testSelector(selector, sendResponse) {
        console.log('测试选择器:', selector);

        try {
            let elements = [];

            // 尝试CSS选择器
            try {
                elements = document.querySelectorAll(selector);
                console.log('CSS选择器找到', elements.length, '个元素');
            } catch (cssError) {
                console.log('CSS选择器失败，尝试XPath');

                // 尝试XPath
                if (selector.startsWith('//') || selector.startsWith('./')) {
                    const result = document.evaluate(
                        selector,
                        document,
                        null,
                        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                        null
                    );

                    elements = [];
                    for (let i = 0; i < result.snapshotLength; i++) {
                        elements.push(result.snapshotItem(i));
                    }
                    console.log('XPath找到', elements.length, '个元素');
                } else {
                    throw cssError;
                }
            }

            sendResponse({
                success: true,
                count: elements.length,
                elements: Array.from(elements).map(el => ({
                    tagName: el.tagName,
                    id: el.id,
                    className: el.className,
                    text: el.textContent ? el.textContent.trim().substring(0, 30) : ''
                }))
            });

        } catch (error) {
            console.error('测试选择器失败:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    // 高亮元素
    highlightElements(selector) {
        console.log('高亮元素:', selector);

        // 清除之前的高亮
        this.clearTestHighlights();

        try {
            let elements = [];

            // 尝试CSS选择器
            try {
                elements = document.querySelectorAll(selector);
            } catch (cssError) {
                // 尝试XPath
                if (selector.startsWith('//') || selector.startsWith('./')) {
                    const result = document.evaluate(
                        selector,
                        document,
                        null,
                        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                        null
                    );

                    elements = [];
                    for (let i = 0; i < result.snapshotLength; i++) {
                        elements.push(result.snapshotItem(i));
                    }
                }
            }

            // 高亮找到的元素
            Array.from(elements).forEach((element, index) => {
                element.classList.add('jifeng-test-highlight');

                // 为多个元素添加编号
                if (elements.length > 1) {
                    const badge = document.createElement('div');
                    badge.className = 'jifeng-element-badge';
                    badge.textContent = index + 1;
                    badge.style.cssText =
                        'position: absolute;' +
                        'top: -10px;' +
                        'left: -10px;' +
                        'background: #FF5722;' +
                        'color: white;' +
                        'border-radius: 50%;' +
                        'width: 20px;' +
                        'height: 20px;' +
                        'display: flex;' +
                        'align-items: center;' +
                        'justify-content: center;' +
                        'font-size: 12px;' +
                        'font-weight: bold;' +
                        'z-index: 10002;';

                    // 确保父元素有相对定位
                    if (getComputedStyle(element).position === 'static') {
                        element.style.position = 'relative';
                    }

                    element.appendChild(badge);
                }
            });

            // 3秒后清除高亮
            setTimeout(() => {
                this.clearTestHighlights();
            }, 3000);

        } catch (error) {
            console.error('高亮元素失败:', error);
        }
    }

    // 清除测试高亮
    clearTestHighlights() {
        // 移除高亮类
        const highlighted = document.querySelectorAll('.jifeng-test-highlight');
        highlighted.forEach(el => {
            el.classList.remove('jifeng-test-highlight');
        });

        // 移除编号标记
        const badges = document.querySelectorAll('.jifeng-element-badge');
        badges.forEach(badge => {
            if (badge.parentNode) {
                badge.parentNode.removeChild(badge);
            }
        });
    }

    // 初始化元素选择功能
    initializeElementSelection() {
        this.boundMouseOver = this.handleMouseOver.bind(this);
        this.boundMouseOut = this.handleMouseOut.bind(this);
        this.boundClick = this.handleElementClick.bind(this);
        this.boundKeyDown = this.handleKeyDown.bind(this);
    }

    // 开始元素选择
    startElementSelection() {
        this.isSelecting = true;
        document.body.style.cursor = 'crosshair';
        
        // 添加事件监听器
        document.addEventListener('mouseover', this.boundMouseOver, true);
        document.addEventListener('mouseout', this.boundMouseOut, true);
        document.addEventListener('click', this.boundClick, true);
        document.addEventListener('keydown', this.boundKeyDown, true);
        
        // 显示选择提示
        this.showSelectionTip();
    }

    // 停止元素选择
    stopElementSelection() {
        this.isSelecting = false;
        document.body.style.cursor = '';
        
        // 移除事件监听器
        document.removeEventListener('mouseover', this.boundMouseOver, true);
        document.removeEventListener('mouseout', this.boundMouseOut, true);
        document.removeEventListener('click', this.boundClick, true);
        document.removeEventListener('keydown', this.boundKeyDown, true);
        
        // 移除高亮
        this.removeHighlight();
        this.hideSelectionTip();
    }

    // 处理鼠标悬停事件
    handleMouseOver(event) {
        if (!this.isSelecting) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        this.removeHighlight();
        this.highlightedElement = event.target;
        event.target.classList.add('jifeng-auto-clicker-highlight');
    }

    // 处理鼠标移出事件
    handleMouseOut(event) {
        if (!this.isSelecting) return;
        
        event.preventDefault();
        event.stopPropagation();
    }

    // 处理元素点击事件
    handleElementClick(event) {
        if (!this.isSelecting) return;

        event.preventDefault();
        event.stopPropagation();

        const element = event.target;
        console.log('用户选择了元素:', element);

        // 生成多个可能的选择器
        const selectors = this.generateMultipleSelectors(element);
        console.log('生成的选择器列表:', selectors);

        // 选择最佳选择器
        const bestSelector = this.selectBestSelector(selectors);
        console.log('选择的最佳选择器:', bestSelector);

        // 验证选择器
        const testElement = document.querySelector(bestSelector);
        if (testElement !== element) {
            console.warn('选择器验证失败，尝试备用方案');
            // 使用备用选择器
            const fallbackSelector = this.generateFallbackSelector(element);
            console.log('备用选择器:', fallbackSelector);
        }

        const finalSelector = testElement === element ? bestSelector : this.generateFallbackSelector(element);

        // 获取元素的详细信息
        const elementInfo = {
            selector: finalSelector,
            tagName: element.tagName,
            text: element.textContent ? element.textContent.trim().substring(0, 50) : '',
            id: element.id || '',
            className: element.className || '',
            attributes: this.getElementAttributes(element),
            position: this.getElementPosition(element)
        };

        console.log('发送元素信息:', elementInfo);

        // 发送选中的元素信息 - 优先使用存储方案确保可靠性
        console.log('=== 开始发送元素选择信息 ===');
        console.log('元素信息:', elementInfo);

        // 方式1: 立即保存到存储（最可靠）
        this.saveElementToStorage(elementInfo);

        // 方式2: 尝试直接发送消息
        try {
            chrome.runtime.sendMessage({
                type: 'elementSelected',
                data: elementInfo
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('直接消息发送失败:', chrome.runtime.lastError.message);
                } else {
                    console.log('直接消息发送成功:', response);
                }
            });
        } catch (error) {
            console.error('发送消息异常:', error);
        }

        // 方式3: 通过后台脚本转发
        setTimeout(() => {
            try {
                chrome.runtime.sendMessage({
                    type: 'forwardToPopup',
                    message: {
                        type: 'elementSelected',
                        data: elementInfo
                    }
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('后台转发失败:', chrome.runtime.lastError.message);
                    } else {
                        console.log('后台转发成功:', response);
                    }
                });
            } catch (error) {
                console.error('后台转发异常:', error);
            }
        }, 200);

        // 显示选择成功提示
        this.showSuccessMessage(finalSelector);

        // 延迟停止选择，让用户看到提示
        setTimeout(() => {
            this.stopElementSelection();
        }, 1000);
    }

    // 生成多个可能的选择器
    generateMultipleSelectors(element) {
        const selectors = [];

        // ID选择器
        if (element.id) {
            selectors.push('#' + element.id);
        }

        // 类选择器
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\s+/).filter(cls => cls && !cls.startsWith('jifeng'));
            if (classes.length > 0) {
                selectors.push(element.tagName.toLowerCase() + '.' + classes[0]);
                if (classes.length > 1) {
                    selectors.push(element.tagName.toLowerCase() + '.' + classes.join('.'));
                }
            }
        }

        // 属性选择器
        const attrs = ['name', 'type', 'value', 'title', 'data-id', 'data-name', 'role'];
        for (const attr of attrs) {
            const value = element.getAttribute(attr);
            if (value && value.length < 50) {
                selectors.push(element.tagName.toLowerCase() + '[' + attr + '="' + value + '"]');
            }
        }

        // 路径选择器
        selectors.push(this.generatePath(element));

        return selectors;
    }

    // 选择最佳选择器
    selectBestSelector(selectors) {
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length === 1) {
                    return selector; // 找到唯一匹配的选择器
                }
            } catch (error) {
                console.warn('选择器语法错误:', selector, error);
            }
        }

        // 如果没有唯一匹配，返回第一个有效的选择器
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    return selector;
                }
            } catch (error) {
                continue;
            }
        }

        return selectors[0] || 'unknown';
    }

    // 生成备用选择器
    generateFallbackSelector(element) {
        return this.generatePath(element);
    }

    // 获取元素属性
    getElementAttributes(element) {
        const attrs = {};
        for (const attr of element.attributes) {
            attrs[attr.name] = attr.value;
        }
        return attrs;
    }

    // 获取元素位置
    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
    }

    // 显示选择成功消息
    showSuccessMessage(selector) {
        const message = document.createElement('div');
        message.id = 'jifeng-success-message';
        message.innerHTML = '✅ 元素选择成功！<br>选择器: ' + selector;
        message.style.cssText =
            'position: fixed;' +
            'top: 50px;' +
            'left: 50%;' +
            'transform: translateX(-50%);' +
            'background: #4CAF50;' +
            'color: white;' +
            'padding: 12px 20px;' +
            'border-radius: 6px;' +
            'font-size: 14px;' +
            'z-index: 10001;' +
            'font-family: Arial, sans-serif;' +
            'box-shadow: 0 2px 10px rgba(0,0,0,0.3);';

        document.body.appendChild(message);

        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 2000);
    }

    // 保存元素到存储
    saveElementToStorage(elementInfo) {
        console.log('=== 保存元素信息到存储 ===');
        console.log('保存的数据:', elementInfo);

        const storageData = {
            jifengSelectedElement: elementInfo,
            jifengSelectionTimestamp: Date.now(),
            jifengSelectionId: Math.random().toString(36).substr(2, 9) // 添加唯一ID
        };

        chrome.storage.local.set(storageData, () => {
            if (chrome.runtime.lastError) {
                console.error('存储元素信息失败:', chrome.runtime.lastError);
            } else {
                console.log('✅ 元素信息已成功保存到存储');
                console.log('存储数据:', storageData);

                // 验证存储是否成功
                chrome.storage.local.get('jifengSelectedElement', (result) => {
                    if (result.jifengSelectedElement) {
                        console.log('✅ 存储验证成功:', result.jifengSelectedElement);
                    } else {
                        console.error('❌ 存储验证失败');
                    }
                });
            }
        });
    }

    // 使用存储作为备用方案（保持兼容性）
    useStorageFallback(elementInfo) {
        this.saveElementToStorage(elementInfo);
    }

    // 处理键盘按下事件
    handleKeyDown(event) {
        if (!this.isSelecting) return;
        
        if (event.key === 'Escape') {
            event.preventDefault();
            this.stopElementSelection();
        }
    }

    // 生成CSS选择器
    generateSelector(element) {
        console.log('正在为元素生成选择器:', element);

        // 方法1: 优先使用ID
        if (element.id) {
            const selector = '#' + element.id;
            console.log('使用ID选择器:', selector);
            return selector;
        }

        // 方法2: 使用类名（选择最具体的类）
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\s+/).filter(cls => cls && !cls.startsWith('jifeng'));
            if (classes.length > 0) {
                // 尝试单个类名
                for (const cls of classes) {
                    const selector = element.tagName.toLowerCase() + '.' + cls;
                    if (document.querySelectorAll(selector).length === 1) {
                        console.log('使用单类名选择器:', selector);
                        return selector;
                    }
                }
                // 使用多个类名
                const selector = element.tagName.toLowerCase() + '.' + classes.join('.');
                console.log('使用多类名选择器:', selector);
                return selector;
            }
        }

        // 方法3: 使用属性选择器
        const attrs = ['name', 'type', 'value', 'title', 'data-id', 'data-name'];
        for (const attr of attrs) {
            const value = element.getAttribute(attr);
            if (value && value.length < 50) { // 避免过长的属性值
                const selector = element.tagName.toLowerCase() + '[' + attr + '="' + value + '"]';
                if (document.querySelectorAll(selector).length === 1) {
                    console.log('使用属性选择器:', selector);
                    return selector;
                }
            }
        }

        // 方法4: 使用文本内容（适用于按钮等）
        if (element.textContent && element.textContent.trim().length > 0 && element.textContent.trim().length < 30) {
            const text = element.textContent.trim();
            const selector = element.tagName.toLowerCase() + ':contains("' + text + '")';
            console.log('尝试文本选择器:', selector);
            // 注意：:contains不是标准CSS，但可以用XPath代替
        }

        // 方法5: 生成路径选择器
        const path = this.generatePath(element);
        console.log('使用路径选择器:', path);
        return path;
    }

    // 生成元素路径
    generatePath(element) {
        const path = [];
        let current = element;

        while (current && current !== document.body) {
            let selector = current.tagName.toLowerCase();

            // 添加ID
            if (current.id) {
                selector += '#' + current.id;
                path.unshift(selector);
                break; // ID是唯一的，可以停止
            }

            // 添加类名
            if (current.className && typeof current.className === 'string') {
                const classes = current.className.trim().split(/\s+/).filter(cls => cls && !cls.startsWith('jifeng'));
                if (classes.length > 0) {
                    selector += '.' + classes[0]; // 只使用第一个类
                }
            }

            // 添加nth-child
            const parent = current.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children).filter(child =>
                    child.tagName === current.tagName
                );
                if (siblings.length > 1) {
                    const index = siblings.indexOf(current) + 1;
                    selector += ':nth-of-type(' + index + ')';
                }
            }

            path.unshift(selector);
            current = current.parentElement;

            // 限制路径长度
            if (path.length >= 5) break;
        }

        return path.join(' > ');
    }

    // 显示选择提示
    showSelectionTip() {
        const tip = document.createElement('div');
        tip.id = 'jifeng-auto-clicker-tip';
        tip.innerHTML = '点击要自动点击的元素，按ESC取消';
        tip.style.cssText = 
            'position: fixed;' +
            'top: 10px;' +
            'left: 50%;' +
            'transform: translateX(-50%);' +
            'background: #333;' +
            'color: white;' +
            'padding: 8px 16px;' +
            'border-radius: 4px;' +
            'font-size: 14px;' +
            'z-index: 10000;' +
            'font-family: Arial, sans-serif;';
        document.body.appendChild(tip);
    }

    // 隐藏选择提示
    hideSelectionTip() {
        const tip = document.getElementById('jifeng-auto-clicker-tip');
        if (tip) {
            tip.remove();
        }
    }

    // 移除高亮
    removeHighlight() {
        if (this.highlightedElement) {
            this.highlightedElement.classList.remove('jifeng-auto-clicker-highlight');
            this.highlightedElement = null;
        }
    }

    // 开始自动点击
    startAutoClick(settings) {
        this.settings = settings;
        this.clickCount = 0;
        
        // 查找目标元素
        this.targetElement = this.findElement(settings.selector);
        if (!this.targetElement) {
            alert('找不到元素: ' + settings.selector);
            return;
        }
        
        // 滚动到元素
        if (settings.scrollToElement) {
            this.targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // 高亮元素
        if (settings.highlightElement) {
            this.targetElement.classList.add('jifeng-auto-clicker-highlight');
        }
        
        this.isRunning = true;
        this.startTime = Date.now();
        this.lastClickTime = Date.now();

        // 计算下次刷新时间
        if (settings.refreshInterval > 0) {
            this.nextRefreshTime = this.startTime + settings.refreshInterval;
            console.log(`设置刷新时机: ${settings.refreshInterval}ms后刷新`);
        }

        // 开始延迟
        setTimeout(() => {
            if (this.isRunning) {
                this.scheduleNextClick();
            }
        }, settings.delay || 1000);

        this.sendStatusUpdate();
    }

    // 停止自动点击
    stopAutoClick() {
        this.isRunning = false;

        if (this.clickInterval) {
            clearTimeout(this.clickInterval);
            this.clickInterval = null;
        }

        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        // 移除高亮
        if (this.targetElement && this.settings && this.settings.highlightElement) {
            this.targetElement.classList.remove('jifeng-auto-clicker-highlight');
        }
        
        this.sendStatusUpdate();
    }

    // 安排下次点击
    scheduleNextClick() {
        if (!this.isRunning) return;
        
        // 检查最大点击次数
        if (this.settings.maxClicks > 0 && this.clickCount >= this.settings.maxClicks) {
            console.log(`达到最大点击次数 ${this.settings.maxClicks}，停止点击`);
            this.stopAutoClick();
            return;
        }

        // 检查是否需要刷新
        const now = Date.now();
        if (this.nextRefreshTime && now >= this.nextRefreshTime) {
            console.log('到达刷新时间，执行页面刷新');
            this.performRefresh();
            return; // 刷新后会重新开始点击
        }

        // 重新查找元素（防止DOM变化）
        this.targetElement = this.findElement(this.settings.selector);
        if (!this.targetElement) {
            console.warn('目标元素不存在，停止点击');
            this.stopAutoClick();
            return;
        }

        // 执行点击
        this.performClick();
        this.lastClickTime = now;

        // 计算下次点击的间隔
        let interval = this.settings.interval;
        if (this.settings.randomInterval) {
            const variation = interval * 0.1; // ±10%
            interval += (Math.random() - 0.5) * 2 * variation;
            interval = Math.max(1, Math.round(interval)); // 确保至少1ms
        }

        // 安排下次点击
        this.clickInterval = setTimeout(() => {
            this.scheduleNextClick();
        }, interval);
    }

    // 执行点击
    performClick() {
        if (!this.targetElement) return;
        
        // 创建点击事件
        const events = ['mousedown', 'mouseup', 'click'];
        
        events.forEach(eventType => {
            const event = new MouseEvent(eventType, {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 0,
                buttons: 1,
                clientX: this.targetElement.getBoundingClientRect().left + this.targetElement.offsetWidth / 2,
                clientY: this.targetElement.getBoundingClientRect().top + this.targetElement.offsetHeight / 2
            });
            
            this.targetElement.dispatchEvent(event);
        });
        
        this.clickCount++;
        this.sendStatusUpdate();
    }

    // 查找元素
    findElement(selector) {
        try {
            // 尝试CSS选择器
            let element = document.querySelector(selector);
            if (element) return element;
            
            // 尝试XPath
            if (selector.startsWith('//') || selector.startsWith('./')) {
                const result = document.evaluate(
                    selector,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                );
                element = result.singleNodeValue;
                if (element) return element;
            }
            
            return null;
        } catch (error) {
            console.error('查找元素失败:', error);
            return null;
        }
    }

    // 发送状态更新
    sendStatusUpdate() {
        chrome.runtime.sendMessage({
            type: 'clickerStatus',
            data: {
                isRunning: this.isRunning,
                clickCount: this.clickCount
            }
        });
    }

    // 执行页面刷新
    performRefresh() {
        console.log('Content脚本执行页面刷新...');

        // 停止当前点击
        this.stopAutoClick();

        // 保存当前状态
        const refreshState = {
            ...this.settings,
            isAutoRefreshRunning: true,
            refreshStartTime: Date.now(),
            clickCount: this.clickCount // 保持点击计数
        };

        chrome.storage.local.set({ autoRefreshState: refreshState }, () => {
            console.log('刷新状态已保存，点击次数:', this.clickCount);

            // 刷新页面
            window.location.reload();
        });
    }
}

// 添加高亮样式
const style = document.createElement('style');
style.textContent =
    '.jifeng-auto-clicker-highlight {' +
    'outline: 3px solid #ff6b6b !important;' +
    'outline-offset: 2px !important;' +
    'background-color: rgba(255, 107, 107, 0.1) !important;' +
    'transition: all 0.3s ease !important;' +
    '}' +
    '.jifeng-test-highlight {' +
    'outline: 3px solid #2196F3 !important;' +
    'outline-offset: 2px !important;' +
    'background-color: rgba(33, 150, 243, 0.1) !important;' +
    'transition: all 0.3s ease !important;' +
    'position: relative !important;' +
    '}';
document.head.appendChild(style);

// 初始化
const jifengAutoClicker = new JiFengAutoClicker();
console.log('极蜂自动点击器内容脚本已加载');

// 页面加载完成后检查是否需要恢复自动点击
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面DOM加载完成，检查自动刷新状态...');
    checkAutoRefreshState();
});

// 如果DOM已经加载完成，立即检查
if (document.readyState === 'loading') {
    // DOM还在加载中，等待DOMContentLoaded事件
} else {
    // DOM已经加载完成，立即检查
    setTimeout(() => {
        console.log('页面已加载完成，检查自动刷新状态...');
        checkAutoRefreshState();
    }, 1000);
}

// 检查自动刷新状态
function checkAutoRefreshState() {
    chrome.storage.local.get('autoRefreshState', (result) => {
        if (result.autoRefreshState && result.autoRefreshState.isAutoRefreshRunning) {
            console.log('内容脚本检测到自动刷新状态，准备恢复点击...');

            const savedState = result.autoRefreshState;
            const refreshDelay = parseInt(savedState.refreshDelay) || 2000;
            const timeSinceRefresh = Date.now() - savedState.refreshStartTime;
            const remainingDelay = Math.max(1000, refreshDelay - timeSinceRefresh); // 至少等待1秒

            console.log(`内容脚本: 刷新后延迟: ${refreshDelay}ms, 已过去: ${timeSinceRefresh}ms, 剩余: ${remainingDelay}ms`);

            // 等待剩余延迟后开始点击
            setTimeout(() => {
                console.log('内容脚本: 开始恢复自动点击...');

                // 恢复点击计数
                if (savedState.clickCount) {
                    jifengAutoClicker.clickCount = savedState.clickCount;
                    console.log('恢复点击计数:', savedState.clickCount);
                }

                // 直接调用startAutoClick方法
                jifengAutoClicker.startAutoClick(savedState);

                // 清除存储的状态
                chrome.storage.local.remove('autoRefreshState');

                // 通知popup更新状态
                chrome.runtime.sendMessage({
                    type: 'autoClickResumed',
                    settings: savedState
                }).catch(() => {
                    console.log('通知popup失败，popup可能未打开');
                });

            }, remainingDelay);
        }
    });
}
