class C3 {
  x:number
  y:number
  z:number
  constructor(x: number = 0.0, y: number = 0.0, z: number = 0.0) {
    this.x = x
    this.y = y
    this.z = z
  }

  static subtract(left: C3, right: C3, result?: C3): C3 {
    if(!result) {
      result = new C3()
    }
    result.x = left.x - right.x;
    result.y = left.y - right.y;
    result.z = left.z - right.z;
    return result;
  }

  static dot(left: C3, right: C3): number {
    return left.x * right.x + left.y * right.y + left.z * right.z;
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


class Sphere {
  center: C3
  radius: number
  color: Array<number>
  constructor(center: C3, radius: number, color: Array<number>) {
    this.center = center
    this.radius = radius
    this.color = color
  }
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

    this.cameraPosition = new C3()

    this.vw = 1.0
    this.vh = 1.0
    this.d = 1.0

    this.scene = [
      new Sphere(new C3(0, -1, 3), 1, color('#ff0000')),
      new Sphere(new C3(2, 0, 4), 1, color('#0000ff')),
      new Sphere(new C3(-2, 0, 4), 1, color('#00ff00'))
    ]
    
  }
  get cw():number {
    return this.canvas.clientWidth
  }
  get ch():number {
    return this.canvas.clientHeight
  }

  putPixel(x: number, y: number, color: Array<number> = []) {
    let cw_half = Math.floor(this.cw / 2)
    let cy_half = Math.floor(this.ch / 2)
    if(x < -cw_half || x > cw_half || y < -cy_half || y > cy_half) {
      // console.log(cw_half, cy_half, x, y)
      return
    }
    let sx = cw_half + x
    let sy = cy_half - y
    let uintc8 = new Uint8ClampedArray(color);
    let imageData = new ImageData(uintc8, 1, 1)
    this.context.putImageData(imageData, sx, sy);
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
      return closest_sphere.color
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

  render(){
    for(let x = -this.cw / 2; x <= this.cw / 2; x++) {
      for(let y = -this.ch / 2; y <= this.ch / 2; y++) {
        let direction: C3 = this.canvasToViewport(x, y)
        let color = this.traceRay(direction)
        this.putPixel(x, y, color)
      }
    }
  }
}