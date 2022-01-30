import React, { useCallback, useMemo, useState } from 'react';
import { QRCode, QRSvg } from 'sexy-qr';
import styles from './App.module.scss';
import GitHubLink from './GitHubLink/GitHubLink';
import svgLogo from './svglogo';

const App = () => {
  const [content, setContent] = useState('https://github.com/avin/sexy-qr');
  const [size, setSize] = useState('380');
  const [fill, setFill] = useState('#182026');
  const [circles, setCircles] = useState('false');
  const [roundOuterCorners, setRoundOuterCorners] = useState('true');
  const [roundInnerCorners, setRoundInnerCorners] = useState('true');
  const [additionalContent, setAdditionalContent] = useState('false');
  const [ecl, setEcl] = useState('M');
  const [radiusFactor, setRadiusFactor] = useState('0.7');
  const [cornerBlockRadiusFactor, setCornerBlockRadiusFactor] = useState('2.0');

  const handleChangeAdditionalContent = useCallback((e) => {
    setAdditionalContent(e.target.value);
  }, []);

  const handleChangeFill = useCallback((e) => {
    setFill(e.target.value);
  }, []);

  const handleChangeCircles = useCallback((e) => {
    setCircles(e.target.value);
  }, []);

  const handleChangeRoundOuterCorners = useCallback((e) => {
    setRoundOuterCorners(e.target.value);
  }, []);

  const handleChangeRoundInnerCorners = useCallback((e) => {
    setRoundInnerCorners(e.target.value);
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

    const qrCode = new QRCode({
      content,
      ecl,
    });

    const emptyCenterSize = 2 * Math.round(qrCode.size / 4 / 2) - 1;
    const additionalContentFunc = (qrSvg) => {
      const start = (qrSvg.matrixSize / 2 - emptyCenterSize / 2) * qrSvg.pointSize + qrSvg.pointSize / 2;
      const size = emptyCenterSize * qrSvg.pointSize - qrSvg.pointSize;
      const logoSrc = `data:image/svg+xml;base64,${btoa(svgLogo)}`;
      return `<image x="${start}" y="${start}" width="${size}" height="${size}" href="${logoSrc}" />`;
    };

    if (additionalContent === 'true') {
      qrCode.emptyCenter(emptyCenterSize);
    }

    const qrSvg = new QRSvg(qrCode, {
      fill: fill,
      cornerBlocksAsCircles: circles === 'true',
      roundOuterCorners: roundOuterCorners === 'true',
      roundInnerCorners: roundInnerCorners === 'true',
      size: Number(size) || 1,
      radiusFactor,
      cornerBlockRadiusFactor,
      preContent: `<!-- QR Content: ${content} -->`,
      postContent: additionalContent === 'true' ? additionalContentFunc : undefined,
    });
    return qrSvg.svg;
  }, [
    content,
    ecl,
    radiusFactor,
    cornerBlockRadiusFactor,
    size,
    circles,
    fill,
    roundOuterCorners,
    roundInnerCorners,
    additionalContent,
  ]);

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
              <label htmlFor="circles">RoundOuterCorners:</label>
              <select
                name="roundOuterCorners"
                id="roundOuterCorners"
                className={styles.select}
                onChange={handleChangeRoundOuterCorners}
                value={roundOuterCorners}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label htmlFor="circles">RoundInnerCorners:</label>
              <select
                name="roundInnerCorners"
                id="roundInnerCorners"
                className={styles.select}
                onChange={handleChangeRoundInnerCorners}
                value={roundInnerCorners}
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

            <div>
              <label htmlFor="circles">AdditionalContent:</label>
              <select
                name="additionalContent"
                id="additionalContent"
                className={styles.select}
                onChange={handleChangeAdditionalContent}
                value={additionalContent}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.imageContainer}>
            {svgCode ? (
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
