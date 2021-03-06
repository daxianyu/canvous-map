import { Grid as CanvasGrid } from '../../core';
import { createDefaultCoordinateTransformation } from '../utils/utils';

export default class Grid {
  constructor(options) {
    const {
      data = [],
      /**
       * Coordinate transformation function.
       * It consumes grid bounds and output x and y in pixel.
       */
      coordinateTransformation = createDefaultCoordinateTransformation(options.map),
      map,
      lazy,
      onClick,
      opacity = 1,
      useCache = true,
      zIndex = 12,
      zooms = [3, 18],
    } = options;

    this.options = {
      data,
      coordinateTransformation,
      map,
      lazy,
      onClick,
      opacity,
      useCache,
      zIndex,
      zooms,
    };
    /* Create canvas. */
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.map = map;
    /* Create a layer who understands how to draw grids on canvas context. */
    this.canvasGrid = new CanvasGrid(this.ctx, {
      coordinateTransformation,
      data,
      useCache,
      lazy,
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

    /* Stop rendering when dragging because it will cause disturbance. */
    map.on('click', this.handleClick, this);
    map.on('dragging', this.listenDragging, this);
    map.on('dragend', this.listenDragEnd, this);
  }

  /**
   * Expose this funtion to change Grid UI and behaviours.
   */
  setOptions = (options) => {
    const {
      data = this.options.data,
      coordinateTransformation = this.options.coordinateTransformation,
      height = this.options.height,
      map = this.options.map,
      lazy = this.options.lazy,
      onClick = this.options.onClick,
      opacity = this.options.opacity,
      useCache = this.options.useCache,
      width = this.options.width,
      zIndex = this.options.zIndex,
      /* There is no api to update zooms  */
      /* zooms = this.options.zooms, */
    } = options;

    /* Save differential options only. */
    const canvasGridNewOptions = {};
    /* If it is true, render function will be called to perform a re-render. */
    let shouldReRender = false;

    /**
     * Combine changed option props that will cause reRender together.
     * */
    const optionShouldRender = (key, newProp) => {
      const lastProp = this.options[key];
      if (lastProp !== newProp) {
        canvasGridNewOptions[key] = newProp;
        shouldReRender = true;
      }
    };

    optionShouldRender('data', data);
    optionShouldRender('useCache', useCache);
    optionShouldRender('coordinateTransformation', coordinateTransformation);

    /* Lazy Change will not cause reRender force */
    if (lazy !== this.options.lazy) {
      canvasGridNewOptions.lazy = lazy;
    }

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
    if (Object.keys(canvasGridNewOptions).length !== 0) {
      this.canvasGrid.setOptions(canvasGridNewOptions);
    }

    /* Save new options. Before render */
    this.options = {
      data,
      coordinateTransformation,
      height,
      map,
      lazy,
      onClick,
      opacity,
      useCache,
      width,
      zIndex,
    };

    /* Perform re-render. */
    if (shouldReRender) {
      this.render(map);
    }
  };

  /* Remove events and remove custom layer. */
  destroy() {
    this.map.off('dragging', this.listenDragging, this);
    this.map.off('dragend', this.listenDragEnd, this);
    this.map.off('click', this.handleClick, this);
    this.customLayer.setMap(null);
  }

  /* Look for grids that has been clicked. */
  handleClick(point) {
    if (!this.options.onClick) return;
    this.canvasGrid.findGridsContainPoint(point.pixel, this.options.onClick);
  }

  /** Stop rendering when mouse dragging */
  listenDragging() {
    this.canvasGrid.pause();
  }

  listenDragEnd() {
    this.canvasGrid.continue();
  }

  /* Render function will be called every time canvas needs update (such as after drag and zoom). */
  render() {
    const size = this.map.getSize();
    /* Clear canvas and resize if map size changed. */
    this.canvas.width = size.width;
    this.canvas.height = size.height;

    /* Call canvasGrid's render function to draw grids. */
    this.canvasGrid.render();
  }
}
