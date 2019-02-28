import TwoDArray from '../base/2dArray';

/**
 * For mass data scheduling
 * lifeCycle:
 * constructor / start / pause / continue
 * */
export default class Scheduler {
  constructor(options) {
    const { data, lazy = true } = options;
    if (!(data instanceof TwoDArray)) {
      throw new Error('Prop data required to be instanceOf TwoDArray!');
    }
    /* All data, mark item by cursor */
    this.data = data;
    this.cursor = 0;
    this.lazy = lazy;
    this.idleHandler = undefined;
  }

  /** Loop */
  loopStack() {
    if (this.lazy) {
      this.idleHandler = window.requestIdleCallback(this.runInRequestIdle);
    } else {
      /*  Block, it will not stop until current meet lastIndex */
      this.runInRequestIdle({
        timeRemaining: () => 9999,
      });
    }
  }

  /** Control data */
  runInRequestIdle = (deadLine) => {
    const {
      data, cursor,
    } = this;
    /* Render this point or not. If false, only this point stop, other points wil render. */
    let shouldRender = true;
    /* Stop render or not. If false, next points will stop. */
    let shouldStopDraw = false;
    const totalLength = data.length;
    if (cursor >= totalLength) return;

    let current = cursor;
    while (current < totalLength) {
      /* If not time left, return */
      if (deadLine.timeRemaining() <= 0) {
        break;
      }
      /* Get raw point by method of TwoDArray, then convert it to deliver to drawer */
      const point = data.peep(current);
      /* User can control if should render or not */
      if (this.shouldScheduleRender) {
        shouldRender = this.shouldScheduleRender(current, point);
      }
      if (this.shouldScheduleStop) {
        const shouldStop = this.shouldScheduleStop(current, point);
        if (shouldStop) {
          shouldStopDraw = true;
        }
      }
      if (shouldRender) {
        this.dataHandler(current, point);
      }
      current += 1;
      if (shouldStopDraw) break;
    }
    this.cursor = current;
    /* Stop loop when finished */
    if (shouldStopDraw) return;
    this.loopStack();
  };

  dataHandler(index, point) {
    //
  }

  start() {
    this.cursor = 0;
    this.continue();
  }

  continue() {
    this.pause();
    this.loopStack();
  }

  pause() {
    if (this.idleHandler) {
      window.cancelIdleCallback(this.idleHandler);
      this.idleHandler = undefined;
    }
  }
}
