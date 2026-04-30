// markdown.ts
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

const md:any = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  highlight(code: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      return `<pre class="hljs"><code>${hljs.highlight(code, { language: lang }).value}</code></pre>`;
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`;
  },
});

export function renderMarkdown(text: string): string {
  if (!text) return '';
  return md.render(text);
}
