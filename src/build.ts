import { promises as fs } from "fs";
import { Type, DEFAULT_SCHEMA, load } from "js-yaml";
import tinycolor from "tinycolor2";
import path from "path";

export default async function generate(
  variant: "light" | "dark"
): Promise<void> {
  const tags = [
    new Type("!undefined", {
      kind: "scalar",
      construct: () => undefined,
    }),
    new Type("!variant?", {
      kind: "mapping",
      construct: ({ light, dark }) => (variant === "light" ? light : dark),
    }),
    new Type("!color", {
      kind: "mapping",
      construct: ({ light, dark }) =>
        tinycolor(variant === "light" ? light : dark).toHex8String(),
    }),
    new Type("!transparent", {
      kind: "sequence",
      construct: ([color, alpha]: [string, number]) =>
        tinycolor(color).setAlpha(alpha).toHex8String(),
    }),
    new Type("!emphasize", {
      kind: "sequence",
      construct: ([color, amount]: [string, number]) => {
        if (amount > 0) {
          if (variant === "light") {
            return tinycolor(color).darken(amount).toHex8String();
          } else {
            return tinycolor(color).brighten(amount).toHex8String();
          }
        } else {
          if (variant === "light") {
            return tinycolor(color).brighten(-amount).toHex8String();
          } else {
            return tinycolor(color).darken(-amount).toHex8String();
          }
        }
      },
    }),
    new Type("!saturate", {
      kind: "sequence",
      construct: ([color, amount]: [string, number]) =>
        tinycolor(color).saturate(amount).toHex8String(),
    }),
    new Type("!desaturate", {
      kind: "sequence",
      construct: ([color, amount]: [string, number]) =>
        tinycolor(color).desaturate(amount).toHex8String(),
    }),
    new Type("!mostReadable", {
      kind: "sequence",
      construct: ([color, ...colors]: string[]) =>
        tinycolor
          .mostReadable(color, colors, {
            includeFallbackColors: true,
          })
          .toHex8String(),
    }),
    new Type("!mix", {
      kind: "sequence",
      construct: ([color1, color2, amount]: [
        string,
        string,
        number | undefined
      ]) => tinycolor.mix(color1, color2, amount || 50).toHex8String(),
    }),
  ];

  const schema = DEFAULT_SCHEMA.extend(tags);

  const source = await fs.readFile(__dirname + "/prism.yaml", "utf-8");
  const { refs: _, ...theme } = load(source, { schema }) as { refs: unknown };

  await fs.writeFile(
    path.join(__dirname, `../themes/prism-${variant}-color-theme.json`),
    JSON.stringify(theme, undefined, 2),
    "utf-8"
  );
}

generate("light");
generate("dark");
