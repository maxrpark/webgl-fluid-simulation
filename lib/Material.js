var Material = /** @class */ (function () {
    function Material(vertexShader, fragmentShaderSource) {
        this.vertexShader = vertexShader;
        this.fragmentShaderSource = fragmentShaderSource;
        this.programs = [];
        this.activeProgram = null;
        this.uniforms = {
            texelSize: null,
            uTexture: null,
            uBloom: null,
            uDithering: null,
            ditherScale: null,
            uSunrays: null,
        };
    }
    Material.prototype.setKeywords = function (keywords) {
        var hash = 0;
        for (var i = 0; i < keywords.length; i++)
            hash += hashCode(keywords[i]);
        var program = this.programs[hash];
        if (program == null) {
            var fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
            program = createProgram(this.vertexShader, fragmentShader);
            this.programs[hash] = program;
        }
        if (program == this.activeProgram)
            return;
        this.uniforms = getUniforms(program);
        this.activeProgram = program;
    };
    Material.prototype.bind = function () {
        gl.useProgram(this.activeProgram);
    };
    return Material;
}());
export default Material;
