var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
self.importScripts('../node_modules/paper/dist/paper-core.min.js');
paper.install(this);
var Bot = /** @class */ (function () {
    function Bot() {
        var _this = this;
        // Listen for messages from game
        addEventListener('message', function (e) {
            switch (e.data.type) {
                case "init" /* INIT */:
                    paper.setup([e.data.width, e.data.height]);
                    _this.postMessage({
                        type: "ready" /* READY */
                    });
                    break;
                case "update" /* UPDATE */:
                    paper.project.clear();
                    _this.debugLayer = new paper.Layer();
                    paper.project.importJSON(e.data.paperState);
                    _this.update(e.data.id, {
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
    Bot.prototype.sendCommand = function (id, command) {
        this.postMessage({
            type: "update" /* UPDATE */,
            id: id,
            command: command
        });
    };
    Bot.prototype.sendPaintMessage = function (paperProject) {
        this.postMessage({
            type: "paint" /* PAINT */,
            paperState: this.debugLayer.exportJSON()
        });
    };
    Bot.prototype.postMessage = function (message) {
        postMessage(message);
    };
    return Bot;
}());
var MyBot = /** @class */ (function (_super) {
    __extends(MyBot, _super);
    function MyBot() {
        var _this = _super.call(this) || this;
        _this.counter = 0;
        _this.turns = 0;
        return _this;
    }
    MyBot.prototype.update = function (id, data) {
        var curve = data.curves.filter(function (c) { return c.pos == data.pos; })[0];
        var turningRadius = 29.443664472000638; // dervied empirically
        if (!this.startPos) {
            this.startPos = curve.pos;
            var perpendicularDirection = new paper.Point(curve.direction.x, curve.direction.y).rotate(90);
            this.circleCenter = new paper.Point(this.startPos.x + turningRadius * perpendicularDirection.x, this.startPos.y + turningRadius * perpendicularDirection.y);
        }
        this.debugLayer.addChild(new paper.Path.Circle({ center: this.circleCenter, radius: 2,
            strokeColor: '#f00',
            strokeWidth: 3
        }));
        var shapes = paper.project.getItems({ data: { type: 0 } });
        var command = 0;
        // Get our own curve.
        // console.log(curve);
        // console.log(data.direction);
        // console.log(this.counter);
        this.counter++;
        var perpendicularToDirection = new paper.Point(-curve.direction.y, curve.direction.x).normalize();
        var pointOffTip = new paper.Point(curve.pos.x + curve.direction.x * 5, curve.pos.y + curve.direction.y * 5);
        var projectedPoint = new paper.Point(curve.pos.x + perpendicularToDirection.x * 15, curve.pos.y + perpendicularToDirection.y * 15);
        var line = new paper.Path.Line({
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
        }
        else {
            for (var _i = 0, shapes_1 = shapes; _i < shapes_1.length; _i++) {
                var shape = shapes_1[_i];
                if (line.intersects(shape)) {
                    console.log("intersects!");
                    command = 0;
                }
            }
        }
        this.sendCommand(id, command);
    };
    return MyBot;
}(Bot));
new MyBot();
//# sourceMappingURL=bot.js.map