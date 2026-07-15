import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

/**
 * Parametric vector illustration of the garden plant at a given growth stage.
 * Stage 0 = seed in soil, up to stage 4 = full bloom. A withered variant
 * dries the palette and droops the plant.
 *
 * Kept intentionally primitive (paths + ellipses + circles) so it's easy to
 * read and tweak; a designer can replace this with richer art later without
 * touching the growth logic.
 */

const PALETTE = {
  soil: '#7A5B43',
  soilDark: '#5E4331',
  stem: '#4C8C4A',
  stemDark: '#356B33',
  leaf: '#5BA85A',
  leafDark: '#3E7D3D',
  petal: '#E8A0BF',
  petalDeep: '#D97CA3',
  center: '#F4C542',
} as const;

const WITHER = {
  soil: '#6B5340',
  soilDark: '#4F3C2E',
  stem: '#9A7B4F',
  stemDark: '#7A5F3B',
  leaf: '#A98C58',
  leafDark: '#8A6F44',
  petal: '#B79A6A',
  petalDeep: '#9C7F4E',
  center: '#B79A6A',
} as const;

/** Height of the stem top per stage (smaller y = taller plant). */
const STEM_TOP_Y = [176, 150, 120, 100, 90] as const;

function Leaf({
  x,
  y,
  rotate,
  color,
  stroke,
}: {
  x: number;
  y: number;
  rotate: number;
  color: string;
  stroke: string;
}) {
  return (
    <G transform={`translate(${x}, ${y}) rotate(${rotate})`}>
      <Ellipse cx={0} cy={0} rx={22} ry={10} fill={color} stroke={stroke} strokeWidth={1.5} />
    </G>
  );
}

function Flower({
  cx,
  cy,
  scale,
  petal,
  petalDeep,
  center,
}: {
  cx: number;
  cy: number;
  scale: number;
  petal: string;
  petalDeep: string;
  center: string;
}) {
  const r = 13 * scale;
  const petals = [0, 60, 120, 180, 240, 300];
  return (
    <G transform={`translate(${cx}, ${cy})`}>
      {petals.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <Ellipse
            key={deg}
            cx={Math.cos(rad) * r}
            cy={Math.sin(rad) * r}
            rx={11 * scale}
            ry={7 * scale}
            fill={petal}
            stroke={petalDeep}
            strokeWidth={1}
            transform={`rotate(${deg})`}
          />
        );
      })}
      <Circle cx={0} cy={0} r={9 * scale} fill={center} />
    </G>
  );
}

export function GardenPlant({
  stage,
  withered = false,
  size = 220,
}: {
  stage: number;
  withered?: boolean;
  size?: number;
}) {
  const s = Math.max(0, Math.min(stage, STEM_TOP_Y.length - 1));
  const c = withered ? WITHER : PALETTE;
  const topY = STEM_TOP_Y[s];

  // Withering droops the plant to one side.
  const bend = withered ? 26 : 6;
  const stemPath = `M100 198 Q ${100 + bend} ${(198 + topY) / 2} ${100 + (withered ? bend * 1.4 : 0)} ${topY}`;
  const flowerX = 100 + (withered ? bend * 1.4 : 0);

  return (
    <Svg width={size} height={size} viewBox="0 0 200 210">
      {/* soil */}
      <Ellipse cx={100} cy={198} rx={74} ry={14} fill={c.soilDark} />
      <Ellipse cx={100} cy={194} rx={70} ry={12} fill={c.soil} />

      {s === 0 && !withered ? (
        // Seed / just-sprouting tip.
        <G>
          <Ellipse cx={100} cy={188} rx={9} ry={6} fill={PALETTE.stemDark} />
          <Path d="M100 190 Q 104 178 100 172" stroke={PALETTE.stem} strokeWidth={4} fill="none" />
          <Ellipse cx={104} cy={174} rx={9} ry={5} fill={PALETTE.leaf} transform="rotate(30 104 174)" />
        </G>
      ) : (
        <G>
          {/* stem */}
          <Path d={stemPath} stroke={c.stemDark} strokeWidth={6} fill="none" strokeLinecap="round" />

          {/* leaves appear from stage 1 */}
          {s >= 1 && (
            <>
              <Leaf x={86} y={162} rotate={withered ? 35 : 20} color={c.leaf} stroke={c.leafDark} />
              <Leaf x={114} y={150} rotate={withered ? 150 : 160} color={c.leaf} stroke={c.leafDark} />
            </>
          )}
          {s >= 2 && (
            <Leaf x={84} y={132} rotate={withered ? 40 : 15} color={c.leaf} stroke={c.leafDark} />
          )}

          {/* bud at stage 2, flowers at stage 3+ */}
          {s === 2 && (
            <Ellipse cx={flowerX} cy={topY} rx={9} ry={13} fill={c.petal} stroke={c.petalDeep} strokeWidth={1.5} />
          )}
          {s >= 3 && (
            <Flower cx={flowerX} cy={topY} scale={1} petal={c.petal} petalDeep={c.petalDeep} center={c.center} />
          )}
          {s >= 4 && (
            <>
              <Flower cx={flowerX - 30} cy={topY + 26} scale={0.7} petal={c.petal} petalDeep={c.petalDeep} center={c.center} />
              <Flower cx={flowerX + 30} cy={topY + 20} scale={0.75} petal={c.petal} petalDeep={c.petalDeep} center={c.center} />
            </>
          )}
        </G>
      )}
    </Svg>
  );
}
