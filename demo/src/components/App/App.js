import React, { useCallback, useMemo, useState } from 'react';
import { QRCode, QRSvg, QRSvgPresets } from 'sexy-qr';
import styles from './App.module.scss';
import GitHubLink from './GitHubLink/GitHubLink';
import svgLogo from './svglogo';

const App = () => {
  const [content, setContent] = useState('https://github.com/avin/sexy-qr');
  const [size, setSize] = useState('380');
  const [fill, setFill] = useState('#182026');
  const [additionalContent, setAdditionalContent] = useState('false');
  const [ecl, setEcl] = useState('M');
  const [preset, setPreset] = useState('square');
  const [outerCornerRadius, setOuterCornerRadius] = useState('0');
  const [innerCornerRadius, setInnerCornerRadius] = useState('0');
  const [cornerBlockOuterOuterRadius, setCornerBlockOuterOuterRadius] = useState('0');
  const [cornerBlockOuterInnerRadius, setCornerBlockOuterInnerRadius] = useState('0');
  const [cornerBlockInnerOuterRadius, setCornerBlockInnerOuterRadius] = useState('0');

  const handleChangeAdditionalContent = useCallback((e) => {
    setAdditionalContent(e.target.value);
  }, []);

  const handleChangeFill = useCallback((e) => {
    setFill(e.target.value);
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

  const handleChangePreset = useCallback((e) => {
    const name = e.target.value;
    const selectedPreset = QRSvgPresets[name];
    setPreset(name);
    setOuterCornerRadius(String(selectedPreset.outerCornerRadius));
    setInnerCornerRadius(String(selectedPreset.innerCornerRadius));
    setCornerBlockOuterOuterRadius(String(selectedPreset.cornerBlockOuter.outerCornerRadius));
    setCornerBlockOuterInnerRadius(String(selectedPreset.cornerBlockOuter.innerCornerRadius));
    setCornerBlockInnerOuterRadius(String(selectedPreset.cornerBlockInner.outerCornerRadius));
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
      ...QRSvgPresets[preset],
      fill,
      size: Number(size) || 1,
      outerCornerRadius: Number(outerCornerRadius),
      innerCornerRadius: Number(innerCornerRadius),
      cornerBlockOuter: {
        outerCornerRadius: Number(cornerBlockOuterOuterRadius),
        innerCornerRadius: Number(cornerBlockOuterInnerRadius),
      },
      cornerBlockInner: {
        outerCornerRadius: Number(cornerBlockInnerOuterRadius),
      },
      // resolveCornerRadius: (cornerCtx) => {
      //   const isTargetCorner =
      //     cornerCtx.region === 'cornerBlock' &&
      //     cornerCtx.block === 'topRight' &&
      //     cornerCtx.part === 'ring' &&
      //     cornerCtx.corner === 'bottomLeft';
      //
      //   if (!isTargetCorner) {
      //     return cornerCtx.defaultRadius;
      //   }
      //
      //   return cornerCtx.contour === 'outer' ? 6 : 4;
      // },
      preContent: `<!-- QR Content: ${content} -->`,
      postContent: additionalContent === 'true' ? additionalContentFunc : undefined,
    });
    return qrSvg.svg;
  }, [
    content,
    ecl,
    preset,
    outerCornerRadius,
    innerCornerRadius,
    cornerBlockOuterOuterRadius,
    cornerBlockOuterInnerRadius,
    cornerBlockInnerOuterRadius,
    size,
    fill,
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
              <label htmlFor="preset">Preset:</label>
              <select name="preset" id="preset" className={styles.select} onChange={handleChangePreset} value={preset}>
                {Object.keys(QRSvgPresets).map((name) => (
                  <option value={name} key={name}>
                    {name}
                  </option>
                ))}
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
              <label htmlFor="outerCornerRadius">OuterCornerRadius:</label>
              <input
                className={styles.range}
                type="range"
                id="outerCornerRadius"
                name="outerCornerRadius"
                min="0"
                max="1"
                step="0.1"
                value={outerCornerRadius}
                onChange={(e) => setOuterCornerRadius(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="innerCornerRadius">InnerCornerRadius:</label>
              <input
                className={styles.range}
                type="range"
                id="innerCornerRadius"
                name="innerCornerRadius"
                min="0"
                max="1"
                step="0.1"
                value={innerCornerRadius}
                onChange={(e) => setInnerCornerRadius(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="cornerBlockOuterOuterRadius">CornerBlockOuter / outer:</label>
              <input
                className={styles.range}
                type="range"
                id="cornerBlockOuterOuterRadius"
                min="0"
                max="7"
                step="0.1"
                value={cornerBlockOuterOuterRadius}
                onChange={(e) => setCornerBlockOuterOuterRadius(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="cornerBlockOuterInnerRadius">CornerBlockOuter / inner:</label>
              <input
                className={styles.range}
                type="range"
                id="cornerBlockOuterInnerRadius"
                min="0"
                max="5"
                step="0.1"
                value={cornerBlockOuterInnerRadius}
                onChange={(e) => setCornerBlockOuterInnerRadius(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="cornerBlockInnerOuterRadius">CornerBlockInner / outer:</label>
              <input
                className={styles.range}
                type="range"
                id="cornerBlockInnerOuterRadius"
                min="0"
                max="3"
                step="0.1"
                value={cornerBlockInnerOuterRadius}
                onChange={(e) => setCornerBlockInnerOuterRadius(e.target.value)}
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
              <label htmlFor="additionalContent">AdditionalContent:</label>
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
