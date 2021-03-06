var inherits = require('inherits')
  , helpers = require('./helpers')
  , nag = require('./nag')
  , Entity = require('./entity')
  , tic = require('tic')
  , vkey = require('vkey')
  , game

module.exports = Player

var sprite = new Image
sprite.src = 'player.png'
var action = new Image
action.src = 'player_action.png'

function Player() {
  if (!(this instanceof Player)) return new Player()
  Entity.call(this)
  if (!game) throw new Error('game not ready')

  var self = this
    , movement = 0.2

  this.pos = [0,0]
  this.spd = [0,0]
  this.acc = [0,0]
  this.game = game
  this.scale = 1
  this.spawner = tic()
  this.collected = 0
  this.action = true
  this.moved = false

  this.spawner.interval(function() {
    var angle = Math.random() * Math.PI * 2
    if (game.boids.boids.length < 150) game.manager.add(nag([
        self.pos[0] + Math.sin(angle) * Math.max(game.width, game.height)
      , self.pos[1] + Math.cos(angle) * Math.max(game.width, game.height)
    ]))
  }, 2500, 'Every')

  this.game.on('keydown', function(key) {
    switch (key) {
      case 'W': case '<up>':    self.acc[1] -= movement; break
      case 'A': case '<left>':  self.acc[0] -= movement; break
      case 'S': case '<down>':  self.acc[1] += movement; break
      case 'D': case '<right>': self.acc[0] += movement; break
      case 'E': if (self.action) self.action.doAction(self); break
    }
  })

  this.game.on('keyup', function(key) {
    switch (key) {
      case 'W': case '<up>':    self.acc[1] = 0; break
      case 'A': case '<left>':  self.acc[0] = 0; break
      case 'S': case '<down>':  self.acc[1] = 0; break
      case 'D': case '<right>': self.acc[0] = 0; break
    }
  })
}
inherits(Player, Entity)

Player.register = function(g) {
  game = g
}

var friction = 1 - 0.035
  , limit = 10

function sqDist(a, b) {
  var x = a[0]-b[0]
    , y = a[1]-b[1]
  return x*x+y*y
}

Player.prototype.tick = function(dt, manager) {
  var pos = this.pos
    , chunkX = Math.floor(pos[0] / manager.chunkSize)
    , chunkY = Math.floor(pos[1] / manager.chunkSize)
    , chunk = chunkX + ',' + chunkY
    , game = manager.game
    , sky = manager.first('sky')
    , actions = manager.group('actionable')
    , boids = game.boids.boids
    , d = [0,0]

  if (this.moved) this.spawner.tick(dt)
  if (game.finished) this.scale *= 0.95

  this.action = false
  for (var i = 0, l = actions.length; i < l; i += 1) {
    if (sqDist(actions[i].pos, this.pos) < actions[i].radius*actions[i].radius) {
      if (actions[i]._type !== 'hub' || game.roundCollected) {
        this.action = actions[i]
      }
    }
  }

  if (manager.chunk !== chunk) {
    manager.chunk = chunk
    manager.updateChunks(chunkX, chunkY)
  }

  this.spd[0] += this.acc[0]
  this.spd[1] += this.acc[1]
  this.spd[0] *= friction
  this.spd[1] *= friction
  var speed = Math.sqrt(this.spd[0]*this.spd[0] + this.spd[1]*this.spd[1])
  if (speed > limit) {
    this.spd[0] *= limit / speed
    this.spd[1] *= limit / speed
  }

  for (var i = 0, l = boids.length; i < l; i += 1) {
    d[0] = boids[i].pos[0] - pos[0]
    d[1] = boids[i].pos[1] - pos[1]
    if (d[0]*d[0]+d[1]*d[1] < 144) {
      game.camera.pos[0] += Math.random() * 24 - 12
      game.camera.pos[1] += Math.random() * 24 - 12
      if (game.shader) {
        game.shader.uniforms.attacked.value = Math.max(0.01
          , game.shader.uniforms.attacked.value
        )
      }
      this.spd[0] += Math.random() * 24 - 12
      this.spd[1] += Math.random() * 24 - 12
      game.sounds.play('nudge', { volume: 50 })
      sky.moment += 0.01
    }
  }

  pos[0] += this.spd[0]
  pos[1] += this.spd[1]
  game.playerAttractor[0] = pos[0]
  game.playerAttractor[1] = pos[1]
  game.chaserAttractor[0] = pos[0]
  game.chaserAttractor[1] = pos[1]
}

Player.prototype.render = function(ctx, manager) {
  var camera = manager.first('camera')
    , pos = this.pos
    , width = ctx.canvas.width
    , height = ctx.canvas.height
    , sky = manager.first('sky')
    , skycolor = sky.time(sky.moment)

  if (game.shader) game.shader.uniforms.attacked.value *= 0.95

  ctx.save()
  ctx.translate(pos[0], pos[1])
  if (this.scale !== 1) ctx.scale(this.scale, this.scale)
  ctx.drawImage(this.action ? action : sprite,  -32,  -32)
  ctx.restore()
}
