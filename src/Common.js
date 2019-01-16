import { createDefaultCoordinateArrayTransformation } from './utils/utils';

/**
 * This class focus only focus on CustomLayer props,
 * delivery canvous props to CanvousComponent.
 * so this CanvousMap layer is light.
 */
class Common {
  constructor(CanvousComponent, options) {
    const {
      data = [],
      /**
       * Coordinate transformation function.
       * It consumes output x and y in pixel.
       */
      coordinateTransformation = createDefaultCoordinateArrayTransformation(options.map),
      map,
      opacity = 1,
      zIndex = 12,
      /* L/R rate */
      zooms = [3, 18],
      ...restOptionsForCanvous
    } = options;

    this.options = {
      map,
      opacity,
      zIndex,
      zooms,
    };

    /* Create canvas. */
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.map = map;
    this.canvous = new CanvousComponent(this.ctx, {
      data,
      coordinateTransformation,
      ...restOptionsForCanvous,
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

  /**
   * Only compare customLayer props here,
   * Canvous props mutation compare in canvous.
   * @param options
   */
  setOptions = (options) => {
    const {
      /* Map seem as invariant */
      map,
      /* Amap props */
      opacity = this.options.opacity,
      zIndex = this.options.zIndex,
      zooms,
      /* Amap props */
      ...canvousOptions
    } = options;
    /* Save new options. */
    this.options = {
      opacity,
      zIndex,
    };

    if (opacity !== this.options.opacity) {
      this.customLayer.setOpacity(opacity);
    }

    if (zIndex !== this.options.zIndex) {
      this.customLayer.setzIndex(zIndex);
    }
    this.canvous.setOptions(canvousOptions);
  };

  /** Stop rendering when mouse dragging */
  listenDragging() {
    this.canvous && this.canvous.pause();
  }

  listenDragEnd() {
    this.canvous && this.canvous.continue();
  }

  /* Remove events and remove custom layer. */
  destroy = () => {
    this.map.off('dragging', this.listenDragging, this);
    this.map.off('dragend', this.listenDragEnd, this);
    this.customLayer.setMap(null);
  };

  mount = () => {
    this.map.on('dragging', this.listenDragging, this);
    this.map.on('dragend', this.listenDragEnd, this);
    this.customLayer.setMap(this.map);
  };

  /* Called every time when map view change or props updated */
  render({ size }) {
    const { width, height } = size;
    if (this.canvas.width !== width) {
      this.canvas.width = width;
    }
    if (this.canvas.height !== height) {
      this.canvas.height = height;
    }
    this.canvous.render();
  }
}

export default Common;
