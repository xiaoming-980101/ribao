export const copyTextToClipboard = async (text: string) => {
  const value = text || '';
  if (!value.trim()) return false;

  let textarea: HTMLTextAreaElement | null = null;
  try {
    textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    if (document.execCommand('copy')) {
      return true;
    }
  } catch (err) {
    console.warn('备用复制方案失败:', err);
  } finally {
    if (textarea?.parentNode) {
      textarea.parentNode.removeChild(textarea);
    }
  }

  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (err) {
      console.warn('Clipboard API 复制失败:', err);
    }
  }

  return false;
};
