// 用于设置rem单位的字体大小(动态)
function setRem() {
    const baseWidth = 375; // 设计稿宽度
    const minFontSize = 6; // 最小字体
    const maxFontSize = 16; // 最大字体（PC屏或大屏限制）
    const html = document.documentElement;
    const width = html.clientWidth;

    let fontSize = (width / baseWidth) * 12;

    if (fontSize < minFontSize) fontSize = minFontSize;
    if (fontSize > maxFontSize) fontSize = maxFontSize;

    html.style.fontSize = fontSize + 'px';
}
setRem();
window.addEventListener('resize', setRem);