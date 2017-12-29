import { GameConfig } from './app';

export const config:GameConfig = {
  game: {
    players: [
      {
        name: 'artemis',
        file: 'dist/artemis.bot.js'
      },
      {
        name: 'spiral',
        file: 'dist/spiral.bot.js'
      },
      {
        name: 'artemis',
        file: 'dist/artemis.bot.js'
      },
      {
        name: 'spiral',
        file: 'dist/spiral.bot.js'
      },
      {
        name: 'artemis',
        file: 'dist/artemis.bot.js'
      },
      {
        name: 'spiral',
        file: 'dist/spiral.bot.js'
      },
    ]
  },
  visuals: {
    explosions: true
  },
  debug: {
    // Step through each update cycle with arrow up key
    step: false,

    // Render debug layer sent by bots
    devMode: true,
  }
}
