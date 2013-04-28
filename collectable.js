var inherits = require('inherits')
  , pointer = require('./pointer')
  , Entity = require('./entity')
  , CIRCLE = Math.PI * 2
  , counts = 1
  , game

module.exports = Collectable
var sprite = new Image
sprite.src = 'ring.png'

function Collectable() {
  if (!(this instanceof Collectable)) return new Collectable()
  Entity.call(this)
  if (!game) throw new Error('game not ready')
  this.radius =
  this._radius = 150

  var angle = Math.random()*CIRCLE

  game.boids.attractors.push(
    this.pos = [
        Math.sin(angle) * (counts * 500 + 800)
      , Math.cos(angle) * (counts * 500 + 800)
      , this._radius
      , -20
    ]
  )
  game.manager.add(this.pointer = pointer(this.pos))
  counts += 1
}
inherits(Collectable, Entity)

Collectable.register = function(g) {
  game = g
}

Collectable.prototype.tick = function() {
  this.pos[2] = this._radius = this._radius + (this.radius - this._radius) * 0.1
}

Collectable.prototype.render = function(ctx, manager) {
  var camera = manager.first('camera')
    , radius = this._radius / 150

  ctx.save()
  ctx.translate(this.pos[0], this.pos[1])
  ctx.scale(radius, radius)
  ctx.translate(-150, -150)
  ctx.drawImage(sprite, 0, 0)
  ctx.restore()
}

Collectable.prototype.doAction = function() {
  var sky = game.manager.first('sky')

  this.pointer.enabled = false
  this.radius = 0
  sky.moment = Math.max(sky.moment - 0.1, 0)
  game.player.collected += 1
}

Collectable.prototype.revive = function() {
  this.pointer.enabled = true
  this.radius = 150
}
