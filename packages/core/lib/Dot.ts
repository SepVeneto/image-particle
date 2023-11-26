export default class Dot {
  private x: number
  private y: number
  private color: string
  private radius: number
  constructor(dot: { x: number, y: number, color: string, radius: number }) {
    this.x = dot.x
    this.y = dot.y
    this.color = dot.color
    this.radius = dot.radius
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
  }
}
