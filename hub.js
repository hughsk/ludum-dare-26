var inherits = require('inherits')
  , Entity = require('./entity')
  , game

module.exports = Hub

function Hub(pos, spd, acc) {
  if (!(this instanceof Hub)) return new Hub(pos, spd, acc)
  Entity.call(this)
  if (!game) throw new Error('game not ready')
}
inherits(Hub, Entity)

Hub.register = function(g) {
  game = g
}
