# 极蜂自动点击器 - 新功能说明

## 🔄 自动刷新功能

### 功能介绍
新增自动刷新功能，可以设置页面自动刷新的间隔时间，刷新后会自动继续点击。

### 设置项
- **自动刷新间隔 (毫秒)**: 设置多久刷新一次页面，0表示不刷新
- **刷新后延迟 (毫秒)**: 页面刷新后等待多久再开始点击，默认2000毫秒

### 工作流程
1. 设置刷新间隔时间
2. 开始点击
3. 到达刷新时间后，自动刷新页面
4. 页面加载完成后，等待设定的延迟时间
5. 自动重新开始点击
6. 循环以上过程，直到手动停止或达到停止条件

### 使用场景
- 需要定期刷新页面的自动化任务
- 防止页面长时间运行导致的内存泄漏
- 需要获取最新内容的场景
- 页面有超时限制的情况

## ⏱️ 时间和次数双重控制

### 功能改进
现在同时支持时间控制和次数控制，任何一个条件满足都会自动停止。

### 控制逻辑
- **时间控制**: 到达设定的结束时间后自动停止
- **次数控制**: 达到设定的最大点击次数后自动停止
- **双重保险**: 两种控制方式可以同时使用

### 工作原理
- 设置精确的时间控制定时器
- 每分钟检查一次时间和点击次数
- 任何一个条件满足就立即停止

## 🛠️ 界面优化

### 标题更新
- 从"点击设置"改为"刷新&点击 设置"，更准确地反映功能

### 布局调整
- 添加了自动刷新相关的设置项
- 保持两列布局，界面整洁

### 标签优化
- "间隔时间"改为"点击间隔"，更明确
- 添加了刷新相关的标签和说明

## 🔧 技术实现

### 自动刷新实现
```javascript
// 设置自动刷新
setupAutoRefresh() {
    this.clearAutoRefresh(); // 清除之前的定时器
    
    const refreshInterval = parseInt(this.elements.refreshInterval.value);
    if (refreshInterval > 0) {
        console.log(`设置自动刷新: 每 ${refreshInterval} 毫秒刷新一次`);
        
        this.refreshTimeout = setTimeout(() => {
            this.performRefresh();
        }, refreshInterval);
    }
}

// 执行刷新
performRefresh() {
    if (!this.isRunning) return;
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            // 先停止当前点击
            chrome.tabs.sendMessage(tabs[0].id, { type: 'stopAutoClick' });
            
            // 刷新页面
            chrome.tabs.reload(tabs[0].id, () => {
                // 等待页面加载后重新开始点击
                const refreshDelay = parseInt(this.elements.refreshDelay.value) || 2000;
                setTimeout(() => {
                    if (this.isRunning) {
                        this.startAutoClick();
                        this.setupAutoRefresh(); // 设置下次刷新
                    }
                }, refreshDelay);
            });
        }
    });
}
```

### 双重控制实现
```javascript
// 时间控制检查
if (currentTime >= endDate) {
    console.log('时间检查触发：到达结束时间，自动停止');
    this.forceStop();
    alert(`到达结束时间 ${endTime}，自动停止`);
    return;
}

// 次数限制检查
const maxClicks = parseInt(this.elements.maxClicks.value);
if (maxClicks > 0 && this.clickCount >= maxClicks) {
    console.log('次数检查触发：达到最大点击次数，自动停止');
    this.forceStop();
    alert(`已达到最大点击次数 ${maxClicks}，自动停止`);
    return;
}
```

## 📊 使用建议

### 自动刷新设置
- **短间隔场景**: 5000-10000毫秒，适合需要频繁刷新的页面
- **中等间隔场景**: 30000-60000毫秒，适合一般网页
- **长间隔场景**: 300000毫秒(5分钟)以上，适合内容变化较慢的页面

### 刷新后延迟
- **简单页面**: 1000-2000毫秒
- **复杂页面**: 3000-5000毫秒
- **加载缓慢的页面**: 5000-10000毫秒

### 双重控制建议
- 同时设置时间和次数限制，提供双重保障
- 时间控制适合有明确结束时间的任务
- 次数控制适合有明确目标数量的任务

## 🧪 测试方法

### 自动刷新测试
1. 设置较短的刷新间隔（如5000毫秒）
2. 开始点击
3. 观察页面是否按设定间隔自动刷新
4. 刷新后是否继续点击

### 双重控制测试
1. 设置较大的点击次数（如100次）
2. 设置较短的结束时间（如当前时间+1分钟）
3. 开始点击
4. 观察是否在时间到达前停止

## 🚀 未来计划

### 功能增强
- 支持按天循环的定时任务
- 添加刷新计数和统计
- 支持条件触发的刷新（如特定元素出现时）

### 界面优化
- 添加刷新历史记录
- 可视化的时间和次数进度条
- 更多的预设配置选项

现在您可以同时使用时间控制、次数限制和自动刷新功能，让自动点击更加智能和灵活！
