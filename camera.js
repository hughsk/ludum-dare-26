var inherits = require('inherits')
  , Entity = require('./entity')
  , game

module.exports = Camera

function Camera() {
  if (!(this instanceof Camera)) return new Camera()
  Entity.call(this)
  if (!game) throw new Error('game not ready')

  this.pos = [-250,-250]
}
inherits(Camera, Entity)

Camera.register = function(g) {
  game = g
}

Camera.prototype.tick = function(dt, manager) {
  var player = manager.first('player')
    , game = manager.game

  this.pos[0] = this.pos[0] + (player.pos[0] - game.width/2 - this.pos[0]) * 0.05
  this.pos[1] = this.pos[1] + (player.pos[1] - game.height/2 - this.pos[1]) * 0.05
}

Camera.prototype.relative = function(pos, arr) {
  arr = arr || []
  arr[0] = pos[0] - this.pos[0]
  arr[1] = pos[1] - this.pos[1]
  return arr
}
