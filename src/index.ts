import * as PIXI from 'pixi.js'
import type { Application } from 'pixi.js'
import { rgbToGray, regionGrow } from './toPx'

type FitType = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
type OriginType = 'center' | 'left-top'
interface IPoint {
  x?: number,
  y?: number,
  h?: number,
  a?: number
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
  origin?: OriginType
}

PIXI.utils.skipHello()

const defaultConfig = {
  x: 0,
  y: 0,
  seeds: [[0, 0]],
  thresh: 10,
  imgGap: 6,
  origin: 'left-top' as OriginType
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
  public shape: { x: number, y: number }[] = []
  public animateEnd = false
  constructor(el: HTMLElement) {
    this.app = new PIXI.Application({
      width: el.offsetWidth,
      height: el.offsetHeight,
      antialias: true,
      backgroundAlpha: 0,
      forceCanvas: true,
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
          y: this.app.view.height / 2
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
      })

      shape = shape.slice(0, i).concat(shape.slice(i + 1))
      d++
    }

    // 剩余固定粒子随机分布
    for (let i = d; i < this.dots.length; ++i) {
      if (!this.dots[i].still) {
        continue;
      }
      this.dots[i].still = false;
      this.dots[i].move({
        x: this.app.view.width * Math.random(),
        y: this.app.view.height * Math.random(),
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
        for (let w = 0; w < image.width; w += gap) {
          for (let h = 0; h < image.height; h += gap) {
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
  private size: number
  public inst: PIXI.Graphics
  public app: PIXI.Application
  public alpha: number
  public target: Required<IPoint>
  public queue: IPoint[] = []
  public h = 0
  public step = 0.25
  public still = false
  constructor(app: PIXI.Application, options?: IPoint) {
    this.app = app;
    const { x: rx, y: ry } = this.randomPosition()
    const x = options?.x ?? rx;
    const y = options?.y ?? ry;
    this.still = false
    this.h = options?.h ?? 0

    this.size = 3;
    this.inst = new PIXI.Graphics()
    // this.alpha = Math.random()
    this.alpha = 0.5;
    this.inst.beginFill(0xffffff)
    this.inst.alpha = this.alpha
    this.inst.position.set(x, y)
    this.inst.drawCircle(0, 0, this.size);
    this.target = {
      x: x,
      y: y,
      h: 0,
      a: this.alpha,
    }
    this.app.stage.addChild(this.inst)
  }
  
  randomPosition() {
    // const seed = Math.random()
    const x = this.app.view.width * Math.random();
    const y = this.app.view.height * Math.random();
    // console.log(x, y, this.app.stage.width, seed)
    return { x, y }
  }
  distanceTo(node: IPoint | null) {
    if (!node) {
      return [];
    }
    const { x, y } = node
    const dx = this.inst.x - (x ?? 0);
    const dy = this.inst.y - (y ?? 0)
    const dist = Math.sqrt(dx * dx + dy * dy)
    return [dx, dy, dist]
  }
  move(point: IPoint) {
    this.queue.push(point)
  }
  render() {
    this.inst.alpha = this.target.a
  }
  update() {
    const [dx, dy, d] = this.distanceTo(this.target);
    if (d > 1) {
      this.inst.x -= ((dx / d) * 0.1 * d)
      this.inst.y -= ((dy / d ) * 0.1 * d)
    } else if (this.target.h && this.target.h > 0 ) {
      // 停顿的时间
      --this.target.h;
    } else {
      const last = this.queue.shift()
      if (last) {
        this.target.x = last.x ?? this.inst.x
        this.target.y = last.y ?? this.inst.y
        this.target.h = last.h ?? 0
        this.target.a = last.a ?? this.alpha
      }
      if (this.still) {
        this.inst.x -= Math.sin(Math.random() * 3.142);
        this.inst.y -= Math.sin(Math.random() * 3.142);
      } else {
        this.move({
          x: this.target.x + (Math.random() * 50) - 25,
          y: this.target.y + (Math.random() * 50) - 25,
        })
      }
    }
    // this.inst.x = this.target.x;
    // this.inst.y = this.target.y;
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
