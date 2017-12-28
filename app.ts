import * as Paper from 'paper';
import { TYPE, WorkerMessage, curveCommand, WorkerMessageType, AppMessageType, AppMessageData } from './messages';
import { config } from './config';
declare const paper:typeof Paper;

const DEBUG = config.debug;

export interface GameConfig {
  game: {
    players: {
        name: string,
        file: string
      }[]
  },
  debug: {
    step: boolean,
    devMode: boolean,
  }
}

const colors = [
  new paper.Color({hue:355, saturation: 0.65, lightness: 0.65}), // red
  new paper.Color({hue:29, saturation: 0.67, lightness: 0.69}), // orange
  new paper.Color({hue:187, saturation: 0.47, lightness: 0.55}), // cyan
  new paper.Color({hue:207, saturation: 0.82, lightness: 0.66}), // blue
  new paper.Color({hue:286, saturation: 0.60, lightness: 0.67}), // purple
  new paper.Color({hue:95, saturation: 0.38, lightness: 0.62}), // green
];

class Game {
  players:Player[];
  round:Round;
  sidebar:Sidebar;
  static params = {
    speed: 1,
    radius: 30
  }
  constructor(opts:{
    players:Player[]
  }) {
    const paperCanvas = <HTMLCanvasElement>document.getElementById('paper');
    paperCanvas.width = 400;
    paperCanvas.height = 400;
    paper.setup(paperCanvas);

    this.players = opts.players;
    for (const player of opts.players) {
      player.id = opts.players.indexOf(player);
      player.color = colors[player.id];
      player.name = player.name || 'Player ' + player.id;
      player.score = 0;
    }
    this.newRound();
    this.sidebar = new Sidebar(this);
    this.sidebar.render();
  }
  newRound() {
    this.round = new Round({
      players: this.players,
      game: this
    });
  }
}

class Sidebar {
  container:HTMLElement;
  game:Game;
  constructor(game) {
    this.game = game;
    const element = document.getElementById('sidebar');
    if (element !== null) {
      this.container = element;
    }
  }
  render() {
    const players = this.game.players;
    this.container.innerHTML = `
      <div class="players">
        ${players.map((player) => {
          return `
            <div class="player ${player.winner ? 'winner': ''}">
              <div class="color" style="background-color:${player.color.toCSS(true)}"></div>
              ${player.name}
              <div class="score">${player.score}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

class Round {
  curves:Curve[];
  game:Game;
  players:Player[];
  paused:boolean;
  ended:boolean;
  constructor(opts:{ players:Player[], game:Game }) {
    this.curves = [];
    this.game = opts.game;
    this.players = opts.players;

    let readyCurveCount = 0;

    for (const player of opts.players) {
      const curve = new Curve({
        pos: this.randomPosition(),
        player: player,
        round: this
      });
      curve.onReady(() => {

        readyCurveCount++;
        if (readyCurveCount === this.players.length) {
          // Start round
          this.loop();
        }
      });
      this.curves.push(curve);
    }

    if (DEBUG.step) {
      document.addEventListener('keydown', (event) => {
        const keyName = event.key;
        if (keyName === 'ArrowUp') {
          this.loop();
        }
      });
    }
  }
  end() {
    this.paused = true;
    if (this.ended) {
      // Round already ended
      return;
    }
    this.ended = true;

    // Clear all paths
    paper.project.clear();

    // start new round
    const pointsToWin = game.players.length * 10;
    const players = this.players;

    // Kill all bots
    for (const curve of this.curves) {
      curve.kill();
    }

    if (players[0].score >= pointsToWin && players[0].score >= players[1].score + 2) {
      // Game end
      players[0].winner = true;
      this.game.sidebar.render();
    } else {
      this.game.newRound();
    }
  }
  getDeadPlayerCount() {
    let deadPlayerCount = 0;
    for (const curve of this.curves) {
      if (!curve.alive) {
        deadPlayerCount++;
      }
    }
    return deadPlayerCount;
  }
  score (player:Player) {
    let deadPlayerCount = this.getDeadPlayerCount();
    player.score = player.score + deadPlayerCount;
    // Sort players by score
    const players = this.game.players.sort((a: Player, b: Player) => {
      return b.score - a.score;
    });
    this.game.sidebar.render();
  }
  checkRoundEnd() {
    let deadPlayerCount = this.getDeadPlayerCount();
    if (deadPlayerCount >= this.curves.length - 1) {
      // Score the last player alive
      for (const curve of this.curves) {
        if (curve.alive) {
          this.score(curve.player);
        }
      }
      this.end();
    }
  }
  randomPosition() {
    // Random position within the center 70% of the map
    return new paper.Point({
      x: (Math.random() * 0.70 + 0.15) * paper.view.bounds.width,
      y: (Math.random() * 0.70 + 0.15) * paper.view.bounds.height
    });
  }
  loop() {
    let curvecommandcount = 0;
    for (const curve of this.curves) {
      // Ask player to give command
      curve.getCommand((command) => {
        curvecommandcount++;
        // Callback
        curve.update(command);
        curve.render();
        // If all curves have given their command
        if (curvecommandcount === this.curves.length) {
          paper.view.draw();
          if (!this.paused && !DEBUG.step) {
            window.requestAnimationFrame(() => this.loop());
          }
        }
      });
    }
  }
}

class Player {
  winner:boolean;
  id:number;
  score:number;
  name:string;
  color:Paper.Color;
  botFileName: string;
  constructor(opts:{
    file:string;
    name?: string;
  }) {
    this.winner = false;
    if (opts.name) {
      this.name = opts.name;
    }
    this.botFileName = opts.file;
  }
}

class Direction {
  x:number;
  y:number;
  rad:number;
  deg:number;
  constructor(deg:number) {
    this.y = Math.cos(Direction.degToRad(deg));
    this.x = Math.sin(Direction.degToRad(deg));
    this.rad = Math.atan2(this.x, this.y);
    this.deg = Direction.radToDeg(this.rad);
  }
  static radToDeg(rad) {
    return rad * (180 / Math.PI);
  }
  static degToRad(deg) {
    return deg * (Math.PI / 180);
  }
}

class Curve {
  debugLayer: Paper.Layer;
  pos:Paper.Point;
  color:Paper.Color;
  direction:Direction;
  speed:number;
  player:Player;
  path:Paper.CompoundPath;
  dot:Paper.Path.Circle;
  draw:boolean;
  holeSpacing:number;
  round:Round;
  collide:boolean;
  alive:boolean;
  ready: boolean;
  private worker: Worker;
  private onReadyCallbacks: Function[];
  private commandCallbacks: {[id:number]: Function};
  private commandId: number;
  private lastCommand: curveCommand | null;
  constructor(opts:{pos:{x:number, y:number}, player:Player, round:Round}) {
    this.speed = Game.params.speed;
    this.round = opts.round;
    this.direction = new Direction(Math.random() * 360);
    this.pos = new paper.Point(opts.pos);
    this.player = opts.player;
    this.lastCommand = null;
    this.alive = true;
    this.draw = true;
    this.collide = true;
    this.holeSpacing = this.getRandomHoleSpacing();
    this.commandId = 0;
    this.worker = new Worker(this.player.botFileName);
    this.ready = false;
    this.onReadyCallbacks = [];
    this.commandCallbacks = {};

    this.path = new paper.CompoundPath({
      strokeColor: this.player.color,
      fillColor: new paper.Color(0,0,0,0),
      strokeCap: 'round',
      strokeWidth: 3,
      data: {
        type: TYPE.curve,
      }
    });
    this.dot = new paper.Path.Circle({
      center: this.pos,
      radius: 4,
      strokeColor: this.player.color,
      strokeWidth: 1
    });

    this.startDrawing();

    // Listen for events from worker
    this.worker.addEventListener('message', (e: WorkerMessage) => {
      switch (e.data.type) {
        case WorkerMessageType.READY:
          this.ready = true;
          for (const callback of this.onReadyCallbacks) {
            callback();
          }
          break;
        case WorkerMessageType.UPDATE:
          this.commandCallbacks[e.data.id](e.data.command);
          delete this.commandCallbacks[e.data.id];
          break;
        case WorkerMessageType.PAINT:
          if (DEBUG.devMode) {
            if (!this.debugLayer) {
              this.debugLayer = new paper.Layer();
            } else {
              this.debugLayer.removeChildren();
            }
            this.debugLayer.importJSON(e.data.paperState);
          }
          break;
      }
    }, false);

    this.postMessage({
      type: AppMessageType.INIT,
      width: 400,
      height: 400
    });
  }

  postMessage(message: AppMessageData) {
    this.worker.postMessage(message);
  }

  onReady(callback: Function) {
    if (this.ready) {
      callback();
    } else {
      this.onReadyCallbacks.push(callback);
    }
  }

  getCommand(callback:(command:curveCommand) => void) {
    const id = this.commandId++;
    const curves:any[] = [];
    for (const curve of this.round.curves) {
      curves.push({
        pos: curve.pos,
        direction: curve.direction
      });
    }
    this.commandCallbacks[id] = callback;
    
    this.postMessage({
      type: AppMessageType.UPDATE,
      pos: this.pos,
      direction: this.direction,
      curves: curves,
      paperState: paper.project.exportJSON(),
      id: id
    });
  }

  kill() {
    this.worker.terminate();
  }

  getRandomHoleSpacing() {
    // Return a length between 10 and 310
    return Math.random() * 300 + 10;
  }

  collision() {
    this.round.score(this.player);
    this.alive = false;
    this.round.checkRoundEnd();
  }

  render() {
    this.dot.position = this.pos;
  }

  checkCollision(point:Paper.Point):boolean {
    if (!this.collide) {
      return false;
    }
    // Bounds
    if (!point.isInside(paper.view.bounds.expand(-this.path.strokeWidth))) {
      return true;
    }

    // Check for collision with self
    /*
      We're collision checking by checking a circle at the tip of the curve,
      unfortunately, this circle will always collide with the curve itself.
      To fix this, we duplicate the curve and remove a bit of the tip, then 
      hittest that instead.
    */
    const lastPath = <Paper.Path>this.path.lastChild;
    if (lastPath.length > this.path.strokeWidth * 1.1) {
      const pathClone = <Paper.Path>lastPath.clone();
      // Remove a segment of the tip.
      pathClone.splitAt(lastPath.length - (this.path.strokeWidth * 1.1)).remove();
      const hits = pathClone.hitTest(point, {
        stroke: true,
        tolerance: this.path.strokeWidth / 2
      });
      pathClone.remove();
      if (hits) {
        return true;
      }
    }

    // Check collision with other curves
    const hitResults = paper.project.hitTestAll(this.pos, {
      stroke: true,
      tolerance: this.path.strokeWidth / 2,
      match: (hit) => {
        // Only care about collision with other curves
        if (hit.item.parent.data.type === TYPE.curve) {
          // Ignore last path of own curve
          if (hit.location.path === lastPath) {
            return false;
          } else {
            return true;
          }
        } else {
          return false;
        }
      }
    });

    if (hitResults.length > 0) {
      return true;;
    }

    return false;
  }

  startDrawing() {
    this.draw = true;
    this.collide = true;
    this.path.addChild(new paper.Path({
      segments: [this.pos],
    }));
  }

  stopDrawing() {
    this.draw = false;
    this.collide = false;
  }

  update(command:curveCommand) {
    if (!this.alive) {
      return;
    }

    let lastPath = <Paper.Path>this.path.lastChild;

    // Draw holes
    // When the length of the last path reaches a set number
    if (this.draw && lastPath.length > this.holeSpacing) {
      this.stopDrawing();
    }
    // When your distance to the last segment is over X, start drawing again
    if (!this.draw && this.pos.getDistance(lastPath.lastSegment.point) > this.path.strokeWidth * 4) {
      this.startDrawing();
      this.holeSpacing = this.getRandomHoleSpacing();
      // startDrawing creates a new path, so, reset lastPath ref.
      lastPath = <Paper.Path>this.path.lastChild;
    }

    // Calculate new position
    const r = Game.params.radius;
    const s = this.speed;
    const deltaAngle = Direction.radToDeg(Math.acos(1 - (s * s) / ( 2 * r * r))) * command;
    this.direction = new Direction(this.direction.deg + deltaAngle);

    this.pos = new paper.Point({
      x: this.pos.x + (this.direction.x * this.speed),
      y: this.pos.y + (this.direction.y * this.speed)
    });

    if (this.checkCollision(this.pos)) {
      this.collision();
      return;
    }

    // Build path
    if (!this.draw) {
      return;
    }
    if (command === this.lastCommand && this.lastCommand !== null && lastPath.segments.length > 1) {
      // If going straight
      if (command === 0) {
        // move point instad of adding new one
        lastPath.lastSegment.remove();
      }
  
      // If curving
      if ((command === 1 || command === -1) && lastPath.segments.length > 2) {
        const arcThrough = lastPath.lastSegment.point;
        lastPath.lastSegment.remove();
        const path = lastPath.arcTo(arcThrough, this.pos);
      } else {
        lastPath.lineTo(this.pos);
      }
    } else {
      lastPath.lineTo(this.pos);
    }

    this.lastCommand = command;
  }
}

function vacuumBot() {
  return function (curve: Curve) {
    const distance = 40;
    const collisionPoint = new paper.Point({
      x: curve.pos.x + (curve.direction.x * distance),
      y: curve.pos.y + (curve.direction.y * distance)
    });
    if (curve.checkCollision(collisionPoint)) {
      return -1;
    } else {
      return 0;
    }
  }
}

function keyboardBot(key1:string, key2:string) {
  return function (curve: Curve) {
    if (keyboard.keys[key1] && keyboard.keys[key1].pressed) {
      return -1;
    }
    if (keyboard.keys[key2] && keyboard.keys[key2].pressed) {
      return 1;
    }
    return 0;
  }
} 

class Keyboard {
  keys: {[key:string]:{pressed:boolean}} = {};
  constructor() {
    document.addEventListener('keydown', (event) => {
      const keyName = event.key;
      this.keys[keyName] = {pressed: true};
    });
    document.addEventListener('keyup', (event) => {
      const keyName = event.key;
      this.keys[keyName] = {pressed: false};
    });
  }
}

const keyboard = new Keyboard();

const game = new Game({
  players: config.game.players.map((player) => new Player(player))
});