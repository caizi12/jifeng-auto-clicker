// 简化版时间选择器
// 直接操作已有的HTML select元素

(function() {
    'use strict';
    
    console.log('加载简化版时间选择器...');
    
    // 等待DOM加载完成
    function initSimpleTimePicker() {
        console.log('初始化简化版时间选择器...');
        
        // 检查元素是否存在
        const startHour = document.getElementById('startHour');
        const startMinute = document.getElementById('startMinute');
        const endHour = document.getElementById('endHour');
        const endMinute = document.getElementById('endMinute');
        
        if (!startHour || !startMinute || !endHour || !endMinute) {
            console.log('时间选择器元素未找到，延迟重试...');
            setTimeout(initSimpleTimePicker, 100);
            return;
        }
        
        console.log('时间选择器元素已找到，绑定事件...');
        
        // 绑定事件
        [startHour, startMinute, endHour, endMinute].forEach(select => {
            select.addEventListener('change', function() {
                console.log('时间选择器值变化:', this.id, this.value);
                triggerTimeChangeEvent();
            });
        });
        
        // 设置当前时间按钮事件
        const setCurrentTimeBtn = document.getElementById('setCurrentTime');
        if (setCurrentTimeBtn) {
            setCurrentTimeBtn.addEventListener('click', function() {
                setCurrentTime();
            });
        }
        
        console.log('简化版时间选择器初始化完成');
    }
    
    // 触发时间变化事件
    function triggerTimeChangeEvent() {
        const startTime = getStartTime();
        const endTime = getEndTime();
        
        const event = new CustomEvent('timeChanged', {
            detail: {
                startTime: startTime,
                endTime: endTime
            }
        });
        
        document.dispatchEvent(event);
        console.log('时间变化事件已触发:', startTime, endTime);
    }
    
    // 获取开始时间
    function getStartTime() {
        const startHour = document.getElementById('startHour');
        const startMinute = document.getElementById('startMinute');
        
        if (!startHour || !startMinute) return '';
        
        return `${startHour.value}:${startMinute.value}`;
    }
    
    // 获取结束时间
    function getEndTime() {
        const endHour = document.getElementById('endHour');
        const endMinute = document.getElementById('endMinute');
        
        if (!endHour || !endMinute) return '';
        
        return `${endHour.value}:${endMinute.value}`;
    }
    
    // 设置开始时间
    function setStartTime(timeString) {
        if (!timeString) return;
        
        const [hour, minute] = timeString.split(':');
        const startHour = document.getElementById('startHour');
        const startMinute = document.getElementById('startMinute');
        
        if (startHour && hour) {
            startHour.value = hour.padStart(2, '0');
        }
        if (startMinute && minute) {
            // 找到最接近的5分钟间隔
            const minuteNum = parseInt(minute);
            const roundedMinute = Math.round(minuteNum / 5) * 5;
            startMinute.value = roundedMinute.toString().padStart(2, '0');
        }
        
        triggerTimeChangeEvent();
    }
    
    // 设置结束时间
    function setEndTime(timeString) {
        if (!timeString) return;
        
        const [hour, minute] = timeString.split(':');
        const endHour = document.getElementById('endHour');
        const endMinute = document.getElementById('endMinute');
        
        if (endHour && hour) {
            endHour.value = hour.padStart(2, '0');
        }
        if (endMinute && minute) {
            // 找到最接近的5分钟间隔
            const minuteNum = parseInt(minute);
            const roundedMinute = Math.round(minuteNum / 5) * 5;
            endMinute.value = roundedMinute.toString().padStart(2, '0');
        }
        
        triggerTimeChangeEvent();
    }
    
    // 设置当前时间
    function setCurrentTime() {
        const now = new Date();
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes();
        
        // 四舍五入到最近的5分钟
        const roundedMinute = Math.round(minute / 5) * 5;
        const minuteStr = roundedMinute.toString().padStart(2, '0');
        
        setStartTime(`${hour}:${minuteStr}`);
        console.log('已设置当前时间:', `${hour}:${minuteStr}`);
    }
    
    // 计算结束时间
    function calculateEndTime(durationMinutes) {
        const startTime = getStartTime();
        if (!startTime || durationMinutes === 0) return false;
        
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(startHour, startMinute, 0, 0);
        
        // 计算结束时间
        const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
        
        const endTimeString = endDate.getHours().toString().padStart(2, '0') + ':' + 
                             endDate.getMinutes().toString().padStart(2, '0');
        
        setEndTime(endTimeString);
        
        // 返回是否跨天
        return endDate.getDate() !== startDate.getDate();
    }
    
    // 导出函数到全局
    window.simpleTimePicker = {
        getStartTime: getStartTime,
        getEndTime: getEndTime,
        setStartTime: setStartTime,
        setEndTime: setEndTime,
        setCurrentTime: setCurrentTime,
        calculateEndTime: calculateEndTime
    };
    
    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSimpleTimePicker);
    } else {
        setTimeout(initSimpleTimePicker, 50);
    }
    
    console.log('简化版时间选择器脚本加载完成');
})();
