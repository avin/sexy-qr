# Sexy-QR

Sexy-QR turns a QR matrix into configurable SVG contours.

## Language

**QR cell**:
One square position in the QR matrix and the unit used to express corner radii.
_Avoid_: Point, pixel

**Contour**:
A closed boundary around one connected dark region of the QR matrix.
_Avoid_: Shape path, block

**Outer corner**:
A convex turn on a contour, facing away from the filled region.
_Avoid_: Rounded corner

**Inner corner**:
A concave turn on a contour, facing into the filled region.
_Avoid_: Inverted corner

**Corner radius**:
A cell-relative rounding amount where `1` fully rounds a figure one QR cell wide.
_Avoid_: Radius factor

**Corner block**:
One of the three large position markers at the corners of a QR code.
_Avoid_: Big square, circle block

**Outer corner block**:
The hollow outer ring of a corner block.
_Avoid_: Corner block out, corner block line

**Inner corner block**:
The solid central figure of a corner block.
_Avoid_: Corner block in, small square
