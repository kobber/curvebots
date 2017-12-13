self.importScripts('../node_modules/paper/dist/paper-core.min.js');
import * as Paper from 'paper';
import { AppMessage, AppMessageType, WorkerMessageType, curveCommand, WorkerMessageData, Curve } from '../messages';
declare const paper: typeof Paper;

paper.install(this);

abstract class Bot {
  debugLayer: Paper.Layer;
  constructor() {
    // Listen for messages from game
    addEventListener('message', (e: AppMessage) => {
      switch (e.data.type) {

        case AppMessageType.INIT:
          paper.setup([e.data.width, e.data.height]);
          this.postMessage({
            type: WorkerMessageType.READY
          });
          break;

        case AppMessageType.UPDATE:
          paper.project.clear();
          this.debugLayer = new paper.Layer();
          paper.project.importJSON(e.data.paperState);
          this.update(e.data.id, {
            paper: paper,
            curves: e.data.curves,
            pos: e.data.pos,
            direction: e.data.direction,
          });
          break;

        default:
          break;
      }
    }, false);
  }
  sendCommand(id: number, command: curveCommand) {
    this.postMessage({
      type: WorkerMessageType.UPDATE,
      id: id,
      command: command
    });
  }
  sendPaintMessage(paperProject: Paper.Project) {
    this.postMessage({
      type: WorkerMessageType.PAINT,
      paperState: this.debugLayer.exportJSON()
    });
  }
  postMessage(message: WorkerMessageData) {
    postMessage(message);
  }
  abstract update(id: number, data: {
    paper: typeof Paper,
    curves: Array<any>,
    pos: Paper.Point,
    direction: any,
  });
}

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
    let pos = new paper.Point(curve.pos);
    let direction = new paper.Point(curve.direction.x, curve.direction.y);
    const turningRadius = 29.443664472000638; // derived empirically
    if (!this.startPos) {
      this.startPos = curve.pos;
      let perpendicularDirection = new paper.Point(curve.direction.x, curve.direction.y).rotate(90);
      this.circleCenter = new paper.Point(
        this.startPos.x + turningRadius * perpendicularDirection.x,
        this.startPos.y + turningRadius * perpendicularDirection.y,
      );

    }
    this.debugLayer.addChild(
      new paper.Path.Circle({
        center: this.circleCenter, radius: 2,
        strokeColor: '#f00',
        strokeWidth: 3
      })
    );
    const shapes = paper.project.getItems({ data: { type: 0 } });
    let command: curveCommand = 0;

    let distanceFromCenter = this.circleCenter.getDistance(curve.pos);

    this.counter++;

    let targetDistance = turningRadius;

    // Make a circle and try to intersect it with all the shapes
    let a = new paper.Path.Circle(curve.pos, 20);
    let hitLocation: Paper.Point | null = null;
    for (const shape of <Paper.PathItem[]>shapes) {
      let intersections = a.getIntersections(shape);
      // if (intersections.length) debugger;
      for (const curveLocation of intersections) {
        let angle = curveLocation.point.subtract(pos).angle;
        if (Math.abs(direction.angle - angle) > 50) {
          // Skip intersections behind us
          this.debugLayer.addChild(new paper.Path.Circle({center: curveLocation.point,
            radius: 2,
            strokeColor: '#fff'
          }));
          continue;
        }
        this.debugLayer.addChild(new paper.Path.Circle({center: curveLocation.point,
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

    this.sendPaintMessage(paper.project);
    this.sendCommand(id, command);
  }
}

new MyBot();