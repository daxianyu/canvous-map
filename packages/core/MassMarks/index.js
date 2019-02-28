import invariant from 'invariant';
import { kdTree as KdTree } from 'kd-tree-javascript';
import TdArray from '../base/2dArray';
import Scheduler from '../Scheduler';

const MAXSIZE = 30000;
// 13 layers
const MAX_NEAREST_COUNT = (2 ** 13) - 1;

function defaultCoordinateTransformation(point) {
  return point;
}

function kdDistance(a, b) {
  return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5;
}

/**
 * Draw mass points without block
 * */
export default class MassMarks extends Scheduler {
  constructor(ctx, options) {
    const {
      data,
      drawer,
      distance = kdDistance,
      dimension = ['x', 'y'],
      coordinateTransformation = defaultCoordinateTransformation,
      useKd = true,
      /** Set max layers of points
       * 1 layer: 1 point
       * 2 layer: 1 + 2 points
       * 3 layer: 1 + 2 + 4 + points
       * ...
       *  */
      layer = -1,
      radius = 1,
      lazy = true,
    } = options;
    invariant(
      Array.isArray(data),
      'Data should be array',
    );
    let processedData;
    let kdTree = null;
    if (useKd) {
      kdTree = MassMarks.generateKdTree(data, distance, dimension);
      processedData = MassMarks.generateBinaryData(kdTree);
    } else {
      processedData = MassMarks.generateNormalData(data);
    }
    super({ data: processedData, lazy });
    this.kdTree = kdTree;

    /** Canvas context */
    this.ctx = ctx;
    /**
     * Options should be kept for when new options given, compare.
     * */
    this.options = {
      data,
      drawer: drawer || this.drawer,
      distance,
      dimension,
      coordinateTransformation,
      useKd,
      layer,
      lazy,
      radius,
    };
    /**
     * start draw points
     * */
    this.start();
  }

  /** drawer
   * Draw point in canvas
   * */
  drawer = (point, ctx) => {
    const { x, y, fillColor, radius: pRadius } = point;
    const { height, width } = ctx.canvas;
    const lastFillColor = ctx.fillStyle;
    ctx.beginPath();
    const radius = pRadius || point.radius || this.options.radius;
    if (fillColor) {
      ctx.fillStyle = fillColor;
    }
    /* Exceed the range, not draw */
    if (
      x + radius < 0 ||
      y + radius < 0 ||
      x - radius > width ||
      y - radius > height
    ) {
      return;
    }
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
    ctx.fillStyle = lastFillColor;
  };

  dataHandler(index, data) {
    const point = this.options.coordinateTransformation(data);
    this.options.drawer(point, this.ctx);
  }

  shouldScheduleStop(index) {
    const { layer } = this.options;
    if (layer === -1) {
      return false;
    }
    return (index > 2 ** layer);
  }

  render() {
    this.start();
  }

  /**
   * Set options and restart render
   * every time it resets, it will be reRendered
   * @param {object} options
   * */
  setOptions(options) {
    const {
      data,
      drawer = this.options.drawer,
      layer = this.options.layer,
      lazy = this.options.lazy,
      useKd = this.options.useKd,
      radius = this.options.radius,
      distance = this.options.distance,
      dimension = this.options.dimension,
      coordinateTransformation = this.options.coordinateTransformation,
    } = options;
    this.lazy = lazy;
    this.options = {
      data: this.options.data,
      drawer,
      layer,
      lazy,
      useKd,
      radius,
      distance,
      dimension,
      coordinateTransformation,
    };

    if (data && this.options.data !== data) {
      this.options.data = data;
      invariant(
        Array.isArray(data),
        'Prop data should be array',
      );
      if (useKd) {
        this.kdTree = MassMarks.generateKdTree(data, distance, dimension);
        this.data = MassMarks.generateBinaryData(this.kdTree);
      } else {
        this.data = MassMarks.generateNormalData(data);
      }
    }
    this.render();
  }

  /**
   * Get nearest points
   * @param {object} center
   * @param {number} distance in range of
   * @param {number} count
   * */
  getNearest(center, distance, count = MAX_NEAREST_COUNT) {
    invariant(
      this.options.useKd,
      'Only support when useKd is True',
    );
    /** Only if useKd is true and data exists */
    if (this.options.useKd && this.kdTree) {
      return this.kdTree.nearest(center, count, distance);
    }
    return [];
  }

  /** Random data arrange if not use kd-tree
   * @param {array} dataList raw data
   * */
  static generateNormalData (dataList) {
    if (!dataList.length) {
      return new TdArray();
    }
    const newDataListArray = dataList.slice();
    newDataListArray.sort(() => (Math.random() - 0.5));
    return new TdArray(newDataListArray);
  }

  static generateKdTree(dataList, distance, dimensions) {
    if (!dataList.length) {
      return null;
    }
    return new KdTree(dataList, distance, dimensions);
  }

  /** Travel tree to generate array */
  static travelKdTree(kdTree) {
    const stack = new TdArray([kdTree.root], MAXSIZE);
    const listArraySet = new TdArray();
    // 2-d array

    // convert tree to binary heap
    while (stack.length) {
      // if stack is empty, exit
      const node = stack.shift();
      if (node.left) {
        stack.push(node.left);
      }
      listArraySet.push(node.obj);
      if (node.right) {
        stack.push(node.right);
      }
    }
    return listArraySet;
  }

  /** generate kdTree data and rearrange to binaryHeap */
  static generateBinaryData(kdTree) {
    if (kdTree === null) {
      return new TdArray();
    }
    return MassMarks.travelKdTree(kdTree);
  }
}
