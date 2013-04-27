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
    , idx = (Math.floor(time * length / 4) * 4) % length

  return 'rgb(' + [data[idx],data[idx+1],data[idx+2]].join(',') + ')'
}

Sky.prototype.tick = function(dt, manager) {
  this.moment += 0.001
  this.color = this.time(this.moment)
}
