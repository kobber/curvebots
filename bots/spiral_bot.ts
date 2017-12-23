import * as Paper from 'paper';
import { Bot } from './bot';
import { curveCommand, Curve } from '../messages';

class MyBot extends Bot {
  circleCenter: Paper.Point;
  startPos: Paper.Point;
  counter: number;
  turns: number;
  constructor() {
    super();
    this.counter = 0;
    this.turns = 0;
  }
  update(id: number, data: {
    paper: typeof Paper,
    curves: Array<Curve>,
    pos: Paper.Point,
    direction: any
  }) {
    let curve = data.curves.filter(c => c.pos == data.pos)[0];
    let pos = new data.paper.Point(curve.pos);
    let direction = new data.paper.Point(curve.direction.x, curve.direction.y);
    const turningRadius = 29.443664472000638; // derived empirically
    if (!this.startPos) {
      this.startPos = curve.pos;
      let perpendicularDirection = new data.paper.Point(curve.direction.x, curve.direction.y).rotate(90);
      this.circleCenter = new data.paper.Point(
        this.startPos.x + turningRadius * perpendicularDirection.x,
        this.startPos.y + turningRadius * perpendicularDirection.y,
      );

    }
    this.debugLayer.addChild(
      new data.paper.Path.Circle({
        center: this.circleCenter, radius: 2,
        strokeColor: '#f00',
        strokeWidth: 3
      })
    );
    const shapes = data.paper.project.getItems({ data: { type: 0 } });
    let command: curveCommand = 0;

    let distanceFromCenter = this.circleCenter.getDistance(curve.pos);

    this.counter++;

    let targetDistance = turningRadius;

    // Make a circle and try to intersect it with all the shapes
    let a = new data.paper.Path.Circle(curve.pos, 20);
    let hitLocation: Paper.Point | null = null;
    for (const shape of <Paper.PathItem[]>shapes) {
      let intersections = a.getIntersections(shape);
      // if (intersections.length) debugger;
      for (const curveLocation of intersections) {
        let angle = curveLocation.point.subtract(pos).angle;
        if (Math.abs(direction.angle - angle) > 50) {
          // Skip intersections behind us
          this.debugLayer.addChild(new data.paper.Path.Circle({center: curveLocation.point,
            radius: 2,
            strokeColor: '#fff'
          }));
          continue;
        }
        this.debugLayer.addChild(new data.paper.Path.Circle({center: curveLocation.point,
          radius: 2,
          strokeColor: '#00f'
        }));
        // Found a hit, store it
        hitLocation = curveLocation.point;
        break;
      }
    }
    if (hitLocation) {
      // Try to move away from the hit
      command = 1;
    } else {
      if (distanceFromCenter - targetDistance > 1.0) {
        // Try to maintain a distance to the center
        command = -1;
      } else {
        command = 0;
      }
    }

    this.sendPaintMessage(data.paper.project);
    this.sendCommand(id, command);
  }
}

new MyBot();