(function(global, name, definition) {
  if (typeof module !== 'undefined') module.exports = definition;
  else if (typeof define === 'function' && typeof define.amd === 'object') define(definition);
  else global[name] = definition();
}(this, 'Selectorablium', function() {

  var LocalStorageShim;
  LocalStorageShim = (function() {
    LocalStorageShim.instance = null;

    function LocalStorageShim() {
      if (LocalStorageShim.instance !== null) {
        return LocalStorageShim.instance;
      }
      this.length = 0;
      this._data = {};
      LocalStorageShim.instance = this;
    }

    LocalStorageShim.prototype.getItem = function(key) {
      var value;
      value = this._data[key];
      if (value === void 0) {
        return null;
      }
      return value;
    };

    LocalStorageShim.prototype.setItem = function(key, value) {
      this._data[key] = value;
      this.length += 1;
      return true;
    };

    LocalStorageShim.prototype.removeItem = function(key) {
      if (!this._data[key]) {
        return false;
      }
      this._data[key] = null;
      delete this._data[key];
      this.length -= 1;
      return true;
    };

    LocalStorageShim.prototype.clear = function() {
      var item;
      this.length = 0;
      for (item in this._data) {
        this._data[item] = null;
      }
      this._data = {};
      return true;
    };

    LocalStorageShim.prototype.key = function(index) {
      var i, key, value, _ref;
      i = 0;
      _ref = this._data;
      for (key in _ref) {
        value = _ref[key];
        if (i === index) {
          return key;
        }
        i++;
      }
      return false;
    };

    return LocalStorageShim;

  })();
var __slice = [].slice;


  var StorageFreak;
  StorageFreak = (function() {
    var fuzzy_sort, lexicographical_sort, regexp_sort;

    regexp_sort = function(re, a, b) {
      return (function(re_match_a, re_match_b) {
        if (re_match_a && !re_match_b) {
          return -1;
        }
        if (re_match_b && !re_match_a) {
          return 1;
        }
      })(this.config.match_func(re, a.name), this.config.match_func(re, b.name));
    };

    lexicographical_sort = function(a, b) {
      if (a.name < b.name) {
        return -1;
      }
      if (b.name < a.name) {
        return 1;
      }
    };

    fuzzy_sort = function(query, a, b) {
      var re, regexp_result, _i, _len, _ref;
      this.sort_criteria_res || (this.sort_criteria_res = this._createSortingREs(query));
      _ref = this.sort_criteria_res;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        re = _ref[_i];
        regexp_result = regexp_sort.call(this, re, a, b);
        re.lastIndex = 0;
        if (regexp_result) {
          return regexp_result;
        }
      }
      return lexicographical_sort(a, b);
    };

    StorageFreak.prototype._defaults = {
      namespace: 'selectorablium',
      sort_func: (function(query, a, b) {
        return fuzzy_sort.call(this, query, a, b);
      }),
      match_func: (function(RE, name) {
        var result;
        result = RE.test(name);
        RE.lastIndex = 0;
        return result;
      }),
      search_type: 'infix'
    };

    StorageFreak.prototype._required = ['url', 'name', 'query', 'app_name', 'XHRTimeout', 'maxResultsNum', 'localCacheTimeout', 'minCharsForRemoteSearch', 'list_of_replacable_chars'];

    function StorageFreak(options) {
      var attr, k, v, _i, _len, _ref, _ref1;
      if (this instanceof StorageFreak === false) {
        return new StorageFreak(options);
      }
      this.options = options;
      this.config = $.extend({}, this._defaults, this.options);
      _ref = this.config;
      for (k in _ref) {
        v = _ref[k];
        if ($.type(v) === 'function') {
          this.config[k] = $.proxy(v, this);
        }
      }
      _ref1 = this._required;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        attr = _ref1[_i];
        if (!this.config[attr]) {
          throw new Error("'" + attr + "' option is required");
        }
      }
      this._db_prefix = "" + this.config.namespace + "." + this.config.app_name;
      this._data_key = "" + this.config.name + "_data";
      this._timestamp_key = "" + this.config.name + "_timestamp";
      this._last_modified_key = "" + this.config.name + "_last_modified";
      this._data = {};
      this._events = {};
      this.timeout = null;
      this.XHR_dfd = null;
      this._storage = this._getStorage();
    }

    StorageFreak.prototype.on = function(event_name, callback, context) {
      var _base;
      if (context == null) {
        context = null;
      }
      if ((_base = this._events)[event_name] == null) {
        _base[event_name] = [];
      }
      return this._events[event_name].push({
        callback: callback,
        context: context
      });
    };

    StorageFreak.prototype.init = function() {
      if (this.config.cache_revalidate || this._isInvalidData()) {
        return this._getRemoteData('', {
          event_name: 'dbcreate'
        });
      } else {
        this._data = this._get(this._data_key);
        return new $.Deferred().resolve();
      }
    };

    StorageFreak.prototype.add = function(value, text) {
      var new_data;
      if (this._data[text]) {
        return;
      }
      new_data = {};
      new_data[text] = value;
      this._data = $.extend({}, this._data, new_data);
      return this._updateDB(this._data);
    };

    StorageFreak.prototype.searchByValue = function(val) {
      var text, value, _ref;
      _ref = this._data;
      for (text in _ref) {
        value = _ref[text];
        if (value === val) {
          return text;
        }
      }
      return false;
    };


    /**
     * The main API method.
     *
     * It queries the dataset, and updates it if necessary.
     *
     * It calls @_searchData with its params. It returns
     * matched data as an argument to the 'dbsearch_results'
     * event called.
     *
     * It the query length is bigger than @config.minCharsForRemoteSearch
     * it queries remotely via an XHR.
     * The XHR is made after a timeout.
     * Once the remote data are fetched, the get appended to @_data and
     * @_searchData is called again the event 'dbsearch_results'
     * is triggered with the updated results.
     *
     * @param  {String|Number} query
     * @param  {Object}        options
     * @return {null or Array}
     */

    StorageFreak.prototype.search = function(query, options) {
      var results;
      if (options == null) {
        options = {};
      }
      results = this._searchData(query, options);
      this._trigger('dbsearch_results', results, query);
      this._resetRemote();
      if (query.length >= this.config.minCharsForRemoteSearch) {
        this._trigger('dbremote_search_in', this.config.XHRTimeout);
        return this.timeout = setTimeout(((function(_this) {
          return function() {
            return _this._getRemoteData(query, options).then(function() {
              results = _this._searchData(query, options);
              return _this._trigger('dbsearch_results', results, query, 'xhr');
            });
          };
        })(this)), this.config.XHRTimeout);
      }
    };

    StorageFreak.prototype.cleanup = function() {
      return this._resetRemote();
    };

    StorageFreak.prototype._resetRemote = function() {
      var _base;
      this._trigger('dbremote_search_reset');
      this.timeout && clearTimeout(this.timeout);
      return this.XHR_dfd && (typeof (_base = this.XHR_dfd).abort === "function" ? _base.abort() : void 0);
    };

    StorageFreak.prototype._searchData = function(query, options) {
      var id, match_func, name, re, results, search_type, sort_func, _ref;
      results = [];
      match_func = options.match_func || this.config.match_func;
      sort_func = options.sort_func || this.config.sort_func;
      search_type = options.search_type || this.config.search_type;
      query = this._createAccentIndependentQuery(query);
      re = this._createQueryRE(query, this.config.search_type);
      _ref = this._data;
      for (name in _ref) {
        id = _ref[name];
        if (match_func(re, name)) {
          results.push({
            id: id,
            name: name
          });
        }
      }
      this._resetSortingREs();
      results = results.sort((function(a, b) {
        return sort_func(query, a, b);
      }));
      return results.slice(0, this.config.maxResultsNum);
    };

    StorageFreak.prototype._getRemoteData = function(query, options) {
      var dfd, headers, last_modified, params, query_param;
      this._trigger("" + (options.event_name || 'dbremote_search') + "_start");
      dfd = new $.Deferred();
      params = {};
      if (query) {
        query_param = options.query || this.config.query;
        params[query_param] = query;
      }
      headers = {};
      last_modified = this._get(this._last_modified_key);
      if (!query && last_modified) {
        headers['If-Modified-Since'] = new Date(last_modified).toUTCString();
      }
      this.XHR_dfd = $.ajax({
        dataType: "json",
        url: options.url || this.config.url,
        headers: headers,
        data: params
      });
      this.XHR_dfd.then((function(_this) {
        return function(json_data, textStatus, xhr) {
          if (xhr.status === 304) {
            return _this._getRemoteNotModified(xhr, dfd, options);
          } else {
            return _this._getRemoteSuccess(json_data, xhr, dfd, options);
          }
        };
      })(this), (function(_this) {
        return function(xhr) {
          return _this._getRemoteError(xhr, dfd, options);
        };
      })(this));
      return dfd;
    };

    StorageFreak.prototype._getRemoteSuccess = function(json_data, xhr, dfd, options) {
      var last_modified, last_modified_ts;
      this._data = $.extend({}, this._data, this._parseResponseData(json_data));
      if (last_modified = xhr.getResponseHeader('Last-Modified')) {
        last_modified_ts = new Date(last_modified).getTime();
      }
      this._updateDB(this._data, last_modified_ts);
      this._trigger("" + (options.event_name || 'dbremote_search') + "_end");
      return dfd.resolve();
    };

    StorageFreak.prototype._getRemoteNotModified = function(xhr, dfd, options) {
      this._data = this._get(this._data_key);
      this._trigger("" + (options.event_name || 'dbremote_search') + "_end");
      return dfd.resolve();
    };

    StorageFreak.prototype._getRemoteError = function(xhr, dfd, options) {
      this._trigger("" + (options.event_name || 'dbremote_search') + "_error", xhr);
      return dfd.reject(xhr);
    };

    StorageFreak.prototype._getStorage = function() {
      if (localStorage) {
        return localStorage;
      } else {
        return new LocalStorageShim();
      }
    };

    StorageFreak.prototype._trigger = function() {
      var context, data, entry, event_name, _i, _len, _ref, _results;
      event_name = arguments[0], data = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (!this._events[event_name]) {
        return;
      }
      _ref = this._events[event_name];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entry = _ref[_i];
        context = entry.context || null;
        _results.push(entry.callback.apply(context, data));
      }
      return _results;
    };

    StorageFreak.prototype._isInvalidData = function() {
      var db_ts, ts;
      ts = new Date().getTime();
      db_ts = this._get(this._timestamp_key);
      if (db_ts) {
        db_ts = parseInt(db_ts, 10);
      }
      return db_ts === false || (ts - db_ts) > this.config.localCacheTimeout;
    };

    StorageFreak.prototype._parseResponseData = function(json_data) {
      var item, result, _i, _len;
      result = {};
      for (_i = 0, _len = json_data.length; _i < _len; _i++) {
        item = json_data[_i];
        result[item.name] = item.id;
      }
      return result;
    };

    StorageFreak.prototype._updateDB = function(data, last_modified_ts) {
      this._set(this._data_key, data);
      this._set(this._timestamp_key, new Date().getTime());
      if (last_modified_ts) {
        this._set(this._last_modified_key, last_modified_ts);
      }
      return this._trigger('dbupdated');
    };

    StorageFreak.prototype._createAccentIndependentQuery = function(query) {
      var re, value, _i, _len, _ref;
      _ref = this.config.list_of_replacable_chars;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        value = _ref[_i];
        re = new RegExp("" + value[0] + "|" + value[1], 'ig');
        query = query.replace(re, "(?:" + value[0] + "|" + value[1] + ")");
      }
      return query;
    };

    StorageFreak.prototype._createQueryRE = function(query, type) {
      if (type == null) {
        type = 'infix';
      }
      if (type === 'infix') {
        return new RegExp("" + query, 'ig');
      }
      if (type === 'prefix') {
        return new RegExp("^" + query, 'ig');
      }
      if (type === 'token') {
        return new RegExp("\\b" + query + "\\b", 'ig');
      }
      if (type === 'absolute') {
        return new RegExp("^" + query + "$", 'ig');
      }
    };

    StorageFreak.prototype._createSortingREs = function(query) {
      var re_abs, re_p, re_t;
      re_abs = this._createQueryRE(query, 'absolute');
      re_t = this._createQueryRE(query, 'token');
      re_p = this._createQueryRE(query, 'prefix');
      return [re_abs, re_t, re_p];
    };

    StorageFreak.prototype._resetSortingREs = function() {
      return this.sort_criteria_res = null;
    };

    StorageFreak.prototype._get = function(key) {
      var value;
      if (typeof key !== 'string' || key === '') {
        return false;
      }
      key = "" + this._db_prefix + "." + key;
      try {
        value = JSON.parse(this._storage.getItem(key));
      } catch (_error) {
        return false;
      }
      if (value === null || value === '') {
        return false;
      } else {
        return value;
      }
    };

    StorageFreak.prototype._set = function(key, value) {
      if (typeof key !== 'string' || key === '') {
        return false;
      }
      if (value === null || value === void 0) {
        return false;
      }
      key = "" + this._db_prefix + "." + key;
      try {
        this._storage.setItem(key, JSON.stringify(value));
      } catch (_error) {
        return false;
      }
      return true;
    };

    return StorageFreak;

  })();
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;


  var Selectorablium;
  Selectorablium = (function() {
    Selectorablium.prototype.defaults = {
      minCharsForRemoteSearch: 3,
      localCacheTimeout: 7 * 24 * 60 * 60 * 1000,
      XHRTimeout: 650,
      debounceInterval: 150,
      maxResultsNum: 10,
      default_value: 0,
      default_text: 'Please select an option',
      selected_id: null,
      list_of_replacable_chars: [['ά', 'α'], ['έ', 'ε'], ['ή', 'η'], ['ί', 'ι'], ['ό', 'ο'], ['ύ', 'υ'], ['ώ', 'ω']]
    };

    Selectorablium.prototype._required = ['app_name', 'url', 'query', 'name', 'minCharsForRemoteSearch', 'XHRTimeout', 'list_of_replacable_chars', 'localCacheTimeout'];

    Selectorablium.prototype.template = "<div class=\"selectorablium_cont\">\n  <div class=\"top\">\n    <div class=\"initial_loader\">Loading initial data...</div>\n    <a class=\"clear_button\">Clear</a>\n  </div>\n  <div class=\"inner_container\">\n    <form>\n      <input autocomplete=\"off\" name=\"var_name\">\n      <span class=\"input_icon\"></span>\n      <div class=\"loader\"></div>\n      <div class=\"XHRCounter\"></div>\n    </form>\n    <ul class=\"list_container\"></ul>\n  </div>\n</div>";

    Selectorablium.prototype.timer = 0;

    function Selectorablium(element, options) {
      this._onDBSearchResults = __bind(this._onDBSearchResults, this);
      this._onDBSearchReset = __bind(this._onDBSearchReset, this);
      this._onDBSearchError = __bind(this._onDBSearchError, this);
      this._onDBSearchEnd = __bind(this._onDBSearchEnd, this);
      this._onDBSearchStart = __bind(this._onDBSearchStart, this);
      this._onDBSearchIn = __bind(this._onDBSearchIn, this);
      this._onDBCreateEnd = __bind(this._onDBCreateEnd, this);
      this._onDBCreateStart = __bind(this._onDBCreateStart, this);
      this._onDBReady = __bind(this._onDBReady, this);
      this._onKeyUp = __bind(this._onKeyUp, this);
      this._onKeyPress = __bind(this._onKeyPress, this);
      this._activateSelectedItem = __bind(this._activateSelectedItem, this);
      this._onItemMouseEnter = __bind(this._onItemMouseEnter, this);
      this._onHTMLClick = __bind(this._onHTMLClick, this);
      this._clearSelectedItem = __bind(this._clearSelectedItem, this);
      this._onClearButtonClick = __bind(this._onClearButtonClick, this);
      this._onContainerClick = __bind(this._onContainerClick, this);
      this._togglePlugin = __bind(this._togglePlugin, this);
      var attr, _i, _len, _ref;
      if (this instanceof Selectorablium === false) {
        return new Selectorablium(element, options);
      }
      if (!element) {
        throw new Error('Element argument is required');
      }
      this.$el = $(element);
      this.options = options;
      this.metadata = this.$el.data();
      this.config = $.extend({}, this.defaults, this.metadata, this.options);
      _ref = this._required;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attr = _ref[_i];
        if (!this.config[attr]) {
          throw new Error("'" + attr + "' option is required");
        }
      }
      this.state = 'disabled';
      this.shift_pressed = false;
      this.structure = [];
      this.indexed_structure = {};
      this.$result_items = [];
      this.events_handled = [];
      this.db = new StorageFreak(this.config);
      this._createHtmlElements();
      this._registerEventHandlers();
      this.data_ready_dfd = this.db.init();
      this.data_ready_dfd.then(this._onDBReady);
    }

    Selectorablium.prototype.cleanup = function() {
      var item, _i, _len, _ref;
      this.db.cleanup();
      _ref = this.events_handled;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        item[0].off.apply(item[0], item[1]);
      }
      this.$container.remove();
      this.$el.unwrap();
      return this.$outer_container.remove();
    };

    Selectorablium.prototype.then = function(success, fail) {
      return this.data_ready_dfd.then(success, fail);
    };

    Selectorablium.prototype.reset = function() {
      return this._insertOptionElement(this.config.default_value, this.config.default_text);
    };

    Selectorablium.prototype.set = function(value, text) {
      if (text == null) {
        text = null;
      }
      if (text === null) {
        text = this.db.searchByValue(value);
        if (text === false) {
          return false;
        }
      }
      this._insertOptionElement(value, text);
      this._hide();
      return true;
    };

    Selectorablium.prototype.add = function(value, text) {
      return this.db.add(value, text);
    };

    Selectorablium.prototype._createHtmlElements = function() {
      this.$el.wrap($('<div class="selectorablium_outer_cont">'));
      this.$outer_container = this.$el.parent();
      this.$outer_container.append(this.template);
      this.$container = this.$outer_container.find('.selectorablium_cont');
      this.$top = this.$container.find('.top');
      this.$top_loader = this.$container.find('.initial_loader');
      this.$inner_container = this.$container.find('.inner_container');
      this.$input = this.$container.find('input');
      this.$results_list = this.$container.find('.list_container');
      this.$XHR_counter = this.$container.find('.XHRCounter');
      this.$XHR_loader = this.$container.find('.loader');
      this.$clear_button = this.$container.find('.clear_button');
      return this.reset();
    };

    Selectorablium.prototype._registerEventHandlers = function() {
      this._addHandler(this.$top, 'click', this._togglePlugin);
      this._addHandler(this.$el, 'focus', this._togglePlugin);
      this._addHandler(this.$container, 'click', this._onContainerClick);
      this._addHandler(this.$clear_button, 'click', this._onClearButtonClick);
      this._addHandler($('html'), 'click', this._onHTMLClick);
      this._addHandler(this.$input, 'keyup', this._onKeyUp);
      this._addHandler(this.$input, this._keyPressEventName(), this._onKeyPress);
      this._addHandler(this.$results_list, 'mouseenter', '.item', this._onItemMouseEnter);
      this._addHandler(this.$results_list, 'click', '.item', this._activateSelectedItem);
      this.db.on('dbcreate_start', this._onDBCreateStart);
      this.db.on('dbcreate_end', this._onDBCreateEnd);
      this.db.on('dbremote_search_in', this._onDBSearchIn);
      this.db.on('dbremote_search_start', this._onDBSearchStart);
      this.db.on('dbremote_search_end', this._onDBSearchEnd);
      this.db.on('dbremote_search_error', this._onDBSearchError);
      this.db.on('dbremote_search_reset', this._onDBSearchReset);
      return this.db.on('dbsearch_results', this._onDBSearchResults);
    };

    Selectorablium.prototype._togglePlugin = function(e) {
      switch (this.state) {
        case 'disabled':
          break;
        case 'visible':
          return this._hide();
        case 'ready':
          if (this.$inner_container.is(':visible') === false) {
            return this._show();
          }
      }
    };

    Selectorablium.prototype._onContainerClick = function(e) {
      return this.do_not_hide_me = true;
    };

    Selectorablium.prototype._onClearButtonClick = function(e) {
      this._clearSelectedItem(e);
      return false;
    };

    Selectorablium.prototype._clearSelectedItem = function(e) {
      this.reset();
      this._hide();
      return this.$el.trigger("change");
    };

    Selectorablium.prototype._onHTMLClick = function(e) {
      if (this.do_not_hide_me === true) {
        return this.do_not_hide_me = false;
      } else {
        return this._hide();
      }
    };

    Selectorablium.prototype._onItemMouseEnter = function(e) {
      return this._selectItem($(e.currentTarget));
    };

    Selectorablium.prototype._activateSelectedItem = function(e) {
      if (this.selected_item) {
        this._insertOptionElement(this.selected_item.data('value'), this.selected_item.text());
        this.$el.trigger("change");
      }
      this._hide();
      return false;
    };

    Selectorablium.prototype._onKeyPress = function(e) {
      switch (e.keyCode) {
        case 16:
          this.shift_pressed = true;
          break;
        case 27:
          this._hide();
          break;
        case 38:
          this._moveSelectedItem('up');
          break;
        case 40:
          this._moveSelectedItem('down');
          break;
        case 13:
          this._activateSelectedItem();
          break;
        case 9:
          this._activateSelectedItem();
          return true;
        default:
          return true;
      }
      return false;
    };

    Selectorablium.prototype._onKeyUp = function(e) {
      var search_func;
      switch (e.keyCode) {
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
        case 16:
          this.shift_pressed = false;
          return false;
      }
      this._resetContainer();
      this.selected_item = null;
      this.query = $.trim(this.$input.val());
      if (this.query.length === 0) {
        this._resetSelectedItem();
        return false;
      }
      search_func = (function(_this) {
        return function() {
          return _this.db.search(_this.query);
        };
      })(this);
      clearTimeout(this.timer);
      this.timer = setTimeout(search_func, this.config.debounceInterval);
      return false;
    };

    Selectorablium.prototype._onDBReady = function(data) {
      if (this.config.selected_id) {
        this.set(this.config.selected_id);
      }
      return this.state = 'ready';
    };

    Selectorablium.prototype._onDBCreateStart = function() {
      this.state = 'disabled';
      this.$top_loader.show();
      return this.$top.addClass('disabled');
    };

    Selectorablium.prototype._onDBCreateEnd = function() {
      this.$top_loader.hide();
      return this.$top.removeClass('disabled');
    };

    Selectorablium.prototype._onDBSearchIn = function(time) {
      return this._showXHRCountdown(time);
    };

    Selectorablium.prototype._onDBSearchStart = function() {
      this._hideXHRCountdown();
      return this.$XHR_loader.show();
    };

    Selectorablium.prototype._onDBSearchEnd = function() {
      return this.$XHR_loader.hide();
    };

    Selectorablium.prototype._onDBSearchError = function(xhr) {
      return this.$XHR_loader.hide();
    };

    Selectorablium.prototype._onDBSearchReset = function() {
      this._hideXHRCountdown();
      return this.$XHR_loader.hide();
    };

    Selectorablium.prototype._onDBSearchResults = function(results, query, xhr) {
      var selected_item;
      if (xhr == null) {
        xhr = false;
      }
      if (query !== this.query) {
        return;
      }
      this._updateStructure(results, xhr);
      this._highlightResults(query);
      this.$result_items = this._appendResults(query);
      this.$result_items.filter('.new').hide().slideToggle();
      if ((selected_item = this.$result_items.filter('.selected')).length === 0) {
        selected_item = this.$result_items.first();
      }
      return this._selectItem(selected_item);
    };

    Selectorablium.prototype._updateStructure = function(results, xhr) {
      var key, new_item, new_keys, result, value, _i, _len, _ref;
      this.structure = [];
      new_keys = {};
      for (_i = 0, _len = results.length; _i < _len; _i++) {
        result = results[_i];
        new_keys[result.name] = true;
        new_item = {
          id: result.id,
          name: result.name,
          template: '',
          selected: false,
          fresh: !!xhr
        };
        if (this.indexed_structure[result.name]) {
          new_item = $.extend(new_item, this.indexed_structure[result.name]);
        }
        this.indexed_structure[result.name] = new_item;
        this.structure.push(new_item);
      }
      _ref = this.indexed_structure;
      for (key in _ref) {
        value = _ref[key];
        if (!new_keys[key]) {
          this.indexed_structure[key] = null;
          delete this.indexed_structure[key];
        }
      }
      return this.structure;
    };

    Selectorablium.prototype._highlightResults = function(query) {
      var item, re, _i, _len, _ref, _results;
      re = this._createAccentIndependentRE(query);
      _ref = this.structure;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        _results.push(item.template = item.name.replace(re, '<span class="highlight">$1</span>'));
      }
      return _results;
    };

    Selectorablium.prototype._appendResults = function(query) {
      this.$results_list.empty();
      this.$results_list.append(this._createTemplate(query));
      return this.$results_list.find('.item');
    };

    Selectorablium.prototype._createTemplate = function(query) {
      var $li, class_name, item, items_templates, text, _i, _len, _ref;
      items_templates = [];
      if (this.structure.length === 0) {
        text = 'No results found';
        $li = $('<li>').append($("<p>", {
          "class": 'empty-message'
        }).text(text)).get(0);
        items_templates.push($li);
      } else {
        _ref = this.structure;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          class_name = 'item';
          if (item.fresh === true) {
            class_name += ' new';
          }
          if (item.selected === true) {
            class_name += ' selected';
          }
          $li = $('<li>').append($("<a>", {
            'href': '#',
            'class': class_name,
            'data-value': item.id,
            'data-text': item.name
          }).html(item.template)).get(0);
          items_templates.push($li);
          item.fresh = false;
        }
      }
      return items_templates;
    };

    Selectorablium.prototype._createAccentIndependentRE = function(query) {
      var re, value, _i, _len, _ref;
      _ref = this.config.list_of_replacable_chars;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        value = _ref[_i];
        re = new RegExp("" + value[0] + "|" + value[1], 'ig');
        query = query.replace(re, "(?:" + value[0] + "|" + value[1] + ")");
      }
      re = null;
      return new RegExp("(" + query + ")", 'ig');
    };

    Selectorablium.prototype._addHandler = function() {
      var $element, on_args;
      $element = arguments[0], on_args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      $element.on.apply($element, on_args);
      return this.events_handled.push([$element, on_args]);
    };

    Selectorablium.prototype._keyPressEventName = function() {
      var ff_ua_match;
      ff_ua_match = window.navigator.userAgent.match(/Firefox\/\d+\.\d+\.\d+/);
      if (window.opera || !!ff_ua_match) {
        return 'keypress';
      } else {
        return 'keydown';
      }
    };

    Selectorablium.prototype._insertOptionElement = function(value, text) {
      return this.$el.html("<option value=\"" + value + "\">" + text + "</option>");
    };

    Selectorablium.prototype._showXHRCountdown = function(milliseconds) {
      this.$XHR_counter.stop(true, true).css('width', '0').show();
      return this.$XHR_counter.animate({
        width: '100%'
      }, milliseconds, function() {
        return $(this).hide();
      });
    };

    Selectorablium.prototype._hideXHRCountdown = function() {
      return this.$XHR_counter.stop(true, true).hide();
    };

    Selectorablium.prototype._show = function() {
      this.$container.addClass('active');
      this.$el.addClass('active');
      this.$inner_container.slideDown(200);
      this.$input.focus();
      return this.state = 'visible';
    };

    Selectorablium.prototype._hide = function() {
      if (this.state !== 'visible') {
        return;
      }
      this.$container.removeClass('active');
      this.$el.removeClass('active');
      this.$inner_container.slideUp(200);
      this._resetSelectedItem();
      this._resetContainer();
      this.$input.val('');
      this.query = '';
      return this.state = 'ready';
    };

    Selectorablium.prototype._resetContainer = function() {
      this.$results_list.empty();
      this.$XHR_loader.hide();
      return this._hideXHRCountdown();
    };

    Selectorablium.prototype._resetSelectedItem = function() {
      var ref;
      if (!this.selected_item) {
        return;
      }
      ref = this.indexed_structure[this.selected_item.data('text')];
      ref && (ref.selected = false);
      this.selected_item.removeClass('selected');
      return this.selected_item = null;
    };

    Selectorablium.prototype._selectItem = function($item) {
      if (!($item && $item.length !== 0)) {
        return;
      }
      this._resetSelectedItem();
      this.selected_item = $item.addClass('selected');
      return this.indexed_structure[$item.data('text')].selected = true;
    };

    Selectorablium.prototype._getNextItem = function(direction) {
      var count, custom_index, index, new_index;
      count = this.$result_items.length;
      index = this.$result_items.index(this.selected_item) + count;
      custom_index = direction === 'up' ? index - 1 : index + 1;
      new_index = custom_index % count;
      return $(this.$result_items.get(new_index));
    };

    Selectorablium.prototype._moveSelectedItem = function(direction) {
      var $item;
      if (!this.selected_item) {
        return;
      }
      $item = this._getNextItem(direction);
      return this._selectItem($item);
    };

    return Selectorablium;

  })();


  $.fn.Selectorablium = function(options) {
    this.each(function() {
      if (!$.data(this, 'Selectorablium')) {
        $.data(this, 'Selectorablium', new Selectorablium(this, options));
      }
    });
  };

  return Selectorablium
}));