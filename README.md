# CURVEBOTS

A _curve fever_ ripoff, ment to be played by bots.

## Getting started

1. `npm install`
2. `npm run build`
3. `npm run build:bots` or `npm run build:bots:watch`

## Config

Game configuration lives in `config.ts`. Add players and set debug options here.

## Bulding a bot

Put a new file in `/bots` folder, named `[name]_bot.ts`. Add the bot to the `players` array in `config.ts` and build bots with `npm run build:bots`. The built bots file will be called `[name].bot.js`.

## Notes

The project contains modified definition files for paper.js:

* `paper.d.ts` has a few things added to match the used version of paper.js
* `bots/paper.d.ts` is modified to work when used in web worker context.