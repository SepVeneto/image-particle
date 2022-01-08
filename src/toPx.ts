export function rgbToGray(img: number[], width: number, height: number) {
  const gray: number[][] = new Array(width).fill('').map(() => []);
  for (let h = 0; h < height; ++h) {
    for (let w = 0; w < width; ++w) {
      const pos = (width * h + w) * 4
      gray[w][h] = 0.3 * img[pos] + 0.59 * img[pos + 1] + 0.11 * img[pos + 2]
    }
  }
  return gray;
}

export enum DIRECT {
  left,
  right
}

function isZone(x: number, y: number, width: number, height: number) {
  return x < 0 || y < 0 || x >= width || y >= height
}

function calDiff(img: number[][], current: number[], step: number[]) {
  const cx = current[DIRECT.left];
  const cy = current[DIRECT.right];
  const sx = step[DIRECT.left];
  const sy = step[DIRECT.right];
  return Math.abs(img[cx][cy] - img[sx][sy])
}

export function regionGrow(grayImg: number[][], seeds: number[][], thresh: number) {
  const width = grayImg.length
  const height = grayImg[0].length
  const direct = [[-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0]];
  const seedMark: boolean[][] = new Array(width).fill('').map(() => [])
  const seedList = [...seeds]

  while (seedList.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const current = seedList.pop()!
    direct.forEach(([dx, dy]) => {
      const stepX = current[DIRECT.left] + dx;
      const stepY = current[DIRECT.right] + dy;
      if (isZone(stepX, stepY, width, height)) {
        return;
      }
      const diff = calDiff(grayImg, current, [stepX, stepY])
      if (diff < thresh && !seedMark[stepX][stepY]) {
        seedMark[stepX][stepY] = true;
        seedList.push([stepX, stepY])
      }
    })
  }
  return seedMark
}
