// 极蜂自动点击器 - 弹出窗口脚本
// 处理弹出界面和用户交互

class JiFengAutoClickerPopup {
    constructor() {
        this.isRunning = false;          // 是否正在运行
        this.clickCount = 0;            // 点击次数
        this.startTime = null;          // 开始时间
        this.timerInterval = null;      // 计时器
        this.selectedElement = null;    // 选中的元素
        this.isSelectingElement = false; // 是否正在选择元素
        this.selectionPollingInterval = null; // 选择轮询定时器
        this.autoStopTimeout = null;    // 自动停止定时器
        this.timeControlInterval = null; // 时间控制检查定时器
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.updateStatus();
        this.checkPendingSelection(); // 检查是否有待处理的选择结果
        this.checkAutoRefreshState(); // 检查自动刷新状态
        this.clearOldTimeSettings(); // 清除旧的时间设置
    }

    // 初始化界面元素
    initializeElements() {
        this.elements = {
            selector: document.getElementById('selector'),
            selectElement: document.getElementById('selectElement'),
            testSelector: document.getElementById('testSelector'),
            refreshSelection: document.getElementById('refreshSelection'),
            selectedInfo: document.getElementById('selectedInfo'),
            selectedText: document.getElementById('selectedText'),
            interval: document.getElementById('interval'),
            maxClicks: document.getElementById('maxClicks'),
            refreshInterval: document.getElementById('refreshInterval'),
            refreshDelay: document.getElementById('refreshDelay'),
            quickDuration: document.getElementById('quickDuration'),
            startTime: document.getElementById('startTime'),
            endTime: document.getElementById('endTime'),
            crossDay: document.getElementById('crossDay'),
            enableTimeControl: document.getElementById('enableTimeControl'),
            timeControlPanel: document.getElementById('timeControlPanel'),
            setCurrentTime: document.getElementById('setCurrentTime'),
            timeInfo: document.getElementById('timeInfo'),
            timeInfoText: document.getElementById('timeInfoText'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            status: document.getElementById('status'),
            clickCount: document.getElementById('clickCount'),
            runTime: document.getElementById('runTime'),
            randomInterval: document.getElementById('randomInterval'),
            scrollToElement: document.getElementById('scrollToElement'),
            highlightElement: document.getElementById('highlightElement')
        };
    }

    // 绑定事件
    bindEvents() {
        this.elements.selectElement.addEventListener('click', () => this.selectElement());
        this.elements.testSelector.addEventListener('click', () => this.testSelector());
        this.elements.refreshSelection.addEventListener('click', () => this.refreshSelection());
        this.elements.setCurrentTime.addEventListener('click', () => this.setCurrentTime());
        this.elements.startBtn.addEventListener('click', () => this.startClicking());
        this.elements.stopBtn.addEventListener('click', () => this.stopClicking());

        // 时间控制相关事件
        this.elements.enableTimeControl.addEventListener('change', () => this.toggleTimeControl());
        this.elements.quickDuration.addEventListener('change', () => this.calculateEndTime());
        this.elements.startTime.addEventListener('change', () => this.calculateEndTime());
        this.elements.endTime.addEventListener('change', () => this.validateTimeSettings());
        this.elements.crossDay.addEventListener('change', () => this.validateTimeSettings());
        
        // 保存设置
        ['selector', 'interval', 'maxClicks', 'refreshInterval', 'refreshDelay', 'quickDuration', 'startTime', 'endTime', 'crossDay', 'enableTimeControl', 'randomInterval', 'scrollToElement', 'highlightElement'].forEach(id => {
            const element = this.elements[id];
            const eventType = element.type === 'checkbox' ? 'change' : 'input';
            element.addEventListener(eventType, () => this.saveSettings());
        });

        // 监听来自内容脚本的消息
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('Popup收到消息:', message);

            if (message.type === 'elementSelected') {
                console.log('处理元素选择消息');
                this.handleElementSelected(message.data);
                sendResponse({ success: true });
            } else if (message.type === 'clickerStatus') {
                console.log('处理状态更新消息');
                this.handleStatusUpdate(message.data);
                sendResponse({ success: true });
            } else if (message.type === 'autoClickResumed') {
                console.log('处理自动点击恢复消息');
                this.handleAutoClickResumed(message.settings);
                sendResponse({ success: true });
            }

            return true; // 保持消息通道开放
        });

        // 监听存储变化（用于跨标签页同步）
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes.jifengSelectedElement) {
                console.log('检测到元素选择存储变化');
                const elementData = changes.jifengSelectedElement.newValue;
                if (elementData) {
                    this.handleElementSelected(elementData);
                    // 清除存储中的临时数据
                    chrome.storage.local.remove('jifengSelectedElement');
                }
            }
        });
    }

    // 选择元素
    async selectElement() {
        try {
            console.log('开始元素选择...');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('当前标签页:', tab);

            // 设置选择状态
            this.isSelectingElement = true;
            this.minimizePopup();

            // 发送消息到内容脚本
            const response = await chrome.tabs.sendMessage(tab.id, { type: 'startElementSelection' });
            console.log('内容脚本响应:', response);

            // 启动轮询检查选择结果
            this.startSelectionPolling();

        } catch (error) {
            console.error('选择元素失败:', error);
            alert('选择元素失败，请确保页面已加载完成。\n错误信息: ' + error.message);
            this.restorePopup();
        }
    }

    // 启动选择轮询
    startSelectionPolling() {
        console.log('启动选择结果轮询...');
        this.selectionPollingInterval = setInterval(async () => {
            try {
                const result = await chrome.storage.local.get('jifengSelectedElement');
                if (result.jifengSelectedElement) {
                    console.log('轮询检测到选择结果:', result.jifengSelectedElement);
                    this.handleElementSelected(result.jifengSelectedElement);
                    // 清除存储和轮询
                    chrome.storage.local.remove('jifengSelectedElement');
                    this.stopSelectionPolling();
                }
            } catch (error) {
                console.error('轮询检查失败:', error);
            }
        }, 500); // 每500ms检查一次

        // 30秒后自动停止轮询
        setTimeout(() => {
            if (this.selectionPollingInterval) {
                console.log('选择超时，停止轮询');
                this.stopSelectionPolling();
                this.restorePopup();
                alert('选择超时，请重试');
            }
        }, 30000);
    }

    // 停止选择轮询
    stopSelectionPolling() {
        if (this.selectionPollingInterval) {
            clearInterval(this.selectionPollingInterval);
            this.selectionPollingInterval = null;
        }
        this.isSelectingElement = false;
    }

    // 最小化弹出窗口
    minimizePopup() {
        // 添加一个提示信息
        const tip = document.createElement('div');
        tip.id = 'selection-tip';
        tip.innerHTML = '请在页面上点击要自动点击的元素...<br><small>选择完成后会自动返回</small>';
        tip.style.cssText =
            'position: fixed;' +
            'top: 0;' +
            'left: 0;' +
            'right: 0;' +
            'background: #2196F3;' +
            'color: white;' +
            'padding: 10px;' +
            'text-align: center;' +
            'font-size: 12px;' +
            'z-index: 1000;';

        document.body.appendChild(tip);

        // 禁用其他控件
        this.elements.startBtn.disabled = true;
        this.elements.selectElement.disabled = true;
        this.elements.selectElement.textContent = '正在选择...';
    }

    // 恢复弹出窗口
    restorePopup() {
        const tip = document.getElementById('selection-tip');
        if (tip) {
            tip.remove();
        }

        // 恢复控件
        this.elements.startBtn.disabled = false;
        this.elements.selectElement.disabled = false;
        this.elements.selectElement.textContent = '选择元素';
    }

    // 处理元素选择
    handleElementSelected(data) {
        console.log('=== 开始处理元素选择数据 ===');
        console.log('接收到的数据:', data);

        // 停止轮询
        this.stopSelectionPolling();

        this.selectedElement = data;

        // 强制更新界面元素
        if (this.elements.selector) {
            this.elements.selector.value = data.selector || '';
            console.log('已设置选择器值:', this.elements.selector.value);
        }

        if (this.elements.selectedText) {
            const displayText = data.text || data.tagName || '未知元素';
            this.elements.selectedText.textContent = displayText;
            console.log('已设置显示文本:', displayText);
        }

        if (this.elements.selectedInfo) {
            this.elements.selectedInfo.style.display = 'block';
            console.log('已显示选择信息区域');
        }

        // 恢复弹出窗口状态
        this.restorePopup();

        // 保存设置
        this.saveSettings();

        // 显示成功提示
        this.showSelectionSuccess(data);

        // 触发input事件确保界面更新
        if (this.elements.selector) {
            this.elements.selector.dispatchEvent(new Event('input', { bubbles: true }));
        }

        console.log('=== 元素选择处理完成 ===');
    }

    // 检查待处理的选择结果
    async checkPendingSelection() {
        console.log('检查是否有待处理的选择结果...');

        try {
            const result = await chrome.storage.local.get(['jifengSelectedElement', 'jifengSelectionTimestamp']);

            if (result.jifengSelectedElement && result.jifengSelectionTimestamp) {
                const timeDiff = Date.now() - result.jifengSelectionTimestamp;

                // 如果选择结果是在最近30秒内产生的，则处理它
                if (timeDiff < 30000) {
                    console.log('发现待处理的选择结果:', result.jifengSelectedElement);
                    this.handleElementSelected(result.jifengSelectedElement);

                    // 清除已处理的数据
                    chrome.storage.local.remove(['jifengSelectedElement', 'jifengSelectionTimestamp']);
                } else {
                    console.log('选择结果已过期，清除数据');
                    chrome.storage.local.remove(['jifengSelectedElement', 'jifengSelectionTimestamp']);
                }
            } else {
                console.log('没有待处理的选择结果');
            }
        } catch (error) {
            console.error('检查待处理选择结果失败:', error);
        }
    }

    // 手动刷新选择结果
    async refreshSelection() {
        console.log('手动刷新选择结果...');

        // 显示刷新状态
        const originalText = this.elements.refreshSelection.textContent;
        this.elements.refreshSelection.textContent = '刷新中...';
        this.elements.refreshSelection.disabled = true;

        try {
            // 检查存储中的选择结果
            await this.checkPendingSelection();

            // 显示成功状态
            this.elements.refreshSelection.textContent = '✅';
            this.elements.refreshSelection.style.backgroundColor = '#4CAF50';

        } catch (error) {
            console.error('刷新失败:', error);
            this.elements.refreshSelection.textContent = '❌';
            this.elements.refreshSelection.style.backgroundColor = '#f44336';
        }

        // 恢复按钮状态
        setTimeout(() => {
            this.elements.refreshSelection.textContent = originalText;
            this.elements.refreshSelection.disabled = false;
            this.elements.refreshSelection.style.backgroundColor = '';
        }, 2000);
    }

    // 显示选择成功提示
    showSelectionSuccess(data) {
        // 临时改变选择按钮的样式和文本
        const originalText = this.elements.selectElement.textContent;
        const originalStyle = this.elements.selectElement.style.backgroundColor;

        this.elements.selectElement.textContent = '✅ 选择成功';
        this.elements.selectElement.style.backgroundColor = '#4CAF50';

        setTimeout(() => {
            this.elements.selectElement.textContent = originalText;
            this.elements.selectElement.style.backgroundColor = originalStyle;
        }, 2000);
    }

    // 测试选择器
    async testSelector() {
        const selector = this.elements.selector.value.trim();
        if (!selector) {
            alert('请先输入CSS选择器或XPath');
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, {
                type: 'testSelector',
                selector: selector
            });

            if (response && response.success) {
                const count = response.count;
                const message = count === 0 ?
                    '❌ 未找到匹配的元素' :
                    count === 1 ?
                    '✅ 找到1个匹配的元素' :
                    `⚠️ 找到${count}个匹配的元素（建议使用更具体的选择器）`;

                this.showTestResult(message, count > 0);

                if (count > 0) {
                    // 高亮显示找到的元素
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'highlightElements',
                        selector: selector
                    });
                }
            } else {
                this.showTestResult('❌ 选择器语法错误', false);
            }

        } catch (error) {
            console.error('测试选择器失败:', error);
            this.showTestResult('❌ 测试失败: ' + error.message, false);
        }
    }

    // 显示测试结果
    showTestResult(message, success) {
        const originalText = this.elements.testSelector.textContent;
        const originalStyle = this.elements.testSelector.style.backgroundColor;

        this.elements.testSelector.textContent = success ? '✅ 有效' : '❌ 无效';
        this.elements.testSelector.style.backgroundColor = success ? '#4CAF50' : '#f44336';

        // 显示详细消息
        alert(message);

        setTimeout(() => {
            this.elements.testSelector.textContent = originalText;
            this.elements.testSelector.style.backgroundColor = originalStyle;
        }, 3000);
    }

    // 开始点击
    async startClicking() {
        const selector = this.elements.selector.value.trim();
        if (!selector) {
            alert('请输入CSS选择器或选择一个元素');
            return;
        }

        // 检查时间控制
        if (this.elements.enableTimeControl.checked) {
            const startTime = this.elements.startTime.value;
            const endTime = this.elements.endTime.value;
            const crossDay = parseInt(this.elements.crossDay.value) || 0;

            if (!startTime || !endTime) {
                alert('启用时间控制时，请设置开始时间和结束时间');
                return;
            }

            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
                               now.getMinutes().toString().padStart(2, '0');

            // 解析时间
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);

            const startDate = new Date();
            startDate.setHours(startHour, startMinute, 0, 0);

            const endDate = new Date();
            endDate.setHours(endHour, endMinute, 0, 0);
            if (crossDay === 1) {
                endDate.setDate(endDate.getDate() + 1);
            }

            console.log(`时间控制检查: 当前 ${now.toLocaleTimeString()}, 开始 ${startDate.toLocaleTimeString()}, 结束 ${endDate.toLocaleTimeString()}`);

            // 检查是否已过结束时间
            if (now >= endDate) {
                const crossDayText = crossDay === 1 ? '（次日）' : '';
                alert(`当前时间已超过结束时间 ${endTime}${crossDayText}，请重新设置时间`);
                return;
            }

            // 检查是否还未到开始时间
            if (now < startDate) {
                const waitMs = startDate.getTime() - now.getTime();
                const waitMinutes = Math.floor(waitMs / 60000);
                alert(`当前时间 ${currentTime}，将在 ${startTime} 开始运行（还需等待 ${waitMinutes} 分钟）`);
            }
        }

        const settings = this.getSettings();

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, {
                type: 'startAutoClick',
                settings: settings
            });

            this.isRunning = true;
            this.clickCount = 0;
            this.startTime = Date.now();
            this.updateUI();
            this.startTimer();
            this.setupAutoStop();
            this.setupAutoRefresh(); // 设置自动刷新

        } catch (error) {
            console.error('启动自动点击失败:', error);
            alert('启动失败，请刷新页面后重试');
        }
    }

    // 停止点击
    async stopClicking() {
        console.log('强制停止自动点击...');

        try {
            // 强制停止，不管是否有响应
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.tabs.sendMessage(tab.id, { type: 'stopAutoClick' }).catch(() => {
                console.log('内容脚本可能已不存在，但继续停止本地状态');
            });

        } catch (error) {
            console.log('发送停止消息失败，但继续停止本地状态:', error);
        }

        // 无论如何都要停止本地状态
        this.forceStop();
    }

    // 强制停止所有状态
    forceStop() {
        console.log('执行强制停止...');
        this.isRunning = false;
        this.stopTimer();
        this.clearAutoStop();
        this.clearAutoRefresh(); // 清除自动刷新
        this.updateUI();

        // 确保向内容脚本发送停止消息
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'stopAutoClick' }).catch(() => {
                        console.log('内容脚本可能已不存在');
                    });
                }
            });
        } catch (error) {
            console.log('发送停止消息失败:', error);
        }

        console.log('已强制停止所有运行状态');
    }

    // 处理状态更新
    handleStatusUpdate(data) {
        this.clickCount = data.clickCount;
        this.isRunning = data.isRunning;
        this.updateUI();
        
        if (!this.isRunning && this.timerInterval) {
            this.stopTimer();
        }
    }

    // 获取运行时设置（包含时间）
    getSettings() {
        return {
            selector: this.elements.selector.value.trim(),
            interval: parseInt(this.elements.interval.value) || 1000,
            maxClicks: parseInt(this.elements.maxClicks.value) || 0,
            refreshInterval: parseInt(this.elements.refreshInterval.value) || 0,
            refreshDelay: parseInt(this.elements.refreshDelay.value) || 2000,
            quickDuration: parseInt(this.elements.quickDuration.value) || 0,
            startTime: this.elements.startTime.value,
            endTime: this.elements.endTime.value,
            crossDay: parseInt(this.elements.crossDay.value) || 0,
            enableTimeControl: this.elements.enableTimeControl.checked,
            randomInterval: this.elements.randomInterval.checked,
            scrollToElement: this.elements.scrollToElement.checked,
            highlightElement: this.elements.highlightElement.checked
        };
    }

    // 获取保存设置（不包含具体时间值）
    getSaveableSettings() {
        return {
            selector: this.elements.selector.value.trim(),
            interval: parseInt(this.elements.interval.value) || 1000,
            maxClicks: parseInt(this.elements.maxClicks.value) || 0,
            refreshInterval: parseInt(this.elements.refreshInterval.value) || 0,
            refreshDelay: parseInt(this.elements.refreshDelay.value) || 2000,
            quickDuration: parseInt(this.elements.quickDuration.value) || 0,
            // 不保存具体的时间值
            // startTime: this.elements.startTime.value,
            // endTime: this.elements.endTime.value,
            crossDay: parseInt(this.elements.crossDay.value) || 0,
            enableTimeControl: this.elements.enableTimeControl.checked,
            randomInterval: this.elements.randomInterval.checked,
            scrollToElement: this.elements.scrollToElement.checked,
            highlightElement: this.elements.highlightElement.checked
        };
    }

    // 设置自动停止
    setupAutoStop() {
        this.clearAutoStop(); // 清除之前的定时器

        // 时间控制检查
        if (this.elements.enableTimeControl.checked && this.elements.endTime.value) {
            const endTime = this.elements.endTime.value;
            const crossDay = parseInt(this.elements.crossDay.value) || 0;

            console.log(`设置时间控制: 结束时间 ${endTime}, 跨天: ${crossDay}`);

            // 解析结束时间
            const [endHour, endMinute] = endTime.split(':').map(Number);
            const endDate = new Date();
            endDate.setHours(endHour, endMinute, 0, 0);

            // 处理跨天情况
            if (crossDay === 1) {
                endDate.setDate(endDate.getDate() + 1);
                console.log('跨天设置，结束时间调整为明天');
            }

            // 计算到结束时间的毫秒数
            const now = new Date();
            const timeToEnd = endDate.getTime() - now.getTime();

            console.log(`当前时间: ${now.toLocaleTimeString()}`);
            console.log(`结束时间: ${endDate.toLocaleTimeString()}`);
            console.log(`剩余时间: ${Math.floor(timeToEnd / 60000)} 分钟`);

            if (timeToEnd > 0) {
                // 设置精确的停止定时器
                this.autoStopTimeout = setTimeout(() => {
                    console.log('定时器触发：到达结束时间，自动停止');
                    if (this.isRunning) {
                        this.forceStop();
                        const crossDayText = crossDay === 1 ? '（次日）' : '';
                        alert(`到达结束时间 ${endTime}${crossDayText}，自动停止`);
                    }
                }, timeToEnd);

                // 每分钟检查一次，防止时间漂移，同时检查次数限制
                this.timeControlInterval = setInterval(() => {
                    const currentTime = new Date();
                    console.log(`时间检查: 当前 ${currentTime.toLocaleTimeString()}, 目标 ${endDate.toLocaleTimeString()}`);

                    // 检查是否还在运行
                    if (!this.isRunning) {
                        console.log('已停止运行，清除时间检查定时器');
                        clearInterval(this.timeControlInterval);
                        this.timeControlInterval = null;
                        return;
                    }

                    // 检查时间控制
                    if (currentTime >= endDate) {
                        console.log('时间检查触发：到达结束时间，自动停止');
                        this.forceStop();
                        const crossDayText = crossDay === 1 ? '（次日）' : '';
                        alert(`到达结束时间 ${endTime}${crossDayText}，自动停止`);
                        return;
                    }

                    // 检查次数限制
                    const maxClicks = parseInt(this.elements.maxClicks.value);
                    if (maxClicks > 0 && this.clickCount >= maxClicks) {
                        console.log('次数检查触发：达到最大点击次数，自动停止');
                        this.forceStop();
                        alert(`已达到最大点击次数 ${maxClicks}，自动停止`);
                        return;
                    }
                }, 60000); // 每分钟检查一次

                console.log('时间控制已设置完成');
            } else {
                console.log('结束时间已过期，无法设置时间控制');
                alert('结束时间已过期，请重新设置时间');
            }
        } else {
            console.log('时间控制未启用或未设置结束时间');
        }
    }

    // 清除自动停止
    clearAutoStop() {
        if (this.autoStopTimeout) {
            clearTimeout(this.autoStopTimeout);
            this.autoStopTimeout = null;
            console.log('已清除自动停止定时器');
        }
        if (this.timeControlInterval) {
            clearInterval(this.timeControlInterval);
            this.timeControlInterval = null;
            console.log('已清除时间检查定时器');
        }
    }

    // 保存设置
    saveSettings() {
        const settings = this.getSaveableSettings();
        chrome.storage.local.set({ jifengAutoClickerSettings: settings });
    }

    // 加载设置
    async loadSettings() {
        try {
            const result = await chrome.storage.local.get('jifengAutoClickerSettings');
            if (result.jifengAutoClickerSettings) {
                const settings = result.jifengAutoClickerSettings;
                this.elements.selector.value = settings.selector || '';
                this.elements.interval.value = settings.interval || 1000;
                this.elements.maxClicks.value = settings.maxClicks || 0;
                this.elements.refreshInterval.value = settings.refreshInterval || 0;
                this.elements.refreshDelay.value = settings.refreshDelay || 2000;
                this.elements.quickDuration.value = settings.quickDuration || 0;
                // 不加载具体的时间值，让用户每次重新设置
                // this.elements.startTime.value = settings.startTime || '';
                // this.elements.endTime.value = settings.endTime || '';
                this.elements.crossDay.value = settings.crossDay || 0;
                this.elements.enableTimeControl.checked = settings.enableTimeControl !== undefined ? settings.enableTimeControl : true;
                this.elements.randomInterval.checked = settings.randomInterval || false;
                this.elements.scrollToElement.checked = settings.scrollToElement || false;
                this.elements.highlightElement.checked = settings.highlightElement || false;

                // 初始化时间控制面板
                this.toggleTimeControl();
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    // 更新界面
    updateUI() {
        this.elements.startBtn.disabled = this.isRunning;
        this.elements.stopBtn.disabled = false; // 停止按钮始终可用
        this.elements.status.textContent = this.isRunning ? '运行中' : '已停止';
        this.elements.clickCount.textContent = this.clickCount;

        // 更新停止按钮样式
        if (this.isRunning) {
            this.elements.stopBtn.style.backgroundColor = '#f44336';
            this.elements.stopBtn.style.fontWeight = 'bold';
        } else {
            this.elements.stopBtn.style.backgroundColor = '';
            this.elements.stopBtn.style.fontWeight = '';
        }
    }

    // 更新状态
    updateStatus() {
        // 获取当前状态
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'getStatus' }, (response) => {
                    if (response) {
                        this.handleStatusUpdate(response);
                    }
                });
            }
        });
    }

    // 开始计时器
    startTimer() {
        this.stopTimer(); // 先停止之前的计时器
        this.timerInterval = setInterval(() => {
            if (this.startTime && this.isRunning) {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;

                if (minutes > 0) {
                    this.elements.runTime.textContent = `${minutes}分${seconds}秒`;
                } else {
                    this.elements.runTime.textContent = `${seconds}秒`;
                }
            }
        }, 1000);
    }

    // 停止计时器
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // 重置运行时间显示
        if (!this.isRunning) {
            this.elements.runTime.textContent = '0秒';
        }
    }

    // 切换时间控制面板
    toggleTimeControl() {
        const enabled = this.elements.enableTimeControl.checked;
        this.elements.timeControlPanel.style.display = enabled ? 'block' : 'none';

        if (enabled) {
            // 启用时间控制时，总是设置当前时间作为开始时间
            this.setCurrentTime();
            this.calculateEndTime();
        } else {
            // 禁用时间控制时，隐藏提示信息
            this.elements.timeInfo.style.display = 'none';
        }
    }

    // 设置当前时间
    setCurrentTime() {
        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' +
                          now.getMinutes().toString().padStart(2, '0');
        this.elements.startTime.value = timeString;
        this.calculateEndTime();
    }

    // 计算结束时间
    calculateEndTime() {
        const startTime = this.elements.startTime.value;
        const durationMinutes = parseInt(this.elements.quickDuration.value);

        if (!startTime || durationMinutes === 0) {
            this.validateTimeSettings();
            return;
        }

        // 解析开始时间
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(startHour, startMinute, 0, 0);

        // 计算结束时间
        const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

        // 检查是否跨天
        const crossDay = endDate.getDate() !== startDate.getDate();

        // 设置结束时间
        const endTimeString = endDate.getHours().toString().padStart(2, '0') + ':' +
                             endDate.getMinutes().toString().padStart(2, '0');
        this.elements.endTime.value = endTimeString;

        // 设置跨天选项
        this.elements.crossDay.value = crossDay ? '1' : '0';

        this.validateTimeSettings();
    }

    // 验证时间设置
    validateTimeSettings() {
        if (!this.elements.enableTimeControl.checked) {
            this.elements.timeInfo.style.display = 'none';
            return;
        }

        const startTime = this.elements.startTime.value;
        const endTime = this.elements.endTime.value;
        const crossDay = parseInt(this.elements.crossDay.value);

        if (!startTime || !endTime) {
            this.showTimeInfo('请设置开始时间和结束时间', 'warning');
            return;
        }

        // 获取当前时间
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
                           now.getMinutes().toString().padStart(2, '0');

        // 解析时间
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        // 创建开始和结束时间对象
        const startDate = new Date();
        startDate.setHours(startHour, startMinute, 0, 0);

        const endDate = new Date();
        endDate.setHours(endHour, endMinute, 0, 0);

        // 处理跨天情况
        if (crossDay === 1) {
            endDate.setDate(endDate.getDate() + 1);
        }

        // 处理跨天情况的时间逻辑检查
        if (crossDay === 0 && endDate <= startDate) {
            // 同一天内，结束时间必须晚于开始时间
            this.showTimeInfo('结束时间必须晚于开始时间', 'error');
            return;
        }

        // 检查是否已经过期
        const currentDate = new Date();
        if (endDate <= currentDate) {
            this.showTimeInfo('结束时间已过期，请重新设置', 'error');
            return;
        }

        // 计算运行时长
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        let durationText = '';
        if (hours > 0) {
            durationText = `${hours}小时${minutes}分钟`;
        } else {
            durationText = `${minutes}分钟`;
        }

        // 显示时间信息
        const crossDayText = crossDay === 1 ? '（跨天）' : '';
        const infoText = `运行时长: ${durationText}${crossDayText}`;

        // 检查是否需要等待开始时间
        if (startDate > currentDate) {
            const waitMs = startDate.getTime() - currentDate.getTime();
            const waitMinutes = Math.floor(waitMs / (1000 * 60));
            const waitHours = Math.floor(waitMinutes / 60);
            const waitMins = waitMinutes % 60;

            let waitText = '';
            if (waitHours > 0) {
                waitText = `${waitHours}小时${waitMins}分钟`;
            } else {
                waitText = `${waitMins}分钟`;
            }

            this.showTimeInfo(`${infoText}，${waitText}后开始`, 'info');
        } else {
            this.showTimeInfo(infoText, 'info');
        }
    }

    // 显示时间信息
    showTimeInfo(text, type = 'info') {
        this.elements.timeInfoText.textContent = text;
        this.elements.timeInfo.className = 'time-info';

        if (type === 'warning') {
            this.elements.timeInfo.classList.add('warning');
        } else if (type === 'error') {
            this.elements.timeInfo.classList.add('error');
        }

        this.elements.timeInfo.style.display = 'block';
    }

    // 设置自动刷新
    setupAutoRefresh() {
        this.clearAutoRefresh(); // 清除之前的定时器

        const refreshInterval = parseInt(this.elements.refreshInterval.value);
        if (refreshInterval > 0 && this.isRunning) {
            console.log(`设置自动刷新: 每 ${refreshInterval} 毫秒刷新一次`);

            // 获取当前设置
            const currentSettings = this.getSettings();

            // 将自动刷新设置发送到后台脚本
            chrome.runtime.sendMessage({
                type: 'setupAutoRefresh',
                settings: currentSettings
            }).then(() => {
                console.log('自动刷新设置已发送到后台脚本');
            }).catch(error => {
                console.error('发送自动刷新设置失败:', error);

                // 如果发送失败，使用本地定时器作为备份
                this.refreshTimeout = setTimeout(() => {
                    this.performRefresh();
                }, refreshInterval);
            });
        }
    }

    // 执行刷新
    performRefresh() {
        if (!this.isRunning) {
            console.log('已停止运行，取消刷新');
            return;
        }

        console.log('执行页面刷新...');

        // 保存当前状态到storage，以便刷新后恢复
        const currentSettings = this.getSettings();
        currentSettings.isAutoRefreshRunning = true;
        currentSettings.refreshStartTime = Date.now();

        chrome.storage.local.set({
            autoRefreshState: currentSettings
        }, () => {
            console.log('自动刷新状态已保存');
        });

        try {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    // 先停止当前点击
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'stopAutoClick' }).catch(() => {
                        console.log('停止点击消息发送失败');
                    });

                    // 刷新页面
                    chrome.tabs.reload(tabs[0].id).then(() => {
                        console.log('页面刷新完成');
                    }).catch((error) => {
                        console.error('刷新页面失败:', error);
                        // 如果刷新失败，继续设置下次刷新
                        if (this.isRunning) {
                            this.setupAutoRefresh();
                        }
                    });
                }
            });
        } catch (error) {
            console.error('获取当前标签页失败:', error);
            // 如果获取标签页失败，继续设置下次刷新
            if (this.isRunning) {
                this.setupAutoRefresh();
            }
        }
    }

    // 清除自动刷新
    clearAutoRefresh() {
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
            console.log('已清除自动刷新定时器');
        }

        // 通知后台脚本清除自动刷新
        chrome.runtime.sendMessage({
            type: 'clearAutoRefresh'
        }).then(() => {
            console.log('已通知后台脚本清除自动刷新');
        }).catch(error => {
            console.error('通知后台脚本失败:', error);
        });

        // 清除存储的自动刷新状态
        chrome.storage.local.remove(['autoRefreshState', 'autoRefreshSettings'], () => {
            console.log('已清除自动刷新状态');
        });
    }

    // 重新开始自动点击（刷新后使用）
    startAutoClick(retryCount = 0) {
        const settings = this.getSettings();
        const maxRetries = 5;

        console.log(`尝试开始自动点击，重试次数: ${retryCount}`);

        try {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'startAutoClick',
                        settings: settings
                    }).then(() => {
                        console.log('自动点击消息发送成功');
                    }).catch((error) => {
                        console.error('发送开始点击消息失败:', error);

                        // 如果失败且还有重试次数，则重试
                        if (retryCount < maxRetries) {
                            console.log(`${1000 * (retryCount + 1)}ms后重试...`);
                            setTimeout(() => {
                                this.startAutoClick(retryCount + 1);
                            }, 1000 * (retryCount + 1)); // 递增延迟
                        } else {
                            console.error('达到最大重试次数，自动点击启动失败');
                            alert('页面刷新后无法启动自动点击，请手动重新开始');
                        }
                    });
                }
            });
        } catch (error) {
            console.error('重新开始点击失败:', error);

            // 如果失败且还有重试次数，则重试
            if (retryCount < maxRetries) {
                setTimeout(() => {
                    this.startAutoClick(retryCount + 1);
                }, 1000 * (retryCount + 1));
            }
        }
    }

    // 检查自动刷新状态
    checkAutoRefreshState() {
        chrome.storage.local.get('autoRefreshState', (result) => {
            if (result.autoRefreshState && result.autoRefreshState.isAutoRefreshRunning) {
                console.log('检测到自动刷新状态，恢复运行...');

                // 恢复设置
                const savedState = result.autoRefreshState;

                // 设置界面元素
                if (this.elements.selector) this.elements.selector.value = savedState.selector || '';
                if (this.elements.interval) this.elements.interval.value = savedState.interval || 1000;
                if (this.elements.maxClicks) this.elements.maxClicks.value = savedState.maxClicks || 0;
                if (this.elements.refreshInterval) this.elements.refreshInterval.value = savedState.refreshInterval || 0;
                if (this.elements.refreshDelay) this.elements.refreshDelay.value = savedState.refreshDelay || 2000;
                if (this.elements.startTime) this.elements.startTime.value = savedState.startTime || '';
                if (this.elements.endTime) this.elements.endTime.value = savedState.endTime || '';
                if (this.elements.crossDay) this.elements.crossDay.value = savedState.crossDay || 0;
                if (this.elements.enableTimeControl) this.elements.enableTimeControl.checked = true;

                // 计算刷新后的延迟时间
                const refreshDelay = parseInt(savedState.refreshDelay) || 2000;
                const timeSinceRefresh = Date.now() - savedState.refreshStartTime;
                const remainingDelay = Math.max(0, refreshDelay - timeSinceRefresh);

                console.log(`刷新后延迟: ${refreshDelay}ms, 已经过去: ${timeSinceRefresh}ms, 剩余: ${remainingDelay}ms`);

                // 设置运行状态
                this.isRunning = true;
                this.updateUI();

                // 等待剩余延迟后开始点击
                setTimeout(() => {
                    console.log('恢复自动点击...');
                    this.startAutoClick();
                    this.setupAutoRefresh(); // 设置下次刷新

                    // 清除存储的状态
                    chrome.storage.local.remove('autoRefreshState');
                }, remainingDelay);
            }
        });
    }

    // 清除旧的时间设置
    clearOldTimeSettings() {
        chrome.storage.local.get('jifengAutoClickerSettings', (result) => {
            if (result.jifengAutoClickerSettings) {
                const settings = result.jifengAutoClickerSettings;

                // 如果存在时间设置，清除它们
                if (settings.startTime || settings.endTime) {
                    console.log('清除旧的时间设置...');
                    delete settings.startTime;
                    delete settings.endTime;

                    // 重新保存设置
                    chrome.storage.local.set({ jifengAutoClickerSettings: settings }, () => {
                        console.log('已清除旧的时间设置');
                    });
                }
            }
        });
    }

    // 处理自动点击恢复
    handleAutoClickResumed(settings) {
        console.log('自动点击已恢复，更新popup状态');

        // 恢复运行状态
        this.isRunning = true;

        // 恢复点击计数
        if (settings.clickCount) {
            this.clickCount = settings.clickCount;
            console.log('恢复点击计数:', settings.clickCount);
        }

        // 恢复设置到界面
        if (settings.selector && this.elements.selector) {
            this.elements.selector.value = settings.selector;
        }
        if (settings.interval && this.elements.interval) {
            this.elements.interval.value = settings.interval;
        }
        if (settings.maxClicks && this.elements.maxClicks) {
            this.elements.maxClicks.value = settings.maxClicks;
        }
        if (settings.refreshInterval && this.elements.refreshInterval) {
            this.elements.refreshInterval.value = settings.refreshInterval;
        }
        if (settings.refreshDelay && this.elements.refreshDelay) {
            this.elements.refreshDelay.value = settings.refreshDelay;
        }
        if (settings.startTime && this.elements.startTime) {
            this.elements.startTime.value = settings.startTime;
        }
        if (settings.endTime && this.elements.endTime) {
            this.elements.endTime.value = settings.endTime;
        }
        if (settings.crossDay && this.elements.crossDay) {
            this.elements.crossDay.value = settings.crossDay;
        }
        if (settings.enableTimeControl && this.elements.enableTimeControl) {
            this.elements.enableTimeControl.checked = settings.enableTimeControl;
        }

        // 更新界面
        this.updateUI();
        this.toggleTimeControl();

        // 重新设置自动刷新
        this.setupAutoRefresh();

        console.log('Popup状态已恢复');
    }
}

// 当DOM加载完成时初始化
document.addEventListener('DOMContentLoaded', () => {
    new JiFengAutoClickerPopup();
});
