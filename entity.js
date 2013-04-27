var EventEmitter = require('events').EventEmitter
  , inherits = require('inherits')

module.exports = Entity

function Entity() {
  if (!(this instanceof Entity)) return new Entity
  EventEmitter.call(this)
}
inherits(Entity, EventEmitter)

Entity.prototype.tick = function(){}
Entity.prototype.render = function(){}
Entity.prototype.kill = function() {
  this.killing = true
}
