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
    
    const turningRadius = 29.443664472000638; // dervied empirically
    if (!this.startPos) {
      this.startPos = curve.pos;
      let perpendicularDirection = new paper.Point(curve.direction.x, curve.direction.y).rotate(90);
      this.circleCenter = new paper.Point(
        this.startPos.x + turningRadius * perpendicularDirection.x,
        this.startPos.y + turningRadius * perpendicularDirection.y,
      );

    }
    this.debugLayer.addChild(
      new paper.Path.Circle({ center: this.circleCenter, radius: 2,
        strokeColor: '#f00',
        strokeWidth: 3
      })
    );
    const shapes = paper.project.getItems({ data: { type: 0 } });
    let command: curveCommand = 0;

    // Get our own curve.
    // console.log(curve);
    // console.log(data.direction);



    // console.log(this.counter);
    this.counter++;
    let perpendicularToDirection = new paper.Point(
      -curve.direction.y,
      curve.direction.x
    ).normalize();
    let pointOffTip = new paper.Point(
      curve.pos.x + curve.direction.x * 5,
      curve.pos.y + curve.direction.y * 5
    );
    let projectedPoint = new paper.Point(
      curve.pos.x + perpendicularToDirection.x * 15,
      curve.pos.y + perpendicularToDirection.y * 15
    );
    let line = new paper.Path.Line({
      from: pointOffTip,
      to: projectedPoint,
      strokeColor: '#fff',
      strokeWidth: 1
    });
    this.debugLayer.addChild(line);
    this.sendPaintMessage(paper.project);

    // collision test
    command = -1;

    if (this.counter > 2 * Math.PI * turningRadius) {
      command = 0;
    } else {
      for (const shape of shapes) {
        if (line.intersects(shape)) {
          console.log("intersects!");
          command = 0;
        }
      }
    }
    this.sendCommand(id, command);
  }
}

new MyBot();