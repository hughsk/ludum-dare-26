var inherits = require('inherits')
  , EventEmitter = require('events').EventEmitter

module.exports = Manager

function Manager(game) {
  if (!(this instanceof Manager)) return new Manager(game)

  this.game = game
  this.groups = {}
  this.chunk = ''
  this.chunks = {}
  this.chunkRange = 2
  this.chunkSize = 250
  this.chunkList = []
  this.types = {}
  this.all = []

  this.on('storeChunk', function(chunk) {
    process.nextTick(function() {
      console.log('store', chunk.length)
    })
  })
  this.on('restoreChunk', function(chunk, pos) {
    console.log('restore', chunk.length)
  })
}
inherits(Manager, EventEmitter)

Manager.prototype.register = function(name, proto, groups) {
  groups = groups || []
  groups = Array.isArray(groups) ? groups : [groups]
  this.types[name] = this.types[name] || []
  for (var i = 0, l = groups.length; i < l; i += 1) {
    this.groups[groups[i]] = this.groups[groups[i]] || []
  }

  proto.prototype._type = name
  proto.prototype._groups = groups
  if (proto.register) proto.register(this.game, this)
}

Manager.prototype.add = function(inst) {
  var type = inst._type
    , groups = inst._groups
    , group

  this.all.push(inst)
  this.types[type].push(inst)
  for (var i = 0, l = groups.length; i < l; i += 1) {
    this.groups[groups[i]].push(inst)
  }
}

Manager.prototype.find = function(type) {
  return this.types[type]
}

Manager.prototype.first = function(type) {
  return this.types[type][0]
}

Manager.prototype.group = function(group) {
  return this.groups[group]
}

Manager.prototype.tick = function(dt) {
  var all = this.all
    , item
    , type
    , group
    , groups

  for (var i = 0, l = all.length; i < l; i += 1) {
    all[i].tick(dt, this)
  }

  for (i = 0; i < l; i += 1) if (all[i].killing) {
    item = all[i]
    item.emit('kill')
    all.splice(i, 1)

    type = this.types[item._type]
    type.splice(type.indexOf(item), 1)
    groups = item._groups

    for (var j = 0, k = groups.length; j < k; j += 1) {
      group = this.groups[groups[i]]
      group.splice(group.indexOf(item), 1)
    }

    i -= 1
    l -= 1
  }
}

Manager.prototype.render = function(ctx) {
  var all = this.all
  for (var i = 0, l = all.length; i < l; i += 1) {
    all[i].render(ctx, this)
  }
}

Manager.prototype.updateChunks = function(x, y) {
  var chunk = x + ',' + y
    , chunkList = this.chunkList
    , chunks = this.chunks
    , range = this.chunkRange
    , self = this

  // Storing chunks no longer accessible
  var a = 0
  chunkList.forEach(function(key, n) {
    var pos = key.split(',')
    if (!(
      Math.abs(pos[0] - x) > range &&
      Math.abs(pos[1] - y) > range
    )) return

    chunkList.splice(n-(a++), 1)
    self.emit('storeChunk'
      , chunks[key] = chunks[key] || []
      , pos
      , key
    )
  })

  // Restoring old chunks
  for (var key, a = -range; a < range; a += 1) {
    for (var b = -range; b < range; b += 1) {
      key = (a+x) + ',' + (b+y)
      if (chunkList.indexOf(key) === -1) chunkList.push(key)
      if (!(key in chunks)) continue

      self.emit('restoreChunk'
        , chunks[key] || []
        , [a,b]
        , key
      )
      delete chunks[key]
    }
  }
}
