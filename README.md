# logo-particle
将logo或图片进行粒子化的动态动画，支持位置，粒子大小、颜色自定义，自适应规则等进行设置。

demo: https://sepveneto.github.io/logo-particle/

## 使用

### 兼容性
涉及到可选链(?.)和空值合并操作符(??)，如果有兼容性需求，可以自行修改`tsconfig.json`重新打包

| ![IE](https://cdn.jsdelivr.net/npm/@browser-logos/edge/edge_32x32.png) | ![Firefox](https://cdn.jsdelivr.net/npm/@browser-logos/firefox/firefox_32x32.png) | ![Chrome](https://cdn.jsdelivr.net/npm/@browser-logos/chrome/chrome_32x32.png) | ![Safari](https://cdn.jsdelivr.net/npm/@browser-logos/safari/safari_32x32.png) |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Edge ≥ 85                                                              | Firefox ≥ 79                                                                      | Chrome ≥ 85                                                                    | Safari ≥ 14                                                                    |


### 通过包管理工具

```
npm i ./logo-particle-1.0.2.tgz

yarn add ./logo-particle-1.0.2.tgz

pnpm i ./logo-particle-1.0.2.tgz
```

```js
import { Stage } from 'logo-particle'

const stage = new Stage(document.querySelector('canvas'))
stage.loadImage('/static/github.png', { /* 相关配置 */ }).then((data) => {
  stage.start()
  stage.switchShape(data)
})
```

### 通过script

```html
<script src="./index.umd.js"></script>
```

```js
window.onload = () => {
  const node = document.querySelector('#canvas')
  const stage = new LOGO_PARTICLE.Stage(node)
  stage.loadImage('static/github.jpg', {
    /*
      相关配置
    */
  }).then((data) => {
    /*
      图片导入成功后解析的坐标集
    */
  })
}
```

## 相关配置

```js
{
  width?: number, // 渲染宽度
  height?: number // 渲染高度
  x?: number, // 原点的坐标
  y?: number, // 原点的坐标
  seeds?: number[][] = [[0, 0]], // 取色的基准点[x,y]
  thresh?: number = 10, // 生长准则
  type?: FitType = 'none', // 同object-fit
  imgGap?: number = 6, // 图片粒子化时的取点规则
  origin?: OriginType = 'left-top', // 图片渲染时的原点
  particleSize?: number = 2, // 粒子半径
  color?: number = 0x000000, // 粒子颜色
}
```

## 注意
原则上不会去限制粒子化图片的大小，但是如果图片过大，或取点的值设置得过小，导致粒子过多，会来严重影响性能甚至导致浏览器失去响应。
