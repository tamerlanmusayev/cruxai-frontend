/** Strip markdown to readable plain text (for audio + downloads). */
export function mdToPlainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>#-]/g, ' ')
    .replace(/\n{2,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** Map a language code to a BCP-47 tag for speech synthesis. */
export function speechLang(code: string | null): string {
  switch ((code ?? 'en').toLowerCase().slice(0, 2)) {
    case 'ru':
      return 'ru-RU';
    case 'az':
      return 'az-AZ';
    case 'tr':
      return 'tr-TR';
    case 'kk':
      return 'kk-KZ';
    case 'uz':
      return 'uz-UZ';
    case 'ka':
      return 'ka-GE';
    default:
      return 'en-US';
  }
}
