import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  RefreshCcw,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { copyToClipboard } from '@/lib/copyToClipboard';
import type { PlaygroundConfig } from '../playgroundConfig';
import styles from './QrPreview.module.scss';

type QrPreviewProps = {
  config: PlaygroundConfig;
  svg: string;
  error: string | null;
  onReset: () => void;
};

export function QrPreview({
  config,
  svg,
  error,
  onReset,
}: QrPreviewProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const handleCopy = async () => {
    await copyToClipboard(svg);
    setCopied(true);
  };

  const handleDownload = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sexy-qr.svg';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={styles.preview}>
      <CardHeader className={styles.header}>
        <div>
          <CardTitle>Live output</CardTitle>
          <CardDescription>Your SVG refreshes with every change.</CardDescription>
        </div>
        <CardAction>
          <Badge variant={error ? 'destructive' : 'secondary'}>
            {error ? (
              'Needs attention'
            ) : (
              <>
                <Sparkles data-icon="inline-start" />
                Ready to scan
              </>
            )}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className={styles.content}>
        <div className={styles.stage}>
          <div className={styles.orbit} aria-hidden="true">
            <span />
            <span />
          </div>
          <div className={styles.scanLabel} aria-hidden="true">
            <ScanLine />
            Live render
          </div>
          <div className={styles.qrPaper}>
            {svg ? (
              <div
                className={styles.svg}
                aria-label="Generated QR code preview"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <p className={styles.error}>{error}</p>
            )}
          </div>
        </div>

        <div className={styles.stats}>
          <div>
            <span>Format</span>
            <strong>SVG</strong>
          </div>
          <Separator orientation="vertical" />
          <div>
            <span>Canvas</span>
            <strong>{config.size} px</strong>
          </div>
          <Separator orientation="vertical" />
          <div>
            <span>Error correction</span>
            <strong>{config.ecl}</strong>
          </div>
        </div>
      </CardContent>

      <CardFooter className={styles.footer}>
        <div className={styles.actions}>
          <Button size="lg" onClick={handleDownload} disabled={!svg}>
            <Download data-icon="inline-start" />
            Download SVG
          </Button>
          <Button size="lg" variant="outline" onClick={handleCopy} disabled={!svg}>
            {copied ? (
              <Check data-icon="inline-start" />
            ) : (
              <Copy data-icon="inline-start" />
            )}
            {copied ? 'SVG copied' : 'Copy SVG'}
          </Button>
          <Button size="icon-lg" variant="ghost" onClick={onReset} aria-label="Reset all values">
            <RefreshCcw />
          </Button>
        </div>
        <p>Copy puts the generated SVG markup on your clipboard.</p>
      </CardFooter>
    </Card>
  );
}
