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

  (function($, window, document) {
    var NOLocalStorageClass, StorageFreak, defaults, pluginName;
    pluginName = "storagefreak";
    defaults = {
      dummy_var: null
    };
    StorageFreak = function(element, options) {
      this.element = element;
      this.options = $.extend({}, defaults, options);
      this._defaults = defaults;
      this._name = pluginName;
      this.localStorageSupport = false;
      return this.init();
    };
    NOLocalStorageClass = function() {
      var _this = this;
      this.length = 0;
      this.NOLocalData = {};
      this.getItem = function(key) {
        var value;
        value = _this.NOLocalData[key];
        if (value === void 0) return null;
        return value;
      };
      this.setItem = function(key, value) {
        _this.NOLocalData[key] = value;
        _this.length += 1;
        return true;
      };
      this.clear = function() {
        _this.length = 0;
        delete _this.NOLocalData;
        _this.NOLocalData = {};
        return true;
      };
      this.key = function(index) {
        var i, key, value, _ref;
        i = 0;
        _ref = _this.NOLocalData;
        for (key in _ref) {
          value = _ref[key];
          if (i === index) return key;
          i++;
        }
        return false;
      };
    };
    StorageFreak.prototype = {
      init: function() {
        if (StorageFreak.instance != null) return;
        StorageFreak.obj_count++;
        this.my_count = StorageFreak.obj_count;
        this.localStorageSupport = StorageFreak.localStorage_support();
        if (this.localStorageSupport !== true) {
          this.localStorage = new NOLocalStorageClass();
        } else {
          this.localStorage = localStorage;
        }
      },
      toString: function() {
        return this._name;
      },
      get_instance: function() {
        return StorageFreak.instance;
      },
      get_objcount: function() {
        return StorageFreak.obj_count;
      },
      local_available: function() {
        return this.localStorageSupport;
      },
      get: function(key) {
        var value;
        if (typeof key !== "string" || key === "") return false;
        try {
          value = JSON.parse(this.localStorage.getItem(key));
        } catch (e) {
          return false;
        }
        if (value === null || value === "") {
          return false;
        } else {
          return value;
        }
      },
      set: function(key, value) {
        if (typeof key !== "string" || key === "") return false;
        if (value === undefined || value === null) return false;
        try {
          this.localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          return false;
        }
        return true;
      },
      length: function() {
        try {
          return this.localStorage.length;
        } catch (e) {
          return false;
        }
      },
      del: function(key) {
        if (typeof key !== "string" || key === "") return false;
        if (this.get(key) === false) {
          return false;
        } else {
          return this.set(key, "");
        }
      },
      del_all: function() {
        try {
          this.localStorage.clear();
        } catch (e) {
          return false;
        }
        return true;
      },
      find_index_by_key: function(key) {
        var i, number_of_tuples, temp_key;
        if (typeof key !== "string" || key === "") return false;
        number_of_tuples = this.length();
        temp_key = null;
        i = 0;
        while (i < number_of_tuples) {
          temp_key = this.find_key_by_index(i);
          if (temp_key === key) return i;
          i++;
        }
        return false;
      },
      find_value_by_key: function(key) {
        return this.get(key);
      },
      find_key_by_index: function(index) {
        var temp_length;
        if (typeof index !== "number") return false;
        temp_length = this.length();
        if (index < 0 || index >= temp_length) return false;
        try {
          return this.localStorage.key(index);
        } catch (e) {
          return false;
        }
      },
      find_value_by_index: function(index) {
        if (typeof index !== "number") return false;
        try {
          return this.get(this.find_key_by_index(index));
        } catch (e) {
          return false;
        }
      },
      find_key_by_value: function(value) {
        var i, number_of_tuples, temp_key, temp_value;
        if (value === undefined || value === null || value === "") return false;
        number_of_tuples = this.length();
        temp_key = null;
        temp_value = null;
        i = 0;
        while (i < number_of_tuples) {
          temp_key = this.find_key_by_index(i);
          temp_value = this.get(temp_key);
          if (temp_value === value) return temp_key;
          i++;
        }
        return false;
      },
      find_index_by_value: function(value) {
        var i, number_of_tuples, temp_key, temp_value;
        if (value === undefined || value === null || value === "") return false;
        number_of_tuples = this.length();
        temp_key = null;
        temp_value = null;
        i = 0;
        while (i < number_of_tuples) {
          temp_key = this.find_key_by_index(i);
          temp_value = this.get(temp_key);
          if (temp_value === value) return i;
          i++;
        }
        return false;
      },
      get_all_values: function() {
        var i, number_of_tuples, temp_value, values;
        values = [];
        number_of_tuples = this.length();
        temp_value = null;
        i = 0;
        while (i < number_of_tuples) {
          temp_value = this.find_value_by_index(i);
          values.push(temp_value);
          i++;
        }
        return values;
      },
      get_all_keys: function() {
        var array_of_keys, i, number_of_tuples, temp_key;
        array_of_keys = [];
        number_of_tuples = this.length();
        temp_key = null;
        i = 0;
        while (i < number_of_tuples) {
          temp_key = this.find_key_by_index(i);
          array_of_keys.push(temp_key);
          i++;
        }
        return array_of_keys;
      }
    };
    StorageFreak.instance = null;
    StorageFreak.obj_count = 0;
    StorageFreak.local = false;
    StorageFreak.JSON_support = function() {
      try {
        return "JSON" in window && window["JSON"] !== null;
      } catch (e) {
        return false;
      }
    };
    StorageFreak.localStorage_support = function() {
      try {
        return "localStorage" in window && window["localStorage"] !== null;
      } catch (e) {
        return false;
      }
    };
    return $.fn.storagefreak = function(options) {
      if (StorageFreak.JSON_support() === false) $.getScript("assets/json2.js");
      if (StorageFreak.instance == null) {
        StorageFreak.instance = new StorageFreak(null, options);
      }
      return StorageFreak.instance;
    };
  })(jQuery, window, document);

  (function($, window, document) {
    var Selectorablium, defaults, pluginName;
    pluginName = "selectorablium";
    defaults = {
      minCharsForRemoteSearch: 3,
      localCacheTimeout: 7 * 24 * 60 * 60 * 1000,
      XHRTimeout: 650,
      maxResultsNum: 10,
      maxNewResultsNum: 5,
      list_of_replacable_chars: [["ά", "α"], ['έ', 'ε'], ['ή', 'η'], ['ί', 'ι'], ['ό', 'ο'], ['ύ', 'υ'], ['ώ', 'ω']]
    };
    Selectorablium = function(element, options) {
      if (!$.fn.toolsfreak) return false;
      if (!$.fn.storagefreak) return false;
      this.timers_func = $.fn.toolsfreak.timers_handler();
      this.el = $(element).attr("autocomplete", "off");
      this.options = $.extend({}, defaults, options);
      if (!this.options.app_name || this.options.app_name === "") {
        this.__error('objectCreation', "no app_name specified on params");
        return false;
      }
      this.options.url = this.el.data("url");
      this.options.query_string = this.el.data("query");
      this.options.data_name = this.el.data("name");
      this.options.default_value = this.el.data("default_value" || 0);
      this.options.default_text = this.el.data("default_text" || "Please select an option");
      this.options.selected_id = this.el.data("selected_id" || null);
      this.db = null;
      this.db_prefix = "skr." + this.options.app_name + "." + pluginName + ".";
      this.el_container = null;
      this.el_top = null;
      this.el_inner_container = null;
      this.el_input = null;
      this.el_list_cont = null;
      this.el_XHRCounter = null;
      this.el_loader = null;
      this.el_clear = null;
      this.el_initial_loader = null;
      this.query = "";
      this.queryLength = "";
      this.data = null;
      this.result_list = null;
      this.selected_item = null;
      this.items_list = null;
      this.result_to_prepend = [];
      this.no_results = false;
      this.do_not_hide_me = false;
      this.got_focused = false;
      this.init();
    };
    Selectorablium.prototype = {
      name: pluginName,
      defaults: defaults,
      init: function() {
        this.createHtmlElements();
        this.makeDbPreparation();
        this.registerEventHandlers();
      },
      makeDbPreparation: function() {
        this.db = Selectorablium.getLocalDBObj();
        Selectorablium.initiateLocalData.call(this);
      },
      createHtmlElements: function() {
        var HTML_string;
        this.el_container = $('<div class="selectorablium_cont">').css({
          width: this.el.outerWidth(),
          minHeight: this.el.outerHeight()
        });
        HTML_string = '<div class="top">';
        HTML_string += '<div class="initial_loader">Loading initial data...</div>';
        HTML_string += '<a class="cancel_button">Clear</a>';
        HTML_string += '</div>';
        HTML_string += '<div class="inner_container clearfix">';
        HTML_string += '<form>';
        HTML_string += '<input name="var_name">';
        HTML_string += '<span class="input_icon"></span>';
        HTML_string += '<div class="loader"></div>';
        HTML_string += '<div class="XHRCounter"></div>';
        HTML_string += '</form>';
        HTML_string += '<ul class="list_container"></ul>';
        HTML_string += '</div>';
        this.el_container.append(HTML_string);
        this.el_top = this.el_container.find(".top").css('height', this.el.outerHeight(true));
        this.el_inner_container = this.el_container.find(".inner_container");
        this.el_input = this.el_container.find("input").attr("autocomplete", "off");
        this.el_list_cont = this.el_container.find(".list_container");
        this.el_XHRCounter = this.el_container.find(".XHRCounter");
        this.el_loader = this.el_container.find(".loader");
        this.el_clear = this.el_container.find(".cancel_button").css({
          'height': this.el.outerHeight(true) + "px",
          'lineHeight': this.el.outerHeight(true) + "px"
        });
        this.el_initial_loader = this.el_container.find(".initial_loader");
        this.el.parent().css('position', 'relative').append(this.el_container);
        this.el.html('<option value="' + this.options.default_value + '">' + this.options.default_text + '</option>');
        this.el.css({
          'borderBottomRightRadius': 0,
          'borderTopRightRadius': 0
        });
      },
      registerEventHandlers: function() {
        var _this = this;
        this.el_top.on('click', function(e) {
          if (_this.el_inner_container.is(":visible")) {
            _this.hide();
          } else {
            if (_this.el_top.hasClass("disabled") === false) {
              _this.el_container.addClass("active");
              _this.el.addClass("active");
              _this.el_inner_container.slideDown(200);
              _this.el_input.focus();
            }
          }
        });
        this.el.on('focus', function(e) {
          if (_this.el_inner_container.is(":visible")) {
            _this.hide();
          } else {
            if (_this.el_top.hasClass("disabled") === false) {
              _this.el_container.addClass("active");
              _this.el.addClass("active");
              _this.el_inner_container.slideDown(200);
              _this.el_input.focus();
            }
          }
        });
        this.el_container.on('click', function(e) {
          _this.do_not_hide_me = true;
        });
        this.el_clear.on('click', function(e) {
          e.stopPropagation();
          _this.resetSelectItem();
          return false;
        });
        $("html").on('click', function(e) {
          if (_this.do_not_hide_me === true) {
            _this.do_not_hide_me = false;
          } else {
            _this.hide();
          }
        });
        if (window.opera || $.browser.mozilla) {
          this.el_input.on('keypress', function(e) {
            return _this.onKeyPress(e);
          });
        } else {
          this.el_input.on('keydown', function(e) {
            return _this.onKeyPress(e);
          });
        }
        this.el_input.on('keyup', function(e) {
          return _this.onKeyUp(e);
        });
      },
      hide: function() {
        if (this.el_inner_container.is(":visible")) {
          this.el_container.removeClass("active");
          this.el.removeClass("active");
          this.el_inner_container.slideUp(200);
          this.el_input.val("");
          this.el_list_cont.empty();
          this.el_loader.hide();
          this.el_XHRCounter.hide();
          this.selected_item = null;
          this.timers_func.end("RemoteSearchTimeout");
          this.query = "";
        }
      },
      onKeyPress: function(e) {
        switch (e.keyCode) {
          case 9:
            if (this.selected_item) {
              this.activateTheSelectedItem();
            } else {
              this.hide();
            }
            return true;
          case 27:
            this.hide();
            break;
          case 38:
            this.moveSelectedElement("up");
            return false;
          case 40:
            this.moveSelectedElement("down");
            return false;
          case 13:
            this.activateTheSelectedItem();
            return false;
            return true;
          case 37:
            return true;
          case 39:
            return true;
          case 8:
            return true;
          default:
            return;
        }
        e.stopImmediatePropagation();
        e.preventDefault();
      },
      onKeyUp: function(e) {
        var query,
          _this = this;
        switch (e.keyCode) {
          case 16:
          case 17:
          case 18:
          case 37:
          case 38:
          case 39:
          case 40:
          case 27:
          case 13:
          case 91:
          case 20:
          case 33:
          case 34:
          case 35:
          case 36:
          case 45:
          case 9:
            return false;
        }
        this.query = this.el_input.val().trim();
        this.queryLength = this.query.length;
        if (this.queryLength === 0) {
          this.el_list_cont.empty();
          this.selected_item = null;
          this.timers_func.end("RemoteSearchTimeout");
          this.el_loader.hide();
          this.el_XHRCounter.hide();
        } else {
          query = this.query;
          this.beginLocalSearchFor(query);
          if (query.length >= this.options.minCharsForRemoteSearch) {
            this.showCountdownForXHR();
            this.timers_func.endAndStart(function() {
              _this.el_loader.show();
              _this.beginRemoteSearchFor(query);
            }, this.options.XHRTimeout, "RemoteSearchTimeout");
          } else {
            this.timers_func.end("RemoteSearchTimeout");
            this.el_loader.hide();
            this.el_XHRCounter.hide();
          }
        }
        return false;
      },
      showCountdownForXHR: function() {
        var _this = this;
        this.el_loader.hide();
        this.el_XHRCounter.stop(true, true).css("width", "0").show();
        this.el_XHRCounter.animate({
          width: "100%"
        }, this.options.XHRTimeout, function() {
          _this.el_XHRCounter.hide();
        });
      },
      beginLocalSearchFor: function(query) {
        this.makeSuggestionListFor(query);
      },
      beginRemoteSearchFor: function(query) {
        var params,
          _this = this;
        params = {};
        params[this.options.query_string] = query;
        $.getJSON(this.options.url, params, function(response_data) {
          var value, we_have_new_results, _i, _len;
          we_have_new_results = false;
          for (_i = 0, _len = response_data.length; _i < _len; _i++) {
            value = response_data[_i];
            if (!_this.data[value.id]) {
              we_have_new_results = true;
              _this.result_to_prepend.push({
                id: value.id,
                name: value.name
              });
              _this.data[value.id] = value.name;
            }
          }
          if (we_have_new_results && query === _this.query) {
            _this.el_list_cont.find(".empty-message").remove();
            _this.__dbSet(_this.options.data_name + "_data", _this.data);
            _this.result_to_prepend = _this.result_to_prepend.sort(function(a, b) {
              if (a.name < b.name) {
                return -1;
              } else {
                return 1;
              }
            });
            _this.result_to_prepend = _this.result_to_prepend.slice(0, _this.options.maxNewResultsNum);
            _this.insertNewResults(query);
          } else {
            _this.el_list_cont.find(".empty-message").text("No results found");
          }
          _this.el_loader.hide();
        });
      },
      insertNewResults: function(query) {
        var a, fragment, item, li, me, new_items, sliding_timer, _i, _len, _ref,
          _this = this;
        fragment = document.createDocumentFragment();
        _ref = this.result_to_prepend;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          li = document.createElement("li");
          a = document.createElement("a");
          a.className = "item";
          a.className += " ajaxed";
          a.setAttribute("data-value", item.id);
          a.setAttribute("href", "#");
          a.setAttribute("style", "display:none");
          a.appendChild(document.createTextNode(item.name));
          li.appendChild(a);
          fragment.appendChild(li);
        }
        this.el_list_cont.prepend(fragment);
        this.el_list_cont[0].innerHTML += '';
        new_items = this.el_list_cont.find(".item.ajaxed");
        sliding_timer = 0;
        new_items.each(function(index, item) {
          setTimeout(function() {
            $(item).slideDown(70);
          }, sliding_timer);
          sliding_timer += 100;
        });
        this.items_list = this.el_list_cont.find(".item");
        this.selected_item = this.el_list_cont.find(".selected");
        me = this;
        this.items_list.on('mouseenter', {
          me: me
        }, function() {
          return me.selectThisItem($(this));
        });
        this.items_list.on('click', {
          me: me
        }, function() {
          return me.activateTheSelectedItem();
        });
        this.highlightTextAndItems(new_items);
        this.result_to_prepend = [];
      },
      removeAccents: function(string) {
        var index, new_string, value, _ref;
        new_string = string;
        _ref = this.options.list_of_replacable_chars;
        for (index in _ref) {
          value = _ref[index];
          new_string = new_string.replace(value[0], value[1]);
        }
        return new_string;
      },
      makeSuggestionListFor: function(query) {
        var canonical_name, canonical_query, id, name, result_list, _ref;
        result_list = [];
        canonical_query = this.removeAccents(query.toLowerCase());
        _ref = this.data;
        for (id in _ref) {
          name = _ref[id];
          canonical_name = this.removeAccents(name.toLowerCase());
          if (canonical_name.indexOf(canonical_query) !== -1) {
            result_list.push({
              id: id,
              name: name
            });
          }
        }
        if (result_list.length === 0) this.no_results = true;
        this.result_list = result_list.slice(0, this.options.maxResultsNum);
        this.result_list = this.result_list.sort(function(a, b) {
          if (a.name < b.name) {
            return -1;
          } else {
            return 1;
          }
        });
        this.printSuggestionList(query);
      },
      printSuggestionList: function() {
        var a, fragment, item, li, me, p, _i, _len, _ref;
        this.el_list_cont.empty();
        fragment = document.createDocumentFragment();
        if (this.result_list.length === 0) {
          li = document.createElement("li");
          p = document.createElement("p");
          p.className = "empty-message";
          p.setAttribute("href", "#");
          if (this.query.length < this.options.minCharsForRemoteSearch) {
            p.appendChild(document.createTextNode("No results found"));
          } else {
            p.appendChild(document.createTextNode("loading..."));
          }
          li.appendChild(p);
          fragment.appendChild(li);
          this.el_list_cont.append(fragment);
          this.el_list_cont[0].innerHTML += '';
        } else {
          _ref = this.result_list;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            item = _ref[_i];
            li = document.createElement("li");
            a = document.createElement("a");
            a.className = "item";
            a.setAttribute("data-value", item.id);
            a.setAttribute("href", "#");
            a.appendChild(document.createTextNode(item.name));
            li.appendChild(a);
            fragment.appendChild(li);
          }
          this.el_list_cont.append(fragment);
          this.el_list_cont[0].innerHTML += '';
          this.items_list = this.el_list_cont.find(".item");
          me = this;
          this.items_list.on('mouseenter', {
            me: me
          }, function() {
            return me.selectThisItem($(this));
          });
          this.items_list.on('click', {
            me: me
          }, function() {
            return me.activateTheSelectedItem();
          });
          this.selected_item = this.el_list_cont.find(".item:first").addClass("selected");
          this.highlightTextAndItems();
        }
      },
      highlightTextAndItems: function(items) {
        var item_to_highlight,
          _this = this;
        if (this.query !== "") {
          item_to_highlight = items || this.items_list;
          item_to_highlight.each(function(index, element) {
            var item_name, new_string, regEXP, value, _ref;
            item_name = $(element).html();
            if (_this.query !== "") {
              new_string = _this.query;
              _ref = _this.options.list_of_replacable_chars;
              for (index in _ref) {
                value = _ref[index];
                regEXP = new RegExp(value[1], "ig");
                new_string = new_string.replace(regEXP, "(?:" + value[0] + "|" + value[1] + ")");
                delete regEXP;
              }
              regEXP = new RegExp("(" + new_string + ")", "ig");
              item_name = item_name.replace(regEXP, "<span class='highlight'>$1</span>");
              delete regEXP;
            }
            $(element).html(item_name);
          });
        }
      },
      resetSelectItem: function() {
        this.el.html('<option value="' + this.options.default_value + '">' + this.options.default_text + '</option>');
        this.hide();
      },
      activateTheSelectedItem: function() {
        this.el.html('<option value="' + this.selected_item.data("value") + '" selected="selected">   ' + this.selected_item.text() + '</option>');
        this.hide();
        return false;
      },
      selectThisItem: function(element) {
        if (this.selected_item !== null) {
          this.selected_item.removeClass("selected");
          this.selected_item = null;
        }
        this.selected_item = element.addClass("selected");
      },
      moveSelectedElement: function(direction) {
        var count, custom_index, index;
        count = this.items_list.length;
        index = this.items_list.index(this.selected_item) + count;
        if (direction === "up") {
          custom_index = index - 1;
        } else if (direction === "down") {
          custom_index = index + 1;
        }
        index = custom_index % count;
        this.selectThisItem(this.items_list.filter(".item:nth(" + index + ")"));
      },
      setSelectItem: function(params, type) {
        var my_type, text, value;
        my_type = type || "refresh";
        if (typeof params === 'object') {
          value = params.value;
          text = params.text;
        } else if (typeof params === 'number') {
          if (this.data && this.data[params]) {
            value = params;
            text = this.data[params];
          } else {
            if (Selectorablium.makeWholeDumpXHR.call(this, {
              type: my_type
            }) === true) {
              if (this.data && this.data[params]) {
                value = params;
                text = this.data[params];
              } else {
                return false;
              }
            } else {
              return false;
            }
          }
        }
        this.el.html('<option value="' + value + '" selected="selected">   ' + text + '</option>');
        this.hide();
        return true;
      },
      refreshMyData: function() {
        if ((this.data = this.__dbGet(this.options.data_name + "_data")) !== false) {
          return true;
        } else {
          return false;
        }
      },
      showPreSelectedItem: function() {
        if (this.options.selected_id) {
          this.setSelectItem(this.options.selected_id, "preselected");
        }
      },
      __dbGet: function(name) {
        return this.db.get(this.db_prefix + name);
      },
      __dbSet: function(name, data) {
        return this.db.set(this.db_prefix + name, data);
      },
      __error: function(message, func_name) {
        var name, where, x;
        if (func_name) {
          x = message;
          message = func_name;
          func_name = x;
        }
        name = (this.options.app_name ? this.options.app_name : "[" + this.name + "]");
        where = "@" + name + ":";
        if (func_name) where = func_name + where;
        $.fn.toolsfreak.error_func(message, where);
      }
    };
    Selectorablium.getLocalDBObj = function() {
      try {
        return $.fn.storagefreak();
      } catch (e) {
        this.__error('getLocalDBObj', "could not get StorageFreak object");
        return null;
      }
    };
    Selectorablium.makeWholeDumpXHR = function(params) {
      var error_string_where, my_async, return_value, type,
        _this = this;
      if (params && params.type && params.type === "initial") {
        error_string_where = 'initiateLocalData';
        type = "initial";
        my_async = true;
      } else if (params && params.type && params.type === "refresh") {
        error_string_where = 'refreshXHRForSetSelectItem';
        type = "refresh";
        my_async = false;
        return_value = false;
      } else if (params && params.type && params.type === "preselected") {
        error_string_where = 'XHRForPreselectedItem';
        type = "preselected";
        my_async = true;
      }
      try {
        $.ajax({
          url: this.options.url,
          type: "get",
          dataType: "json",
          async: my_async,
          success: function(data) {
            var index, length, new_data, result, value;
            new_data = {};
            result = {};
            length = 0;
            for (index in data) {
              value = data[index];
              new_data[value.id] = value.name;
              length += 1;
            }
            if (_this.__dbSet(_this.options.data_name + "_data", new_data) === false) {
              _this.__error(error_string_where, "error storing '" + _this.options.data_name + "' initial data to localStorage");
              return false;
            } else {
              if (_this.__dbSet(_this.options.data_name + "_timestamp", new Date().getTime()) === false) {
                _this.__error(error_string_where, "error storing timestamp" + _this.options.app_name);
                return false;
              }
              _this.data = new_data;
              if (type === "initial") {
                _this.showPreSelectedItem();
                _this.el_initial_loader.fadeOut();
                _this.el_top.removeClass("disabled");
              }
            }
            return_value = true;
            return true;
          },
          error: function(a, b, c) {
            _this.__error(error_string_where, "XHR error");
            return_value = false;
            return false;
          }
        });
      } catch (e) {
        this.__error(error_string_where, "catched XHR error");
        return_value = false;
      }
      return return_value;
    };
    Selectorablium.initiateLocalData = function() {
      var current_timestamp;
      current_timestamp = new Date().getTime();
      this.local_db_timestamp = this.__dbGet(this.options.data_name + "_timestamp");
      if (this.local_db_timestamp !== false) {
        this.local_db_timestamp = parseInt(this.local_db_timestamp, 10);
      }
      if (this.local_db_timestamp === false || (current_timestamp - this.local_db_timestamp) > this.options.localCacheTimeout) {
        this.el_initial_loader.show();
        this.el_top.addClass("disabled");
        Selectorablium.makeWholeDumpXHR.call(this, {
          type: "initial"
        });
      } else {
        this.data = this.__dbGet(this.options.data_name + "_data");
        this.showPreSelectedItem();
      }
    };
    $.fn.Selectorablium = function(options) {
      this.each(function() {
        if (!$.data(this, pluginName)) {
          $.data(this, pluginName, new Selectorablium(this, options));
        }
      });
    };
  })(jQuery, window, document);

}).call(this);