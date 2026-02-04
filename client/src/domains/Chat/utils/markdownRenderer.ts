import { h, Fragment } from 'preact';
import type { VNode } from 'preact';
import type { MarkdownToken } from '../types/markdown.types';
import { parseMarkdown } from './markdownParser';

/**
 * URL이 안전한지 검증 (XSS 방지)
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // http, https만 허용
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    // 상대 경로는 허용하지 않음 (보안상)
    return false;
  }
}


/**
 * 마크다운 토큰을 Preact VNode로 렌더링
 */
export function renderMarkdownToken(token: MarkdownToken, key?: string | number): VNode {
  switch (token.type) {
    case 'text':
      return h('span', { key }, token.content || '') as VNode;

    case 'bold':
      return h(
        'strong',
        { key, className: 'markdown-bold' },
        token.children?.map((child, idx) => renderMarkdownToken(child, idx)) || []
      ) as VNode;

    case 'italic':
      return h(
        'em',
        { key, className: 'markdown-italic' },
        token.children?.map((child, idx) => renderMarkdownToken(child, idx)) || []
      ) as VNode;

    case 'strikethrough':
      return h(
        'del',
        { key, className: 'markdown-strikethrough' },
        token.children?.map((child, idx) => renderMarkdownToken(child, idx)) || []
      ) as VNode;

    case 'inlineCode':
      // 코드에서는 HTML 엔티티를 표시해야 하므로 수동 이스케이프
      const codeContent = (token.content || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return h(
        'code',
        { key, className: 'markdown-inline-code', dangerouslySetInnerHTML: { __html: codeContent } }
      ) as VNode;

    case 'codeBlock':
      // 코드 블럭에서는 HTML 엔티티를 표시해야 하므로 수동 이스케이프
      // 띄어쓰기는 그대로 유지하고, HTML 특수 문자만 이스케이프
      const blockContent = (token.content || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      return h(
        'pre',
        { key, className: 'markdown-code-block' },
        h(
          'code',
          {
            className: token.language ? `language-${token.language}` : undefined,
            dangerouslySetInnerHTML: { __html: blockContent }
          }
        ) as VNode
      ) as VNode;

    case 'link':
      const url = token.url || '';
      const linkText = token.text || url;
      const isSafe = isValidUrl(url);

      return h(
        'a',
        {
          key,
          className: 'markdown-link',
          href: isSafe ? url : undefined,
          target: isSafe ? '_blank' : undefined,
          rel: isSafe ? 'noopener noreferrer' : undefined,
          onClick: (e: Event) => {
            if (!isSafe) {
              e.preventDefault();
            }
          },
        },
        linkText
      ) as VNode;

    case 'lineBreak':
      return h('br', { key }) as VNode;

    default:
      return h('span', { key }, '') as VNode;
  }
}

/**
 * 마크다운 텍스트를 Preact VNode 배열로 렌더링
 */
export function renderMarkdown(text: string): VNode[] {
  if (!text) return [];

  try {
    // 방어 코드: 중첩 깊이 제한 (5단계), 텍스트 길이 제한
    if (text.length > 100000) {
      return [h('span', { key: 0 }, text.substring(0, 100000)) as VNode];
    }

    const tokens = parseMarkdown(text, { maxNestingDepth: 5 });
    
    // 토큰 개수 제한 (1000개)
    if (tokens.length > 1000) {
      return [h('span', { key: 0 }, text) as VNode];
    }

    return tokens.map((token, idx) => renderMarkdownToken(token, idx));
  } catch (error) {
    // 파싱 에러 발생 시 일반 텍스트로 렌더링
    return [h('span', { key: 0 }, text) as VNode];
  }
}

/**
 * 마크다운 텍스트를 단일 Fragment로 렌더링
 */
export function renderMarkdownFragment(text: string): VNode {
  const nodes = renderMarkdown(text);
  return h(Fragment, {}, ...nodes);
}
