var inherits = require('inherits')
  , Entity = require('./entity')
  , imageloaded = require('image-loaded')
  , game
  , id = 0

module.exports = Chaser

var sprite = new Image
sprite.src = 'chaser.png'

function Chaser(pos, spd, acc) {
  if (!(this instanceof Chaser)) return new Chaser(pos, spd, acc)
  Entity.call(this)
  if (!game) throw new Error('game not ready')
  var self = this

  game.chasers.boids.push({
      spd: this.spd = spd || [0,0]
    , pos: this.pos = pos || [0,0]
    , acc: this.acc = acc || [0,0]
    , id: this.id = id++
  })

  this.dying = false
  this.scale = 1

  this.once('kill', function() {
    var idx = game.chasers.boids.indexOf(self.data)
    if (idx !== -1) return game.chasers.boids.splice(idx, 1)
    for (var i = 0, l = game.chasers.boids.length; i < l; i += 1) {
      if (game.chasers.boids[i].id === self.id) {
        return game.chasers.boids.splice(i, 1)
      }
    }
  })
}
inherits(Chaser, Entity)

Chaser.register = function(g) {
  game = g
}

Chaser.prototype.tick = function() {
  if (this.dying) this.scale -= 0.05
  if (this.scale < 0) {
    this.scale = 0
    this.dying = false
    this.kill()
  }
}

Chaser.prototype.render = function(ctx, manager) {
  var camera = manager.first('camera')

  if (this.scale !== 1) {
    ctx.save()
    ctx.translate(this.pos[0], this.pos[1])
    ctx.scale(this.scale, this.scale)
    ctx.drawImage(sprite, -16, -16)
    ctx.restore()
  } else {
    ctx.drawImage(sprite, this.pos[0]-16, this.pos[1]-16)
  }
}
