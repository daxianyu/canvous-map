import { Grid as CanvasGrid } from 'canvous';

function lngLatToXy(map, position) {
  const { lng, lat } = position;
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
    } = options;
    /* Create canvas. */
    this.canvas = document.createElement('canvas');
    this.canvas.height = height;
    this.canvas.width = width;
    this.map = map;
    this.ctx = this.canvas.getContext('2d');
    /* Create a layer who understands how to draw grids on canvas context. */
    const grids = this.convertData(data);
    this.data = data;
    this.layer = new CanvasGrid(this.ctx, {
      useCache, data: grids,
    });
    /* Inject CustomLayer plugin. */
    window.AMap.plugin('AMap.CustomLayer', () => {
      /* Create AMap custom layer with our canvas. */
      const customLayer = new window.AMap.CustomLayer(this.canvas, {
        opacity,
        zooms,
        zIndex,
      });
      /**
       * Assign custom layer's render function so that this function will be called
       * every time our canvas needs update.
       */
      customLayer.render = () => {
        /* Clear canvas. */
        this.canvas.width = width;
        this.layer.setOptions({
          data: this.convertData(data)
        })
        /* Call layer's render function to draw grids. */
        this.layer.render();
      };
      /* Register customerLayer to map. */
      customLayer.setMap(map);
    });
  }

  /**
   * convert lng-lat data to x-y data
   * options
   * */
  convertData = (data) => {
    return data.map(grid => {
      return {
        ...grid,
        /* Transform bound position from lng lat to canvas pixel. */
        bounds: {
          bottomLeft: lngLatToXy(this.map, grid.bounds.bottomLeft),
          topRight: lngLatToXy(this.map, grid.bounds.topRight),
        },
      };
    });
  };

  /**
   * set options
   * @param {object} options
   * */
  setOptions = (options) => {
    const { data, useCache } = options;
    this.data = data;
    const newOptions = {
      useCache,
    }
    this.layer.setOptions(newOptions)
  }
}
