import { MassMarks as MassMarks2D } from 'canvas-mass';
import {
  convertToXy, getDistance
} from '../utils/utils';
const invariant = require('invariant')

export default class MassMarksDrawer {
  constructor(options) {
    const {
      map, data,
    } = options;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    invariant(
      map,
      'map is required'
    );
    invariant(
      Array.isArray(data),
      'points must be array'
    );
    this.options = {...options};
    this.map = map;
    this.canvas = canvas;

    /** Extract globally to avoid recalculation */
    this.ctx = ctx;
    this.zoom = 3;
    this.pointRadius = options.radius || 1;
    this.render();

    /** Stop rendering when dragging for it will cause disturbance */
    map.on('dragging', this.listenDragging, this);
    map.on('dragend', this.listenDragEnd, this);
    map.on('click', this.listenClick, this);
    map.on('mousemove', this.listenMouseMove, this);
  }

  /**
   * Filter map, events, should not transfer to MassMarks2D
   * */
  setOption(options) {
    const { radius, isFixedRadius=false, ...rest } = options;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Object.assign(this.options, options)
    const newOptions = rest;
    if(radius !== undefined) {
      let pointRadius = radius;
      if(!isFixedRadius) {
        pointRadius = pointRadius / this.map.getResolution();
      }
      newOptions.radius = Math.ceil(pointRadius);
    }
    this.pointRender.setOptions(newOptions);
  }

  /** Remove events and remove custom layer */
  destroy() {
    this.map.off('dragging', this.listenDragging, this);
    this.map.off('dragend', this.listenDragEnd, this);
    this.map.off('click', this.listenClick, this)
    this.map.off('mousemove', this.listenMouseMove, this)
    this.customLayer.setMap(null);
  }

  /** Stop rendering when mouse dragging */
  listenDragging() {
    this.pointRender.pause();
  }

  listenDragEnd() {
    this.pointRender.continue();
  }

  listenClick(point) {
    if(!this.options.onClick) return;
    const nearest = this.getNearestPoint(point)
    if(nearest) {
      this.options.onClick(nearest)
    }
  }

  /** Add mouse pointer when points detected nearby */
  listenMouseMove(point) {
    const nearest = this.getNearestPoint(point)
    const container = this.map.getContainer()
    if(nearest) {
      container.style.cursor = 'pointer';
    } else {
      delete container.style.cursor;
    }
  }

  getNearestPoint(point) {
    const { lnglat } = point
    let { radius, isFixedRadius } = this.options
    /** If point in lng-lat, but radius is fixed,
     * px should transform to actual distance.
     * 2x range
     * */
    if(isFixedRadius) {
      radius = radius * this.map.getResolution()
    }
    let nearestPoint = this.pointRender.getNearest(lnglat, radius, 1);
    if(!nearestPoint.length) return;
    nearestPoint = nearestPoint[0][0];
    return nearestPoint
  }

  /** ReInit renderer */
  render() {
    const AMap = window.AMap;
    const { map, canvas, ctx, options } = this;
    let { customLayer } = this;
    const { speed, useKd, layer, data = [], isFixedRadius } = options;

    /** Will unMount last MassRender */
    if (this.pointRender) {
      this.pointRender.pause();
    }

    AMap.plugin('AMap.CustomLayer', () => {
      this.pointRender = new MassMarks2D(ctx, {
        data,
        speed,
        useKd,
        layer,
        pointConverter: (point) => {
          return convertToXy(map, point);
        },
        /** Radius is fixed or not is unRelevant to unit */
        distance: getDistance,
        dimension: ['lat', 'lng']
      });

      if (!customLayer) {
        customLayer = new AMap.CustomLayer(canvas, {
          zIndex: 12,
          zooms: [3, 18],
        });
        this.customLayer = customLayer;
      }

      /**
       * Reset zoom, canvas size, fillStyle
       * calculate latest pointRadius
       * */
      customLayer.render = ({ size, W }) => {
        const { height, width } = size;
        const { zoom } = W;
        this.zoom = zoom;
        const { radius, fillColor = 'black', isFixedRadius } = this.options
        /** Int renders faster than float */
        let pointRadius = radius;
        if (!isFixedRadius) {
          pointRadius = Math.ceil(radius / this.map.getResolution());
        }
        this.pointRender.setOptions({
          radius: pointRadius,
        });
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = fillColor;
        this.pointRender.render();
      };
      customLayer.setMap(map)
    });
  }
}
