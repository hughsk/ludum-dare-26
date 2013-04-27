var inherits = require('inherits')
  , Entity = require('./entity')
  , CIRCLE = Math.PI * 2
  , game

module.exports = Hub

function Hub() {
  if (!(this instanceof Hub)) return new Hub()
  Entity.call(this)
  if (!game) throw new Error('game not ready')
  this.radius =
  this._radius = 100
  game.boids.attractors.push(
    this.pos = [0,0,this._radius,-20]
  )
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

  ctx.fillStyle = 'rgba(0,255,0,0.25)'
  ctx.strokeStyle = 'rgba(0,255,0,0.75)'
  ctx.lineWidth = 0.65
  ctx.beginPath()
  ctx.arc(this.pos[0], this.pos[1], radius, 0, CIRCLE, false)
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = 'none'
}
