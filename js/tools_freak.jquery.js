(function() {

  (function($, window, document) {
    var error_function, timers_handler, wresize;
    if (!String.prototype.trim) {
      String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, "");
      };
    }
    if (!Array.prototype.indexOf) {
      Array.prototype.indexOf = function(searchElement) {
        "use strict";
        var k, len, n, t;
        if (this === void 0 || this === null) throw new TypeError();
        t = Object(this);
        len = t.length >>> 0;
        if (len === 0) return -1;
        n = 0;
        if (arguments.length > 0) {
          n = Number(arguments[1]);
          if (n !== n) {
            n = 0;
          } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
            n = (n > 0 || -1) * Math.floor(Math.abs(n));
          }
        }
        if (n >= len) return -1;
        k = (n >= 0 ? n : Math.max(len - Math.abs(n), 0));
        while (k < len) {
          if (k in t && t[k] === searchElement) return k;
          k++;
        }
        return -1;
      };
    }
    wresize = function(callback) {
      var _this = this;
      this.wresize_vars = {
        fired: false,
        width: 0
      };
      this.resizeOnce = function() {
        var version, width;
        if ($.browser.msie) {
          if (this.wresize_vars.fired === false) {
            this.wresize_vars.fired = true;
          } else {
            version = parseInt($.browser.version, 10);
            this.wresize_vars.fired = false;
            if (version < 7) {
              return false;
            } else if (version === 7) {
              width = $(window).width();
              if (width !== this.wresize_vars.width) {
                this.wresize_vars.width = width;
                return false;
              }
            }
          }
        }
        return true;
      };
      this.handleWResize = function(e) {
        if (_this.resizeOnce() === true) return callback.apply(_this, [e]);
      };
      $(window).resize(this.handleWResize);
    };
    timers_handler = function() {
      var default_timer, end, endAndStart, list_of_timers;
      list_of_timers = {};
      default_timer = "default_timer";
      endAndStart = function(callback, time, named_timer) {
        var timer;
        if (callback === void 0) return false;
        if (time === void 0) return false;
        timer = default_timer;
        if (named_timer !== void 0) timer = named_timer;
        if (list_of_timers[timer] !== void 0) {
          window.clearTimeout(list_of_timers[timer]);
        }
        list_of_timers[timer] = window.setTimeout(function() {
          return callback();
        }, time);
        return true;
      };
      end = function(named_timer) {
        var timer;
        timer = default_timer;
        if (named_timer !== void 0) timer = named_timer;
        if (list_of_timers[timer] === void 0) return false;
        window.clearTimeout(list_of_timers[timer]);
        return true;
      };
      return {
        endAndStart: endAndStart,
        end: end,
        list: list_of_timers
      };
    };
    error_function = function(message, where) {
      message = "Error( " + where + " '" + message + "' )";
      try {
        console.log(message);
      } catch (e) {
        alert(message);
      }
      return true;
    };
    return $.fn.toolsfreak = {
      wresize: wresize,
      timers_handler: timers_handler,
      error_func: error_function
    };
  })(jQuery, window, document);

}).call(this);
