import * as Paper from 'paper';
import { Bot } from './bot';
import { curveCommand, Curve, Direction } from '../messages';

class MyBot extends Bot {
  constructor() {
    super();
  }
  update(id: number, data: {
    paper: typeof Paper,
    curves: Curve[],
    bounds: Paper.Path,
    pos: Paper.Point,
    direction: Direction
  }) {
    let command: curveCommand = 0;
    let curve = this.getMyCurve(data.curves);
    let pos = new data.paper.Point(curve.pos);
    let direction = new data.paper.Point(curve.direction.x, curve.direction.y);
    const turningRadius = 29.443664472000638; // derived empirically

    let circle = new data.paper.Path.Circle(
      pos.add(direction.multiply(10)),
      5
    );
    let intersections = circle.getIntersections(curve.path);
    for (const curveLocation of intersections) {
      let angle = curveLocation.point.subtract(pos).angle;
      this.debugLayer.addChild(new data.paper.Path.Circle({
        center: curveLocation.point,
        radius: 2,
        strokeColor: '#00f'
      }));
    }
    if (intersections.length) {
      command = 1;
    } else {
      command = -1;
    }


    this.sendPaintMessage(data.paper.project);
    this.sendCommand(id, command);
  }
}

new MyBot();