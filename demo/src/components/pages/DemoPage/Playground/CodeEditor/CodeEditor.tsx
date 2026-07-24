import { useEffect, useState } from 'react';
import { Braces, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { copyToClipboard } from '@/lib/copyToClipboard';
import type { CodePresetKey, PlaygroundConfig } from '../playgroundConfig';
import { codePresetOptions } from '../playgroundConfig';
import { CodePanel } from '../CodePanel';
import styles from './CodeEditor.module.scss';

type CodeEditorProps = {
  /** Template with `{{id}}` placeholders — drives the on-screen rendering. */
  template: string;
  /** Serialized code (placeholders replaced) — what the copy button writes. */
  code: string;
  config: PlaygroundConfig;
  presetKey: CodePresetKey;
  onChange: <Key extends keyof PlaygroundConfig>(key: Key, value: PlaygroundConfig[Key]) => void;
  onPresetChange: (presetKey: CodePresetKey) => void;
};

export function CodeEditor({ template, code, config, presetKey, onChange, onPresetChange }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
  };

  return (
    <section className={styles.editor} aria-label="Interactive API configuration">
      <header className={styles.header}>
        <div>
          <span className={styles.icon}>
            <Braces />
          </span>
          <div>
            <strong>playground.ts</strong>
          </div>
        </div>
        <div className={styles.headerActions}>
          <Select
            items={codePresetOptions}
            value={presetKey}
            onValueChange={(value) => value && onPresetChange(value as CodePresetKey)}
          >
            <SelectTrigger size="sm" className={styles.presetSelect} aria-label="Choose code preset">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" alignItemWithTrigger={false}>
              <SelectGroup>
                {codePresetOptions.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            size="icon-sm"
            variant="outline"
            onClick={handleCopy}
            aria-label={copied ? 'Code copied' : 'Copy code'}
            title={copied ? 'Code copied' : 'Copy code'}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
      </header>

      <FieldGroup className={styles.code} aria-label="QR code options">
        <CodePanel template={template} config={config} onChange={onChange} />
      </FieldGroup>
    </section>
  );
}
