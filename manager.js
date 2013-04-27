module.exports = Manager

function Manager(game) {
  if (!(this instanceof Manager)) return new Manager(game)

  this.game = game
  this.groups = {}
  this.types = {}
  this.all = []
}

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
  for (var i = 0, l = all.length; i < l; i += 1) {
    all[i].tick(dt, this)
  }
}

Manager.prototype.render = function(ctx) {
  var all = this.all
  for (var i = 0, l = all.length; i < l; i += 1) {
    all[i].render(ctx, this)
  }
}
