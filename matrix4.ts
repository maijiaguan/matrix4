// use code from cesium.js-Cartesian3
// https://github.com/CesiumGS/cesium/blob/1.62/Source/Core/Cartesian3.js
class C3 {
  x:number
  y:number
  z:number
  constructor(x: number = 0.0, y: number = 0.0, z: number = 0.0) {
    this.x = x
    this.y = y
    this.z = z
  }

  static subtract(left: C3, right: C3, result: C3 = new C3()): C3 {
    result.x = left.x - right.x;
    result.y = left.y - right.y;
    result.z = left.z - right.z;
    return result;
  }

  static add(left: C3, right: C3, result: C3 = new C3()) {
    result.x = left.x + right.x;
    result.y = left.y + right.y;
    result.z = left.z + right.z;
    return result;
  }

  static multiplyByScalar(c3: C3, scalar: number, result: C3 = new C3()): C3 {
    result.x = c3.x * scalar;
    result.y = c3.y * scalar;
    result.z = c3.z * scalar;
    return result;
  }

  static dot(left: C3, right: C3): number {
    return left.x * right.x + left.y * right.y + left.z * right.z;
  }

  static magnitudeSquared(c3: C3): number {
    return c3.x * c3.x + c3.y * c3.y + c3.z * c3.z;
  }
  
  static magnitude(c3: C3): number {
    return Math.sqrt(C3.magnitudeSquared(c3));
  }

  static distance(left: C3, right:C3): number {
    let distanceScratch = new C3();
    C3.subtract(left, right, distanceScratch);
    return C3.magnitude(distanceScratch);
  }

  static distanceSquared(left: C3, right:C3): number {
    let distanceScratch = new C3();
    C3.subtract(left, right, distanceScratch);
    return C3.magnitudeSquared(distanceScratch);
  }

  static normalize(c3: C3, result: C3 = new C3()) {
    var magnitude = C3.magnitude(c3);

    result.x = c3.x / magnitude;
    result.y = c3.y / magnitude;
    result.z = c3.z / magnitude;
 
    if (isNaN(result.x) || isNaN(result.y) || isNaN(result.z)) {
        throw new Error('normalized result is not a number');
    }

    return result;
  }
}

function color(hex: string): Array<number> {
  let rgb = hex.split('#')[1]
  if(rgb.length !== 3 && rgb.length !== 6) return [0, 0, 0, 255]
  let c = []
  for(let i = 0; i < 3; i++) {
    let start = i * rgb.length / 3
    let end = start + rgb.length / 3
    let value_16 = '0x' + (end - start === 1 ? rgb.slice(start, end) + rgb.slice(start, end) : rgb.slice(start, end))
    let value_10 = parseInt(value_16)
    c.push(value_10)
  }
  c.push(255)
  return c
}
function colorByScalar(color: Array<number>, scalar: number): Array<number> {
  let new_color = []
  new_color[0] = clamp(color[0] * scalar)
  new_color[1] = clamp(color[1] * scalar)
  new_color[2] = clamp(color[2] * scalar)
  new_color[3] = clamp(color[3])
  return new_color
}
function clamp(value: number): number {
  return Math.min(255, Math.max(0, value))
}


class Sphere {
  center: C3
  radius: number
  color: Array<number>
  specular: number
  constructor(center: C3, radius: number, color: Array<number>, specular: number) {
    this.center = center
    this.radius = radius
    this.color = color
    this.specular = specular
  }
}

type Light = {
  type: string,
  intensity: number,
  position?: C3,
  direction?: C3
}

class Matrix4 {
  canvas: HTMLCanvasElement
  container: Element
  context: CanvasRenderingContext2D
  cameraPosition: C3
  vw: number
  vh: number
  d: number
  scene: Array <Sphere>
  light: Light[]
  canvasBuffer: ImageData
  constructor(id: string) {
    let container = document.querySelector('#' + id)
    if(!container) {
      throw new Error("container is null")
    }
    let { width, height } = container.getBoundingClientRect()
    let canvas: HTMLCanvasElement = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    container.append(canvas)
    let ctx: CanvasRenderingContext2D = canvas.getContext('2d')
    this.canvas = canvas
    this.container = container
    this.context = ctx
    this.canvasBuffer = ctx.getImageData(0, 0, width, height)
    this.cameraPosition = new C3()

    this.vw = 1.0
    this.vh = 1.0
    this.d = 1.0

    this.scene = [
      new Sphere(new C3(0, -1, 3), 1, color('#ff0000'), 500),
      new Sphere(new C3(2, 0, 4), 1, color('#0000ff'), 500),
      new Sphere(new C3(-2, 0, 4), 1, color('#00ff00'), 10),
      new Sphere(new C3(0, -5001, 0), 5000, color('#ffff00'), 1000)
    ]

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
    ]
    
  }
  get cw():number {
    return this.canvas.clientWidth
  }
  get ch():number {
    return this.canvas.clientHeight
  }

  putPixel(x: number, y: number, color: Array<number> = []) {
    x = this.cw / 2 + x
    y = this.ch / 2 - y - 1
    if(x < 0 || x >= this.cw || y < 0 || y >= this.ch) {
      return
    }
    let offset = this.canvasBuffer.width * 4 * y + 4 * x
    this.canvasBuffer.data[offset++] = color[0] // r
    this.canvasBuffer.data[offset++] = color[1] // g
    this.canvasBuffer.data[offset++] = color[2] // b
    this.canvasBuffer.data[offset++] = color[3] // alpha
  }

  computeLighting(point: C3, n: C3, v: C3, specular: number): number {
    let i = 0.0
    this.light.forEach(light => {
      if(light.type === "ambient") {
        i += light.intensity
      }else {
        let l: C3
        if(light.type === "point") {
          l = C3.subtract(light.position, point)
        }else {
          l = light.direction
        }
        let cos_a = C3.dot(n, l)
        // diffuse
        if(cos_a > 0) {
          i += light.intensity * cos_a / (C3.magnitude(n) * C3.magnitude(l))
        }
        // specular
        if(specular !== -1) {
          let reflex = C3.subtract(C3.multiplyByScalar(n, 2 * C3.dot(n, l)), l)
          let cos_a_2 = C3.dot(reflex, v)
          if(cos_a_2 > 0) {
            i += light.intensity * (cos_a_2 / (C3.magnitude(reflex) * C3.magnitude(v))) ** specular
          }
        }
      }
    })
    return i
  }

  canvasToViewport(x: number, y: number): C3 {
    return new C3(x * this.vw / this.cw, y * this.vh / this.ch, this.d)
  }

  traceRay(direction: C3, t_min: number = 1, t_max: number = 10000000): Array<number> {
    let closest_t = Infinity
    let closest_sphere = null
    this.scene.forEach(sphere => {
      let [t1, t2] = this.intersectRaySphere(direction, sphere)
      if(t1 < t_max && t1 > t_min && t1 < closest_t) {
        closest_t = t1
        closest_sphere = sphere
      }
      if(t2 < t_max && t2 > t_min && t2 < closest_t) {
        closest_t = t2
        closest_sphere = sphere
      }
    })
    if(!closest_sphere) {
      return color('#fff')
    }else {
      let point = C3.add(this.cameraPosition, C3.multiplyByScalar(direction, closest_t))
      let n = C3.normalize(C3.subtract(point, closest_sphere.center))
      let i = this.computeLighting(point, n, C3.multiplyByScalar(direction, -1), closest_sphere.specular)
      return colorByScalar(closest_sphere.color, i)
    }
  }

  intersectRaySphere(direction: C3, sphere: Sphere): Array<number> {
    let r = sphere.radius
    let co = C3.subtract(this.cameraPosition, sphere.center)
    let a = C3.dot(direction, direction)
    let b = 2 * C3.dot(co, direction)
    let c = C3.dot(co, co) - r * r
    let discriminant = b * b - 4 * a * c
    if(discriminant < 0) {
      return [Infinity, Infinity]
    }
    let t1 = (-b + Math.sqrt(discriminant)) / (2 * a)
    let t2 = (-b - Math.sqrt(discriminant)) / (2 * a)
    return [t1, t2]
  }

  updateCanvas() {
    this.context.putImageData(this.canvasBuffer, 0, 0)
  }

  render(){
    for(let x = -this.cw / 2; x < this.cw / 2; x++) {
      for(let y = -this.ch / 2; y < this.ch / 2; y++) {
        let direction: C3 = this.canvasToViewport(x, y)
        let color = this.traceRay(direction)
        this.putPixel(x, y, color)
      }
    }
    this.updateCanvas()
  }
}    