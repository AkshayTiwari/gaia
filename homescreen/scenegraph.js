/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

function GetAnimationStartTime() {
  return window.mozAnimationStartTime ||
         window.webkitAnimationStartTime ||
         window.animationStartTime;
}

function RequestAnimationFrame() {
  if (window.mozRequestAnimationFrame)
    window.mozRequestAnimationFrame();
  else if (window.webkitRequestAnimationFrame)
    window.webkitRequestAnimationFrame();
  else if (window.requestAnimationFrame)
    window.requestAnimationFrame();
}

var Physics = {
  Linear: function(elapsed, start, current, target) {
    return start + (target - start) * elapsed;
  },
  Spring: function(elapsed, start, current, target) {
    return current + (target - current) * elapsed;
  }
}

function Sprite(canvas, x, y, scale) {
  this.canvas = canvas || null;
  this.width = this.height = 0;
  this.setPosition(x | 0, y | 0);
  this.setScale(scale || 1);
}

Sprite.prototype = {
  setCanvas: function(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    RequestAnimationFrame();
  },
  setPosition: function(targetX, targetY, duration, fn) {
    if (duration && (this.x != targetX || this.y != targetY)) {
      this.startX = this.x;
      this.startY = this.y;
      this.targetX = targetX;
      this.targetY = targetY;
      this.moveStart = GetAnimationStartTime();
      this.moveStop = this.moveStart + duration;
      this.moveFunction = fn || Physics.Spring;
      RequestAnimationFrame();
      return;
    }
    this.x = targetX;
    this.y = targetY;
    this.moveFuncton = null;
  },
  setScale: function(targetScale, duration, fn) {
    if (duration && this.scale != targetScale) {
      this.startScale = this.scale;
      this.targetScale = targetScale;
      this.scaleStart = GetAnimationStartTime();
      this.scaleStop = this.scaleStart + duration;
      this.scaleFunction = fn || Physics.Spring;
      RequestAnimationFrame();
      return;
    }
    this.scale = targetScale;
    this.scaleFunction = null;
  },
  stopAnimation: function() {
    this.moveFunction = this.scaleFunction = null;
  },
  animate: function(now) {
    function GetElapsed(start, stop, now) {
      return (now < start || now > stop) ? 1 : ((now - start) / (stop - start));
    }
    if (this.moveFunction) {
      var elapsed = GetElapsed(this.moveStart, this.moveStop, now);
      this.x = this.moveFunction(elapsed, this.startX, this.x, this.targetX);
      this.y = this.moveFunction(elapsed, this.startY, this.y, this.targetY);
      if (elapsed == 1)
        this.moveFunction = null;
    }
    if (this.scaleFunction) {
      var elapsed = GetElapsed(this.scaleStart, this.scaleStop, now);
      this.scale = this.scaleFunction(elapsed, this.startScale, this.scale, this.targetScale);
      if (elapsed == 1)
        this.scaleFunction = null;
    }
    return this.moveFunction || this.scaleFunction;
  }
}

function SceneGraph(canvas) {
  this.canvas = canvas;
  this.sprites = [];

  // animate the scene graph, returning false if the animation is done
  function animate(sprites, now) {
    var more = false;
    for (var n = 0; n < sprites.length; ++n) {
      var sprite = sprites[n];
      if (sprite.animate(now))
        more = true;
    }
    return more;
  }
  // fallback 2D canvas backend
  function draw(canvas, sprites) {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (var n = 0; n < sprites.length; ++n) {
      var sprite = sprites[n];
      var canvas = sprite.canvas;
      if (canvas) {
        var scale = sprite.scale;
        ctx.drawImage(canvas, sprite.x, sprite.y, canvas.width * scale, canvas.height * scale);
      }
    }
  }

  var self = this;
  window.addEventListener("MozBeforePaint", function(event) {
      // continue painting until we are run out of animations
      if (animate(self.sprites, event.timeStamp))
        RequestAnimationFrame();
      draw(self.canvas, self.sprites);
    }, false);
}

SceneGraph.prototype = {
  // add a sprite to the scene graph
  add: function(sprite) {
    var sprites = this.sprites;
    sprite.index = sprites.length;
    sprites.push(sprite);
  },
  // remove a sprite from the scene graph
  remove: function(sprite) {
    var sprites = this.sprites;
    sprites.splice(sprites.index, 1);
  },
  // walk over all sprites in the scene
  forAll: function(callback) {
    var sprites = this.sprites;
    for (var n = 0; n < sprites.length; ++n)
      callback(sprites[n]);
  },
  forHit: function(x, y, callback) {
    var canvas = this.canvas;
    x -= canvas.clientLeft;
    y -= canvas.clientTop;
    if (x >= canvas.clientWidth || y >= canvas.clientHeight)
      return;
    var sprites = this.sprites;
    for (var n = 0; n < sprites.length; ++n) {
      var sprite = sprites[n];
      if (x >= sprite.x && x < sprite.x + sprite.width &&
          y >= sprite.y && y < sprite.y + sprite.height) {
        callback(sprite);
        return;
      }
    }
  }
}
