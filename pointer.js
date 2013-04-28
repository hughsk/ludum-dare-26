var inherits = require('inherits')
  , helpers = require('./helpers')
  , Entity = require('./entity')
  , game

module.exports = Pointer

var large = new Image
large.src = 'pointer.png'
var small = new Image
small.src = 'smallpointer.png'

function Pointer(target, islarge) {
  if (!(this instanceof Pointer)) return new Pointer(target, islarge)
  Entity.call(this)
  if (!game) throw new Error('game not ready')

  this.target = target || [0,0]
  this.opacity = 1
  this.large = !!islarge
  this.enabled = true
}
inherits(Pointer, Entity)

Pointer.register = function(g) {
  game = g
}

var dummy = [0,0]
Pointer.prototype.render = function(ctx, manager) {
  var camera = manager.first('camera')
    , width = ctx.canvas.width
    , height = ctx.canvas.height
    , target = this.target

  dummy = camera.relative(target, dummy)

  if (!this.enabled || (
    dummy[0] > 0 &&
    dummy[0] < width &&
    dummy[1] > 0 &&
    dummy[1] < height
  )) {
    this.opacity -= 0.05
    this.opacity = Math.max(0, this.opacity)
  } else {
    this.opacity += 0.05
    this.opacity = Math.min(1, this.opacity)
  }

  if (this.opacity < 0.01) return

  var edge = helpers.edgePoint(camera.pos, [
      target[0]-width/2
    , target[1]-height/2
  ], width - 100, height - 100)

  ctx.globalAlpha = this.opacity
  ctx.fillStyle = target[0] === 0 ? 'green' : 'yellow'
  ctx.save()
  ctx.translate(edge[0] + 50 + camera.pos[0], edge[1] + 50 + camera.pos[1])
  ctx.rotate(-edge[2])
  ctx.drawImage(this.large ? large : small, 0, 0)
  ctx.restore()
  ctx.globalAlpha = 1
}
