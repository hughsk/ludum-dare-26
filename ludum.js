require('./vendor/soundmanager2-nodebug-jsmin.js')

var shader
  , renderer
  , tcam
  , quad
  , scene
  , shaderTexture
  , template = require('./score.ejs')

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
  , chaser = require('./chaser')
  , nag = require('./nag')
  , hub = require('./hub')
  , sky = require('./sky')

soundManager.setup({
    url: 'vendor/swf/'
  , useHighPerformance: true
  , onready: function() {
    var game = module.exports = Game({})

    raf(window)
      .on('data', function(dt) { game.tick(dt) })
      .on('data', function(dt) { game.render(dt) })

    document.body.style.padding = '0'
    document.body.style.margin = '0'
    document.body.style.background = '#000'

    window.onresize = debounce(function() {
      game.resize()
    }, 50)

    game.once('quitting', quitting)
    function quitting(score) {
      var div = document.createElement('div')
      div.innerHTML = template({
        score: score
      })
      document.body.appendChild(div)
      document.querySelector('[data-playagain]').onclick = function(e) {
        game = module.exports = Game({})
        game.once('quitting', quitting)
        e.preventDefault()
        document.body.removeChild(div)
        return false
      }
    }
  }
})

function Game(opts) {
  if (!(this instanceof Game)) return new Game(opts)
  EventEmitter.call(this)

  var self = this

  opts = opts || {}

  this.playerAttractor = [0,0,1200,0.25]
  this.chaserAttractor = [0,0,Infinity,0.5]
  this.boids = boids({
      boids: 0
    , speedLimit: 4
    , attractors: [this.playerAttractor]
    , separationForce: 0.2
    , separationDistance: 70
  })

  this.chasers = boids({
      boids: 0
    , speedLimit: 10
    , attractors: [this.chaserAttractor]
    , separationDistance: 70
    , separationForce: 0.2
    , alignment: 0.3
  })

  this.round = 1
  this.score = 0
  this.fadeout = 1
  this.finished = false
  this.collected = 0
  this.roundCollected = false
  this.manager = manager(this)
  this.manager.register('camera', camera)
  this.manager.register('pointer', pointer)
  this.manager.register('sky', sky)
  this.manager.register('nag', nag)
  this.manager.register('chaser', chaser)
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
  this.context.setLineDash = this.context.setLineDash || function(){}

  this.sounds = soundManager
  this.sounds.createSound({
      id: 'nudge'
    , url: 'audio/nudge.mp3'
    , autoLoad: true
    , autoPlay: false
    , volume: 100
  })
  this.sounds.createSound({
      id: 'point'
    , url: 'audio/point2.mp3'
    , autoLoad: true
    , autoPlay: false
    , volume: 100
  })
  this.sounds.createSound({
      id: 'hub'
    , url: 'audio/hub.mp3'
    , autoLoad: true
    , autoPlay: false
    , volume: 100
  })
  this.sounds.createSound({
      id: 'chaser'
    , url: 'audio/chaser.mp3'
    , autoLoad: true
    , autoPlay: false
    , volume: 100
  })
  this.sounds.createSound({
      id: 'finish'
    , url: 'audio/finish.mp3'
    , autoLoad: true
    , autoPlay: false
    , volume: 100
  })

  function keyup(e) {
    self.emit('keyup', vkey[e.keyCode], e)
  }
  function keydown(e) {
    self.emit('keydown', vkey[e.keyCode], e)
  }

  document.body.addEventListener('keyup', keyup)
  document.body.addEventListener('keydown', keydown)
  this.on('finishing', function() {
    document.body.removeEventListener('keyup', keyup)
    document.body.removeEventListener('keydown', keydown)
  })

  if (window.WebGLRenderingContext) {
    this.setupPostProcessing()
  } else {
    document.body.appendChild(this.element)
  }

  this.resize()
}
inherits(Game, EventEmitter)

Game.prototype.tick = function(dt) {
  if (this.finished) {
    this.fadeout *= 0.98
    var attacked = this.shader.uniforms.attacked
    attacked.value = Math.min(attacked.value+0.001, 0.02)
  }
  this.boids.tick(dt)
  this.chasers.tick(dt)
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

  ctx.translate(-camera.pos[0], -camera.pos[1])
  this.manager.render(ctx)

  ctx.restore()

  if (this.fadeout !== 1) {
    ctx.fillStyle = 'black'
    ctx.globalAlpha = 1 - this.fadeout
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = 1
    if (this.fadeout < 0.001) {
      this.end()
    }
  }

  if (this.target) {
    this.target.setSize(width, height)
    this.shader.uniforms.canvas.value.needsUpdate = true
    this.target.render(this.tscene, this.tcam)
  }
}

Game.prototype.setupPostProcessing = function() {
  this.shader = shader = shader || new three.ShaderMaterial({
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
        , "gl_FragColor = vec4( mix( texel.rgb, vec3( 1.0 - attacked * 100. ), dot( uv, uv ) ), 1.0 );"
      , '}'
    ].join('\n'),
    vertexShader: copyshader.vertexShader,
    uniforms: {
        canvas: { type: 't', value: null }
      , attacked: { type: 'f', value: 0 }
    }
  })
  this.target = renderer = renderer || new three.WebGLRenderer
  this.tcam = tcam = tcam || new three.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  this.tquad = quad = quad || new three.Mesh(new three.PlaneGeometry(2,2), this.shader)
  this.tscene = scene = scene || new three.Scene
  this.tscene.add(this.tquad)
  this.target.setClearColor(0xff0000)
  this.target.clear()
  if (shaderTexture) {
    this.shader.uniforms.canvas.value = shaderTexture
    this.shader.uniforms.canvas.value.image = this.element
  } else {
    this.shader.uniforms.canvas.value = shaderTexture = shaderTexture || new three.Texture(this.element)
    this.shader.uniforms.canvas.value.needsUpdate = true
  }
  this.shader.uniforms.attacked.value = 0
  document.body.appendChild(this.target.domElement)
}

Game.prototype.end = function() {
  var self = this
  if (this.ended) return
  this.ended = true
  this.emit('quitting', this.score)

  if (this.target) {
    document.body.removeChild(this.target.domElement)
  } else {
    document.body.removeChild(this.element)
  }

  Object.keys(this).forEach(function(key) {
    delete this[key]
  })
  Object.keys(Game.prototype).forEach(function(key) {
    self[key] = function(){}
  })
}

Game.prototype.finish = function() {
  if (this.finished) return
  this.finished = true
  this.sounds.play('finish')
  this.emit('finishing')
  this.player.acc[0] = 0
  this.player.acc[1] = 0
}
