import { Fragment, type ReactNode } from 'react';

/**
 * Tiny inline markdown renderer for chat replies. Handles **bold** and
 * *italic* only — the only formatting the chat system prompt allows.
 * Newlines are preserved by the parent's `whitespace-pre-wrap`.
 *
 * Why hand-rolled: pulling in react-markdown / marked / remark just for
 * two inline marks is ~50KB of bundle for nothing. This is ~30 lines
 * and covers the model's actual output.
 */
type Token =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let buffer = '';

  const flush = () => {
    if (buffer) {
      tokens.push({ type: 'text', content: buffer });
      buffer = '';
    }
  };

  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2);
      if (end > -1 && end > i + 2) {
        flush();
        tokens.push({ type: 'bold', content: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    if (text[i] === '*') {
      // Italic — single asterisk, but skip if it's just stray punctuation
      // (no closing match, or empty body).
      const end = text.indexOf('*', i + 1);
      if (end > -1 && end > i + 1 && !text.startsWith('**', end)) {
        flush();
        tokens.push({ type: 'italic', content: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    buffer += text[i];
    i++;
  }
  flush();
  return tokens;
}

export function renderInlineMd(text: string): ReactNode[] {
  return tokenize(text).map((t, k) => {
    if (t.type === 'bold') return <strong key={k}>{t.content}</strong>;
    if (t.type === 'italic') return <em key={k}>{t.content}</em>;
    return <Fragment key={k}>{t.content}</Fragment>;
  });
}
