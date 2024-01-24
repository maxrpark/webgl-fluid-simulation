export declare const hashCode: (s: string) => number;
export declare const generateColor: () => {
    r: number;
    g: number;
    b: number;
};
export declare const HSVtoRGB: (h: number, s: number, v: number) => {
    r: number;
    g: number;
    b: number;
};
export declare const wrap: (value: number, min: number, max: number) => number;
export declare const scaleByPixelRatio: (input: number) => number;
export declare const normalizeColor: (color: string) => {
    r: number;
    g: number;
    b: number;
};
export declare const uuid: () => string;
export declare const setFluidColor: (fluidColor: string) => {
    r: number;
    g: number;
    b: number;
};
