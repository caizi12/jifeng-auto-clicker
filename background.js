// 极蜂自动点击器 - 后台脚本
// 处理插件生命周期和消息传递

class JiFengAutoClickerBackground {
    constructor() {
        this.refreshTimer = null;
        this.initializeListeners();
        this.checkPendingRefresh();
    }

    // 初始化监听器
    initializeListeners() {
        // 插件安装时的处理
        chrome.runtime.onInstalled.addListener((details) => {
            console.log('极蜂自动点击器插件已安装');
            
            if (details.reason === 'install') {
                // 首次安装时的初始化
                this.setDefaultSettings();
            }
        });

        // 处理来自弹出窗口和内容脚本的消息
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // 保持消息通道开放
        });

        // 标签页更新时的处理
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                // 页面加载完成后，可以进行一些初始化操作
                this.onTabUpdated(tabId, tab);
            }
        });

        // 标签页激活时的处理
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.onTabActivated(activeInfo.tabId);
        });
    }

    // 处理消息
    handleMessage(message, sender, sendResponse) {
        console.log('后台脚本收到消息:', message, '来自:', sender);

        switch (message.type) {
            case 'getTabInfo':
                this.getTabInfo(sendResponse);
                break;
            case 'logError':
                console.error('内容脚本错误:', message.error);
                break;
            case 'logInfo':
                console.log('内容脚本信息:', message.info);
                break;
            case 'forwardToPopup':
                // 专门处理转发到popup的消息
                this.forwardToPopup(message.message, sendResponse);
                break;
            case 'elementSelected':
                // 直接处理元素选择消息
                console.log('后台脚本处理元素选择消息');
                this.handleElementSelection(message, sender, sendResponse);
                break;
            case 'setupAutoRefresh':
                this.setupAutoRefresh(message.settings);
                sendResponse({ success: true });
                break;
            case 'clearAutoRefresh':
                this.clearAutoRefresh();
                sendResponse({ success: true });
                break;
            default:
                // 转发消息到其他组件
                this.forwardMessage(message, sender, sendResponse);
        }
    }

    // 处理元素选择
    handleElementSelection(message, sender, sendResponse) {
        console.log('处理元素选择，尝试转发到popup');

        // 尝试直接转发到popup
        chrome.runtime.sendMessage(message).then(() => {
            console.log('成功转发到popup');
            sendResponse({ success: true, method: 'direct' });
        }).catch((error) => {
            console.log('直接转发失败，使用存储方案:', error);
            // 如果popup不存在，保存到存储
            chrome.storage.local.set({
                jifengSelectedElement: message.data,
                jifengSelectionTimestamp: Date.now()
            });
            sendResponse({ success: true, method: 'storage' });
        });
    }

    // 转发到popup
    forwardToPopup(message, sendResponse) {
        chrome.runtime.sendMessage(message).then(() => {
            sendResponse({ success: true });
        }).catch((error) => {
            console.warn('转发到popup失败:', error);
            sendResponse({ success: false, error: error.message });
        });
    }

    // 获取标签页信息
    async getTabInfo(sendResponse) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            sendResponse({
                success: true,
                tab: {
                    id: tab.id,
                    url: tab.url,
                    title: tab.title
                }
            });
        } catch (error) {
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    // 转发消息
    forwardMessage(message, sender, sendResponse) {
        // 在弹出窗口和内容脚本之间转发消息
        if (sender.tab) {
            // 来自内容脚本，转发到弹出窗口
            chrome.runtime.sendMessage(message).catch(() => {
                // 弹出窗口可能已关闭，忽略错误
            });
        } else {
            // 来自弹出窗口，转发到当前标签页的内容脚本
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, message, sendResponse);
                }
            });
        }
    }

    // 设置默认配置
    async setDefaultSettings() {
        const defaultSettings = {
            selector: '',
            interval: 1000,
            maxClicks: 0,
            delay: 0,
            randomInterval: false,
            scrollToElement: true,
            highlightElement: true
        };

        try {
            await chrome.storage.local.set({ jifengAutoClickerSettings: defaultSettings });
            console.log('默认设置已保存');
        } catch (error) {
            console.error('保存默认设置失败:', error);
        }
    }

    // 标签页更新处理
    onTabUpdated(tabId, tab) {
        // 页面更新时可以进行一些处理
        // 例如：重新注入脚本、重置状态等
        console.log('标签页 ' + tabId + ' 已更新: ' + tab.url);
    }

    // 标签页激活处理
    onTabActivated(tabId) {
        // 标签页激活时的处理
        console.log('标签页 ' + tabId + ' 已激活');
    }

    // 设置自动刷新
    setupAutoRefresh(settings) {
        this.clearAutoRefresh();

        const refreshInterval = parseInt(settings.refreshInterval);
        if (refreshInterval > 0) {
            console.log(`后台设置自动刷新: 每 ${refreshInterval} 毫秒刷新一次`);

            this.refreshTimer = setTimeout(() => {
                this.performRefresh(settings);
            }, refreshInterval);

            // 保存刷新设置
            chrome.storage.local.set({
                autoRefreshSettings: {
                    ...settings,
                    nextRefreshTime: Date.now() + refreshInterval,
                    isActive: true
                }
            });
        }
    }

    // 执行刷新
    async performRefresh(settings) {
        console.log('后台执行页面刷新...');

        try {
            // 获取当前活动标签页
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                // 先停止当前点击
                try {
                    await chrome.tabs.sendMessage(tabs[0].id, { type: 'stopAutoClick' });
                } catch (error) {
                    console.log('停止点击消息发送失败:', error);
                }

                // 保存刷新状态
                chrome.storage.local.set({
                    autoRefreshState: {
                        ...settings,
                        isAutoRefreshRunning: true,
                        refreshStartTime: Date.now()
                    }
                });

                // 刷新页面
                await chrome.tabs.reload(tabs[0].id);
                console.log('后台页面刷新完成');

                // 不在这里设置下次刷新，让content.js在点击过程中控制刷新时机
            }
        } catch (error) {
            console.error('后台刷新页面失败:', error);
            // 如果刷新失败，重试
            const refreshInterval = parseInt(settings.refreshInterval);
            if (refreshInterval > 0) {
                this.refreshTimer = setTimeout(() => {
                    this.performRefresh(settings);
                }, refreshInterval);
            }
        }
    }

    // 清除自动刷新
    clearAutoRefresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
            console.log('后台已清除自动刷新定时器');
        }

        // 清除存储的设置
        chrome.storage.local.remove(['autoRefreshSettings', 'autoRefreshState']);
    }

    // 检查待处理的刷新
    checkPendingRefresh() {
        chrome.storage.local.get('autoRefreshSettings', (result) => {
            if (result.autoRefreshSettings && result.autoRefreshSettings.isActive) {
                const settings = result.autoRefreshSettings;
                const now = Date.now();

                if (settings.nextRefreshTime && settings.nextRefreshTime > now) {
                    // 还有待执行的刷新
                    const remainingTime = settings.nextRefreshTime - now;
                    console.log(`恢复自动刷新，剩余时间: ${remainingTime}ms`);

                    this.refreshTimer = setTimeout(() => {
                        this.performRefresh(settings);
                    }, remainingTime);
                } else {
                    // 时间已过，立即执行
                    console.log('立即执行待处理的刷新');
                    this.performRefresh(settings);
                }
            }
        });
    }
}

// 初始化后台脚本
const jifengAutoClickerBackground = new JiFengAutoClickerBackground();

// 错误处理
chrome.runtime.onStartup.addListener(() => {
    console.log('极蜂自动点击器插件已启动');
});

// 处理未捕获的错误
self.addEventListener('error', (event) => {
    console.error('后台脚本错误:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
});
