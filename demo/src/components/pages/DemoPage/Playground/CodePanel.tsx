import { Fragment, type ReactNode, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
/* Global stylesheet — must NOT live inside a CSS module, or the selectors get
   hashed and no longer match the `token <type>` classes Prism emits. */
import 'prismjs/themes/prism-tomorrow.min.css';
import type { PlaygroundConfig } from './playgroundConfig';
import { PLACEHOLDER_PATTERN } from './codeTemplate';
import { renderControl } from './Controls';
import styles from './CodeEditor/CodeEditor.module.scss';

type CodePanelProps = {
  template: string;
  config: PlaygroundConfig;
  onChange: <Key extends keyof PlaygroundConfig>(key: Key, value: PlaygroundConfig[Key]) => void;
};

type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'control'; id: string };

type Line = {
  segments: Segment[];
};

/**
 * Splits a single source line into alternating text and control segments at
 * every `{{id}}` placeholder. Text segments are later syntax highlighted by
 * Prism; control segments are replaced with the interactive input.
 */
function parseSegments(line: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  // Reset the shared global RegExp to avoid state leaking between calls.
  const pattern = new RegExp(PLACEHOLDER_PATTERN);

  for (const match of line.matchAll(pattern)) {
    const matchStart = match.index ?? 0;
    if (matchStart > cursor) {
      segments.push({ kind: 'text', value: line.slice(cursor, matchStart) });
    }
    segments.push({ kind: 'control', id: match[1] });
    cursor = matchStart + match[0].length;
  }

  if (cursor < line.length) {
    segments.push({ kind: 'text', value: line.slice(cursor) });
  }
  return segments;
}

/** Recursively renders a Prism token stream (content can nest further tokens). */
function renderTokens(tokens: Prism.TokenStream, keyPrefix: string): ReactNode {
  if (typeof tokens === 'string') {
    return tokens;
  }
  if (Array.isArray(tokens)) {
    return tokens.map((token, index) => renderTokens(token, `${keyPrefix}.${index}`));
  }
  return (
    <span key={keyPrefix} className={`token ${tokens.type}`}>
      {renderTokens(tokens.content, keyPrefix)}
    </span>
  );
}

/** Renders a text segment as Prism-tokenized HTML for TypeScript. */
function highlight(text: string): ReactNode {
  const grammar = Prism.languages.typescript ?? Prism.languages.javascript;
  if (!grammar) return text;

  const tokens = Prism.tokenize(text, grammar);
  return <>{renderTokens(tokens, '')}</>;
}

export function CodePanel({ template, config, onChange }: CodePanelProps) {
  const lines = useMemo<Line[]>(() => {
    const sourceLines = template.split('\n');
    return sourceLines.map((rawLine) => ({ segments: parseSegments(rawLine) }));
  }, [template]);

  const ctx = useMemo(() => ({ config, onChange }), [config, onChange]);

  return (
    <>
      {lines.map((line, index) => {
        const segments = line.segments;
        const hasContent = segments.some(
          (segment) => segment.kind === 'control' || segment.value.length > 0,
        );
        return (
          <div key={index} className={styles.line}>
            <span className={styles.lineNumber}>{String(index + 1).padStart(2, '0')}</span>
            <div className={styles.lineContent}>
              {hasContent ? (
                segments.map((segment, segmentIndex) =>
                  segment.kind === 'control' ? (
                    <Fragment key={segmentIndex}>{renderControl(segment.id, ctx)}</Fragment>
                  ) : (
                    // Wrap text in a span so the whitespace it contains is
                    // preserved. A bare text node would be a flex item whose
                    // inter-item whitespace the browser collapses.
                    <span key={segmentIndex} className={styles.text}>
                      {highlight(segment.value)}
                    </span>
                  ),
                )
              ) : (
                '\u00A0'
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
