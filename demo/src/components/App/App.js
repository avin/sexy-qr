import React, { useCallback, useMemo, useState } from 'react';
import QrCode from 'sexy-qr';
import styles from './App.module.scss';
import GitHubLink from './GitHubLink/GitHubLink';

const App = () => {
  const [link, setLink] = useState('https://github.com/avin/sexy-qr');
  const [size, setSize] = useState('380');
  const [color, setColor] = useState('#182026');
  const [circles, setCircles] = useState('true');
  const [ecl, setEcl] = useState('M');
  const [dotRadius, setDotRadius] = useState(35);

  const handleChangeColor = useCallback((e) => {
    setColor(e.target.value);
  }, []);
  const handleChangeCircles = useCallback((e) => {
    setCircles(e.target.value);
  }, []);
  const handleChangeLink = useCallback((e) => {
    setLink(e.target.value);
  }, []);

  const handleChangeSize = useCallback((e) => {
    setSize(e.target.value);
  }, []);

  const handleChangeEcl = useCallback((e) => {
    setEcl(e.target.value);
  }, []);
  const handleChangeDotRadius = useCallback((e) => {
    setDotRadius(e.target.value);
  }, []);

  const svgCode = useMemo(() => {
    if (!link) {
      return null;
    }
    return new QrCode({
      content: link,
      ecl: ecl,
      join: true,
      color: color,
      circleCorners: circles === 'true',
      size: Number(size) || 1,
      dotRadius: dotRadius,
    }).svg();
  }, [link, ecl, dotRadius, size, circles, color]);

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
            <label htmlFor="link">Link:</label>
            <input
              id="link"
              type="text"
              onChange={handleChangeLink}
              value={link}
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
            <label htmlFor="dotRadius">DotRadius:</label>
            <select
              name="dotRadius"
              id="dotRadius"
              className={styles.select}
              onChange={handleChangeDotRadius}
              value={dotRadius}
            >
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((v) => (
                <option value={v} key={v}>
                  {v}
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
