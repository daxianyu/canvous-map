import Scheduler from '../Scheduler';
import TwoDArray from '../base/2dArray';

const invariant = require('invariant');

/**
 * Default coordinate transformation doesn't do anything.
 */
function defaultCoordinateTransformation(coordinate) {
  return coordinate;
}

function isBoundContainsPoint(point, x0, x1, y0, y1) {
  let { x, y } = point;
  /* Compatible with both object and array. */
  if (Array.isArray(point)) {
    x = point[0];
    y = point[1];
  }

  if (x >= x0 && x <= x1 && y >= y0 && y <= y1) {
    return true;
  }

  return false;
}

/* Class to render grid with or without border. */
export default class Grid extends Scheduler {
  constructor(ctx, options) {
    const {
      coordinateTransformation = defaultCoordinateTransformation,
      data = [],
      lazy = true,
      useCache = true,
    } = options;

    super({
      data: new TwoDArray(data),
      lazy,
    });
    /**
     * Coordinate transformation will be executed just before calling canvas api.
     * In most cases, coordinates (bounds for Grid) should have values in pixel, and it is not
     * necessary to transform coordinates. However, in some rare cases, performing coordinate
     * transformation here could bring notable performance improvement. Assume coordinates (bounds)
     * are defined in terms of lngLat, and it won't change ever since. Everytime user zooms or drag
     * map, one should loop through coordinates, perform coordinate transformation and feed Grid
     * with coordinates in pixel. However, if this coordinate transformation could be executed in
     * Grid just before calling canvas api, we boost render performance by escaping a loop.
     */
    this.ctx = ctx;
    this.imageCache = {};
    this.options = {
      data,
      lazy,
      useCache,
      coordinateTransformation,
    };
    /**
     * Every grid will be drawn on offscreen canvas first, then cached if required,
     * and finally copied to the screen canvas.
     * In this way, we could cache the entire grid image even though this grid is not
     * visible on screen. In the circumstance that this cached grid could be reused later,
     * it shows the grid image instead of a blank image.
     */
    this.offscreenGrid = window.document.createElement('canvas');
    this.offscreenCtx = this.offscreenGrid.getContext('2d');
  }

  /* Iterate all grids to find grids that contains this point. */
  findGridsContainPoint = (point, cb) => {
    const gridIds = [];
    const grids = [];

    /* TwoDArray does not support forEach yet */
    for (let i = 0; i < this.data.length; i += 1) {
      const grid = this.data.peep(i);
      const { bounds } = grid;
      const { bottomLeft, topRight } = bounds;
      const { coordinateTransformation } = this.options;
      const { x: x0, y: y1 } = coordinateTransformation(bottomLeft);
      const { x: x1, y: y0 } = coordinateTransformation(topRight);

      if (isBoundContainsPoint(point, x0, x1, y0, y1)) {
        gridIds.push(i);
        grids.push(grid);
      }
    }
    /* Returns a list of grid ids and grid objects */
    return cb(gridIds, grids);
  }

  drawGrid(grid) {
    const {
      bounds = {},
      borderColor,
      color = 'black',
    } = grid;
    const { coordinateTransformation } = this.options;
    const { bottomLeft, topRight } = bounds;
    invariant(bottomLeft, 'bounds must have prop bottomLeft');
    invariant(topRight, 'bounds must have prop topRight');
    /**
     * Assume topLeft bound point as (x0, y0), bottomRight bound point as (x1, y1).
     * BottomLeft and topRight bound points coordinates.
     */
    const { x: x0, y: y1 } = coordinateTransformation(bottomLeft);
    const { x: x1, y: y0 } = coordinateTransformation(topRight);
    /* Decimal point would raise performance and platform consistency issues on canvas. */
    const width = Math.round(x1 - x0);
    const height = Math.round(y1 - y0);
    this.drawGridOnScreen(x0, y0, width, height, color, borderColor);
  }

  dataHandler(index, data) {
    this.drawGrid(data);
  }
  /**
   * Render many grids. Calling this function draws grids.
   * @param {object[]} grids - Represents a list of grids.
   * @param {object}   grids[].bounds - Grid boundary.
   * @param {object}   grids[].bounds.bottomLeft - Grid bottom left point in the coordinate system.
   * @param {number}   grids[].bounds.bottomLeft.x - Grid bottom left point horizontal coordinate value.
   * @param {number}   grids[].bounds.bottomLeft.y - Grid bottom left point vertical coordinate value.
   * @param {object}   grids[].bounds.topRight - Grid top right point in the coordinate system.
   * @param {number}   grids[].bounds.topRight.x - Grid top right point horizontal coordinate value.
   * @param {number}   grids[].bounds.topRight.y - Grid top right point vertical coordinate value.
   * @param {string}   [grids[].borderColor] - Grid outline colour.
   * @param {string}   [grids[].color=black] - Grid background colour.
   *
   * grid format:
   * 1. bounds: {bottomLeft: {x, y}, topRight: {x, y}}.
   * 2. borderColor: outline colour.
   * 3. color: background colour.
   * */

  render = () => {
    this.start();
  }

  /**
   * This is the only API to modify grid.
   * New options will be merged with old options, such that one could update grid by calling
   * this API with differentials.
   */
  setOptions = (options) => {
    const {
      data = this.options.data,
      lazy = this.options.lazy,
      useCache = this.options.useCache,
      coordinateTransformation = this.options.coordinateTransformation,
    } = options;
    if (this.options.data !== data) {
      this.data = new TwoDArray(data);
    }
    this.lazy = lazy;
    this.options = {
      data,
      lazy,
      useCache,
      coordinateTransformation,
    };
  }

  /* Draw a single grid. */
  drawGridOnScreen(x, y, width, height, color, borderColor) {
    const { ctx, imageCache, options } = this;
    const { useCache } = options;
    /* Skip if any one of width or height is 0. */
    if (!width || !height) return;
    /* Grids have the same width, height, color and borderColor will be reused. */
    const cacheKey = `${width},${height},${color},${borderColor},`;
    if (useCache && imageCache.hasOwnProperty(cacheKey)) {
      /* Use cached image. */
      const cache = imageCache[cacheKey];
      ctx.putImageData(cache, x, y);
    } else {
      /**
       * Draw offscreenGrid so that a full grid image will be created even though
       * it isn't visible on screen.
       */
      const gridImage = this.drawOffscreenGrid(width, height, color, borderColor);
      ctx.putImageData(gridImage, x, y);
      if (useCache) {
        /* Save image in cache. */
        imageCache[cacheKey] = gridImage;
      }
    }
  }

  /**
   * Draw a single grid on an offscreen canvas.
   * The size of the grid should match exactly the size of the canvas.
   */
  drawOffscreenGrid(width, height, color, borderColor) {
    const canvas = this.offscreenGrid;
    const ctx = this.offscreenCtx;
    /* Clear canvas and adjust the size appropriate to the grid. */
    canvas.width = width;
    canvas.height = height;
    /* Call canvas api to draw grid. */
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    /* Draw border if border colour is defined. */
    if (borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.strokeRect(0, 0, width, height);
    }
    return ctx.getImageData(0, 0, width, height);
  }
}
