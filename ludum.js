var EventEmitter = require('events').EventEmitter
  , copyshader = require('three-copyshader')
  , inherits = require('inherits')
  , debounce = require('debounce')
  , three = require('three')
  , boids = require('boids')
  , vkey = require('vkey')
  , raf = require('raf')

var collectable = require('./collectable')
  , manager = require('./manager')
  , pointer = require('./pointer')
  , player = require('./player')
  , camera = require('./camera')
  , nag = require('./nag')
  , hub = require('./hub')
  , sky = require('./sky')

function Game(opts) {
  if (!(this instanceof Game)) return new Game(opts)
  EventEmitter.call(this)

  var self = this

  opts = opts || {}

  this.boids = boids({
      boids: 0
    , speedLimit: 4
    , attractors: [this.playerAttractor = [0,0,1200,0.25]]
    , separationForce: 0.2
    , separationDistance: 70
  })

  this.round = 1
  this.manager = manager(this)
  this.manager.register('camera', camera)
  this.manager.register('pointer', pointer)
  this.manager.register('sky', sky)
  this.manager.register('nag', nag)
  this.manager.register('hub', hub, ['safezone', 'actionable'])
  this.manager.register('collectable', collectable, ['safezone', 'actionable'])
  this.manager.register('player', player)

  this.manager.add(this.hub = hub())
  this.manager.add(this.player = player())
  this.manager.add(this.camera = camera())
  this.manager.add(sky())
  this.manager.add(pointer(this.hub.pos, true))
  this.manager.add(collectable())

  this.element = document.createElement('canvas')
  this.context = this.element.getContext('2d')

  document.body.addEventListener('keyup', function(e) {
    self.emit('keyup', vkey[e.keyCode], e)
  })

  document.body.addEventListener('keydown', function(e) {
    self.emit('keydown', vkey[e.keyCode], e)
  })

  this.resize()
}
inherits(Game, EventEmitter)

Game.prototype.tick = function(dt) {
  this.boids.tick(dt)
  this.manager.tick(dt)
}

Game.prototype.resize = function() {
  this.width = this.element.width = window.innerWidth
  this.height = this.element.height = window.innerHeight
}

Game.prototype.render = function(dt) {
  var ctx = this.context
    , camera = this.manager.first('camera')
    , sky = this.manager.first('sky')
    , width = this.width
    , height = this.height

  ctx.save()
  ctx.fillStyle = sky.color
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = 'black'
  ctx.translate(-camera.pos[0], -camera.pos[1])
  this.manager.render(ctx)

  ctx.restore()
}

var game = module.exports = Game({

})

raf(window)
  .on('data', game.tick.bind(game))
  .on('data', game.render.bind(game))

document.body.appendChild(game.element)
document.body.style.padding = '0'
document.body.style.margin = '0'

window.onresize = debounce(function() {
  game.resize()
}, 50)
