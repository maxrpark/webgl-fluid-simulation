export var hashCode = function (s) {
    if (s.length == 0)
        return 0;
    var hash = 0;
    for (var i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};
export var generateColor = function () {
    var c = HSVtoRGB(Math.random(), 1.0, 1.0);
    c.r *= 0.15;
    c.g *= 0.15;
    c.b *= 0.15;
    return c;
    // return { r: 1, g: 1, b: 1, a: 1 };
};
export var HSVtoRGB = function (h, s, v) {
    var r, g, b, i, f, p, q, t;
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
        r: r,
        g: g,
        b: b,
    };
};
export var wrap = function (value, min, max) {
    var range = max - min;
    if (range == 0)
        return min;
    return ((value - min) % range) + min;
};
export var scaleByPixelRatio = function (input) {
    var pixelRatio = window.devicePixelRatio || 1;
    return Math.floor(input * pixelRatio);
};
export var normalizeColor = function (input) {
    var output = {
        r: input.r / 255,
        g: input.g / 255,
        b: input.b / 255,
    };
    return output;
};
export var uuid = function () {
    return "xxxx-xxxx-xxx-xxxx".replace(/[x]/g, function (c) {
        var r = Math.floor(Math.random() * 16);
        return r.toString(16);
    });
};
