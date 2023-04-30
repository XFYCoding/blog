import { inBrowser } from 'vitepress';
import { ElMessage } from "element-plus";
export function useCopyCode() {
    if (inBrowser) {
        const timeoutIdMap = new Map();
        window.addEventListener('click', (e) => {
            const el = e.target;
            if (el.matches('div[class*="language-"] > button.copy')) {
                const parent = el.parentElement;
                const sibling = el.nextElementSibling
                    ?.nextElementSibling;
                if (!parent || !sibling) {
                    return;
                }
                const isShell = /language-(shellscript|shell|bash|sh|zsh)/.test(parent.className);
                let text = '';
                sibling
                    .querySelectorAll('span.line:not(.diff.remove)')
                    .forEach((node) => (text += (node.textContent || '') + '\n'));
                text = text.slice(0, -1);
                if (isShell) {
                    text = text.replace(/^ *(\$|>) /gm, '').trim();
                }
                text = text + '\n' + '\n' + '\n' + "============================" + '\n';
                text = text + "作者：xfycoding" + '\n' + "小肥瑜博客：https://xfycoding.github.io/blog/" + '\n' + "文章来源：" + sibling.baseURI + '\n';
                console.log(text);
                copyToClipboard(text).then(() => {
                    el.classList.add('copied');
                    clearTimeout(timeoutIdMap.get(el));
                    const timeoutId = setTimeout(() => {
                        el.classList.remove('copied');
                        el.blur();
                        timeoutIdMap.delete(el);
                    }, 2000);
                    timeoutIdMap.set(el, timeoutId);
                });
                ElMessage({
                    message: "复制成功",
                    type: "success",
                });
            }
        });
    }
}
async function copyToClipboard(text) {
    try {
        return navigator.clipboard.writeText(text);
    }
    catch {
        const element = document.createElement('textarea');
        const previouslyFocusedElement = document.activeElement;
        element.value = text;
        // Prevent keyboard from showing on mobile
        element.setAttribute('readonly', '');
        element.style.contain = 'strict';
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        element.style.fontSize = '12pt'; // Prevent zooming on iOS
        const selection = document.getSelection();
        const originalRange = selection
            ? selection.rangeCount > 0 && selection.getRangeAt(0)
            : null;
        document.body.appendChild(element);
        element.select();
        // Explicit selection workaround for iOS
        element.selectionStart = 0;
        element.selectionEnd = text.length;
        document.execCommand('copy');
        document.body.removeChild(element);
        if (originalRange) {
            selection.removeAllRanges(); // originalRange can't be truthy when selection is falsy
            selection.addRange(originalRange);
        }
        // Get the focus back on the previously focused element, if any
        if (previouslyFocusedElement) {
            ;
            previouslyFocusedElement.focus();
        }
    }
}

