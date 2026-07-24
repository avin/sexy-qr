import { useMemo, useState } from 'react';
import { QRCode, QRSvg } from 'sexy-qr';
import { CodeEditor } from './CodeEditor/CodeEditor';
import { QrPreview } from './QrPreview/QrPreview';
import {
  createUsageCode,
  initialConfig,
  type PlaygroundConfig,
} from './playgroundConfig';
import styles from './Playground.module.scss';

export function Playground() {
  const [config, setConfig] = useState<PlaygroundConfig>(initialConfig);

  const updateConfig = <Key extends keyof PlaygroundConfig>(
    key: Key,
    value: PlaygroundConfig[Key],
  ) => {
    setConfig((current) => ({ ...current, [key]: value }));
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
      });

      return { svg: qrSvg.svg, error: null };
    } catch (error) {
      return {
        svg: '',
        error: error instanceof Error ? error.message : 'Unable to generate this QR code.',
      };
    }
  }, [config]);

  const usageCode = useMemo(() => createUsageCode(config), [config]);

  return (
    <section className={styles.section} id="playground">
      <div className={styles.workbench}>
        <CodeEditor code={usageCode} config={config} onChange={updateConfig} />
        <QrPreview
          config={config}
          svg={result.svg}
          error={result.error}
          onReset={() => setConfig(initialConfig)}
        />
      </div>
    </section>
  );
}
