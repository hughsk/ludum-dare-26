var inherits = require('inherits')
  , Entity = require('./entity')
  , CIRCLE = Math.PI * 2
  , game

module.exports = Hub

function Hub() {
  if (!(this instanceof Hub)) return new Hub()
  Entity.call(this)
  if (!game) throw new Error('game not ready')
  this.pos = [0,0]
  this.radius = 100
}
inherits(Hub, Entity)

Hub.register = function(g) {
  game = g
}

var spareArray = []
Hub.prototype.render = function(ctx, manager) {
  var camera = manager.first('camera')

  ctx.fillStyle = 'rgba(0,255,0,0.25)'
  ctx.strokeStyle = 'rgba(0,255,0,0.75)'
  ctx.lineWidth = 0.65
  ctx.beginPath()
  camera.relative(this.pos, spareArray)
  ctx.arc(spareArray[0], spareArray[1], this.radius, 0, CIRCLE, false)
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = 'none'
}
