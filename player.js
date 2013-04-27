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
  , limit = 10

Player.prototype.tick = function(dt, manager) {
  var pos = this.pos
    , chunkX = Math.floor(pos[0] / manager.chunkSize)
    , chunkY = Math.floor(pos[1] / manager.chunkSize)
    , chunk = chunkX + ',' + chunkY
    , game = manager.game
    , boids = game.boids.boids
    , d = [0,0]

  if (manager.chunk !== chunk) {
    manager.chunk = chunk
    manager.updateChunks(chunkX, chunkY)
  }

  this.spd[0] += this.acc[0]
  this.spd[1] += this.acc[1]
  this.spd[0] *= friction
  this.spd[1] *= friction
  var speed = Math.sqrt(this.spd[0]*this.spd[0] + this.spd[1]*this.spd[1])
  if (speed > limit) {
    this.spd[0] *= limit / speed
    this.spd[1] *= limit / speed
  }

  for (var i = 0, l = boids.length; i < l; i += 1) {
    d[0] = boids[i].pos[0] - pos[0]
    d[1] = boids[i].pos[1] - pos[1]
    if (d[0]*d[0]+d[1]*d[1] < 144) {
      game.camera.pos[0] += Math.random() * 24 - 12
      game.camera.pos[1] += Math.random() * 24 - 12
      this.spd[0] += Math.random() * 24 - 12
      this.spd[1] += Math.random() * 24 - 12
    }
  }

  pos[0] += this.spd[0]
  pos[1] += this.spd[1]
  game.playerAttractor[0] = pos[0]
  game.playerAttractor[1] = pos[1]
}

Player.prototype.render = function(ctx, manager) {
  var camera = manager.first('camera')
    , pos = this.pos
    , width = ctx.canvas.width
    , height = ctx.canvas.height

  ctx.fillStyle = '#f00'
  ctx.fillRect(pos[0] - 12, pos[1] - 12, 24, 24)
}
