var C3 = /** @class */ (function () {
    function C3(x, y, z) {
        if (x === void 0) { x = 0.0; }
        if (y === void 0) { y = 0.0; }
        if (z === void 0) { z = 0.0; }
        this.x = x;
        this.y = y;
        this.z = z;
    }
    C3.subtract = function (left, right, result) {
        if (!result) {
            result = new C3();
        }
        result.x = left.x - right.x;
        result.y = left.y - right.y;
        result.z = left.z - right.z;
        return result;
    };
    C3.dot = function (left, right) {
        return left.x * right.x + left.y * right.y + left.z * right.z;
    };
    return C3;
}());
function color(hex) {
    var rgb = hex.split('#')[1];
    if (rgb.length !== 3 && rgb.length !== 6)
        return [0, 0, 0, 255];
    var c = [];
    for (var i = 0; i < 3; i++) {
        var start = i * rgb.length / 3;
        var end = start + rgb.length / 3;
        var value_16 = '0x' + (end - start === 1 ? rgb.slice(start, end) + rgb.slice(start, end) : rgb.slice(start, end));
        var value_10 = parseInt(value_16);
        c.push(value_10);
    }
    c.push(255);
    return c;
}
var Sphere = /** @class */ (function () {
    function Sphere(center, radius, color) {
        this.center = center;
        this.radius = radius;
        this.color = color;
    }
    return Sphere;
}());
var Matrix4 = /** @class */ (function () {
    function Matrix4(id) {
        var container = document.querySelector('#' + id);
        if (!container) {
            throw new Error("container is null");
        }
        var _a = container.getBoundingClientRect(), width = _a.width, height = _a.height;
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        container.append(canvas);
        var ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.container = container;
        this.context = ctx;
        this.cameraPosition = new C3();
        this.vw = 1.0;
        this.vh = 1.0;
        this.d = 1.0;
        this.scene = [
            new Sphere(new C3(0, -1, 3), 1, color('#ff0000')),
            new Sphere(new C3(2, 0, 4), 1, color('#0000ff')),
            new Sphere(new C3(-2, 0, 4), 1, color('#00ff00'))
        ];
    }
    Object.defineProperty(Matrix4.prototype, "cw", {
        get: function () {
            return this.canvas.clientWidth;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Matrix4.prototype, "ch", {
        get: function () {
            return this.canvas.clientHeight;
        },
        enumerable: false,
        configurable: true
    });
    Matrix4.prototype.putPixel = function (x, y, color) {
        if (color === void 0) { color = []; }
        var cw_half = Math.floor(this.cw / 2);
        var cy_half = Math.floor(this.ch / 2);
        if (x < -cw_half || x > cw_half || y < -cy_half || y > cy_half) {
            // console.log(cw_half, cy_half, x, y)
            return;
        }
        var sx = cw_half + x;
        var sy = cy_half - y;
        var uintc8 = new Uint8ClampedArray(color);
        var imageData = new ImageData(uintc8, 1, 1);
        this.context.putImageData(imageData, sx, sy);
    };
    Matrix4.prototype.canvasToViewport = function (x, y) {
        return new C3(x * this.vw / this.cw, y * this.vh / this.ch, this.d);
    };
    Matrix4.prototype.traceRay = function (direction, t_min, t_max) {
        var _this = this;
        if (t_min === void 0) { t_min = 1; }
        if (t_max === void 0) { t_max = 10000000; }
        var closest_t = Infinity;
        var closest_sphere = null;
        this.scene.forEach(function (sphere) {
            var _a = _this.intersectRaySphere(direction, sphere), t1 = _a[0], t2 = _a[1];
            if (t1 < t_max && t1 > t_min && t1 < closest_t) {
                closest_t = t1;
                closest_sphere = sphere;
            }
            if (t2 < t_max && t2 > t_min && t2 < closest_t) {
                closest_t = t2;
                closest_sphere = sphere;
            }
        });
        if (!closest_sphere) {
            return color('#fff');
        }
        else {
            return closest_sphere.color;
        }
    };
    Matrix4.prototype.intersectRaySphere = function (direction, sphere) {
        var r = sphere.radius;
        var co = C3.subtract(this.cameraPosition, sphere.center);
        var a = C3.dot(direction, direction);
        var b = 2 * C3.dot(co, direction);
        var c = C3.dot(co, co) - r * r;
        var discriminant = b * b - 4 * a * c;
        if (discriminant < 0) {
            return [Infinity, Infinity];
        }
        var t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        var t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        return [t1, t2];
    };
    Matrix4.prototype.render = function () {
        for (var x = -this.cw / 2; x <= this.cw / 2; x++) {
            for (var y = -this.ch / 2; y <= this.ch / 2; y++) {
                var direction = this.canvasToViewport(x, y);
                var color_1 = this.traceRay(direction);
                this.putPixel(x, y, color_1);
            }
        }
    };
    return Matrix4;
}());
