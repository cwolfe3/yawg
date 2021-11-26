function Point(x, y) {
  this.x = x;
  this.y = y;

  this.add = function(point) {
    return new Point(this.x + point.x, this.y + point.y);
  }

  this.scale = function(s) {
    return new Point(this.x * s, this.y * s);
  }

  this.sub = function(point) {
    return this.add(point.scale(-1));
  }

  this.mag2 = function() {
    return this.x * this.x + this.y * this.y;
  }

  this.dist2 = function(point) {
    return this.sub(point).mag2();
  }

  this.dist = function(point) {
    return Math.sqrt(this.dist2(point));
  }

  this.normalize = function() {
    return this.scale(1 / Math.sqrt(this.mag2()));
  }

  this.clamp = function(lower, upper) {
    if (this.mag2() < lower * lower) {
      return this.normalize().scale(lower);
    } else if (this.mag2() > upper * upper) {
      return this.normalize().scale(upper);
    } else {
      return this.copy();
    }
  }

  this.copy = function() {
    return new Point(this.x, this.y);
  }
}

export { Point };
