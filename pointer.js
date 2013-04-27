var inherits = require('inherits')
  , helpers = require('./helpers')
  , Entity = require('./entity')
  , game

module.exports = Pointer

var sprite = new Image
sprite.src = 'pointer.png'
function Pointer(target) {
  if (!(this instanceof Pointer)) return new Pointer(target)
  Entity.call(this)
  if (!game) throw new Error('game not ready')

  this.target = target || [0,0]
  this.opacity = 1
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

  if (
    dummy[0] > 0 &&
    dummy[0] < width &&
    dummy[1] > 0 &&
    dummy[1] < height
  ) {
    this.opacity *= 0.8
  } else {
    this.opacity *= 1.2
    this.opacity = Math.min(1, this.opacity)
  }

  if (this.opacity < 0.01) return

  var edge = helpers.edgePoint(camera.pos, [
      target[0]-width/2
    , target[1]-height/2
  ], width - 100, height - 100)

  ctx.globalAlpha = this.opacity
  console.log(this.opacity)
  ctx.fillStyle = target[0] === 0 ? 'green' : 'yellow'
  ctx.save()
  ctx.translate(edge[0] + 50, edge[1] + 50)
  ctx.rotate(-edge[2])
  ctx.drawImage(sprite, 0, 0)
  ctx.restore()
  ctx.globalAlpha = 1
}
