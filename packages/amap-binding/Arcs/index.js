import { createDefaultCoordinateArrayTransformation } from '../utils/utils';
import { Arcs as CanvousArcs } from '../../core';

export default class Arcs {
  constructor(options) {
    const {
      data = [],
      /**
       * Coordinate transformation function.
       * It consumes output x and y in pixel.
       */
      coordinateTransformation = createDefaultCoordinateArrayTransformation(options.map),
      map,
      strokeWeight = 1,
      strokeColor = 'black',
      opacity = 1,
      lazy = true,
      zIndex = 12,
      /* L/R rate */
      rate = 0.5,
      zooms = [3, 18],
    } = options;

    this.options = {
      data,
      coordinateTransformation,
      map,
      opacity,
      zIndex,
      rate,
      lazy,
      zooms,
      strokeWeight,
      strokeColor,
    };

    /* Create canvas. */
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.map = map;
    this.canvasArcs = new CanvousArcs(this.ctx, {
      data,
      rate,
      lazy,
      coordinateTransformation,
    });

    /* Inject CustomLayer plugin. */
    window.AMap.plugin('AMap.CustomLayer', () => {
      /* Create AMap custom layer with our canvas. */
      this.customLayer = new window.AMap.CustomLayer(this.canvas, {
        opacity,
        zIndex,
        zooms,
      });
      /**
       * Assign custom layer's render function so that this function will be called
       * every time our canvas needs update.
       * 'this' referred to map
       */
      this.customLayer.render = this.render.bind(this);
      /* Register customerLayer to map. */
      this.customLayer.setMap(map);
    });
    map.on('dragging', this.listenDragging, this);
    map.on('dragend', this.listenDragEnd, this);
  }

  setOptions = (options) => {
    const {
      data = this.options.data,
      coordinateTransformation = this.options.coordinateTransformation,
      map = this.options.map,
      opacity = this.options.opacity,
      rate = this.options.rate,
      lazy = this.options.lazy,
      zIndex = this.options.zIndex,
      strokeWeight = this.options.strokeWeight,
      strokeColor = this.options.strokeColor,
    } = options;

    /* Save differential options only. */
    const canvasArcsNewOptions = {};
    /* If it is true, render function will be called to perform a re-render. */
    let shouldReRender = false;

    /**
     * Combine changed option props that will cause reRender together.
     * */
    const optionShouldRender = (key, newProp) => {
      const lastProp = this.options[key];
      if (lastProp !== newProp) {
        canvasArcsNewOptions[key] = newProp;
        shouldReRender = true;
      }
    };
    optionShouldRender('rate', rate);
    optionShouldRender('data', data);
    optionShouldRender('strokeColor', strokeColor);
    optionShouldRender('strokeWeight', strokeWeight);

    if (lazy !== this.options.lazy) {
      canvasArcsNewOptions.lazy = lazy;
    }

    if (opacity !== this.options.opacity) {
      this.customLayer.setOpacity(opacity);
      shouldReRender = true;
    }

    if (zIndex !== this.options.zIndex) {
      this.customLayer.setzIndex(zIndex);
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
    if (Object.keys(canvasArcsNewOptions).length !== 0) {
      this.canvasArcs.setOptions(canvasArcsNewOptions);
    }

    /* Save new options. Before render */
    this.options = {
      data,
      coordinateTransformation,
      map,
      opacity,
      lazy,
      rate,
      strokeColor,
      strokeWeight,
      zIndex,
    };

    /* Perform re-render. */
    if (shouldReRender) {
      this.render();
    }
  };

  /** Stop rendering when mouse dragging */
  listenDragging() {
    this.canvasArcs.pause();
  }

  listenDragEnd() {
    this.canvasArcs.continue();
  }

  /* Remove events and remove custom layer. */
  destroy() {
    this.map.off('dragging', this.listenDragging, this);
    this.map.off('dragend', this.listenDragEnd, this);
    this.customLayer.setMap(null);
  }

  /* Called every time when map view change or props updated */
  render() {
    const { width, height } = this.map.getSize();
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.lineWidth = this.options.strokeWeight;
    this.ctx.strokeStyle = this.options.strokeColor;
    this.canvasArcs.render();
  }
}
