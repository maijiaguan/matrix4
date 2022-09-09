// use code from cesium.js-Cartesian3
// https://github.com/CesiumGS/cesium/blob/1.62/Source/Core/Cartesian3.js
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
        if (result === void 0) { result = new C3(); }
        result.x = left.x - right.x;
        result.y = left.y - right.y;
        result.z = left.z - right.z;
        return result;
    };
    C3.add = function (left, right, result) {
        if (result === void 0) { result = new C3(); }
        result.x = left.x + right.x;
        result.y = left.y + right.y;
        result.z = left.z + right.z;
        return result;
    };
    C3.multiplyByScalar = function (c3, scalar, result) {
        if (result === void 0) { result = new C3(); }
        result.x = c3.x * scalar;
        result.y = c3.y * scalar;
        result.z = c3.z * scalar;
        return result;
    };
    C3.dot = function (left, right) {
        return left.x * right.x + left.y * right.y + left.z * right.z;
    };
    C3.magnitudeSquared = function (c3) {
        return c3.x * c3.x + c3.y * c3.y + c3.z * c3.z;
    };
    C3.magnitude = function (c3) {
        return Math.sqrt(C3.magnitudeSquared(c3));
    };
    C3.distance = function (left, right) {
        var distanceScratch = new C3();
        C3.subtract(left, right, distanceScratch);
        return C3.magnitude(distanceScratch);
    };
    C3.distanceSquared = function (left, right) {
        var distanceScratch = new C3();
        C3.subtract(left, right, distanceScratch);
        return C3.magnitudeSquared(distanceScratch);
    };
    C3.normalize = function (c3, result) {
        if (result === void 0) { result = new C3(); }
        var magnitude = C3.magnitude(c3);
        result.x = c3.x / magnitude;
        result.y = c3.y / magnitude;
        result.z = c3.z / magnitude;
        if (isNaN(result.x) || isNaN(result.y) || isNaN(result.z)) {
            throw new Error('normalized result is not a number');
        }
        return result;
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
function colorByScalar(color, scalar) {
    var new_color = [];
    new_color[0] = clamp(color[0] * scalar);
    new_color[1] = clamp(color[1] * scalar);
    new_color[2] = clamp(color[2] * scalar);
    new_color[3] = clamp(color[3]);
    return new_color;
}
function clamp(value) {
    return Math.min(255, Math.max(0, value));
}
var Sphere = /** @class */ (function () {
    function Sphere(center, radius, color, specular) {
        this.center = center;
        this.radius = radius;
        this.color = color;
        this.specular = specular;
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
        this.canvasBuffer = ctx.getImageData(0, 0, width, height);
        this.cameraPosition = new C3();
        this.vw = 1.0;
        this.vh = 1.0;
        this.d = 1.0;
        this.scene = [
            new Sphere(new C3(0, -1, 3), 1, color('#ff0000'), 500),
            new Sphere(new C3(2, 0, 4), 1, color('#0000ff'), 500),
            new Sphere(new C3(-2, 0, 4), 1, color('#00ff00'), 10),
            new Sphere(new C3(0, -5001, 0), 5000, color('#ffff00'), 1000)
        ];
        this.light = [
            {
                type: "ambient",
                intensity: 0.2
            },
            {
                type: "point",
                intensity: 0.6,
                position: new C3(2, 1, 0)
            },
            {
                type: "directional",
                intensity: 0.2,
                direction: new C3(1, 4, 4)
            }
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
        x = this.cw / 2 + x;
        y = this.ch / 2 - y - 1;
        if (x < 0 || x >= this.cw || y < 0 || y >= this.ch) {
            return;
        }
        var offset = this.canvasBuffer.width * 4 * y + 4 * x;
        this.canvasBuffer.data[offset++] = color[0]; // r
        this.canvasBuffer.data[offset++] = color[1]; // g
        this.canvasBuffer.data[offset++] = color[2]; // b
        this.canvasBuffer.data[offset++] = color[3]; // alpha
    };
    Matrix4.prototype.computeLighting = function (point, n, v, specular) {
        var i = 0.0;
        this.light.forEach(function (light) {
            if (light.type === "ambient") {
                i += light.intensity;
            }
            else {
                var l = void 0;
                if (light.type === "point") {
                    l = C3.subtract(light.position, point);
                }
                else {
                    l = light.direction;
                }
                var cos_a = C3.dot(n, l);
                // diffuse
                if (cos_a > 0) {
                    i += light.intensity * cos_a / (C3.magnitude(n) * C3.magnitude(l));
                }
                // specular
                if (specular !== -1) {
                    var reflex = C3.subtract(C3.multiplyByScalar(n, 2 * C3.dot(n, l)), l);
                    var cos_a_2 = C3.dot(reflex, v);
                    if (cos_a_2 > 0) {
                        i += light.intensity * Math.pow((cos_a_2 / (C3.magnitude(reflex) * C3.magnitude(v))), specular);
                    }
                }
            }
        });
        return i;
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
            var point = C3.add(this.cameraPosition, C3.multiplyByScalar(direction, closest_t));
            var n = C3.normalize(C3.subtract(point, closest_sphere.center));
            var i = this.computeLighting(point, n, C3.multiplyByScalar(direction, -1), closest_sphere.specular);
            return colorByScalar(closest_sphere.color, i);
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
    Matrix4.prototype.updateCanvas = function () {
        this.context.putImageData(this.canvasBuffer, 0, 0);
    };
    Matrix4.prototype.render = function () {
        for (var x = -this.cw / 2; x < this.cw / 2; x++) {
            for (var y = -this.ch / 2; y < this.ch / 2; y++) {
                var direction = this.canvasToViewport(x, y);
                var color_1 = this.traceRay(direction);
                this.putPixel(x, y, color_1);
            }
        }
        this.updateCanvas();
    };
    return Matrix4;
}());
