self.importScripts('../node_modules/paper/dist/paper-core.min.js');
import * as Paper from 'paper';
import { AppMessage, AppMessageType, WorkerMessageType, curveCommand, WorkerMessageData } from '../messages';
declare const paper: typeof Paper;

paper.install(this);

abstract class Bot {
  constructor() {
    // Listen for messages from game
    addEventListener('message', (e:AppMessage) => {
      switch (e.data.type) {

        case AppMessageType.INIT:
          paper.setup([e.data.width, e.data.height]);
          this.postMessage({
            type: WorkerMessageType.READY
          });
          break;
          
        case AppMessageType.UPDATE:
          paper.project.clear();
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
  sendCommand(id: number, command:curveCommand) {
    this.postMessage({
      type: WorkerMessageType.UPDATE,
      id: id,
      command: command
    });
  }
  postMessage(message:WorkerMessageData) {
    postMessage(message);
  }
  abstract update(id:number, data:{
    paper: typeof Paper,
    curves: Array<any>,
    pos: Paper.Point,
    direction: any,
  });
}

class MyBot extends Bot {
  count: number;
  constructor() {
    super();
    this.count = 0;
  }
  update(id: number, data:{
    paper: typeof Paper,
    curves: Array<any>,
    pos: Paper.Point,
    direction: any
  }) {
    const shapes = paper.project.getItems({ data: { type: 0 } });
    let command:curveCommand = 0;
    
    // Do some collision checking
    // Check if we can go straight
    const newPoint = new paper.Point(data.pos.x + (34 * data.direction.x), data.pos.y + (34 * data.direction.y);
    const collisionline = new paper.Path([
      data.pos, newPoint
    ]);
    if (!paper.view.bounds.contains(newPoint)) {
      command = -1;
    }
    for (const shape of shapes) {
      if (collisionline.intersects(shape)) {
        command = -1;
      }
    }
    collisionline.remove();

    this.sendCommand(id, command);
    if (this.count > 20) {
      this.count = 0;
    }
  }
}

new MyBot();