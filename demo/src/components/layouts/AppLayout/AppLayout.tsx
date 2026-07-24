import type { ReactNode } from 'react';
import { Github } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import styles from './AppLayout.module.scss';

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="Sexy-QR home">
          <span className={styles.mark} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>Sexy-QR</span>
        </a>

        <div className={styles.headerMeta}>
          <span>SVG QR generator</span>
        </div>

        <a
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), styles.github)}
          href="https://github.com/avin/sexy-qr"
          target="_blank"
          rel="noreferrer"
        >
          <Github data-icon="inline-start" />
          GitHub
        </a>
      </header>

      {children}

      <footer className={styles.footer}>
        <span>Open source under the MIT License.</span>
        <span>Made for the web, exported as SVG.</span>
      </footer>
    </div>
  );
}
