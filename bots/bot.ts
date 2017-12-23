self.importScripts('../node_modules/paper/dist/paper-core.min.js');
import * as Paper from 'paper';
import { AppMessage, AppMessageType, WorkerMessageType, curveCommand, WorkerMessageData, Curve } from '../messages';
declare const paper: typeof Paper;

paper.install(this);

export abstract class Bot {
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
