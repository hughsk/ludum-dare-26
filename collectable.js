var inherits = require('inherits')
  , pointer = require('./pointer')
  , Entity = require('./entity')
  , CIRCLE = Math.PI * 2
  , counts = 1
  , game

module.exports = Hub
var sprite = new Image
sprite.src = 'glow.png'

function Hub() {
  if (!(this instanceof Hub)) return new Hub()
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
  game.manager.add(pointer(this.pos))
  counts += 1
}
inherits(Hub, Entity)

Hub.register = function(g) {
  game = g
}

Hub.prototype.tick = function() {
  this.pos[2] = this._radius = this._radius + (this.radius - this._radius) * 0.1
}

Hub.prototype.render = function(ctx, manager) {
  var camera = manager.first('camera')
    , radius = this._radius - 10

  ctx.fillStyle = 'rgba(201,255,80,0.35)'
  ctx.beginPath()
  ctx.arc(this.pos[0], this.pos[1], radius, 0, CIRCLE, false)
  ctx.fill()
  ctx.save()
  ctx.translate(-16, -16)
  ctx.drawImage(sprite, this.pos[0], this.pos[1])
  ctx.restore()
}
