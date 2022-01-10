'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var PIXI = require('pixi.js');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var PIXI__namespace = /*#__PURE__*/_interopNamespace(PIXI);

function rgbToGray(img, width, height) {
  const gray = new Array(width).fill("").map(() => []);
  for (let h = 0; h < height; ++h) {
    for (let w = 0; w < width; ++w) {
      const pos = (width * h + w) * 4;
      gray[w][h] = 0.3 * img[pos] + 0.59 * img[pos + 1] + 0.11 * img[pos + 2];
    }
  }
  return gray;
}
function isZone(x, y, width, height) {
  return x < 0 || y < 0 || x >= width || y >= height;
}
function calDiff(img, current, step) {
  const cx = current[0 /* left */];
  const cy = current[1 /* right */];
  const sx = step[0 /* left */];
  const sy = step[1 /* right */];
  return Math.abs(img[cx][cy] - img[sx][sy]);
}
function regionGrow(grayImg, seeds, thresh) {
  const width = grayImg.length;
  const height = grayImg[0].length;
  const direct = [[-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0]];
  const seedMark = new Array(width).fill("").map(() => []);
  const seedList = [...seeds];
  while (seedList.length > 0) {
    const current = seedList.pop();
    direct.forEach(([dx, dy]) => {
      const stepX = current[0 /* left */] + dx;
      const stepY = current[1 /* right */] + dy;
      if (isZone(stepX, stepY, width, height)) {
        return;
      }
      const diff = calDiff(grayImg, current, [stepX, stepY]);
      if (diff < thresh && !seedMark[stepX][stepY]) {
        seedMark[stepX][stepY] = true;
        seedList.push([stepX, stepY]);
      }
    });
  }
  return seedMark;
}

PIXI__namespace.utils.skipHello();
const defaultConfig = {
  x: 0,
  y: 0,
  seeds: [[0, 0]],
  thresh: 10,
  imgGap: 6,
  origin: "left-top",
  particleSize: 2,
  color: 0
};
function objectFit(type = "fill", origin, target) {
  const whr = origin.width / origin.height;
  const whrW = whr * target.height;
  const whrH = target.width / whr;
  switch (type) {
    case "none":
      return origin;
    case "fill":
      return target;
    case "contain":
      if (whrW < whrH) {
        return {
          width: whrW,
          height: target.height
        };
      } else {
        return {
          width: target.width,
          height: whrH
        };
      }
    case "cover":
      if (whrW < whrH) {
        return {
          width: target.width,
          height: whrH
        };
      } else {
        return {
          width: whrW,
          height: target.height
        };
      }
    case "scale-down":
      if (origin.width <= target.width && origin.height <= target.height) {
        return objectFit("contain", origin, target);
      } else {
        return objectFit("none", origin, target);
      }
    default:
      return target;
  }
}
class Stage {
  app;
  dots = [];
  particleSize = 2;
  color;
  shape = [];
  animateEnd = false;
  constructor(el) {
    this.app = new PIXI__namespace.Application({
      width: el.offsetWidth,
      height: el.offsetHeight,
      antialias: true,
      backgroundAlpha: 0
    });
    el.appendChild(this.app.view);
  }
  destroy() {
    this.app.destroy();
  }
  switchShape(shape = []) {
    this.animateEnd = false;
    if (shape.length > this.dots.length) {
      const restSize = shape.length - this.dots.length;
      for (let i2 = 0; i2 < restSize; ++i2) {
        this.dots.push(new Dot(this.app, {
          x: this.app.view.width / 2,
          y: this.app.view.height / 2,
          size: this.particleSize,
          color: this.color
        }));
      }
    }
    let i = 0;
    let d = 0;
    while (shape.length > 0) {
      i = Math.floor(Math.random() * shape.length);
      this.dots[d]?.move({
        size: Math.random() * 5 + 5,
        h: 18
      });
      this.dots[d].still = true;
      this.dots[d]?.move({
        x: shape[i].x,
        y: shape[i].y,
        h: 0,
        a: 1,
        size: this.particleSize
      });
      shape = shape.slice(0, i).concat(shape.slice(i + 1));
      d++;
    }
    for (let i2 = d; i2 < this.dots.length; ++i2) {
      if (!this.dots[i2].still) {
        continue;
      }
      this.dots[i2].move({
        size: Math.random() * 20 + 10,
        a: Math.random(),
        h: 20
      });
      this.dots[i2].still = false;
      this.dots[i2].move({
        x: this.app.view.width * Math.random(),
        y: this.app.view.height * Math.random(),
        a: 0.3,
        size: Math.random() * 4,
        h: 0
      });
    }
  }
  start() {
    for (let i = 0; i < 100; ++i) {
      this.dots.push(new Dot(this.app, { color: this.color }));
    }
    this.app.ticker.maxFPS = 60;
    this.app.ticker.add((delta) => {
      this.render();
    });
  }
  setInterval(fn, time) {
    const that = this;
    const origin = time * this.app.ticker.maxFPS;
    let tTime = origin;
    this.app.ticker.add(update);
    function update(delta) {
      if (tTime === origin) {
        fn.apply(that);
      }
      tTime -= delta;
      if (tTime <= 0) {
        tTime = origin;
      }
    }
  }
  setTimer(fn, time) {
    const that = this;
    function update(delta) {
      tTime -= delta;
      if (tTime <= 0) {
        fn.apply(that);
        that.app.ticker.remove(update);
      }
    }
    let tTime = time * this.app.ticker.maxFPS;
    this.app.ticker.add(update);
  }
  render() {
    this.dots.forEach((dot) => {
      if (dot.still) {
        this.animateEnd = true;
      }
      dot.update();
      dot.render();
    });
  }
  async loadImage(url, options) {
    const config = { ...defaultConfig, ...options };
    this.particleSize = config.particleSize;
    this.color = config.color;
    return new Promise((resolve) => {
      PIXI__namespace.Loader.shared.add(url).load((loader, resource) => {
        const image = new PIXI__namespace.Sprite(resource[url].texture);
        const origin = {
          width: image.width,
          height: image.height
        };
        const target = {
          width: config.width ?? origin.width,
          height: config.height ?? origin.height
        };
        const { width: iw, height: ih } = objectFit(config.type, origin, target);
        image.width = iw;
        image.height = ih;
        const cImage = this.app.renderer.plugins.extract.canvas(image);
        const ctx = cImage.getContext("2d");
        if (!ctx) {
          console.error("error");
          return;
        }
        const { data, width, height } = ctx.getImageData(image.x, image.y, image.width, image.height);
        const gray = rgbToGray(data, width, height);
        const mark = regionGrow(gray, config.seeds, config.thresh);
        const gap = config.imgGap;
        const posList = [];
        for (let h = 0; h < image.height; h += gap) {
          for (let w = 0; w < image.width; w += gap) {
            if (mark[w][h]) {
              continue;
            }
            const { offsetX, offsetY } = setOrigin(config, width, height);
            posList.push({
              x: w + offsetX,
              y: h + offsetY
            });
          }
        }
        resolve(posList);
      });
    });
  }
}
class Dot {
  inst;
  app;
  point;
  target;
  queue = [];
  still = false;
  constructor(app, options = {}) {
    this.app = app;
    const randomP = this.randomPosition();
    this.point = { ...randomP, ...options };
    this.point.h = options.h ?? 0;
    this.point.size = 2;
    this.point.a = 0.5;
    this.inst = new PIXI__namespace.Graphics();
    this.target = { ...this.point };
    this.app.stage.addChild(this.inst);
  }
  randomPosition() {
    const x = this.app.view.width * Math.random();
    const y = this.app.view.height * Math.random();
    return { x, y };
  }
  distanceTo(node) {
    if (!node) {
      return [];
    }
    const { x, y } = node;
    const dx = this.point.x - (x ?? 0);
    const dy = this.point.y - (y ?? 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return [dx, dy, dist];
  }
  move(point) {
    this.queue.push(point);
  }
  render() {
    this.inst.clear();
    this.inst.beginFill(this.point.color);
    this.inst.alpha = this.point.a;
    this.inst.drawCircle(0, 0, this.point.size);
    this.inst.position.set(this.point.x, this.point.y);
  }
  moveTo(target) {
    const [dx, dy, d] = this.distanceTo(target);
    if (d > 1) {
      this.point.x -= dx / d * 0.1 * d;
      this.point.y -= dy / d * 0.1 * d;
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
      const last = this.queue.shift();
      if (last) {
        this.target.x = last.x ?? this.point.x;
        this.target.y = last.y ?? this.point.y;
        this.target.a = last.a ?? this.point.a;
        this.target.size = last.size ?? this.point.size;
        this.point.h = last.h ?? 0;
      } else {
        if (this.still) {
          this.point.x -= Math.sin(Math.random() * 3.142);
          this.point.y -= Math.sin(Math.random() * 3.142);
        } else {
          this.move({
            x: this.point.x + Math.random() * 50 - 25,
            y: this.point.y + Math.random() * 50 - 25
          });
        }
      }
    }
    let diff = this.point.size - this.target.size;
    this.point.size = Math.max(1, this.point.size - diff * 0.05);
    diff = this.point.a - this.target.a;
    this.point.a = Math.max(0.1, this.point.a - diff * 0.05);
  }
}
function setOrigin(config, width, height) {
  const { x, y } = config;
  switch (config.origin) {
    case "center":
      return {
        offsetX: x - width / 2,
        offsetY: y - height / 2
      };
    case "left-top":
      return {
        offsetX: x,
        offsetY: y
      };
    default:
      return {
        offsetX: x,
        offsetY: y
      };
  }
}

exports.Stage = Stage;
