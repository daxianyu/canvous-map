import { createDefaultCoordinateTransformation } from '../utils/utils';
import { Arcs as CanvousArcs } from 'canvous';

export default class Arcs {
  constructor(options) {
    const {
      data = [],
      /**
       * Coordinate transformation function.
       * It consumes grid bounds and output x and y in pixel.
       */
      coordinateTransformation = createDefaultCoordinateTransformation(options.map),
      height = 0,
      map,
      opacity = 1,
      width = 0,
      zIndex = 12,
      zooms = [3, 18],
    } = options;

    this.options = {
      data,
      coordinateTransformation,
      height,
      map,
      opacity,
      width,
      zIndex,
      zooms,
    };

    /* Create canvas. */
    this.canvas = document.createElement('canvas');
    this.canvas.height = height;
    this.canvas.width = width;
    this.ctx = this.canvas.getContext('2d');
    this.map = map;
    this.canvasArcs = new CanvousArcs(this.ctx, {
      data,
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
  }

  setOptions = (options) => {
    const {
      data = this.options.data,
      coordinateTransformation = this.options.coordinateTransformation,
      height = this.options.height,
      map = this.options.map,
      opacity = this.options.opacity,
      width = this.options.width,
      zIndex = this.options.zIndex,
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
    optionShouldRender('data', data);
    optionShouldRender('coordinateTransformation', coordinateTransformation);

    if (height !== this.options.height) {
      this.canvas.height = height;
      shouldReRender = true;
    }

    if (width !== this.options.width) {
      this.canvas.width = width;
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

    if (map !== this.options.map) {
      this.customLayer.setMap(map);
      /**
       * It might be not neccessary to call re-render function
       * because setMap will perform re-render automatically
       */
      shouldReRender = false;
    }

    /* Update canvas grid options if options is not empty. */
    if (Object.keys(canvasArcsNewOptions).length !== 0) {
      this.canvasGrid.setOptions(canvasArcsNewOptions);
    }

    /* Perform re-render. */
    if (shouldReRender) {
      this.render();
    }

    /* Save new options. */
    this.options = {
      data,
      coordinateTransformation,
      height,
      map,
      opacity,
      width,
      zIndex,
    };
  };

  /* Remove events and remove custom layer. */
  destroy() {
    this.customLayer.setMap(null);
  }

  /* Called every time when map view change or props updated */
  render() {
    this.canvasArcs.render();
  }
}
