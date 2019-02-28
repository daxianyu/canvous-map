/**
 * @param matrix - two dimensional array
 * [[1 2 3], [1 2 1], [0 1 1]]
 * @param vector
 * @return {*}
 */
function matrixMultipleVector(matrix, vector) {
  return matrix.map(row => {
    return row.reduce((sum, cell, i) => {
      return sum + cell * (vector[i] || 0);
    }, 0);
  });
}

function matrixMultiplication(a, b) {
  return a.map((row) => {
    return row.map((_, i) => {
      return row.reduce((sum, cell, j) => {
        return sum + cell * b[j][i];
      }, 0);
    });
  });
}

/**
 * Rotation matrix.
 * @param rad
 * @return {*[]}
 */
function getRotateMatrix(rad) {
  const cosRad = Math.cos(rad);
  const sinRad = Math.sin(rad);
  return [
    [cosRad, -sinRad, 0],
    [sinRad, cosRad, 0],
    [0, 0, 1],
  ];
}

/**
 * Scale matrix.
 * @param scale
 * @return {*[]}
 */
function getScaleMatrix(scale) {
  return [
    [scale, 0, 0],
    [0, scale, 0],
    [0, 0, 0],
  ];
}

/**
 * Translation matrix.
 * @param center
 * @return {*[]}
 */
function getTranslationMatrix(center) {
  const [x, y] = center;
  return [
    [1, 0, x],
    [0, 1, y],
    [0, 0, 0],
  ];
}

/**
 * Given two points, return midperpandicular func
 * */
function getMidperpandicular(point1, point2) {
  let { x: x1, y: y1 } = point1;
  let { x: x2, y: y2 } = point2;
  if (Array.isArray(point1)) {
    x1 = point1[0];
    y1 = point1[1];
  }
  if (Array.isArray(point2)) {
    x2 = point2[0];
    y2 = point2[1];
  }

  if (x1 === x2 && y1 === y2) {
    throw new Error('Points should not be same!');
  }

  const stringLength = ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5;
  if (x1 === x2) {
    return function getCenters(rate) {
      if (rate > 2 || rate < 0) {
        throw new Error('Rate of L/R should not larger than 2 or small than 0');
      }
      const y = (y1 + y2) / 2;
      const R = stringLength / rate;
      const distance = (R ** 2 - (stringLength / 2) ** 2) ** 0.5;
      return {
        centers: [[x1 - distance, y], [x1 + distance, y]],
        radius: R,
      };
    };
  }

  if (y1 === y2) {
    return function getCenters(rate) {
      if (rate > 2 || rate < 0) {
        throw new Error('Rate of L/R should not larger than 2 or small than 0');
      }
      const x = (x1 + x2) / 2;
      const R = stringLength / rate;
      const distance = (R ** 2 - (stringLength / 2) ** 2) ** 0.5;
      return {
        centers: [[x, y1 - distance], [x, y1 + distance]],
        radius: R,
      };
    };
  }

  /**
   * point1-center relation and point2-center relation
   * (x - x1)^2 + (y - y1)^2 = (x - x2)^2 + (y - y2) ^ 2
   * we obtain relationship: x + ky = c
   * */
  const c = (x2 ** 2 - x1 ** 2 + y2 ** 2 - y1 ** 2) / (2 * (x2 - x1));
  const k = (y1 - y2) / (x1 - x2);
  /**
   * With Simultaneous equations of circle function
   * and point-center distance, we get another function Ay^2 + By + C = 0
   * */
  const A = (k ** 2 + 1);
  const B = 2 * (x1 * k - c * k - y1);

  /* L/R rate */
  return function getCenters(rate) {
    if (rate > 2 || rate < 0) {
      throw new Error('Rate of L/R should not larger than 2 or small than 0');
    }
    // TODO: rate = 0 to draw line;
    const R = stringLength / rate;
    const C = x1 ** 2 + y1 ** 2 - 2 * c * x1 + c ** 2 - R ** 2;
    const partOfRoot = (B ** 2 - 4 * A * C) ** 0.5;
    const y = (-B + partOfRoot) / (2 * A);
    const x = c - k * y;
    const ySharp = (-B - partOfRoot) / (2 * A);
    const xSharp = c - k * ySharp;
    return {
      centers: [[x, y], [xSharp, ySharp]],
      radius: R,
    };
  };
}

/**
 * Constrain angle to [0, 2 * PI]
 */
function mapAngleToRangeOf2Pi(angle) {
  while (angle < 0) {
    angle += 2 * Math.PI;
  }
  return angle % (2 * Math.PI);
}

/**
 * return the angle of vector, and lays between [0, 2 * PI]
 * @param vector
 * @return {*}
 */
function getRadOfVector(vector) {
  const [x, y] = vector;
  const rad = Math.atan(y / x);
  if (x <= 0) {
    return Math.PI + rad;
  }
  return mapAngleToRangeOf2Pi(rad);
}

/**
 * Return the length of a vector.
 * @param x
 * @param y
 */
function getVectorLength([x, y]) {
  return (x ** 2 + y ** 2) ** 0.5;
}

/**
 * Using calculated or relative point and radius,
 * to calculate new center and radius.
 * @param points
 * @param center - relative center,
 * @param radius
 * @return {{radius: number, center: *}}
 */
function getTransformedRadiusAndCenter(points, center, radius) {
  const [point1, point2] = points;
  let { x: x1, y: y1 } = point1;
  let { x: x2, y: y2 } = point2;
  if (Array.isArray(point1)) {
    x1 = point1[0];
    y1 = point1[1];
  }
  if (Array.isArray(point2)) {
    x2 = point2[0];
    y2 = point2[1];
  }
  const vector = [x2 - x1, y2 - y1];
  const stringLength = getVectorLength(vector);

  const rad = getRadOfVector(vector);
  const rotate = getRotateMatrix(rad);
  const scale = getScaleMatrix(stringLength);
  const translation = getTranslationMatrix(point1);

  const scaledCenter = matrixMultipleVector(scale, center);
  const rotatedCenter = matrixMultipleVector(rotate, scaledCenter);
  const translatedCenter = matrixMultipleVector(translation, [rotatedCenter[0], rotatedCenter[1], 1]);

  return {
    radius: stringLength * radius,
    center: translatedCenter,
  };
}

export {
  getMidperpandicular,
  getRadOfVector,
  getTransformedRadiusAndCenter,
  mapAngleToRangeOf2Pi,
};
