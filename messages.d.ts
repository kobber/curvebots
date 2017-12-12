// Other types
type curveCommand = 1 | 0 | -1;

// Worker messages
declare const enum WorkerMessageType {
  READY = 'ready',
  UPDATE = 'update'
}

interface WorkerMessage_ready {
  type: WorkerMessageType.READY
}

interface WorkerMessage_update {
  type: WorkerMessageType.UPDATE,
  id: number,
  command: curveCommand
}

type WorkerMessageData = WorkerMessage_ready | WorkerMessage_update

interface WorkerMessage extends MessageEvent {
  data: WorkerMessageData
}

// App messages
declare const enum AppMessageType {
  INIT = 'init',
  UPDATE = 'update'
}

interface AppMessage_init {
  type: AppMessageType.INIT,
  width: number,
  height: number
}
interface AppMessage_update {
  type: AppMessageType.UPDATE,
  paperState: string,
  id: number
}

type AppMessageData = AppMessage_init | AppMessage_update;

interface AppMessage extends MessageEvent {
  data: AppMessageData
}