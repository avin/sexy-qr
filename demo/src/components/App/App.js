import React, { useCallback, useMemo, useState } from 'react';
import QrCode from 'sexy-qr';
import styles from './App.module.scss';
import GitHubLink from './GitHubLink/GitHubLink';

const App = () => {
  const [content, setContent] = useState('https://github.com/avin/sexy-qr');
  const [size, setSize] = useState('380');
  const [fill, setFill] = useState('#182026');
  const [circles, setCircles] = useState('false');
  const [roundExternalCorners, setRoundExternalCorners] = useState('true');
  const [roundInternalCorners, setRoundInternalCorners] = useState('true');
  const [ecl, setEcl] = useState('M');
  const [radiusFactor, setRadiusFactor] = useState('0.7');
  const [cornerBlockRadiusFactor, setCornerBlockRadiusFactor] = useState('2.0');

  const handleChangeFill = useCallback((e) => {
    setFill(e.target.value);
  }, []);
  const handleChangeCircles = useCallback((e) => {
    setCircles(e.target.value);
  }, []);
  const handleChangeRoundExternalCorners = useCallback((e) => {
    setRoundExternalCorners(e.target.value);
  }, []);
  const handleChangeRoundInternalCorners = useCallback((e) => {
    setRoundInternalCorners(e.target.value);
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
  const handleChangeCornerBlockRadiusFactor = useCallback((e) => {
    setCornerBlockRadiusFactor(e.target.value);
  }, []);

  const svgCode = useMemo(() => {
    if (!content) {
      return null;
    }
    return new QrCode({
      content,
      ecl,
      fill: fill,
      cornerBlocksAsCircles: circles === 'true',
      roundExternalCorners: roundExternalCorners === 'true',
      roundInternalCorners: roundInternalCorners === 'true',
      size: Number(size) || 1,
      radiusFactor,
      cornerBlockRadiusFactor,
    }).svg();
  }, [
    content,
    ecl,
    radiusFactor,
    cornerBlockRadiusFactor,
    size,
    circles,
    fill,
    roundExternalCorners,
    roundInternalCorners,
  ]);

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
      <div className={styles.top}>
        <div className={styles.downloadContainer}>
          <div className={styles.title}>
            <a href="https://github.com/avin/sexy-qr">Sexy-QR</a>
          </div>
        </div>
        <div>
          <div style={{ width: '100%', paddingLeft: 30, paddingRight: 30 }}>
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
      </div>

      <div className={styles.main}>
        <div>
          <div className={styles.controls}>
            <div>
              <label htmlFor="circles">CornerBlocksAsCircles:</label>
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
              <label htmlFor="circles">RoundExternalCorners:</label>
              <select
                name="roundExternalCorners"
                id="roundExternalCorners"
                className={styles.select}
                onChange={handleChangeRoundExternalCorners}
                value={roundExternalCorners}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label htmlFor="circles">RoundInternalCorners:</label>
              <select
                name="roundInternalCorners"
                id="roundInternalCorners"
                className={styles.select}
                onChange={handleChangeRoundInternalCorners}
                value={roundInternalCorners}
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
              <input
                className={styles.range}
                type="range"
                id="radiusFactor"
                name="radiusFactor"
                min="0"
                max="1"
                step="0.1"
                value={radiusFactor}
                onChange={handleChangeRadiusFactor}
              />
            </div>
            <div>
              <label htmlFor="cornerBlockRadiusFactor">CornerBlockRadiusFactor:</label>
              <input
                className={styles.range}
                type="range"
                id="cornerBlockRadiusFactor"
                name="cornerBlockRadiusFactor"
                min="0"
                max="3"
                step="0.1"
                value={cornerBlockRadiusFactor}
                onChange={handleChangeCornerBlockRadiusFactor}
              />
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
              <label htmlFor="fill">Fill:</label>
              <input
                id="fill"
                type="color"
                onChange={handleChangeFill}
                value={fill}
                className={styles.input}
                placeholder="#000"
              />
            </div>
          </div>
        </div>
        <div>
          <div className={styles.imageContainer}>
            {qrCodeSrc ? (
              // <img src={qrCodeSrc} alt="QR" className={styles.qr} />
              <div>
                <div dangerouslySetInnerHTML={{ __html: svgCode }} />
              </div>
            ) : (
              <div className={styles.notice}>Type string to encode</div>
            )}

            <button onClick={handleDownload} className={styles.downloadButton}>
              Download SVG
            </button>
          </div>
        </div>
      </div>

      <GitHubLink />
    </div>
  );
};

export default App;
