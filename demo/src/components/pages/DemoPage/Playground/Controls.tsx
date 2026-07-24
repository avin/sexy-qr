import type { ReactNode } from 'react';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ErrorCorrectionLevel, PlaygroundConfig } from './playgroundConfig';
import { ConfigField } from './CodeEditor/ConfigField/ConfigField';
import styles from './CodeEditor/CodeEditor.module.scss';

type UpdateConfig = <Key extends keyof PlaygroundConfig>(key: Key, value: PlaygroundConfig[Key]) => void;

type ControlContext = {
  config: PlaygroundConfig;
  onChange: UpdateConfig;
};

const correctionLevels = [
  { value: 'L', label: 'L · 7%' },
  { value: 'M', label: 'M · 15%' },
  { value: 'Q', label: 'Q · 25%' },
  { value: 'H', label: 'H · 30%' },
];

/** Wraps a control with the quote characters that frame a string literal. */
function Quoted({ children }: { children: ReactNode }) {
  return (
    <Field className={styles.inlineField}>
      <span className="token string">&quot;</span>
      {children}
      <span className="token string">&quot;</span>
    </Field>
  );
}

function ContentControl({ config, onChange }: ControlContext) {
  return (
    <Quoted>
      <FieldLabel className={styles.srOnly} htmlFor="qr-content">
        QR code content
      </FieldLabel>
      <Input
        id="qr-content"
        className={styles.textInput}
        value={config.content}
        onChange={(event) => onChange('content', event.target.value)}
        spellCheck={false}
      />
    </Quoted>
  );
}

function EclControl({ config, onChange }: ControlContext) {
  return (
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
  );
}

function SizeControl({ config, onChange }: ControlContext) {
  return (
    <ConfigField
      id="qr-size"
      label="SVG size"
      value={config.size}
      min={180}
      max={900}
      step={10}
      onChange={(value) => onChange('size', value)}
    />
  );
}

function FillControl({ config, onChange }: ControlContext) {
  return (
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
  );
}

type NumberFieldSpec = {
  label: string;
  min: number;
  max: number;
  step: number;
};

const numberFields: Record<string, NumberFieldSpec & { key: keyof PlaygroundConfig }> = {
  outerCornerRadius: { key: 'outerCornerRadius', label: 'Outer data corner radius', min: 0, max: 1, step: 0.05 },
  innerCornerRadius: { key: 'innerCornerRadius', label: 'Inner data corner radius', min: 0, max: 1, step: 0.05 },
  finderOuterRadius: { key: 'finderOuterRadius', label: 'Finder outer radius', min: 0, max: 7, step: 0.1 },
  finderInnerRadius: { key: 'finderInnerRadius', label: 'Finder inner radius', min: 0, max: 5, step: 0.1 },
  finderCoreRadius: { key: 'finderCoreRadius', label: 'Finder core radius', min: 0, max: 3, step: 0.1 },
};

function NumberControl(id: string, { config, onChange }: ControlContext) {
  const spec = numberFields[id];
  if (!spec) return null;
  return (
    <ConfigField
      id={id}
      label={spec.label}
      value={config[spec.key] as number}
      min={spec.min}
      max={spec.max}
      step={spec.step}
      onChange={(value) => onChange(spec.key, value)}
    />
  );
}

/**
 * Registry mapping a placeholder id to its interactive renderer. Adding a new
 * field is a one-line edit here — no JSX code layout to touch elsewhere.
 */
const controlRenderers: Record<string, (ctx: ControlContext) => ReactNode> = {
  content: ContentControl,
  ecl: EclControl,
  size: SizeControl,
  fill: FillControl,
  outerCornerRadius: (ctx) => NumberControl('outerCornerRadius', ctx),
  innerCornerRadius: (ctx) => NumberControl('innerCornerRadius', ctx),
  finderOuterRadius: (ctx) => NumberControl('finderOuterRadius', ctx),
  finderInnerRadius: (ctx) => NumberControl('finderInnerRadius', ctx),
  finderCoreRadius: (ctx) => NumberControl('finderCoreRadius', ctx),
};

export function renderControl(id: string, ctx: ControlContext): ReactNode {
  const renderer = controlRenderers[id];
  return renderer ? renderer(ctx) : `{{${id}}}`;
}

/**
 * Serializers that turn a config value into the source-code snippet copied to
 * the clipboard. Kept side-by-side with the renderer so each control owns both
 * facets of its representation.
 */
export const controlSerializers: Record<string, (config: PlaygroundConfig) => string> = {
  content: (config) => JSON.stringify(config.content),
  ecl: (config) => `'${config.ecl}'`,
  size: (config) => String(config.size),
  fill: (config) => JSON.stringify(config.fill),
  outerCornerRadius: (config) => String(config.outerCornerRadius),
  innerCornerRadius: (config) => String(config.innerCornerRadius),
  finderOuterRadius: (config) => String(config.finderOuterRadius),
  finderInnerRadius: (config) => String(config.finderInnerRadius),
  finderCoreRadius: (config) => String(config.finderCoreRadius),
};
