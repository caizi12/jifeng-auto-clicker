// 时间选择器样式修复脚本
// 用于修复Chrome时间选择器弹出面板的样式问题

(function() {
    'use strict';
    
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTimePickerFix);
    } else {
        initTimePickerFix();
    }
    
    function initTimePickerFix() {
        console.log('初始化时间选择器样式修复...');
        
        // 添加全局样式
        addGlobalTimePickerStyles();
        
        // 监听时间输入框的交互
        setupTimeInputListeners();
        
        // 定期检查和修复样式
        setInterval(fixTimePickerStyles, 1000);
    }
    
    function addGlobalTimePickerStyles() {
        const style = document.createElement('style');
        style.id = 'time-picker-fix-styles';
        style.textContent = `
            /* 强制时间选择器样式 */
            input[type="time"] {
                font-size: 11px !important;
                zoom: 1 !important;
                font-weight: normal !important;
            }

            /* 尝试控制时间选择器弹出面板 */
            input[type="time"]::-webkit-datetime-edit {
                font-size: 10px !important;
                font-weight: normal !important;
            }

            input[type="time"]::-webkit-datetime-edit-hour-field,
            input[type="time"]::-webkit-datetime-edit-minute-field {
                font-size: 10px !important;
                font-weight: normal !important;
                border: none !important;
                padding: 0 2px !important;
            }

            input[type="time"]::-webkit-datetime-edit-text {
                font-size: 10px !important;
                font-weight: normal !important;
            }
            
            /* 时间选择器下拉箭头 */
            input[type="time"]::-webkit-calendar-picker-indicator {
                width: 10px !important;
                height: 10px !important;
                padding: 0 !important;
                margin: 0 0 0 2px !important;
            }
            
            /* 尝试影响时间选择器弹出面板 */
            ::-webkit-datetime-edit-fields-wrapper {
                font-size: 10px !important;
                font-weight: normal !important;
                 border: none !important;
            }
            
            /* 全局字体大小控制 */
            .input-group {
                font-size: 12px !important;
            }
            
            .input-group * {
                font-size: inherit !important;
            }
        `;
        
        // 移除旧的样式（如果存在）
        const oldStyle = document.getElementById('time-picker-fix-styles');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        document.head.appendChild(style);
        console.log('时间选择器全局样式已添加');
    }
    
    function setupTimeInputListeners() {
        const timeInputs = document.querySelectorAll('input[type="time"]');
        
        timeInputs.forEach(input => {
            // 点击时应用样式
            input.addEventListener('click', function() {
                setTimeout(() => {
                    fixTimePickerPopup();
                }, 100);
            });
            
            // 焦点时应用样式
            input.addEventListener('focus', function() {
                setTimeout(() => {
                    fixTimePickerPopup();
                }, 100);
            });
            
            // 直接设置样式
            input.style.fontSize = '11px';
            input.style.fontWeight = 'normal';
            input.style.zoom = '1';
        });
        
        console.log(`已设置 ${timeInputs.length} 个时间输入框的监听器`);
    }
    
    function fixTimePickerPopup() {
        // 尝试查找时间选择器弹出面板
        const timePickerElements = [
            'input[type="time"]::-webkit-datetime-edit',
            'input[type="time"]::-webkit-datetime-edit-hour-field',
            'input[type="time"]::-webkit-datetime-edit-minute-field',
            'input[type="time"]::-webkit-datetime-edit-text'
        ];
        
        // 应用内联样式
        const timeInputs = document.querySelectorAll('input[type="time"]');
        timeInputs.forEach(input => {
            input.style.fontSize = '11px';
            input.style.fontWeight = 'normal';
            input.style.zoom = '1';
        });
        
        console.log('时间选择器弹出面板样式已修复');
    }
    
    function fixTimePickerStyles() {
        // 定期检查并修复时间输入框样式
        const timeInputs = document.querySelectorAll('input[type="time"]');
        
        timeInputs.forEach(input => {
            if (input.style.fontSize !== '11px') {
                input.style.fontSize = '11px';
                input.style.fontWeight = 'normal';
                input.style.zoom = '1';
            }
        });
    }
    
    // 监听DOM变化，处理动态添加的时间输入框
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // 元素节点
                        const timeInputs = node.querySelectorAll ? node.querySelectorAll('input[type="time"]') : [];
                        if (timeInputs.length > 0) {
                            setupTimeInputListeners();
                        }
                        
                        // 如果添加的节点本身就是时间输入框
                        if (node.type === 'time') {
                            setupTimeInputListeners();
                        }
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('时间选择器样式修复脚本已初始化');
})();
