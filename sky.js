var imageloaded = require('image-loaded')
  , inherits = require('inherits')
  , Entity = require('./entity')
  , game

module.exports = Sky

var gradient = new Image
gradient.src = 'sky.png'

function Sky() {
  if (!(this instanceof Sky)) return new Sky()
  Entity.call(this)
  if (!game) throw new Error('game not ready')
  var self = this

  this.color = 0x000000
  this.data = [0,0,0,1]
  this.moment = 0

  imageloaded(gradient, function() {
    var canvas = document.createElement('canvas')
      , ctx = canvas.getContext('2d')

    canvas.width = gradient.width
    canvas.height = 1
    ctx.drawImage(gradient, 0, 0, canvas.width, 1)
    self.data = ctx.getImageData(0, 0, canvas.width, 1).data
  })
}
inherits(Sky, Entity)

Sky.register = function(g) {
  game = g
}

Sky.prototype.time = function(time) {
  var data = this.data
    , length = data.length
    , idxA = (Math.floor(time * length / 4) * 4) % length
    , idxB = (Math.floor(time * length / 4) * 4 + 4) % length
    , mid = ((time * length / 4) % 1)

  return 'rgb(' + [
      Math.round(data[idxA  ] + (data[idxB  ] - data[idxA  ]) * mid)
    , Math.round(data[idxA+1] + (data[idxB+1] - data[idxA+1]) * mid)
    , Math.round(data[idxA+2] + (data[idxB+2] - data[idxA+2]) * mid)
  ].join(',') + ')'
}

Sky.prototype.tick = function(dt, manager) {
  this.moment += 0.000075
  this.color = this.time(this.moment)
}
