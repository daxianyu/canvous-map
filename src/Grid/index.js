import { Grid as CanvasGrid } from 'canvas-mass';

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
    this.ctx = this.canvas.getContext('2d');
    /* Create a layer who understands how to draw grids on canvas context. */
    this.layer = new CanvasGrid(this.ctx, useCache);
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
        const grids = data.map(grid => {
          return {
            ...grid,
            /* Transform bound position from lng lat to canvas pixel. */
            bounds: {
              bottomLeft: lngLatToXy(map, grid.bounds.bottomLeft),
              topRight: lngLatToXy(map, grid.bounds.topRight),
            },
          };
        });
        /* Call layer's render function to draw grids. */
        this.layer.render(grids);
      };
      /* Register customerLayer to map. */
      customLayer.setMap(map);
    });
  }
}
