var Target = /** @class */ (function () {
    function Target(props) {
        Object.assign(this, props);
    }
    Target.prototype.swap = function () {
        var temp = this.read;
        this.read = this.write;
        this.write = temp;
    };
    return Target;
}());
export default Target;
