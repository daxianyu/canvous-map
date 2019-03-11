const style = document.createElement('style');
style.innerHTML = '.multi-custom-layer{position:absolute;top:0;left:0;width:100%;height:100%}';
document.head.appendChild(style);

/**
 * If fitSize, canvas width and height will be set automatically
 * as parent layer;
 */
class Layer {
  constructor(options = {}) {
    const {
      zIndex = '1',
      opacity = '1',
      fitSize = false,
      zoom = 1,
    } = options;
    const wrapper = document.createElement('div');
    const canvas = document.createElement('canvas');
    wrapper.classList.add('multi-custom-layer');
    wrapper.style.zIndex = zIndex;
    wrapper.style.opacity = opacity;
    wrapper.appendChild(canvas);
    this.options = {
      zIndex,
      opacity,
      fitSize,
      zoom,
    };
    this.root = wrapper;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  getCtx() {
    return this.canvas.getContext('2d');
  }

  getSize() {
    const { width, height } = this.canvas;
    return { width, height };
  }

  setSize({ width, height }) {
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    const { fitSize, zoom } = this.options;
    if (fitSize) {
      this.canvas.width = width / zoom;
      this.canvas.height = height / zoom;
    }
  }

  clear() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
  }

  onRender() {}
}

/**
 * Manage multi layers
 * providing events proxy ability.
 */
class MultiLayer {
  constructor(container, options = {}) {
    const { width, height } = options;
    this.root = container;
    container.style.position = 'relative';
    if (width) {
      container.style.width = `${width}px`;
    }
    if (height) {
      container.style.height = `${height}px`;
    }
    this.root.addEventListener('click', this.eventHandler('click'));
    this.root.addEventListener('mousemove', this.eventHandler('mousemove'));
  }

  addLayer(layer) {
    if (!(layer instanceof Layer)) {
      throw Error('Should be typeof Layer!');
    }
    layer.setSize(this.getSize());
    this.root.appendChild(layer.root);
  }

  removeLayer(layer) {
    this.root.removeChild(layer.root);
  }

  getSize() {
    const { clientHeight: height, clientWidth: width } = this.root;
    return {
      height, width,
    };
  }

  handlers = {
    click: [],
    mousemove: [],
  };

  eventHandler = (eventName) => (event) => {
    const handlers = this.handlers[eventName];
    if (!Array.isArray(handlers)) return;
    const { x, y } = event;
    handlers.forEach(({ handler, layer }) => {
      const { zoom } = layer.options;
      handler.call(this, {
        y: y / zoom,
        x: x / zoom,
      }, event);
    });
  };

  on(eventName, handler, target) {
    if (!(target instanceof Layer)) {
      throw Error('Prop target should be delivered and instance of Layer!');
    }
    let eventHandlers = this.handlers[eventName];
    if (!eventHandlers) {
      eventHandlers = [];
      this.handlers[eventName] = eventHandlers;
    }
    eventHandlers.push({
      handler,
      layer: target,
    });
  }

  off(eventName, handler) {
    const eventHandlers = this.handlers[eventName];
    const index = eventHandlers.indexOf(handler);
    if (index > -1) {
      eventHandlers.splice(index, 1);
    }
  }
}

MultiLayer.Layer = Layer;

export default MultiLayer;
