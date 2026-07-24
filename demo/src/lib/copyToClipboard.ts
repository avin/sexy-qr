export function copyToClipboard(value: string) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(value);
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.append(textArea);
  textArea.select();
  document.execCommand('copy');
  textArea.remove();
  return Promise.resolve();
}
