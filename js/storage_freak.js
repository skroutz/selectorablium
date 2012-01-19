(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
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
      this.length = 0;
      this.NOLocalData = {};
      this.getItem = __bind(function(key) {
        var value;
        value = this.NOLocalData[key];
        if (value === void 0) {
          return null;
        }
        return value;
      }, this);
      this.setItem = __bind(function(key, value) {
        this.NOLocalData[key] = value;
        this.length += 1;
        return true;
      }, this);
      this.clear = __bind(function() {
        this.length = 0;
        delete this.NOLocalData;
        this.NOLocalData = {};
        return true;
      }, this);
      this.key = __bind(function(index) {
        var i, key, value, _ref;
        i = 0;
        _ref = this.NOLocalData;
        for (key in _ref) {
          value = _ref[key];
          if (i === index) {
            return key;
          }
          i++;
        }
        return false;
      }, this);
    };
    StorageFreak.prototype = {
      init: function() {
        if (StorageFreak.instance != null) {
          return;
        }
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
        if (typeof key !== "string" || key === "") {
          return false;
        }
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
        if (typeof key !== "string" || key === "") {
          return false;
        }
        if (value === undefined || value === null) {
          return false;
        }
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
        if (typeof key !== "string" || key === "") {
          return false;
        }
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
        if (typeof key !== "string" || key === "") {
          return false;
        }
        number_of_tuples = this.length();
        temp_key = null;
        i = 0;
        while (i < number_of_tuples) {
          temp_key = this.find_key_by_index(i);
          if (temp_key === key) {
            return i;
          }
          i++;
        }
        return false;
      },
      find_value_by_key: function(key) {
        return this.get(key);
      },
      find_key_by_index: function(index) {
        var temp_length;
        if (typeof index !== "number") {
          return false;
        }
        temp_length = this.length();
        if (index < 0 || index >= temp_length) {
          return false;
        }
        try {
          return this.localStorage.key(index);
        } catch (e) {
          return false;
        }
      },
      find_value_by_index: function(index) {
        if (typeof index !== "number") {
          return false;
        }
        try {
          return this.get(this.find_key_by_index(index));
        } catch (e) {
          return false;
        }
      },
      find_key_by_value: function(value) {
        var i, number_of_tuples, temp_key, temp_value;
        if (value === undefined || value === null || value === "") {
          return false;
        }
        number_of_tuples = this.length();
        temp_key = null;
        temp_value = null;
        i = 0;
        while (i < number_of_tuples) {
          temp_key = this.find_key_by_index(i);
          temp_value = this.get(temp_key);
          if (temp_value === value) {
            return temp_key;
          }
          i++;
        }
        return false;
      },
      find_index_by_value: function(value) {
        var i, number_of_tuples, temp_key, temp_value;
        if (value === undefined || value === null || value === "") {
          return false;
        }
        number_of_tuples = this.length();
        temp_key = null;
        temp_value = null;
        i = 0;
        while (i < number_of_tuples) {
          temp_key = this.find_key_by_index(i);
          temp_value = this.get(temp_key);
          if (temp_value === value) {
            return i;
          }
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
      if (StorageFreak.JSON_support() === false) {
        $.getScript("assets/json2.js");
      }
      if (StorageFreak.instance == null) {
        StorageFreak.instance = new StorageFreak(null, options);
      }
      return StorageFreak.instance;
    };
  })(jQuery, window, document);
}).call(this);
