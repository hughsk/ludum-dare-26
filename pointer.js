var inherits = require('inherits')
  , helpers = require('./helpers')
  , Entity = require('./entity')
  , game

module.exports = Pointer

var sprite = new Image
sprite.src = 'pointer.png'
function Pointer() {
  if (!(this instanceof Pointer)) return new Pointer()
  Entity.call(this)
  if (!game) throw new Error('game not ready')

  this.target = [0,0]
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
    , edge = helpers.edgePoint(camera.pos, [target[0]-width/2,target[1]-height/2], width - 100, height - 100)

  ctx.fillStyle = target[0] === 0 ? 'green' : 'yellow'
  ctx.save()
  ctx.translate(edge[0] + 50, edge[1] + 50)
  ctx.rotate(-edge[2])
  ctx.drawImage(sprite, 0, 0)
  ctx.restore()

  target = camera.relative(target, dummy)
  ctx.fillStyle = 'blue'
  ctx.fillRect(target[0], target[1], 20, 20)
}
