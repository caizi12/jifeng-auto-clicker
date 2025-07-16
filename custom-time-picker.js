// 自定义时间选择器
// 替换浏览器内置的time input，使用select下拉框实现

class CustomTimePicker {
    constructor() {
        this.timeSelectors = new Map(); // 存储时间选择器实例
        this.init();
    }
    
    init() {
        console.log('初始化自定义时间选择器...');
        this.populateTimeSelectors();
        this.bindEvents();
    }
    
    // 填充时间选择器选项
    populateTimeSelectors() {
        // 填充小时选项 (0-23)
        this.populateHourSelectors();
        
        // 填充分钟选项 (0-59)
        this.populateMinuteSelectors();
        
        console.log('时间选择器选项已填充');
    }
    
    // 填充小时选择器
    populateHourSelectors() {
        const hourSelectors = document.querySelectorAll('#startHour, #endHour');

        hourSelectors.forEach(selector => {
            // 检查是否已有选项，如果有就不重新生成
            if (selector.options.length > 0) {
                console.log('小时选择器已有选项，跳过生成');
                return;
            }

            // 添加小时选项 0-23
            for (let hour = 0; hour < 24; hour++) {
                const option = document.createElement('option');
                option.value = hour.toString().padStart(2, '0');
                option.textContent = hour.toString().padStart(2, '0');
                selector.appendChild(option);
            }

            console.log(`已为小时选择器添加 ${selector.options.length} 个选项`);
        });
    }
    
    // 填充分钟选择器
    populateMinuteSelectors() {
        const minuteSelectors = document.querySelectorAll('#startMinute, #endMinute');

        minuteSelectors.forEach(selector => {
            // 检查是否已有选项，如果有就不重新生成
            if (selector.options.length > 0) {
                console.log('分钟选择器已有选项，跳过生成');
                return;
            }

            // 添加分钟选项 0-59，每5分钟一个选项
            for (let minute = 0; minute < 60; minute += 5) {
                const option = document.createElement('option');
                option.value = minute.toString().padStart(2, '0');
                option.textContent = minute.toString().padStart(2, '0');
                selector.appendChild(option);
            }

            console.log(`已为分钟选择器添加 ${selector.options.length} 个选项`);
        });
    }
    
    // 绑定事件
    bindEvents() {
        // 监听时间选择变化
        const timeSelects = document.querySelectorAll('.time-select');
        timeSelects.forEach(select => {
            select.addEventListener('change', () => {
                this.onTimeChange();
            });
        });
        
        console.log('时间选择器事件已绑定');
    }
    
    // 时间变化处理
    onTimeChange() {
        // 触发自定义事件，通知其他组件时间已变化
        const event = new CustomEvent('timeChanged', {
            detail: {
                startTime: this.getStartTime(),
                endTime: this.getEndTime()
            }
        });
        document.dispatchEvent(event);
    }
    
    // 获取开始时间
    getStartTime() {
        const startHour = document.getElementById('startHour');
        const startMinute = document.getElementById('startMinute');
        
        if (!startHour || !startMinute) return '';
        
        return `${startHour.value}:${startMinute.value}`;
    }
    
    // 获取结束时间
    getEndTime() {
        const endHour = document.getElementById('endHour');
        const endMinute = document.getElementById('endMinute');
        
        if (!endHour || !endMinute) return '';
        
        return `${endHour.value}:${endMinute.value}`;
    }
    
    // 设置开始时间
    setStartTime(timeString) {
        if (!timeString) return;
        
        const [hour, minute] = timeString.split(':');
        const startHour = document.getElementById('startHour');
        const startMinute = document.getElementById('startMinute');
        
        if (startHour && hour) {
            startHour.value = hour.padStart(2, '0');
        }
        if (startMinute && minute) {
            startMinute.value = minute.padStart(2, '0');
        }
        
        this.onTimeChange();
    }
    
    // 设置结束时间
    setEndTime(timeString) {
        if (!timeString) return;
        
        const [hour, minute] = timeString.split(':');
        const endHour = document.getElementById('endHour');
        const endMinute = document.getElementById('endMinute');
        
        if (endHour && hour) {
            endHour.value = hour.padStart(2, '0');
        }
        if (endMinute && minute) {
            endMinute.value = minute.padStart(2, '0');
        }
        
        this.onTimeChange();
    }
    
    // 设置当前时间
    setCurrentTime() {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        
        this.setStartTime(currentTime);
        console.log('已设置当前时间:', currentTime);
    }
    
    // 计算结束时间（基于开始时间和持续时间）
    calculateEndTime(durationMinutes) {
        const startTime = this.getStartTime();
        if (!startTime || durationMinutes === 0) return;
        
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(startHour, startMinute, 0, 0);
        
        // 计算结束时间
        const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
        
        const endTimeString = endDate.getHours().toString().padStart(2, '0') + ':' + 
                             endDate.getMinutes().toString().padStart(2, '0');
        
        this.setEndTime(endTimeString);
        
        // 返回是否跨天
        return endDate.getDate() !== startDate.getDate();
    }
    
    // 验证时间格式
    validateTime(timeString) {
        if (!timeString) return false;
        
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(timeString);
    }
    
    // 比较两个时间
    compareTime(time1, time2) {
        if (!this.validateTime(time1) || !this.validateTime(time2)) {
            return 0;
        }
        
        const [hour1, minute1] = time1.split(':').map(Number);
        const [hour2, minute2] = time2.split(':').map(Number);
        
        const minutes1 = hour1 * 60 + minute1;
        const minutes2 = hour2 * 60 + minute2;
        
        if (minutes1 < minutes2) return -1;
        if (minutes1 > minutes2) return 1;
        return 0;
    }
    
    // 获取时间差（分钟）
    getTimeDifference(startTime, endTime, crossDay = false) {
        if (!this.validateTime(startTime) || !this.validateTime(endTime)) {
            return 0;
        }
        
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        let startMinutes = startHour * 60 + startMinute;
        let endMinutes = endHour * 60 + endMinute;
        
        // 处理跨天情况
        if (crossDay) {
            endMinutes += 24 * 60; // 加一天的分钟数
        }
        
        return endMinutes - startMinutes;
    }
    
    // 格式化时间显示
    formatTimeDisplay(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}小时${mins}分钟`;
        } else {
            return `${mins}分钟`;
        }
    }
    
    // 销毁时间选择器
    destroy() {
        const timeSelects = document.querySelectorAll('.time-select');
        timeSelects.forEach(select => {
            select.removeEventListener('change', this.onTimeChange);
        });
        
        this.timeSelectors.clear();
        console.log('自定义时间选择器已销毁');
    }
}

// 全局实例
let customTimePicker = null;

// 初始化函数
function initCustomTimePicker() {
    console.log('开始初始化自定义时间选择器...');

    // 检查DOM元素是否存在
    const startHour = document.getElementById('startHour');
    const startMinute = document.getElementById('startMinute');
    const endHour = document.getElementById('endHour');
    const endMinute = document.getElementById('endMinute');

    if (!startHour || !startMinute || !endHour || !endMinute) {
        console.error('时间选择器DOM元素未找到，延迟重试...');
        setTimeout(initCustomTimePicker, 100);
        return;
    }

    customTimePicker = new CustomTimePicker();
    window.customTimePicker = customTimePicker;
    console.log('自定义时间选择器初始化完成');
}

// 多种初始化方式
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomTimePicker);
} else {
    // DOM已经加载完成
    setTimeout(initCustomTimePicker, 50);
}

// 导出供其他脚本使用
window.CustomTimePicker = CustomTimePicker;
window.initCustomTimePicker = initCustomTimePicker;
