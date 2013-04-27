var EventEmitter = require('events').EventEmitter
  , inherits = require('inherits')
  , debounce = require('debounce')
  , boids = require('boids')
  , vkey = require('vkey')
  , raf = require('raf')

var manager = require('./manager')
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
    , speedLimit: 7
    , attractors: [this.playerAttractor = [0,0,500,0.25]]
    , separationForce: 0.2
    , separationDistance: 70
  })

  this.manager = manager(this)
  this.manager.register('player', player)
  this.manager.register('camera', camera)
  this.manager.register('pointer', pointer)
  this.manager.register('sky', sky)
  this.manager.register('nag', nag)
  this.manager.register('hub', hub, ['safezone'])

  this.manager.add(this.hub = hub())
  this.manager.add(player())
  this.manager.add(camera())
  this.manager.add(sky())
  this.manager.add(pointer(this.hub.pos))
  for (var i = 0, l = 200; i < l; i += 1)
    this.manager.add(nag([Math.random()*100-50, Math.random()*100-50]))

  // i = 0; l = 10;
  // for (; i < l; i += 1) {
  //   var randp = pointer()
  //   randp.target[0] = Math.random() * 5000 - 2500
  //   randp.target[1] = Math.random() * 5000 - 2500
  //   this.manager.add(randp)
  // }

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
    , sky = this.manager.first('sky')
    , width = this.width
    , height = this.height

  ctx.fillStyle = sky.color
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = 'black'

  this.manager.render(ctx)
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
