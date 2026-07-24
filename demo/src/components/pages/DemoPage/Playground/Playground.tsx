import { useMemo, useState } from 'react';
import { QRCode, QRSvg } from 'sexy-qr';
import { CodeEditor } from './CodeEditor/CodeEditor';
import { QrPreview } from './QrPreview/QrPreview';
import {
  applyCodePreset,
  type CodePresetKey,
  initialConfig,
  initialPreset,
  resolveDemoCornerRadius,
  type PlaygroundConfig,
} from './playgroundConfig';
import { serializeTemplate, templateForPreset } from './codeTemplate';
import { controlSerializers } from './Controls';
import styles from './Playground.module.scss';

export function Playground() {
  const [config, setConfig] = useState<PlaygroundConfig>(initialConfig);
  const [presetKey, setPresetKey] = useState<CodePresetKey>(initialPreset);

  const updateConfig = <Key extends keyof PlaygroundConfig>(key: Key, value: PlaygroundConfig[Key]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const selectPreset = (nextPresetKey: CodePresetKey) => {
    setPresetKey(nextPresetKey);
    setConfig((current) => applyCodePreset(current, nextPresetKey));
  };

  const result = useMemo(() => {
    try {
      if (!/^#[0-9a-f]{6}$/i.test(config.fill)) {
        throw new Error('Use a six-digit HEX color, for example #171717.');
      }

      const qrCode = new QRCode({
        content: config.content,
        ecl: config.ecl,
      });
      const qrSvg = new QRSvg(qrCode, {
        size: config.size,
        fill: config.fill,
        outerCornerRadius: config.outerCornerRadius,
        innerCornerRadius: config.innerCornerRadius,
        cornerBlockOuter: {
          outerCornerRadius: config.finderOuterRadius,
          innerCornerRadius: config.finderInnerRadius,
        },
        cornerBlockInner: {
          outerCornerRadius: config.finderCoreRadius,
        },
        resolveCornerRadius: presetKey === 'resolver' ? resolveDemoCornerRadius : undefined,
      });

      return { svg: qrSvg.svg, error: null };
    } catch (error) {
      return {
        svg: '',
        error: error instanceof Error ? error.message : 'Unable to generate this QR code.',
      };
    }
  }, [config, presetKey]);

  const { template, code } = useMemo(() => {
    const sourceTemplate = templateForPreset(presetKey);
    return {
      template: sourceTemplate,
      code: serializeTemplate(sourceTemplate, config, controlSerializers),
    };
  }, [config, presetKey]);

  return (
    <section className={styles.section} id="playground">
      <div className={styles.workbench}>
        <CodeEditor
          template={template}
          code={code}
          config={config}
          presetKey={presetKey}
          onChange={updateConfig}
          onPresetChange={selectPreset}
        />
        <QrPreview config={config} svg={result.svg} error={result.error} />
      </div>
    </section>
  );
}
