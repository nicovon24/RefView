# Coordinate and field contract

## Canonical world

- Units are metres and radians.
- The world is right-handed: `+y` is up, `+z` is the first-half attacking direction for the authored attacking team, and `+x` is that team's right.
- The field origin is the centre spot at ground level.
- A standard 105 x 68 m field occupies `x = -34..34` and `z = -52.5..52.5`.
- `yaw = 0` faces `+z`; positive yaw turns toward `+x`. Pitch and roll are zero for authored player roots unless an animation explicitly supplies them.
- Positions use `{ x, y, z }`; ground locations use `{ x, z }` and imply `y = 0`.

The near edge of the `+z` penalty area is `z = 36.0`; its lateral limits are `x = -20.16..20.16`. Boundary lines belong to the areas they enclose. Authoring tools must render the line width consistently but resolve legal location from the canonical boundary, not a sampled texture pixel.

## Invariants

- A scenario declares its field dimensions and attack direction; it never relies on renderer defaults.
- Actor roots, ball centres, contact points, camera eyes, and offence ground locations are distinct values.
- The renderer may transform canonical coordinates for a camera or engine adapter but must provide an invertible mapping.
- Runtime physics must not replace authored actor, ball, contact, or offence coordinates.
- Stored coordinates use at least millimetre precision; UI labels may round.

## Example

```ts
type Vec3m = Readonly<{ x: number; y: number; z: number }>;
type GroundPointM = Readonly<{ x: number; z: number }>;

type FieldGeometry = Readonly<{
  lengthM: 105;
  widthM: 68;
  goalWidthM: 7.32;
  penaltyAreaDepthM: 16.5;
  penaltyAreaExtraWidthEachSideM: 16.5;
  lineWidthM: 0.12;
  attackDirection: "positiveZ" | "negativeZ";
}>;
```

Valid: an authored contact point at `(13.8, 0.34, 36.8)` resolves to a ground offence inside the `+z` penalty area.

Invalid:

- Determining the offence from the ball position.
- Switching `x` and `z` only inside the Three.js scene.
- Letting a collision response move the reviewed contact outside the area.
- Treating the visible centre of the painted line as an unversioned legal boundary.
