# Use cell-relative corner radii

Corner rounding is expressed as a radius relative to a QR cell: `1` fully rounds a one-cell-wide figure. This replaces factor and boolean-based rounding controls with independent radii for convex corners, concave corners, outer corner-block rings, and inner corner-block figures, making one scale sufficient for both subtle rounding and exact circular corner blocks.
