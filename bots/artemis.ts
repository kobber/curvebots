import * as Paper from 'paper';
import { Bot } from './bot';
import { curveCommand, Curve, Direction } from '../messages';

class Artemis extends Bot {
  circleCenter: Paper.Point;
  startPos: Paper.Point;
  counter: number;
  turns: number;
  constructor() {
    super();
    this.counter = 0;
    this.turns = 0;
  }

  // Draw a line straight ahead
  line(data, length):Paper.Path {
    return new data.paper.Path({
      segments: [
        data.pos,
        [
          data.pos.x + (data.direction.x * length),
          data.pos.y + (data.direction.y * length)
        ]
      ],
      strokeColor: '#ff0',
      strokeWidth: 1
    });
  } 
  update(id: number, data: {
    paper: typeof Paper,
    curves: Curve[],
    bounds: Paper.Path,
    pos: Paper.Point,
    direction: Direction
  }) {
    let command: curveCommand = 0;
    const turnradius = 33;

    function getIntersections(path:Paper.Path, curveOnly?:boolean) {
      let intersections:Paper.CurveLocation[] = [];
      for (let curve of data.curves) {
        for (let path of curve.paths) {
          intersections = intersections.concat(path.getIntersections(path));
        }
      }
      if (!curveOnly) {
        intersections = intersections.concat(path.getIntersections(data.bounds));
      }
      return intersections;
    }

    const vector = data.pos.subtract(this.line(data, 1).lastSegment.point);
    const collideRectWidth = 9;
    const collideRect = new data.paper.Path.Rectangle(
      data.pos.subtract([data.direction.x + collideRectWidth / 2, data.direction.y - 4]), 
      new data.paper.Size(collideRectWidth, turnradius* 1.2)
    );
    collideRect.rotate(vector.angle + 90, data.pos);

    if (getIntersections(collideRect).length) {
      // Collision!
      const rightCheck = this.line(data, turnradius);
      rightCheck.rotate(90, data.pos);
      if (getIntersections(new data.paper.Path.Circle({
        center: rightCheck.lastSegment.point,
        radius: turnradius - 3.5,
      })).length) {
        // Collision right!
        command = 1;
      }
  
      const leftCheck = this.line(data, turnradius);
      leftCheck.rotate(-90, data.pos);
      if (getIntersections(new data.paper.Path.Circle({
        center: leftCheck.lastSegment.point,
        radius: turnradius - 3.5,
      })).length) {
        // Collision right!
        command = -1;
      }
      
    }

    // const rightCurveCheck = this.line(data, turnradius * 2);
    // rightCurveCheck.rotate(15, data.pos);
    // if (getIntersections(new data.paper.Path.Circle({
    //   center: rightCurveCheck.lastSegment.point,
    //   radius: turnradius/2,
    // }), true).length) {
    //   // Collision right!
    //   command = -1;
    // }
    // const leftCurveCheck = this.line(data, turnradius * 2);
    // leftCurveCheck.rotate(-15, data.pos);
    // if (getIntersections(new data.paper.Path.Circle({
    //   center: leftCurveCheck.lastSegment.point,
    //   radius: turnradius/2,
    // }), true).length) {
    //   // Collision right!
    //   command = 1;
    // }

    
    this.sendPaintMessage(data.paper.project);
    this.sendCommand(id, command);
  }
}

new Artemis();