import { Application, Graphics } from 'pixi.js'
export type FitType = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
export type OriginType = 'center' | 'left-top'
export interface IPoint {
  x?: number,
  y?: number,
  // 位置状态变更前保持上一状态的时候，单位帧
  h?: number,
  // alpha
  a?: number,
  // 粒子半径
  size?: number,
  // 粒子颜色
  color?: number,
}
export interface IConfig {
  width?: number,
  height?: number
  x?: number,
  y?: number,
  // 取色的基准点[x,y]
  seeds?: number[][]
  // 生长准则
  thresh?: number,
  // 同object-fit
  type?: FitType,
  // 图片粒子化时的取点规则
  imgGap?: number,
  // 图片渲染时的原点
  origin?: OriginType,
  // 粒子半径
  particleSize?: number,
  // 粒子颜色
  color?: number,
}

export class Stage {
  public app: Application
  public dots: Dot[]
  public particleSize: number
  public color?: number
  public shape: { x: number, y: number }[]
  public animateEnd: boolean
  constructor(el: HTMLElement)
  destroy(): void
  switchShape(shape: { x: number, y: number }[]): void
  start(): void
  setInterval(fn: () => void, time: number): void
  setTimer(fn: () => void, time: number): void
  loadImage(url: string, options: IConfig): Promise<{ x: number, y: number }[]>
}

declare class Dot {
  public inst: Graphics
  public app: Application
  public point: Required<IPoint>
  public target: Required<IPoint>
  public queue: IPoint[]
  public still: boolean
  constructor(app: Application, options?: IPoint)
  randomPosition(): { x: number, y: number }
  distanceTo(node: IPoint | null): number[]
  move(point: IPoint): void
  render():void
  moveTo(target: IPoint): void
  update(): void
}