export const hashCode = (s: string) => {
  if (s.length == 0) return 0;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export const generateColor = (): { r: number; g: number; b: number } => {
  let c = HSVtoRGB(Math.random(), 1.0, 1.0);
  c.r! *= 0.15;
  c.g! *= 0.15;
  c.b! *= 0.15;

  return c;
};

export const HSVtoRGB = (
  h: number,
  s: number,
  v: number
): { r: number; g: number; b: number } => {
  let r, g, b, i, f, p, q, t: number;
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
  }

  return {
    r: r!,
    g: g!,
    b: b!,
  };
};

export const wrap = (value: number, min: number, max: number) => {
  let range = max - min;
  if (range == 0) return min;
  return ((value - min) % range) + min;
};

export const scaleByPixelRatio = (input: number) => {
  let pixelRatio = window.devicePixelRatio || 1;
  return Math.floor(input * pixelRatio);
};

// export const normalizeColor = (input: { r: number; g: number; b: number }) => {
//   let output = {
//     r: input.r / 255,
//     g: input.g / 255,
//     b: input.b / 255,
//   };
//   return output;
// };

export const normalizeColor = (
  color: string
): { r: number; g: number; b: number } => {
  let match;

  // Check if the input is in hex format
  if ((match = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i))) {
    return {
      r: parseInt(match[1], 16) / 255,
      g: parseInt(match[2], 16) / 255,
      b: parseInt(match[3], 16) / 255,
    };
  }

  // Check if the input is in RGB format
  if ((match = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/))) {
    return {
      r: parseInt(match[1], 10) / 255,
      g: parseInt(match[2], 10) / 255,
      b: parseInt(match[3], 10) / 255,
    };
  }

  // If the format is not recognized, return null or handle it as needed
  return { r: 1, g: 0, b: 0 };
};

export const uuid = () => {
  return "xxxx-xxxx-xxx-xxxx".replace(/[x]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return r.toString(16);
  });
};

export const setFluidColor = (
  fluidColor: string
): { r: number; g: number; b: number } => {
  let color = generateColor();
  if (fluidColor) {
    color = normalizeColor(fluidColor);
  }

  return color;
};
