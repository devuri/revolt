

L.AnimatedLine = L.Polyline.extend({
  options: {
    // meters
    distance: 200,
    // ms
    interval: 250,
    // animate on add?
    autoStart: true,
    // callback onend
    onEnd: function(){},
    clickable: true
  },

  initialize: function (latlngs, options) {
      // Chunk up the lines into options.distance bits
    this._coords = this._chunk(latlngs);
    this.options.distance = 20;
    this.options.interval = 10;
    L.Polyline.prototype.initialize.call(this, latlngs, options);
  },

  // Breaks the line up into tiny chunks (see options) ONLY if CSS3 animations
  // are not supported.
  _chunk: function(latlngs) {
    var i,
        len = latlngs.length,
        chunkedLatLngs = [];

    for (i=1;i<len;i++) {
      var cur = latlngs[i-1],
          next = latlngs[i],
          dist = cur.distanceTo(next),
          factor = this.options.distance / dist,
          dLat = factor * (next.lat - cur.lat),
          dLng = factor * (next.lng - cur.lng);

      if (dist > this.options.distance) {
        while (dist > this.options.distance) {
          cur = new L.LatLng(cur.lat + dLat, cur.lng + dLng);
          dist = cur.distanceTo(next);
          chunkedLatLngs.push(cur);
        }
      } else {
        chunkedLatLngs.push(cur);
      }
    }

    return chunkedLatLngs;
  },

  onAdd: function (map) {
    L.Polyline.prototype.onAdd.call(this, map);

    // Start animating when added to the map
    if (this.options.autoStart) {
      this.start();
    }
  },

  animate: function() {
    var self = this,
        len = this._coords.length,
        speed = this.options.interval;

    // Normalize the transition speed from vertex to vertex
    if (this._i < len) {
      speed = this._coords[this._i-1].distanceTo(this._coords[this._i]) / this.options.distance * this.options.interval;
    }

    // Move to the next vertex
    this.setLatLngs(this._coords.slice(0,this._i+1));
    this._i++;

    // Queue up the animation ot the next next vertex
    this._tid = setTimeout(function(){
      if (self._i === len) {
        self.options.onEnd.apply(self, Array.prototype.slice.call(arguments));
      } else {
        self.animate();
      }
    }, speed);
  },

  // Start the animation
  start: function() {
    if (!this._i) {
      this._i = 1;
    }

    this.animate();
  },

  // Stop the animation in place
  stop: function() {
    if (this._tid) {
      clearTimeout(this._tid);
    }
  }
});

L.animatedLine = function (latlngs, options) {
  return new L.AnimatedLine(latlngs, options);
};