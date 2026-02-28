
/**
 * 格式化时间为相对时间或完整时间字符串
 * 
 * - 小于 1 分钟返回 "刚刚"
 * - 小于 1 小时返回 "x 分钟前"
 * - 小于 1 天返回 "x 小时前"
 * - 小于 7 天返回 "x 天前"
 * - 超过 7 天返回 "YYYY-MM-DD HH:mm" 格式
 * 
 * @param time - 可选的时间字符串，格式一般为 "YYYY-MM-DD HH:mm:ss" 或带 "-" 的标准时间
 * @returns 格式化后的时间字符串，如果输入无效或未传入时间，返回空字符串
 */
const formatTimeText = (time?: string) => {
    if (!time) return '';

    const safeTime = time.replace(/-/g, '/');

    const date = new Date(safeTime);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

    const pad = (val: number) => String(val).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
/**
 * 格式化时间戳为 "HH:mm" 格式的时间字符串
 *  
 * @param timestamp - 时间戳，可以是字符串、数字或 Date 对象
 * @returns "HH:mm" 格式的时间字符串
 */
const formatTime = (timestamp: string | number | Date) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

export { formatTimeText, formatTime };