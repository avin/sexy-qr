import { useEffect, useState, type ReactNode } from 'react';
import { Braces, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { copyToClipboard } from '@/lib/copyToClipboard';
import type { CodePresetKey, ErrorCorrectionLevel, PlaygroundConfig } from '../playgroundConfig';
import { codePresetOptions } from '../playgroundConfig';
import { ConfigField } from './ConfigField/ConfigField';
import styles from './CodeEditor.module.scss';

type CodeEditorProps = {
  code: string;
  config: PlaygroundConfig;
  presetKey: CodePresetKey;
  onChange: <Key extends keyof PlaygroundConfig>(key: Key, value: PlaygroundConfig[Key]) => void;
  onPresetChange: (presetKey: CodePresetKey) => void;
};

type CodeLineProps = {
  number: number;
  indent?: number;
  children?: ReactNode;
};

const correctionLevels = [
  { value: 'L', label: 'L · 7%' },
  { value: 'M', label: 'M · 15%' },
  { value: 'Q', label: 'Q · 25%' },
  { value: 'H', label: 'H · 30%' },
];

function CodeLine({ number, indent = 0, children }: CodeLineProps) {
  return (
    <div className={styles.line}>
      <span className={styles.lineNumber}>{String(number).padStart(2, '0')}</span>
      <div className={styles.lineContent} style={{ paddingLeft: `${indent * 1.35}rem` }}>
        {children}
      </div>
    </div>
  );
}

function Keyword({ children }: { children: ReactNode }) {
  return <span className={styles.keyword}>{children}</span>;
}

function Property({ children }: { children: ReactNode }) {
  return <span className={styles.property}>{children}</span>;
}

export function CodeEditor({ code, config, presetKey, onChange, onPresetChange }: CodeEditorProps) {
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
        <CodeLine number={1}>
          <Keyword>import</Keyword>&nbsp;{'{ '}
          <span className={styles.typeName}>QRCode</span>, <span className={styles.typeName}>QRSvg</span>
          {' }'}&nbsp;<Keyword>from</Keyword>&nbsp;
          <span className={styles.string}>&apos;sexy-qr&apos;</span>;
        </CodeLine>
        <CodeLine number={2} />
        <CodeLine number={3}>
          <Keyword>const</Keyword>&nbsp;qrCode = <Keyword>new</Keyword>&nbsp;
          <span className={styles.typeName}>QRCode</span>({'{'}
        </CodeLine>
        <CodeLine number={4} indent={1}>
          <Property>content</Property>:&nbsp;
          <Field className={styles.inlineField}>
            <FieldLabel className={styles.srOnly} htmlFor="qr-content">
              QR code content
            </FieldLabel>
            <span className={styles.string}>&quot;</span>
            <Input
              id="qr-content"
              className={styles.textInput}
              value={config.content}
              onChange={(event) => onChange('content', event.target.value)}
              spellCheck={false}
            />
            <span className={styles.string}>&quot;</span>
          </Field>
          ,
        </CodeLine>
        <CodeLine number={5} indent={1}>
          <Property>ecl</Property>:&nbsp;
          <Field className={styles.inlineField}>
            <FieldLabel className={styles.srOnly} htmlFor="qr-ecl">
              Error correction level
            </FieldLabel>
            <Select
              items={correctionLevels}
              value={config.ecl}
              onValueChange={(value) => value && onChange('ecl', value as ErrorCorrectionLevel)}
            >
              <SelectTrigger id="qr-ecl" className={styles.select}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {correctionLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          ,
        </CodeLine>
        <CodeLine number={6}>{'}'});</CodeLine>
        <CodeLine number={7} />
        <CodeLine number={8}>
          <Keyword>const</Keyword>&nbsp;qrSvg = <Keyword>new</Keyword>&nbsp;
          <span className={styles.typeName}>QRSvg</span>(qrCode, {'{'}
        </CodeLine>
        <CodeLine number={9} indent={1}>
          <Property>size</Property>:
          <ConfigField
            id="qr-size"
            label="SVG size"
            value={config.size}
            min={180}
            max={900}
            step={10}
            onChange={(value) => onChange('size', value)}
          />
          ,
        </CodeLine>
        <CodeLine number={10} indent={1}>
          <Property>fill</Property>:&nbsp;
          <Field className={styles.inlineField}>
            <FieldLabel className={styles.srOnly} htmlFor="qr-fill">
              QR fill color
            </FieldLabel>
            <label className={styles.colorControl}>
              <Input
                className={styles.colorPicker}
                type="color"
                value={config.fill}
                onChange={(event) => onChange('fill', event.target.value)}
                aria-label="Choose QR fill color"
              />
              <span style={{ backgroundColor: config.fill }} aria-hidden="true" />
              <Input
                id="qr-fill"
                className={styles.colorText}
                value={config.fill}
                onChange={(event) => onChange('fill', event.target.value)}
                maxLength={7}
                spellCheck={false}
              />
            </label>
          </Field>
          ,
        </CodeLine>
        {presetKey === 'resolver' ? (
          <>
            <CodeLine number={11} indent={1}>
              <Property>outerCornerRadius</Property>: 0,
            </CodeLine>
            <CodeLine number={12} indent={1}>
              <Property>innerCornerRadius</Property>: 0,
            </CodeLine>
            <CodeLine number={13} indent={1}>
              <Property>resolveCornerRadius</Property>: (corner) =&gt; {'{'}
            </CodeLine>
            <CodeLine number={14} indent={2}>
              <Keyword>if</Keyword> (
            </CodeLine>
            <CodeLine number={15} indent={3}>
              corner.<Property>region</Property> === <span className={styles.string}>&apos;cornerBlock&apos;</span>{' '}
              &amp;&amp;
            </CodeLine>
            <CodeLine number={16} indent={3}>
              corner.<Property>block</Property> === <span className={styles.string}>&apos;topRight&apos;</span>{' '}
              &amp;&amp;
            </CodeLine>
            <CodeLine number={17} indent={3}>
              corner.<Property>part</Property> === <span className={styles.string}>&apos;ring&apos;</span> &amp;&amp;
            </CodeLine>
            <CodeLine number={18} indent={3}>
              corner.<Property>corner</Property> === <span className={styles.string}>&apos;bottomLeft&apos;</span>
            </CodeLine>
            <CodeLine number={19} indent={2}>
              ) {'{'}
            </CodeLine>
            <CodeLine number={20} indent={3}>
              <Keyword>return</Keyword> corner.
              <Property>contour</Property> === <span className={styles.string}>&apos;outer&apos;</span> ? 2 : 0.8;
            </CodeLine>
            <CodeLine number={21} indent={2}>
              {'}'}
            </CodeLine>
            <CodeLine number={22} />
            <CodeLine number={23} indent={2}>
              <Keyword>return</Keyword> corner.
              <Property>defaultRadius</Property>;
            </CodeLine>
            <CodeLine number={24} indent={1}>
              {'}'},
            </CodeLine>
            <CodeLine number={25}>{'}'});</CodeLine>
            <CodeLine number={26} />
            <CodeLine number={27}>
              <Keyword>const</Keyword>&nbsp;svgCode = qrSvg.
              <Property>svg</Property>;
            </CodeLine>
          </>
        ) : (
          <>
            <CodeLine number={11} indent={1}>
              <Property>outerCornerRadius</Property>:
              <ConfigField
                id="outer-radius"
                label="Outer data corner radius"
                value={config.outerCornerRadius}
                min={0}
                max={1}
                step={0.05}
                onChange={(value) => onChange('outerCornerRadius', value)}
              />
              ,
            </CodeLine>
            <CodeLine number={12} indent={1}>
              <Property>innerCornerRadius</Property>:
              <ConfigField
                id="inner-radius"
                label="Inner data corner radius"
                value={config.innerCornerRadius}
                min={0}
                max={1}
                step={0.05}
                onChange={(value) => onChange('innerCornerRadius', value)}
              />
              ,
            </CodeLine>
            <CodeLine number={13} indent={1}>
              <Property>cornerBlockOuter</Property>: {'{'}
            </CodeLine>
            <CodeLine number={14} indent={2}>
              <Property>outerCornerRadius</Property>:
              <ConfigField
                id="finder-outer-radius"
                label="Finder outer radius"
                value={config.finderOuterRadius}
                min={0}
                max={7}
                step={0.1}
                onChange={(value) => onChange('finderOuterRadius', value)}
              />
              ,
            </CodeLine>
            <CodeLine number={15} indent={2}>
              <Property>innerCornerRadius</Property>:
              <ConfigField
                id="finder-inner-radius"
                label="Finder inner radius"
                value={config.finderInnerRadius}
                min={0}
                max={5}
                step={0.1}
                onChange={(value) => onChange('finderInnerRadius', value)}
              />
              ,
            </CodeLine>
            <CodeLine number={16} indent={1}>
              {'}'},
            </CodeLine>
            <CodeLine number={17} indent={1}>
              <Property>cornerBlockInner</Property>: {'{'}
            </CodeLine>
            <CodeLine number={18} indent={2}>
              <Property>outerCornerRadius</Property>:
              <ConfigField
                id="finder-core-radius"
                label="Finder core radius"
                value={config.finderCoreRadius}
                min={0}
                max={3}
                step={0.1}
                onChange={(value) => onChange('finderCoreRadius', value)}
              />
              ,
            </CodeLine>
            <CodeLine number={19} indent={1}>
              {'}'},
            </CodeLine>
            <CodeLine number={20}>{'}'});</CodeLine>
            <CodeLine number={21} />
            <CodeLine number={22}>
              <Keyword>const</Keyword>&nbsp;svgCode = qrSvg.
              <Property>svg</Property>;
            </CodeLine>
          </>
        )}
      </FieldGroup>
    </section>
  );
}
