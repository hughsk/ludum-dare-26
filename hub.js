var inherits = require('inherits')
  , Entity = require('./entity')
  , collectable = require('./collectable')
  , CIRCLE = Math.PI * 2
  , game

module.exports = Hub
var title = new Image
title.src = 'title.png'

function Hub() {
  if (!(this instanceof Hub)) return new Hub()
  Entity.call(this)
  if (!game) throw new Error('game not ready')
  this.radius =
  this._radius = 125
  game.boids.attractors.push(
    this.pos = [0,0,this._radius,-20]
  )
}
inherits(Hub, Entity)

Hub.register = function(g) {
  game = g
}

Hub.prototype.tick = function() {
  var chasers = game.manager.find('chaser')
    , chaser
    , x
    , y

  for (var i = 0, l = chasers.length; i < l; i += 1) {
    chaser = chasers[i]
    if (chaser.dying) continue
    x = chaser.pos[0] - this.pos[0]
    y = chaser.pos[1] - this.pos[0]
    if (x*x+y*y < this._radius*this._radius) {
      this.radius += 25
      game.player.collected -= 1
      chaser.dying = true
      chaser.spd[0] = 0
      chaser.spd[1] = 0
    }
  }
  this.pos[2] = this._radius = this._radius + (this.radius - this._radius) * 0.1
}

Hub.prototype.render = function(ctx, manager) {
  var camera = manager.first('camera')
    , radius = this._radius - 10

  if (radius < 0) return

  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath()
  ctx.arc(this.pos[0], this.pos[1], radius, 0, CIRCLE, false)
  ctx.fill()
  ctx.save()
  ctx.translate(this.pos[0] - 125, this.pos[1] - 95 - radius)
  ctx.drawImage(title, 0, 0)
  ctx.restore()
}

Hub.prototype.doAction = function(player) {
  game.sounds.play('hub')

  var sky = game.manager.first('sky')
    , nag = game.manager.find('nag')
    , collectables = game.manager.find('collectable')
    , chunks = game.manager.chunks

  sky.moment = 0
  this.radius = Math.max(
      20
    , this.radius - Math.max(25, game.round * 25 - 25)
  )
  game.round += 1
  game.roundCollected = false
  game.player.spawner._things[0].at = Math.pow(0.9, game.round) * 2500
  game.boids.speedLimitRoot = Math.min(game.boids.speedLimit + 1, 9)
  game.boids.speedLimit = game.boids.speedLimitRoot*game.boids.speedLimitRoot

  for (var i = 0, l = nag.length; i < l; i += 1) {
    nag[i].dying = true
  }

  Object.keys(chunks).forEach(function(chunk) {
    chunk = chunks[chunk]
    for (var i = 0, l = chunk.length; i < l; i += 1) {
      if (chunk[i].type !== 'nag') continue
      chunk.splice(i, 1)
      i -= 1
      l -= 1
    }
  })

  collectables.forEach(function(c) { c.revive() })
  game.manager.add(collectable())
}
