var EventEmitter = /** @class */ (function () {
    function EventEmitter() {
        this.callbacks = {};
        this.callbacks = {};
        this.callbacks.base = {};
    }
    EventEmitter.prototype.on = function (_names, callback) {
        var _this = this;
        // Errors
        if (typeof _names === "undefined" || _names === "") {
            console.warn("wrong names");
            return false;
        }
        if (typeof callback === "undefined") {
            console.warn("wrong callback");
            return false;
        }
        // Resolve names
        var names = this.resolveNames(_names);
        // Each name
        names.forEach(function (_name) {
            // Resolve name
            var name = _this.resolveName(_name);
            // Create namespace if not exist
            if (!(_this.callbacks[name.namespace] instanceof Object))
                _this.callbacks[name.namespace] = {};
            // Create callback if not exist
            if (!(_this.callbacks[name.namespace][name.value] instanceof Array))
                _this.callbacks[name.namespace][name.value] = [];
            // Add callback
            _this.callbacks[name.namespace][name.value].push(callback);
        });
        return this;
    };
    EventEmitter.prototype.off = function (_names) {
        var _this = this;
        // Errors
        if (typeof _names === "undefined" || _names === "") {
            console.warn("wrong name");
            return false;
        }
        // Resolve names
        var names = this.resolveNames(_names);
        // Each name
        names.forEach(function (_name) {
            // Resolve name
            var name = _this.resolveName(_name);
            // Remove namespace
            if (name.namespace !== "base" && name.value === "") {
                delete _this.callbacks[name.namespace];
            }
            // Remove specific callback in namespace
            else {
                // Default
                if (name.namespace === "base") {
                    // Try to remove from each namespace
                    for (var namespace in _this.callbacks) {
                        if (_this.callbacks[namespace] instanceof Object &&
                            _this.callbacks[namespace][name.value] instanceof Array) {
                            delete _this.callbacks[namespace][name.value];
                            // Remove namespace if empty
                            if (Object.keys(_this.callbacks[namespace]).length === 0)
                                delete _this.callbacks[namespace];
                        }
                    }
                }
                // Specified namespace
                else if (_this.callbacks[name.namespace] instanceof Object &&
                    _this.callbacks[name.namespace][name.value] instanceof Array) {
                    delete _this.callbacks[name.namespace][name.value];
                    // Remove namespace if empty
                    if (Object.keys(_this.callbacks[name.namespace]).length === 0)
                        delete _this.callbacks[name.namespace];
                }
            }
        });
        return this;
    };
    EventEmitter.prototype.trigger = function (_name, _args) {
        var _this = this;
        // Errors
        if (typeof _name === "undefined" || _name === "") {
            console.warn("wrong name");
            return false;
        }
        var finalResult = null;
        var result = null;
        // Default args
        var args = !(_args instanceof Array) ? [] : _args;
        // Resolve names (should on have one event)
        var nameArray = this.resolveNames(_name);
        // Resolve name
        var name = this.resolveName(nameArray[0]);
        // Default namespace
        if (name.namespace === "base") {
            // Try to find callback in each namespace
            for (var namespace in this.callbacks) {
                if (this.callbacks[namespace] instanceof Object &&
                    this.callbacks[namespace][name.value] instanceof Array) {
                    this.callbacks[namespace][name.value].forEach(function (callback) {
                        result = callback.apply(_this, args);
                        if (typeof finalResult === "undefined") {
                            finalResult = result;
                        }
                    });
                }
            }
        }
        // Specified namespace
        else if (this.callbacks[name.namespace] instanceof Object) {
            if (name.value === "") {
                console.warn("wrong name");
                return this;
            }
            this.callbacks[name.namespace][name.value].forEach(function (callback) {
                result = callback.apply(_this, args);
                if (typeof finalResult === "undefined")
                    finalResult = result;
            });
        }
        return finalResult;
    };
    EventEmitter.prototype.resolveNames = function (_names) {
        var names = _names;
        names = names.replace(/[^a-zA-Z0-9 ,/.]/g, "");
        names = names.replace(/[,/]+/g, " ");
        names = names.split(" ");
        return names;
    };
    EventEmitter.prototype.resolveName = function (name) {
        var newName = {};
        var parts = name.split(".");
        newName.original = name;
        newName.value = parts[0];
        newName.namespace = "base"; // Base namespace
        // Specified namespace
        if (parts.length > 1 && parts[1] !== "") {
            newName.namespace = parts[1];
        }
        return newName;
    };
    return EventEmitter;
}());
export default EventEmitter;
