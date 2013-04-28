var inherits = require('inherits')
  , Entity = require('./entity')
  , imageloaded = require('image-loaded')
  , game
  , id = 0

module.exports = Nag

var sprite = new Image
sprite.src = 'glow.png'

function Nag(pos, spd, acc) {
  if (!(this instanceof Nag)) return new Nag(pos, spd, acc)
  Entity.call(this)
  if (!game) throw new Error('game not ready')
  var self = this

  game.boids.boids.push(this.data = {
      spd: this.spd = spd || [0,0]
    , pos: this.pos = pos || [0,0]
    , acc: this.acc = acc || [0,0]
    , id: this.id = id++
  })

  this.dying = false
  this.scale = 1

  this.once('kill', function() {
    var idx = game.boids.boids.indexOf(self.data)
    if (idx !== -1) return game.boids.boids.splice(idx, 1)
    for (var i = 0, l = game.boids.boids.length; i < l; i += 1) {
      if (game.boids.boids[i].id === self.id) {
        return game.boids.boids.splice(i, 1)
      }
    }
  })
}
inherits(Nag, Entity)

Nag.register = function(g) {
  game = g
  var manager = game.manager

  manager.on('storeChunk', function(chunk, pos) {
    chunk.push.apply(chunk, manager
      .find('nag')
      .filter(inRange(pos, manager.chunkSize))
      .map(function(nag) {
        nag.kill()
        return { type: 'nag', pos: nag.pos }
      })
    )
  })
  manager.on('restoreChunk', function(chunk, pos) {
    for (var i = 0, l = chunk.length; i < l; i += 1) {
      if (chunk[i].type !== 'nag') continue
      manager.add(new Nag(chunk[i].pos))
    }
  })
}

function inRange(pos, chunkSize) {
  return function(nag) {
    var x = nag.pos[0] - pos[0]*chunkSize
      , y = nag.pos[1] - pos[1]*chunkSize

    return (!nag.killed &&
      x > 0 && x < chunkSize &&
      y > 0 && y < chunkSize
    )
  }
}

Nag.prototype.tick = function() {
  if (this.dying) this.scale -= 0.05
  if (this.scale < 0) {
    this.scale = 0
    this.dying = false
    this.kill()
  }
}

Nag.prototype.render = function(ctx, manager) {
  var camera = manager.first('camera')

  if (this.scale !== 1) {
    ctx.save()
    ctx.translate(this.pos[0], this.pos[1])
    ctx.scale(this.scale, this.scale)
    ctx.drawImage(sprite, -16, -16)
    ctx.restore()
  } else {
    ctx.drawImage(sprite, this.pos[0]-16, this.pos[1]-16)
  }
}
