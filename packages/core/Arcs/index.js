import { getMidperpandicular, getRadOfVector, getTransformedRadiusAndCenter } from './utils';
import Scheduler from '../Scheduler';
import TwoDArray from '../base/2dArray';

export default class Arcs extends Scheduler {
  /**
   * @param {object} ctx - canvas context;
   * @param {object} options: rate: L/R rate;
   * */
  constructor(ctx, options) {
    const { data, coordinateTransformation, rate = 0.5, lazy = true } = options;
    super({ data: new TwoDArray(data), lazy });
    this.ctx = ctx;
    this.coordinateTransformation = coordinateTransformation;
    this.rate = rate;
    this.generateRelativeCenterAndRadius(rate);
  }

  generateRelativeCenterAndRadius(rate) {
    /** Generate initial radius and centers,
     * any others could calculate by rotation or translation or scale
     */
    const radiusAndCenters = getMidperpandicular([0, 0], [1, 0])(rate);
    /* With two points and one radius, we can obtain two circles */
    const { centers, radius } = radiusAndCenters;
    this.relativeCenterAndRadius = {
      centers,
      radius,
    };
  }

  /**
   * This is the only API to modify grid.
   * New options will be merged with old options, such that one could update grid by calling
   * this API with differentials.
   */
  setOptions = (options) => {
    const {
      coordinateTransformation = this.coordinateTransformation,
      data,
      rate = this.rate,
    } = options;
    if (data && data !== this.data) {
      this.data = new TwoDArray(data);
    }
    this.coordinateTransformation = coordinateTransformation;
    this.rate = rate;
    this.generateRelativeCenterAndRadius(rate);
  };

  /* Implement Schedule dataHandler */
  dataHandler(index, data) {
    this.drawArcs(data, this.rate);
  }

  drawArc(center, points, radius) {
    const [xc, yc] = center;
    const [point1, point2] = points;
    const [xp1, yp1] = point1;
    const [xp2, yp2] = point2;
    let startAngle = getRadOfVector([xp1 - xc, yp1 - yc]);
    let endAngle = getRadOfVector([xp2 - xc, yp2 - yc]);

    /**
     * Minor arc;
     * */
    if (
      (startAngle > endAngle && startAngle - endAngle < Math.PI)
      || endAngle - startAngle > Math.PI
    ) {
      const temp = startAngle;
      startAngle = endAngle;
      endAngle = temp;
    }
    this.ctx.beginPath();
    this.ctx.arc(xc, yc, radius, startAngle, endAngle);
    this.ctx.stroke();
  }

  drawArcs(points) {
    let [point1, point2] = points;
    /**
     * Transform other unit to x-y;
     * */
    point1 = this.coordinateTransformation(point1);
    point2 = this.coordinateTransformation(point2);
    points = [point1, point2];

    const { centers, radius } = this.relativeCenterAndRadius;
    if (Math.random() > 0.5) {
      const {
        center,
        radius: transformedRadius,
      } = getTransformedRadiusAndCenter(points, centers[0], radius);
      this.drawArc(center, points, transformedRadius);
    } else {
      const {
        center,
        radius: transformedRadius,
      } = getTransformedRadiusAndCenter(points, centers[1], radius);
      this.drawArc(center, points, transformedRadius);
    }
  }

  /* Uniform method */
  render() {
    this.start();
  }
}
