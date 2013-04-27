var helpers = module.exports = {}
  , PI = Math.PI
  , angle = 180 / PI

helpers.edgePoint = function(src, dst, width, height) {
  var dir = Math.atan2(
      dst[0] - src[0]
    , dst[1] - src[1]
  )

  var x = Math.sin(dir) * width
    , y = Math.cos(dir) * height

  return [
      Math.min(Math.max(0, x + width/2), width)
    , Math.min(Math.max(0, y + height/2), height)
    , dir
  ]
}
