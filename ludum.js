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

  this.setupPostProcessing()
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

  if (this.target) {
    this.target.setSize(this.width, this.height)
    this.shader.uniforms.canvas.value.needsUpdate = true
    this.target.render(this.tscene, this.tcam)
  }

  ctx.restore()
}

Game.prototype.setupPostProcessing = function() {
  this.shader = new three.ShaderMaterial({
    fragmentShader: [
        'uniform sampler2D canvas;'
      , 'uniform float attacked;'
      , 'varying vec2 vUv;'

      , 'void main() {'
        , 'vec2 offset = vec2(1., 1.) * attacked;'
        , "vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( 1.0 );"
        , 'vec3 texel = vec3('
        ,     '  texture2D(canvas, vUv - offset).r'
        ,     ', texture2D(canvas, vUv).g'
        ,     ', texture2D(canvas, vUv + offset).b'
        , ');'
        , "gl_FragColor = vec4( mix( texel.rgb, vec3( 1.0 - attacked*100.0 ), dot( uv, uv ) ), 1.0 );"
      , '}'
    ].join('\n'),
    vertexShader: copyshader.vertexShader,
    uniforms: {
        canvas: { type: 't', value: null }
      , attacked: { type: 'f', value: 0 }
    }
  })
  this.target = new three.WebGLRenderer
  this.tcam = new three.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  this.tquad = new three.Mesh(new three.PlaneGeometry(2,2), this.shader)
  this.tscene = new three.Scene
  this.tscene.add(this.tquad)
  this.target.setClearColor(0xff0000)
  this.target.clear()
  this.shader.uniforms.canvas.value = new three.Texture(this.element)
  this.shader.uniforms.canvas.value.needsUpdate = true
  document.body.appendChild(this.target.domElement)
}

var game = module.exports = Game({

})

raf(window)
  .on('data', game.tick.bind(game))
  .on('data', game.render.bind(game))

// document.body.appendChild(game.element)
document.body.style.padding = '0'
document.body.style.margin = '0'

window.onresize = debounce(function() {
  game.resize()
}, 50)
