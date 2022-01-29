import React, { useCallback, useMemo, useState } from 'react';
import QrCode from 'sexy-qr';
import styles from './App.module.scss';
import GitHubLink from './GitHubLink/GitHubLink';

const App = () => {
  const [content, setContent] = useState('https://github.com/avin/sexy-qr');
  const [size, setSize] = useState('380');
  const [color, setColor] = useState('#182026');
  const [circles, setCircles] = useState('true');
  const [ecl, setEcl] = useState('M');
  const [radiusFactor, setRadiusFactor] = useState(0.75);

  const handleChangeColor = useCallback((e) => {
    setColor(e.target.value);
  }, []);
  const handleChangeCircles = useCallback((e) => {
    setCircles(e.target.value);
  }, []);
  const handleChangeContent = useCallback((e) => {
    setContent(e.target.value);
  }, []);

  const handleChangeSize = useCallback((e) => {
    setSize(e.target.value);
  }, []);

  const handleChangeEcl = useCallback((e) => {
    setEcl(e.target.value);
  }, []);
  const handleChangeRadiusFactor = useCallback((e) => {
    setRadiusFactor(e.target.value);
  }, []);

  const svgCode = useMemo(() => {
    if (!content) {
      return null;
    }
    return new QrCode({
      content,
      ecl,
      join: true,
      color,
      circleCorners: circles === 'true',
      size: Number(size) || 1,
      radiusFactor,
    }).svg();
  }, [content, ecl, radiusFactor, size, circles, color]);

  const qrCodeSrc = useMemo(() => {
    if (!svgCode) {
      return null;
    }
    return `data:image/svg+xml;base64,${btoa(svgCode)}`;
  }, [svgCode]);

  const handleDownload = useCallback(() => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(svgCode));
    element.setAttribute('download', 'qrcode.svg');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }, [svgCode]);

  return (
    <div>
      <div className={styles.title}>
        <a href="https://github.com/avin/sexy-qr">Sexy-QR</a>
      </div>

      <div className={styles.container}>
        <div className={styles.controls}>
          <div style={{ width: '100%' }}>
            <label htmlFor="content">Content:</label>
            <input
              id="content"
              type="text"
              onChange={handleChangeContent}
              value={content}
              className={styles.input}
              placeholder="Encoding string..."
            />
          </div>
        </div>

        <div className={styles.controls}>
          <div>
            <label htmlFor="circles">Circles:</label>
            <select
              name="circles"
              id="circles"
              className={styles.select}
              onChange={handleChangeCircles}
              value={circles}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div>
            <label htmlFor="ecl">ECL:</label>
            <select name="ecl" id="ecl" className={styles.select} onChange={handleChangeEcl} value={ecl}>
              {['L', 'M', 'Q', 'H'].map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="radiusFactor">RadiusFactor:</label>
            <select
              name="radiusFactor"
              id="radiusFactor"
              className={styles.select}
              onChange={handleChangeRadiusFactor}
              value={radiusFactor}
            >
              {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((v) => (
                <option value={v} key={v}>
                  {v.toFixed(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="size">Size:</label>
            <input
              id="size"
              type="tel"
              onChange={handleChangeSize}
              value={size}
              className={styles.input}
              placeholder="Size"
            />
          </div>
          <div>
            <label htmlFor="color">Color:</label>
            <input
              id="color"
              type="color"
              onChange={handleChangeColor}
              value={color}
              className={styles.input}
              placeholder="#000"
            />
          </div>
        </div>

        <div className={styles.imageContainer}>
          {qrCodeSrc ? (
            // <img src={qrCodeSrc} alt="QR" className={styles.qr} />
            <div>
              <div dangerouslySetInnerHTML={{ __html: svgCode }} />

              <div className={styles.downloadContainer}>
                <button onClick={handleDownload} className={styles.downloadButton}>
                  Download SVG
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.notice}>Type string to encode</div>
          )}
        </div>

        <GitHubLink />
      </div>
    </div>
  );
};

export default App;
