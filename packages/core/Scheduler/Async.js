function linear(from, to, rate) {
  return from * (1 - rate) + to * rate;
}

const CURVE = {
  linear,
};

class AnimateScheduler {
  constructor(props) {
    const { handler } = props;
    this.handler = handler;
    this.loopAnimate();
  }

  loopAnimate = () => {
    this.clear();
    this.runInAnimateHandler = window.requestAnimationFrame(this.runInAnimate);
  };

  runInAnimate = () => {
    this.handler(this.loopAnimate);
  };

  start = (props = this.props) => {
    this.props = props;
    this.loopAnimate();
  };

  clear = () => {
    window.cancelAnimationFrame(this.runInAnimateHandler);
  };
}

class AnimateSpirit {
  constructor(props) {
    const { curve = 'linear', splitCount = 100, onRender, from, to } = props;
    this.curve = CURVE[curve] || linear;
    if (typeof curve === 'function') {
      this.curve = curve;
    }
    this.currentIndex = 0;
    this.onRender = onRender;
    if (from !== undefined && to !== undefined) {
      this.isAnimating = true;
    }
    this.options = {
      curve, splitCount, from, to,
    };
  }

  isAnimating = false;

  /**
   * 'from' and 'to' provided showed that it's an animation spirit.
   */
  render() {
    const { from, to } = this.options;
    if (from !== undefined && to !== undefined) {
      if (this.currentIndex <= this.options.splitCount) {
        const nextPosition = this.curve(from, to, this.currentIndex / this.options.splitCount);
        this.onRender(nextPosition, this.currentIndex);
        this.currentIndex += 1;
      } else {
        this.onRender(to);
        this.onEnd();
      }
    } else {
      this.onRender(to);
    }
  }

  /**
   * Do sth when animation ended.
   */
  onEnd = () => {}
}

/**
 * Manage spirits.
 */
class AnimationScheduler {
  /**
   * animatedSpirits: do not need calculate next position
   * animatingSpirits: need.
   * @param props
   */
  constructor(props) {
    this.animatedSpirits = [];
    this.animatingSpirits = [];
    this.onAnimationEnd = props.onAnimationEnd;
    this.onFrameStart = props.onFrameStart;
    this.onFrameEnd = props.onFrameEnd;
    this.animateEnded = true;
    this.animateHandler = new AnimateScheduler({
      handler: this.runAnimation,
    });
  }

  /**
   * When no animating spirit, animationEnd Triggered.
   */
  runAnimation = (next) => {
    if (this.onFrameStart) {
      this.onFrameStart();
    }
    this.animatedSpirits.forEach(spirit => {
      spirit.render();
    });
    this.animatingSpirits.forEach(spirit => {
      spirit.render();
    });
    if (
      !this.animatingSpirits.length &&
      this.onAnimationEnd &&
      !this.animateEnded
    ) {
      this.onAnimationEnd();
      this.animateEnded = true;
    } else {
      next();
    }
    if (this.onFrameEnd) {
      this.onFrameEnd();
    }
  };

  addSpirit = (spirit) => {
    if (!(spirit instanceof AnimateSpirit)) {
      throw Error('Spirit should be type of AnimatedSpirit');
    }
    if (spirit.isAnimating) {
      this.animatingSpirits.push(spirit);
    } else {
      this.animatedSpirits.push(spirit);
    }
    this.animateEnded = false;
    this.animateHandler.start();
    spirit.onEnd = () => {
      const index = this.animatingSpirits.indexOf(spirit);
      /* 只能是转移,而不是增加 */
      if (index > -1) {
        this.animatingSpirits.splice(index, 1);
        this.animatedSpirits.push(spirit);
      }
    };
  };

  delSpirit = (spirit) => {
    let index = this.animatingSpirits.indexOf(spirit);
    if (index > -1) {
      this.animatingSpirits.splice(index, 1);
    }
    index = this.animatedSpirits.indexOf(spirit);
    if (index > -1) {
      this.animatedSpirits.splice(index, 1);
    }
  };

  clear = () => {
    this.animatingSpirits.length = 0;
    this.animatedSpirits.length = 0;
    this.animateHandler.clear();
  }
}

class AsyncScheduler {
  constructor(props) {
    const { data } = props;
    this.props = props;
    this.cursor = 0;
    this.data = data;
    this.animation = new AnimationScheduler({});
  }

  dataHandler() {}

  /**
   * Instant or lazy controls here.
   */
  loopStack = () => {
    this.runInStackHandler = setTimeout(() => {
      this.runInStack();
    });
  };

  /**
   * Next point is driven by onAnimate
   */
  runInStack() {
    const {
      data, cursor,
    } = this;
    const totalLength = data.length;
    if (cursor >= totalLength) return;
    const nextData = data[cursor];
    this.cursor += 1;
    this.dataHandler(nextData, this.cursor, this.loopStack);
  }

  pause = () => {
    window.clearTimeout(this.runInStackHandler);
  };

  continue = () => {
    this.pause();
    this.loopStack();
  };

  rePaint = () => {
    this.cursor = 0;
    this.continue();
  };

  start = () => {
    this.cursor = 0;
    this.animation.clear();
    this.continue();
  }
}

AsyncScheduler.AnimateScheduler = AnimateScheduler;
AsyncScheduler.AnimateSpirit = AnimateSpirit;

export default AsyncScheduler;
