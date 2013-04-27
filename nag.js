var inherits = require('inherits')
  , Entity = require('./entity')
  , imageloaded = require('image-loaded')
  , game

module.exports = Nag

var sprite = new Image
sprite.src = 'glow.png'

function Nag(pos, spd, acc) {
  if (!(this instanceof Nag)) return new Nag(pos, spd, acc)
  Entity.call(this)
  if (!game) throw new Error('game not ready')

  game.boids.boids.push({
      spd: this.spd = spd || [0,0]
    , pos: this.pos = pos || [0,0]
    , acc: this.acc = acc || [0,0]
  })
}
inherits(Nag, Entity)

Nag.register = function(g) {
  game = g
}

var spareArray = [0,0]
Nag.prototype.render = function(ctx, manager) {
  var camera = manager.first('camera')

  ctx.fillStyle = '#fff'
  spareArray = camera.relative(this.pos, spareArray)
  ctx.drawImage(sprite, spareArray[0] - 16, spareArray[1] - 16)
}
