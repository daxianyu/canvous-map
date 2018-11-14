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

export default class Grid {
  constructor(options) {
    const {
      data,
      height = 0,
      map,
      opacity = 1,
      useCache = true,
      width = 0,
      zooms = [3, 18],
      zIndex = 12,
      /* Covert raw point to x-y point */
      pointConverter,
    } = options;
    this.options = options;
    /* Create canvas. */
    this.canvas = document.createElement('canvas');
    this.canvas.height = height;
    this.canvas.width = width;
    this.map = map;
    this.ctx = this.canvas.getContext('2d');
    /* Create a layer who understands how to draw grids on canvas context. */
    this.data = data;
    this.layer = new CanvasGrid(this.ctx, {
      useCache, data, pointConverter: pointConverter || function(point) {
        return lngLatToXy(map, point);
      }
    });
    /* Inject CustomLayer plugin. */
    window.AMap.plugin('AMap.CustomLayer', () => {
      /* Create AMap custom layer with our canvas. */
      const customLayer = new window.AMap.CustomLayer(this.canvas, {
        opacity,
        zooms,
        zIndex,
      });
      this.customLayer = customLayer;
      /**
       * Assign custom layer's render function so that this function will be called
       * every time our canvas needs update.
       */
      customLayer.render = () => {
        /* Clear canvas. */
        this.canvas.width = this.canvas.width;
        /* Call layer's render function to draw grids. */
        this.layer.render();
      };
      /* Register customerLayer to map. */
      customLayer.setMap(map);
    });

    /** Stop rendering when dragging for it will cause disturbance */
    map.on('click', this.listenClick, this);
  }

  /** Remove events and remove custom layer */
  destroy() {
    this.map.off('click', this.listenClick, this);
    this.customLayer.setMap(null);
  }

  listenClick(point) {
    if(!this.options.onClick) return;
    this.layer.getNearestGrid(point.pixel, this.options.onClick);
  }

  /**
   * set options
   * @param {object} options
   * */
  setOptions = (options) => {
    const { data, useCache } = options;
    const newOptions = {
      useCache,
    };
    /* Data changes, canvas should reRender */
    if(this.data!==data) {
      newOptions.data = data;
      this.canvas.width = this.canvas.width;
    }
    this.layer.setOptions(newOptions);
    /* When data change, but AMap does not move or zoom inout */
    if(newOptions.data) {
      this.layer.render();
    }
    this.data = data;
  }
}
