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
                    paper.project.importJSON(e.data.paperState);
                    _this.update(e.data.id);
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
    Bot.prototype.postMessage = function (message) {
        postMessage(message);
    };
    return Bot;
}());
var MyBot = /** @class */ (function (_super) {
    __extends(MyBot, _super);
    function MyBot() {
        var _this = _super.call(this) || this;
        _this.count = 0;
        return _this;
    }
    MyBot.prototype.update = function (id) {
        var command = 0;
        if (this.count > 10) {
            command = -1;
        }
        this.count++;
        this.sendCommand(id, command);
        if (this.count > 20) {
            this.count = 0;
        }
    };
    return MyBot;
}(Bot));
new MyBot();
//# sourceMappingURL=bot.js.map