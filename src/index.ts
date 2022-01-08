import * as PIXI from 'pixi.js'
import { Application, TilingSprite } from 'pixi.js'
import { rgbToGray, regionGrow } from './toPx'

type FitType = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
type OriginType = 'center' | 'left-top'
interface IPoint {
  x?: number,
  y?: number,
  h?: number,
  a?: number,
  size?: number,
}
interface IConfig {
  width?: number,
  height?: number
  x?: number,
  y?: number,
  seeds?: number[][]
  thresh?: number,
  type?: FitType,
  imgGap?: number,
  origin?: OriginType,
  particleSize?: number,
}

PIXI.utils.skipHello()

const defaultConfig = {
  x: 0,
  y: 0,
  seeds: [[0, 0]],
  thresh: 10,
  imgGap: 6,
  origin: 'left-top' as OriginType,
  particleSize: 2,
}

/**
 * @param type 同object-fit类型
 * @param origin 原始的图片尺寸
 * @param target 设定的目标尺寸
 */
function objectFit(
  type: FitType = 'fill',
  origin: { width: number, height: number },
  target: { width: number, height: number }
): { width: number, height: number } {
  const whr = origin.width / origin.height
  const whrW = whr * target.height
  const whrH = target.width / whr

  switch(type) {
    case 'none':
      return origin;
    case 'fill':
      return target;
    case 'contain':
      if (whrW < whrH) {
        return {
          width: whrW,
          height: target.height
        }
      } else {
        return {
          width: target.width,
          height: whrH,
        }
      }
    case 'cover':
      if (whrW < whrH) {
        return {
          width: target.width,
          height: whrH,
        }
      } else {
        return {
          width: whrW,
          height: target.height
        }
      }
    case 'scale-down':
      if (origin.width <= target.width && origin.height <= target.height) {
        return objectFit('contain', origin, target)
      } else {
        return objectFit('none', origin, target)
      }
    default:
      return target
  }
}

export default class Stage {
  public app: Application
  public dots: Dot[] = []
  public particleSize: number = 2
  public shape: { x: number, y: number }[] = []
  public animateEnd = false
  constructor(el: HTMLElement) {
    this.app = new PIXI.Application({
      width: el.offsetWidth,
      height: el.offsetHeight,
      antialias: true,
      backgroundAlpha: 0,
    })
    el.appendChild(this.app.view)
  }
  destroy() {
    this.app.destroy();
  }
  switchShape(shape: any[] = []) {
    this.animateEnd = false;
    // 创建额外的粒子
    if (shape.length > this.dots.length ) {
      const restSize = shape.length - this.dots.length;
      for( let i = 0; i < restSize; ++i) {
        this.dots.push(new Dot(this.app, {
          x: this.app.view.width / 2,
          y: this.app.view.height / 2,
          size: this.particleSize
        }))

      }
    }

    let i = 0;
    let d = 0;
    // 为所有粒子随机选择目标位置
    while(shape.length > 0) {
      i = Math.floor(Math.random() * shape.length)
      this.dots[d]?.move({
        h: 18,
      })

      this.dots[d].still = true;
      this.dots[d]?.move({
        x: shape[i].x,
        y: shape[i].y,
        h: 0,
        a: 1,
        size: this.particleSize
      })

      shape = shape.slice(0, i).concat(shape.slice(i + 1))
      d++
    }

    // 剩余固定粒子随机分布
    for (let i = d; i < this.dots.length; ++i) {
      if (!this.dots[i].still) {
        continue;
      }
      this.dots[i].move({
        size: Math.random() * 20 + 10,
        a: Math.random(),
        h: 20
      })

      this.dots[i].still = false;
      this.dots[i].move({
        x: this.app.view.width * Math.random(),
        y: this.app.view.height * Math.random(),
        a: 0.3,
        size: Math.random() * 4,
        h: 0
      })
    }
  }
  start() {
    for (let i = 0; i < 100; ++i) {
      this.dots.push(new Dot(this.app))
    }
    this.app.ticker.maxFPS = 60;
    this.app.ticker.add(() => {
      this.render()
    })
  }
  render() {
    this.dots.forEach(dot => {
      if (dot.still) {
        this.animateEnd = true;
      }
      dot.update()
      dot.render()
    })
  }

  async loadImage(url: string, options: IConfig) {
    const config = { ...defaultConfig, ...options}
    this.particleSize = config.particleSize
    return new Promise(resolve => {
      PIXI.Loader.shared.add(url).load((loader, resource) => {
        const image = new PIXI.Sprite(resource[url].texture)
        const origin = {
          width: image.width,
          height: image.height
        }
        const target = {
          width: config.width ?? origin.width,
          height: config.height ?? origin.height,
        }
        const { width: iw, height: ih } = objectFit(config.type, origin, target)
        image.width = iw;
        image.height = ih;
      
        const cImage = this.app.renderer.plugins.extract.canvas(image) as HTMLCanvasElement;
        const ctx = cImage.getContext('2d')
        if (!ctx) {
          console.error('error')
          return;
        }
        const { data, width, height } = ctx.getImageData(image.x, image.y, image.width, image.height)

        const gray = rgbToGray(data as any, width, height)
        const mark = regionGrow(gray, config.seeds, config.thresh)

        const gap = config.imgGap;
        const posList: {x: number, y: number}[] = []
        for (let h = 0; h < image.height; h += gap) {
          for (let w = 0; w < image.width; w += gap) {
            if (mark[w][h]) {
              continue;
            }
            const { offsetX, offsetY } = setOrigin(config, width, height)
            posList.push({
              x: w + offsetX,
              y: h + offsetY,
            })
          }
        }
        
        resolve(posList)
      })
    })
  }
}

class Dot {
  public inst: PIXI.Graphics
  public app: PIXI.Application
  public point: Required<IPoint>
  public target: Required<IPoint>
  public queue: IPoint[] = []
  public step = 0.25
  public still = false
  constructor(app: PIXI.Application, options: IPoint = {}) {
    this.app = app;
    const randomP = this.randomPosition()
    this.still = false
    this.point = { ...randomP, ...options, } as Required<IPoint>
    this.point.h = options.h ?? 0
    this.point.size = 2;
    this.point.a = 0.5;

    this.inst = new PIXI.Graphics()
    this.target = { ...this.point } as Required<typeof this.point>;
    this.app.stage.addChild(this.inst)
  }
  
  randomPosition() {
    const x = this.app.view.width * Math.random();
    const y = this.app.view.height * Math.random();
    return { x, y }
  }
  distanceTo(node: IPoint | null) {
    if (!node) {
      return [];
    }
    const { x, y } = node
    const dx = this.point.x - (x ?? 0);
    const dy = this.point.y - (y ?? 0)
    const dist = Math.sqrt(dx * dx + dy * dy)
    return [dx, dy, dist]
  }
  move(point: IPoint) {
    this.queue.push(point)
  }
  render() {
    this.inst.clear()
    this.inst.beginFill(0xffffff)
    this.inst.alpha = this.point.a
    this.inst.drawCircle(0, 0, this.point.size!);
    this.inst.position.set(this.point.x, this.point.y)
  }
  moveTo(target: IPoint) {
    const [dx, dy, d] = this.distanceTo(target);
    if (d > 1) {
      this.point.x -= ((dx / d) * 0.1 * d)
      this.point.y -= ((dy / d ) * 0.1 * d)
    } else {
      if (this.point.h > 0) {
        --this.point.h;
      } else {
        return true;
      }
    }
    return false;
  }
  update() {
    if (this.moveTo(this.target)) {
      const last = this.queue.shift()
      if (last) {
        this.target.x = last.x ?? this.point.x
        this.target.y = last.y ?? this.point.y
        this.target.a = last.a ?? this.point.a
        this.target.size = last.size ?? this.point.size
        this.point.h = last.h ?? 0
      } else {
        if (this.still) {
          this.point.x -= Math.sin(Math.random() * 3.142);
          this.point.y -= Math.sin(Math.random() * 3.142);
        } else {
          this.move({
            x: this.point.x + Math.random() * 50 - 25,
            y: this.point.y + Math.random() * 50 - 25,
          })
        }
      }
    }
    let diff = this.point.size - this.target.size
    this.point.size = Math.max(1, this.point.size - (diff * 0.05))
    diff = this.point.a - this.target.a
    this.point.a = Math.max(0.1, this.point.a - (diff * 0.05))
  }
}

export function setTimer(fn: () => void, time: number) {
  let timer = performance.now();
  function checkTime() {
    const curr = performance.now();
    if ((curr - timer) >= time) {
      timer = curr;
      fn()
    }
    requestAnimationFrame(checkTime)
  }
  requestAnimationFrame(checkTime)
}

function setOrigin(config: IConfig & typeof defaultConfig, width: number, height: number) {
  const { x, y } = config;
  switch(config.origin!) {
    case 'center':
      return {
        offsetX: x - width / 2,
        offsetY: y - height / 2,
      }
    case 'left-top':
      return {
        offsetX: x,
        offsetY: y
      }
    default:
      return {
        offsetX: x,
        offsetY: y
      }
  }
}
