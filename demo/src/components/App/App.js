import React, { useCallback, useMemo, useState } from 'react';
import QrCode from 'sexy-qr';
import styles from './App.module.scss';
import GitHubLink from './GitHubLink/GitHubLink';

const App = () => {
  const [link, setLink] = useState('https://github.com/avin/sexy-qr');

  const handleChangeLink = useCallback((e) => {
    setLink(e.target.value);
  }, []);

  const qrCodeSrc = useMemo(() => {
    if (!link) {
      return null;
    }
    return `data:image/svg+xml;base64,${btoa(
      new QrCode({
        content: link,
        ecl: 'M',
        join: true,
        color: '#182026',
        width: 380,
        height: 380,
      }).svg(),
    )}`;
  }, [link]);

  return (
    <div className={styles.container}>
      <input
        type="text"
        onChange={handleChangeLink}
        value={link}
        className={styles.input}
        placeholder="Encoding string..."
      />
      <div className={styles.imageContainer}>
        {qrCodeSrc ? (
          <img src={qrCodeSrc} alt="QR" className={styles.qr} />
        ) : (
          <div className={styles.notice}>Type string to encode</div>
        )}
      </div>
      <GitHubLink />
    </div>
  );
};

export default App;
