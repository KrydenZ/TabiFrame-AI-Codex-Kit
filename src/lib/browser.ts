export function downloadJson(filename: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export async function copyText(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) throw new Error('当前浏览器不允许自动复制，请手动选择文本。');
  await navigator.clipboard.writeText(text);
}
