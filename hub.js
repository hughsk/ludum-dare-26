var inherits = require('inherits')
  , Entity = require('./entity')
  , collectable = require('./collectable')
  , CIRCLE = Math.PI * 2
  , game

module.exports = Hub
var title = new Image
title.src = 'title.png'
var wasd = new Image
wasd.src = 'wasd.png'
var scores = []
for (var s = 0; s < 10; s += 1) {
  scores[s] = new Image
  scores[s].src = 'n' + s + '.png'
}

function drawScore(ctx, num) {
  num = String(num).split('')
  for (var i = 0; i < num.length; i += 1) {
    ctx.drawImage(scores[num[i]], i*24 - 8, 0)
  }
}

function Hub() {
  if (!(this instanceof Hub)) return new Hub()
  Entity.call(this)
  if (!game) throw new Error('game not ready')

  this.radius =
  this._radius =
  this.maxRadius = 125

  this.wasdOpacity = 1
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
    , player = game.player
    , chaser
    , x
    , y

  if (!player.moved) {
    x = player.pos[0] - this.pos[0]
    y = player.pos[1] - this.pos[1]
    if (x*x*y*y > this._radius*this._radius) {
      player.moved = true
    }
  } else
  if (this.wasdOpacity > 0.01) {
    this.wasdOpacity *= 0.95
  }

  this.maxRadius = Math.max(this._radius, this.maxRadius)
  game.score = Math.round(this.maxRadius + game.collected)

  for (var i = 0, l = chasers.length; i < l; i += 1) {
    chaser = chasers[i]
    if (chaser.dying) continue
    x = chaser.pos[0] - this.pos[0]
    y = chaser.pos[1] - this.pos[0]
    if (x*x+y*y < this._radius*this._radius) {
      this.radius += Math.max(25 - game.round * 0.2, 15)
      game.player.collected -= 1
      game.sounds.play('chaser')
      chaser.dying = true
      chaser.spd[0] = 0
      chaser.spd[1] = 0
    }
  }
  this.pos[2] = this._radius = this._radius + (this.radius - this._radius) * 0.1
}

var dash = [5]
Hub.prototype.render = function(ctx, manager) {
  var camera = manager.first('camera')
    , radius = this._radius - 10
    , maxRadius = this.maxRadius - 10

  if (radius < 0) return

  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.setLineDash(dash)
  ctx.beginPath()
  ctx.arc(this.pos[0], this.pos[1], radius, 0, CIRCLE, false)
  ctx.fill()
  if (maxRadius - radius > 1) {
    ctx.beginPath()
    ctx.arc(this.pos[0], this.pos[1], maxRadius, 0, CIRCLE, false)
    ctx.stroke()
  }
  ctx.save()
    ctx.translate(this.pos[0], this.pos[1])
    if (this.wasdOpacity > 0.01) {
      ctx.globalAlpha = this.wasdOpacity
      ctx.drawImage(wasd, -125, -125)
      ctx.globalAlpha = 1
    }
    var scorelength = String(game.score).length * 12
    ctx.globalAlpha = 1 - this.wasdOpacity
    ctx.save()
      ctx.translate(this.pos[0] - scorelength, this.pos[1] + radius + 10)
      drawScore(ctx, game.score)
    ctx.restore()
    ctx.globalAlpha = 1
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
    , this.radius - Math.max(25
      , game.round * 25 - 25
    )
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
