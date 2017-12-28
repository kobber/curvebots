# CURVEBOTS

A _curve fever_ ripoff, ment to be played by bots.

## Getting started

1. `npm install`
2. `npm run build`
3. `npm run build:bots` or `npm run build:bots:watch`

## Config

Game configuration lives in `config.ts`. Add players and set debug options here.

## Bulding a bot

1. Put a new file in `/bots` folder, named `[name]_bot.ts`
2. Add the file to `entries` in `bots/webpack.config.js`
3. Add `{ file: [name].bot.js }` to the `players` array in `config.ts`
4. build bots with `npm run build:bots`.

## Notes

The project contains modified definition files for paper.js:

* `paper.d.ts` has a few things added to match the used version of paper.js
* `bots/paper.d.ts` is modified to work when used in web worker context.