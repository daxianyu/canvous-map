import { MassMarks as MassMarks2D } from 'canvas-mass';
import {
  convertToXy, getDistance
} from '../utils/utils';
const invariant = require('invariant')

export default class MassMarksDrawer {
  constructor(map, options, events = {
    onClick: null
  }) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    invariant(map, 'map is required')
    invariant(Array.isArray(options.points), 'points must be array')
    this.events = {...events};
    this.options = {...options};
    this.map = map
    this.canvas = canvas;
    // extract globally to avoid recalculation
    this.ctx = ctx;
    this.zoom = 3;
    this.pointRadius = options.radius || 1;
    this.massRenderer();
    // stop rendering when dragging for it will cause disturbance
    map.on('dragging', this.listenDragging, this);
    map.on('dragend', this.listenDragEnd, this);
    map.on('click', this.listenClick, this);
    map.on('mousemove', this.listenMouseMove, this);
  }

  setOption(options) {
    const { layer, points, radius = 1, speed, useKd, isFixedRadius=false } = options;
    const lastOptions = this.options;
    this.options = {...this.options, ...options};
    const { ctx, canvas } = this;
    if (points !== lastOptions.points ||
      (useKd !== lastOptions.useKd)
    ) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.massRenderer();
    } else if (layer !== lastOptions.layer) {
      if (layer < lastOptions.layer) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      this.pointRender.setLayer(layer);
    } else if (speed !== lastOptions.speed) {
      this.pointRender.setSpeed(speed);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.pointRender.restart();
    } else if (radius !== lastOptions.radius) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if(isFixedRadius) {
        this.pointRadius = radius
      } else {
        this.pointRadius = radius / this.map.getResolution()
      }
      this.pointRender.restart();
    }
  }

  setEvents(events) {
    const lastEvents= {...this.events}
    this.events = {...lastEvents, ...events}
  }

  destroy() {
    this.map.off('dragging', this.listenDragging, this);
    this.map.off('dragend', this.listenDragEnd, this);
    this.map.off('click', this.listenClick, this)
    this.map.off('mousemove', this.listenMouseMove, this)
  }

  listenDragging() {
    this.pointRender.stop();
  }

  listenDragEnd() {
    this.pointRender.start();
  }

  listenClick(point) {
    if(!this.events.onClick) return;
    const nearest = this.getNearestPoint(point)
    if(nearest) {
      this.events.onClick(nearest)
    }
  }

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
    let nearestPoint = this.pointRender.getNearest(lnglat, this.options.radius, 1)
    if(!nearestPoint.length) return
    nearestPoint = nearestPoint[0][0]
    return nearestPoint
  }

  /** re init renderer */
  massRenderer() {
    const AMap = window.AMap;
    const { map, canvas, ctx, options } = this;
    let { customLayer } = this;
    const { speed, useKd = false, layer, points = [], isFixedRadius } = options;

    // will unMount last MassRender
    if (this.pointRender) {
      this.pointRender.stop();
    }

    AMap.plugin('AMap.CustomLayer', () => {
      this.pointRender = new MassMarks2D(points, (point) => {
        const { x, y } = convertToXy(map, point);
        ctx.beginPath();
        ctx.arc(x, y, this.pointRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
      }, {
        speed,
        useKd,
        layer,
        distance: isFixedRadius? undefined: getDistance,
        dimension: isFixedRadius? undefined: ['lat', 'lng']
      });

      if (!customLayer) {
        customLayer = new AMap.CustomLayer(canvas, {
          zIndex: 12,
          zooms: [3, 18],
        });
        this.customLayer = customLayer;
        map.add(customLayer);
      }

      /**
       * reset zoom, canvas size, fillStyle
       * calculate latest pointRadius
       * */
      customLayer.render = ({ size, W }) => {
        const { height, width } = size;
        const { zoom } = W;
        this.zoom = zoom;
        const { radius, fillColor = 'black', isFixedRadius } = this.options
        // Int renders faster than float
        if (isFixedRadius) {
          this.pointRadius = radius;
        } else {
          this.pointRadius = radius / this.map.getResolution();
        }
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = fillColor;
        this.pointRender.restartMain();
      };
    });
  }
}
