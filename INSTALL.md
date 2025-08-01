# 极蜂自动点击器 - 安装和使用指南

## 快速安装

### 第一步：安装插件

1. 打开Chrome浏览器
2. 在地址栏输入：`chrome://extensions/`
3. 开启右上角的"开发者模式"开关
4. 点击"加载已解压的扩展程序"按钮
5. 选择 `chrome-extension` 文件夹
6. 插件安装成功！

### 第二步：验证安装

- 在扩展程序列表中应该能看到"极蜂自动点击器"
- Chrome工具栏中会出现插件图标
- 点击图标可以打开控制面板

## 详细使用教程

### 基础使用流程

1. **打开插件**
   - 点击Chrome工具栏中的极蜂插件图标
   - 控制面板会弹出

2. **选择目标元素**
   
   **方法A：可视化选择（推荐）**
   - 点击"选择元素"按钮
   - 插件窗口会关闭，页面进入选择模式
   - 鼠标悬停在元素上会看到红色高亮
   - 点击要自动点击的元素
   - 插件会自动生成选择器并重新打开

   **方法B：手动输入选择器**
   - 在"CSS选择器/XPath"输入框中输入
   - 常用格式示例：
     ```
     #button-id          (通过ID选择)
     .button-class       (通过类名选择)
     button[type="submit"] (通过属性选择)
     //button[@id='submit'] (XPath选择)
     ```

3. **配置参数**
   - **间隔时间**：两次点击间的毫秒数（1-60000）
   - **最大点击次数**：总共点击多少次（0=无限制）
   - **开始延迟**：开始前等待的毫秒数

4. **高级选项**
   - ☑️ **随机间隔**：在设定时间基础上±10%随机变化
   - ☑️ **滚动到元素**：自动滚动使元素可见
   - ☑️ **高亮显示元素**：用红框标记目标元素

5. **开始自动点击**
   - 点击"开始点击"按钮
   - 观察状态信息：运行状态、点击次数、运行时间
   - 需要停止时点击"停止点击"

### 实际应用场景

**场景1：网页游戏挂机**
```
选择器: .game-button
间隔: 500毫秒
随机间隔: ✓
高亮元素: ✓
```

**场景2：表单测试**
```
选择器: #submit-btn
间隔: 2000毫秒
最大次数: 10
滚动到元素: ✓
```

**场景3：页面刷新按钮**
```
选择器: button[onclick*="refresh"]
间隔: 5000毫秒
开始延迟: 1000毫秒
```

### 高级技巧

**1. 复杂选择器示例**
```css
/* 选择包含特定文本的按钮 */
button:contains("提交")

/* 选择第n个按钮 */
button:nth-child(2)

/* 选择特定父元素下的按钮 */
.form-container button.primary
```

**2. XPath高级用法**
```xpath
// 选择包含特定文本的元素
//button[contains(text(), "确认")]

// 选择具有特定属性的元素
//input[@type="submit" and @value="提交"]

// 选择父元素的第n个子元素
//div[@class="container"]//button[1]
```

**3. 处理动态内容**
- 如果页面内容会动态变化，建议使用更通用的选择器
- 开启"滚动到元素"确保元素可见
- 适当增加间隔时间避免过快点击

## 故障排除

### 常见问题

**问：插件图标不显示**
答：确保icons文件夹中有正确的PNG图标文件

**问：找不到元素错误**
答：
- 检查选择器语法是否正确
- 确保元素在页面加载完成后存在
- 尝试使用可视化选择重新选择

**问：点击没有效果**
答：
- 某些元素可能需要特殊事件触发
- 尝试增加点击间隔
- 检查元素是否真的可点击

**问：插件无法启动**
答：
- 刷新页面后重试
- 检查浏览器控制台错误信息
- 重新安装插件

### 调试技巧

1. **打开开发者工具**
   - 按F12打开Chrome开发者工具
   - 查看Console标签页的错误信息

2. **测试选择器**
   - 在Console中输入：`document.querySelector('你的选择器')`
   - 确认能正确选中元素

3. **检查元素属性**
   - 右键点击元素选择"检查"
   - 查看元素的ID、class、属性等信息

## 安全提醒

- 仅在允许的网站使用
- 遵守网站使用条款
- 避免对服务器造成过大压力
- 不要用于恶意目的

## 技术支持

如果遇到问题，可以：
1. 查看浏览器控制台错误信息
2. 检查插件是否正确安装
3. 确认目标网站没有反自动化机制

## 更新日志

- v1.0 - 初始版本，支持基本自动点击功能
- 支持毫秒级精度控制
- 支持可视化元素选择
- 支持CSS选择器和XPath
- 支持高级配置选项
