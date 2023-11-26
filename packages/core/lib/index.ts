import { regionGrow, rgbToGray } from './toPx'
import Dot from './Dot'

type FitType = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
type OriginType = 'center' | 'left-top'
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
  color?: string,
}

const defaultConfig = {
  x: 0,
  y: 0,
  seeds: [[0, 0]],
  thresh: 10,
  imgGap: 6,
  origin: 'left-top' as OriginType,
  particleSize: 2,
  color: 'black',
}

function mergeConfig(config: IConfig) {
  return { ...defaultConfig, ...config }
}

export class Stage {
  private ctx: CanvasRenderingContext2D
  private config: ReturnType<typeof mergeConfig>
  private dots: Dot[]
  constructor(dom: HTMLElement, config: IConfig) {
    const canvas = document.createElement('canvas')
    canvas.width = dom.offsetWidth
    canvas.height = dom.offsetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Can not get canvas context')
    }
    this.ctx = ctx
    this.config = mergeConfig(config)
    this.dots = []

    dom.appendChild(canvas)
  }

  async start(url: string) {
    this.dots = (await this._normalizeImage(url)).map(item => new Dot({
      x: item.x,
      y: item.y,
      color: this.config.color,
      radius: this.config.particleSize,
    }))

    this.render()

    // this.ctx.fillStyle = 'red'
    // this.dots.forEach(dot => {
    //   this.ctx.beginPath()
    //   this.ctx.arc(dot.x, dot.y, this.config.particleSize, 0, 360)
    //   this.ctx.fill()
    // })
    // this.ctx.drawImage()
    // imageData.data
    // this.ctx.putImageData(imageData, 0, 0)
  }

  render() {
    this.dots.forEach(dot => dot.render(this.ctx))
    window.requestAnimationFrame(() => {
      this.render()
    })
  }

  async _normalizeImage(url: string) {
    const img = await this.loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Can not get canvas context')
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

    const gray = rgbToGray(Array.from(data), canvas.width, canvas.height)
    const mark = regionGrow(gray, this.config.seeds, this.config.thresh)

    const gap = this.config.imgGap
    const posList: {x: number, y: number}[] = []
    for (let h = 0; h < canvas.height; h += gap) {
      for (let w = 0; w < canvas.width; w += gap) {
        if (mark[w][h]) {
          continue
        }
        const { offsetX, offsetY } = setOrigin(this.config, canvas.width, canvas.height)
        posList.push({
          x: w + offsetX,
          y: h + offsetY,
        })
      }
    }
    return posList
  }

  loadImage(url: string): Promise<HTMLImageElement> {
    const img = new Image()
    img.src = url
    return new Promise((resolve, reject) => {
      img.onload = () => resolve(img)
      img.onerror = reject
    })
  }
}

function setOrigin(config: IConfig & typeof defaultConfig, width: number, height: number) {
  const { x, y } = config
  switch (config.origin!) {
    case 'center':
      return {
        offsetX: x - width / 2,
        offsetY: y - height / 2,
      }
    case 'left-top':
      return {
        offsetX: x,
        offsetY: y,
      }
    default:
      return {
        offsetX: x,
        offsetY: y,
      }
  }
}
