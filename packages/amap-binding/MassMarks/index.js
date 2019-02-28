import { convertToXy, getDistance } from '../utils/utils';
import { MassMarks as MassMarks2D } from '../../core';

const invariant = require('invariant');

export default class MassMarksDrawer {
  constructor(options) {
    const {
      map,
      data,
      drawer,
      useKd,
      layer,
      radius = 1,
      opacity = 1,
      blendMode = 'source-over',
      zIndex = 12,
    } = options;
    const AMap = window.AMap;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    invariant(
      map,
      'map is required',
    );
    invariant(
      Array.isArray(data),
      'points must be array',
    );
    this.options = { ...options };
    this.map = map;
    this.canvas = canvas;

    /** Extract globally to avoid recalculation */
    this.ctx = ctx;
    AMap.plugin('AMap.CustomLayer', () => {
      this.pointRender = new MassMarks2D(ctx, {
        data,
        drawer,
        useKd,
        layer,
        radius,
        coordinateTransformation: (point) => {
          const newPoint = convertToXy(map, point);
          return { ...point, ...newPoint };
        },
        /** Radius is fixed or not is unRelevant to unit */
        distance: getDistance,
        dimension: ['lat', 'lng'],
      });

      this.customLayer = new AMap.CustomLayer(canvas, {
        zIndex,
        opacity,
        zooms: [3, 18],
      });
      this.customLayer.render = this.render.bind(this);
      this.customLayer.setMap(map);
    });

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
    const {
      map = this.options.map,
      blendMode = this.options.blendMode,
      layer = this.options.layer,
      data = this.options.layer,
      radius = this.options.radius,
      useKd = this.options.useKd,
      opacity = this.options.opacity,
      onClick = this.options.onClick,
      onHover = this.options.onHover,
      isFixedRadius = this.options.isFixedRadius,
      fillColor = this.options.fillColor,
      zIndex = this.options.zIndex,
    } = options;

    /* Save differential options only. */
    const canvasNewOptions = {};

    /* If it is true, render function will be called to perform a re-render. */
    let shouldReRender = false;

    /**
     * Combine changed option props that will cause reRender together.
     * */
    const optionShouldRender = (key, newProp) => {
      const lastProp = this.options[key];
      if (lastProp !== newProp) {
        canvasNewOptions[key] = newProp;
        shouldReRender = true;
      }
    };

    optionShouldRender('layer', layer);
    optionShouldRender('blendMode', blendMode);
    optionShouldRender('data', data);
    optionShouldRender('radius', radius);
    optionShouldRender('useKd', useKd);
    optionShouldRender('isFixedRadius', isFixedRadius);
    optionShouldRender('fillColor', fillColor);

    if (isFixedRadius !== this.options.isFixedRadius) {
      shouldReRender = true;
    }

    if (opacity !== this.options.opacity) {
      this.customLayer.setOpacity(opacity);
      shouldReRender = true;
    }

    if (zIndex !== this.options.zIndex) {
      this.customLayer.setzIndex(zIndex);
      shouldReRender = true;
    }

    /**
     * Radius and isFixed are relative;
     * */
    if (radius !== this.options.radius || isFixedRadius !== this.options.isFixedRadius) {
      if (radius !== undefined) {
        let pointRadius = radius;
        if (typeof radius === 'function') {
          pointRadius = radius(this.map);
        } else if (!isFixedRadius) {
          pointRadius = radius / this.map.getResolution();
        }
        pointRadius = Math.ceil(pointRadius);
        canvasNewOptions.radius = pointRadius;
      } else {
        canvasNewOptions.radius = undefined;
      }
      shouldReRender = true;
    }

    if (map !== this.options.map) {
      this.customLayer.setMap(map);
      /**
       * It might be not neccessary to call re-render function
       * because setMap will perform re-render automatically
       */
      shouldReRender = false;
    }

    /* Update canvas options if options is not empty. */
    if (Object.keys(canvasNewOptions).length !== 0) {
      /** Raw radius should be kept in this.options,
       * and the processed radius delivered to pointRender */
      this.pointRender.setOptions(canvasNewOptions);
    }

    this.options = {
      map,
      layer,
      data,
      radius,
      useKd,
      onClick,
      onHover,
      isFixedRadius,
      fillColor,
      zIndex,
      blendMode,
    };

    /* Perform re-render. */
    if (shouldReRender) {
      this.render();
    }
  }

  /** Remove events and remove custom layer */
  destroy() {
    this.map.off('dragging', this.listenDragging, this);
    this.map.off('dragend', this.listenDragEnd, this);
    this.map.off('click', this.listenClick, this);
    this.map.off('mousemove', this.listenMouseMove, this);
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
    if (!this.options.onClick) return;
    const nearest = this.getNearestPoint(point);
    if (nearest) {
      this.options.onClick(nearest);
    }
  }

  /**
   * If hovering on point, should not trigger another
   * onHover handler.
   * If two point is adjoin, we should save
   * latest nearest point to compare.
   * */
  $$hoveringPoint = null;

  /** Add mouse pointer when points detected nearby */
  listenMouseMove(point) {
    const nearest = this.getNearestPoint(point);
    const container = this.map.getContainer();
    if (nearest) {
      container.style.cursor = 'pointer';
      if (this.$$hoveringPoint !== nearest) {
        this.$$hoveringPoint = nearest;
        if (this.options.onHover) {
          this.options.onHover(point, nearest);
        }
      }
    } else {
      this.$$hoveringPoint = null;
      delete container.style.cursor;
    }
  }

  getNearestPoint = (point) => {
    const { lnglat } = point;
    let nearestPoint;
    let { radius } = this.options;
    const { isFixedRadius } = this.options;
    /** If point in lng-lat, but radius is fixed,
     * px should transform to actual distance.
     * 2x range
     * */
    if (typeof radius === 'function') {
      let pointRadius = radius(this.map);
      if (isFixedRadius) {
        pointRadius *= this.map.getResolution();
      }
      nearestPoint = this.pointRender.getNearest(lnglat, pointRadius, 1);
    } else {
      if (isFixedRadius) {
        radius *= this.map.getResolution();
      }
      nearestPoint = this.pointRender.getNearest(lnglat, radius, 1);
    }
    if (!nearestPoint.length) return;
    nearestPoint = nearestPoint[0][0];
    return nearestPoint;
  }

  render = () => {
    const size = this.map.getSize();
    const { canvas, ctx } = this;
    const { height, width } = size;
    const { radius, fillColor, isFixedRadius, blendMode } = this.options;
    let pointRadius = radius;
    if (typeof radius === 'function') {
      pointRadius = radius(this.map);
    } else if (!isFixedRadius) {
      /* Int renders faster than float */
      pointRadius = Math.ceil(radius / this.map.getResolution());
    }
    /* TODO: change compare method */
    if (pointRadius !== this.pointRender.options.radius) {
      this.pointRender.setOptions({
        radius: pointRadius,
      });
    }
    // Resize and will clear canvas.
    canvas.width = width;
    canvas.height = height;
    if (fillColor) {
      ctx.fillStyle = fillColor;
    }
    ctx.globalCompositeOperation = blendMode;
    this.pointRender.render();
  };
}
