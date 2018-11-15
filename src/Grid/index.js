import { Grid as CanvasGrid } from 'canvous';

/**
 * Coordinate transformation.
 * Transform lngLat to pixel.
 */
function lngLatToXy(map, position) {
  let { lng, lat } = position;
  if (Array.isArray(position)) {
    lng = position[0];
    lat = position[1];
  }

  const lngLat = new window.AMap.LngLat(lng, lat);
  return map.lngLatToContainer(lngLat);
}

function createDefaultCoordinateTransformation(map) {
  return (position) => {
    return lngLatToXy(map, position);
  };
}

export default class Grid {
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
      onClick,
      opacity = 1,
      useCache = true,
      width = 0,
      zIndex = 12,
      zooms = [3, 18],
    } = options;

    this.options = {
      data,
      coordinateTransformation,
      height,
      map,
      onClick,
      opacity,
      useCache,
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
    /* Create a layer who understands how to draw grids on canvas context. */
    this.canvasGrid = new CanvasGrid(this.ctx, {
      coordinateTransformation,
      data,
      useCache,
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
  }

  /**
   * Expose this funtion to change Grid UI and behaviours.
   */
  setOptions = (options) => {
    const {
      data = this.options.data,
      /**
       * Coordinate transformation function.
       * It consumes grid bounds and output x and y in pixel.
       */
      coordinateTransformation = this.options.coordinateTransformation,
      height = this.options.height,
      map = this.options.map,
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

    if (data !== this.options.data) {
      canvasGridNewOptions.data = data;
      shouldReRender = true;
    }

    if (coordinateTransformation !== this.options.coordinateTransformation) {
      canvasGridNewOptions.coordinateTransformation = coordinateTransformation;
      shouldReRender = true;
    }

    if (height !== this.options.height) {
      this.canvas.height = height;
      shouldReRender = true;
    }

    if (map !== this.options.map) {
      this.customLayer.setMap(map);
      /**
       * It might be not neccessary to call re-render function
       * because setMap will perform re-render automatically
       */
      /* shouldReRender = true; */
    }

    if (opacity !== this.options.opacity) {
      this.customLayer.setOpacity(opacity);
      shouldReRender = true;
    }

    if (useCache !== this.options.useCache) {
      canvasGridNewOptions.useCache = useCache;
      shouldReRender = true;
    }

    if (width !== this.options.width) {
      this.canvas.width = width;
      shouldReRender = true;
    }

    if (zIndex !== this.options.zIndex) {
      this.customLayer.setzIndex(zIndex);
      shouldReRender = true;
    }

    /* Update canvas grid options if options is not empty. */
    if (Object.keys(canvasGridNewOptions).length !== 0) {
      this.canvasGrid.setOptions(canvasGridNewOptions);
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
      onClick,
      opacity,
      useCache,
      width,
      zIndex,
    };
  }

  /* Remove events and remove custom layer. */
  destroy() {
    this.map.off('click', this.handleClick, this);
    this.customLayer.setMap(null);
  }

  /* Look for grids that has been clicked. */
  handleClick(point) {
    if (!this.options.onClick) return;
    this.canvasGrid.findGridsContainPoint(point.pixel, this.options.onClick);
  }

  /* Render function will be called every time canvas needs update (such as after drag and zoom). */
  render() {
    /* Clear canvas. */
    this.canvas.width = this.canvas.width;
    /* Call canvasGrid's render function to draw grids. */
    this.canvasGrid.render();
  }
}
