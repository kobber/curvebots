self.importScripts('../node_modules/paper/dist/paper-core.min.js');
declare const paper: any;

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
          this.update(e.data.id);
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
  abstract update(id:number);
}

class MyBot extends Bot {
  count: number;
  constructor() {
    super();
    this.count = 0;
  }
  update(id:number) {
    let command: curveCommand = 0;
    if (this.count > 10) {
      command = -1;
    }
    this.count++;
    this.sendCommand(id, command);
    if (this.count > 20) {
      this.count = 0;
    }
  }
}

new MyBot();