var inherits = require('inherits')
  , helpers = require('./helpers')
  , Entity = require('./entity')
  , vkey = require('vkey')
  , game

module.exports = Player

function Player() {
  if (!(this instanceof Player)) return new Player()
  Entity.call(this)
  if (!game) throw new Error('game not ready')

  var self = this
    , movement = 0.2

  this.pos = [0,0]
  this.spd = [0,0]
  this.acc = [0,0]
  this.game = game

  this.game.on('keydown', function(key) {
    switch (key) {
      case 'W': self.acc[1] -= movement; break
      case 'A': self.acc[0] -= movement; break
      case 'S': self.acc[1] += movement; break
      case 'D': self.acc[0] += movement; break
    }
  })

  this.game.on('keyup', function(key) {
    switch (key) {
      case 'W': self.acc[1] = 0; break
      case 'A': self.acc[0] = 0; break
      case 'S': self.acc[1] = 0; break
      case 'D': self.acc[0] = 0; break
    }
  })
}
inherits(Player, Entity)

Player.register = function(g) {
  game = g
}

var friction = 1 - 0.035
  , limit = 8

Player.prototype.tick = function(dt, manager) {
  this.spd[0] += this.acc[0]
  this.spd[1] += this.acc[1]
  this.spd[0] *= friction
  this.spd[1] *= friction
  var speed = Math.sqrt(this.spd[0]*this.spd[0] + this.spd[1]*this.spd[1])
  if (speed > limit) {
    this.spd[0] *= limit / speed
    this.spd[1] *= limit / speed
  }

  this.pos[0] += this.spd[0]
  this.pos[1] += this.spd[1]
  manager.game.playerAttractor[0] = this.pos[0]
  manager.game.playerAttractor[1] = this.pos[1]


}

Player.prototype.render = function(ctx, manager) {
  var camera = manager.first('camera')
    , pos = camera.relative(this.pos)
    , width = ctx.canvas.width
    , height = ctx.canvas.height

  ctx.fillStyle = '#f00'
  ctx.fillRect(pos[0], pos[1], 25, 25)

  var center = camera.relative([0,0])
  ctx.fillStyle = 'blue'
  ctx.fillRect(center[0], center[1], 20, 20)
}
