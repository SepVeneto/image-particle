(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('pixi.js')) :
  typeof define === 'function' && define.amd ? define(['exports', 'pixi.js'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.IMAGE_PARTICLE = {}, global.PIXI));
})(this, (function (exports, PIXI) { 'use strict';

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
    for (let w = 0; w < width; ++w) {
      for (let h = 0; h < height; ++h) {
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
    origin: "left-top"
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
    shape = [];
    animateEnd = false;
    constructor(el) {
      this.app = new PIXI__namespace.Application({
        width: el.offsetWidth,
        height: el.offsetHeight,
        antialias: true,
        backgroundAlpha: 0,
        forceCanvas: true
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
            y: this.app.view.height / 2
          }));
        }
      }
      let i = 0;
      let d = 0;
      while (shape.length > 0) {
        i = Math.floor(Math.random() * shape.length);
        this.dots[d]?.move({
          h: 18
        });
        this.dots[d].still = true;
        this.dots[d]?.move({
          x: shape[i].x,
          y: shape[i].y,
          h: 0,
          a: 1
        });
        shape = shape.slice(0, i).concat(shape.slice(i + 1));
        d++;
      }
      for (let i2 = d; i2 < this.dots.length; ++i2) {
        if (!this.dots[i2].still) {
          continue;
        }
        this.dots[i2].still = false;
        this.dots[i2].move({
          x: this.app.view.width * Math.random(),
          y: this.app.view.height * Math.random()
        });
      }
    }
    start() {
      for (let i = 0; i < 100; ++i) {
        this.dots.push(new Dot(this.app));
      }
      this.app.ticker.maxFPS = 60;
      this.app.ticker.add(() => {
        this.render();
      });
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
          for (let w = 0; w < image.width; w += gap) {
            for (let h = 0; h < image.height; h += gap) {
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
    size;
    inst;
    app;
    alpha;
    target;
    queue = [];
    h = 0;
    step = 0.25;
    still = false;
    constructor(app, options) {
      this.app = app;
      const { x: rx, y: ry } = this.randomPosition();
      const x = options?.x ?? rx;
      const y = options?.y ?? ry;
      this.still = false;
      this.h = options?.h ?? 0;
      this.size = 3;
      this.inst = new PIXI__namespace.Graphics();
      this.alpha = 0.5;
      this.inst.beginFill(16777215);
      this.inst.alpha = this.alpha;
      this.inst.position.set(x, y);
      this.inst.drawCircle(0, 0, this.size);
      this.target = {
        x,
        y,
        h: 0,
        a: this.alpha
      };
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
      const dx = this.inst.x - (x ?? 0);
      const dy = this.inst.y - (y ?? 0);
      const dist = Math.sqrt(dx * dx + dy * dy);
      return [dx, dy, dist];
    }
    move(point) {
      this.queue.push(point);
    }
    render() {
      this.inst.alpha = this.target.a;
    }
    update() {
      const [dx, dy, d] = this.distanceTo(this.target);
      if (d > 1) {
        this.inst.x -= dx / d * 0.1 * d;
        this.inst.y -= dy / d * 0.1 * d;
      } else if (this.target.h && this.target.h > 0) {
        --this.target.h;
      } else {
        const last = this.queue.shift();
        if (last) {
          this.target.x = last.x ?? this.inst.x;
          this.target.y = last.y ?? this.inst.y;
          this.target.h = last.h ?? 0;
          this.target.a = last.a ?? this.alpha;
        }
        if (this.still) {
          this.inst.x -= Math.sin(Math.random() * 3.142);
          this.inst.y -= Math.sin(Math.random() * 3.142);
        } else {
          this.move({
            x: this.target.x + Math.random() * 50 - 25,
            y: this.target.y + Math.random() * 50 - 25
          });
        }
      }
    }
  }
  function setTimer(fn, time) {
    let timer = performance.now();
    function checkTime() {
      const curr = performance.now();
      if (curr - timer >= time) {
        timer = curr;
        fn();
      }
      requestAnimationFrame(checkTime);
    }
    requestAnimationFrame(checkTime);
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

  exports["default"] = Stage;
  exports.setTimer = setTimer;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
