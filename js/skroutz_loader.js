(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  (function(window, document) {
    var reg_exp, userAgent;
    window.skroutz = window.skroutz || {};
    window.skroutz.jsonp_list = window.skroutz.jsonp_list || {};
    window.skroutz.widgets = window.skroutz.widgets || {};
    window.skroutz.ie_version = -1;
    if (navigator.appName === 'Microsoft Internet Explorer') {
      userAgent = navigator.userAgent;
      reg_exp = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
      if (reg_exp.exec(userAgent) !== null) {
        window.skroutz.ie_version = parseFloat(RegExp.$1);
        document.getElementsByTagName('html')[0].className += " skroutz_ie";
      }
    }
    window.skroutz.helpers = window.skroutz.helpers || (function() {
      var addEvent, async_load, deep_merge_objects, load, make_xhr, removeEvent, widget_css_base_url, widget_js_base_url;
      widget_js_base_url = "http://192.168.6.4/widgets/js/";
      widget_css_base_url = "http://192.168.6.4/widgets/css/";
      load = function(plugin_name, params, callback) {
        var init_callback, options, plugin_url;
        options = options || {};
        options.params = params;
        init_callback = __bind(function() {
          window.skroutz.widgets[plugin_name](params);
          if (callback) {
            return callback();
          }
        }, this);
        if (plugin_name !== void 0 && typeof plugin_name === "string" && plugin_name !== "" && !window.skroutz.widgets[plugin_name]) {
          options.filetype = 'js';
          plugin_url = plugin_name + ".js";
          if (plugin_url.substr(0, 7) !== "http://") {
            plugin_url = widget_js_base_url + plugin_url;
          }
          async_load(plugin_url, options, init_callback);
          options.filetype = 'css';
          plugin_url = plugin_name + ".css";
          if (plugin_url.substr(0, 7) !== "http://") {
            plugin_url = widget_css_base_url + plugin_url;
          }
          async_load(plugin_url, options, init_callback);
          return true;
        } else {
          init_callback();
          return false;
        }
      };
      addEvent = function(event, target, method, context) {
        var my_method, my_method2;
        if (context) {
          my_method = function(e) {
            return method.apply(context, [e]);
          };
        } else {
          my_method = method;
        }
        if (target.addEventListener !== void 0) {
          target.addEventListener(event, my_method, false);
        } else if (target.attachEvent !== void 0) {
          if (event === "load") {
            event = "readystatechange";
            my_method2 = function() {
              if (this.readyState === 'complete') {
                my_method();
              }
            };
            target.attachEvent("on" + event, my_method2);
          }
          target.attachEvent("on" + event, my_method);
        }
      };
      removeEvent = function(event, target, method) {
        if (target.removeEventListener !== void 0) {
          target.removeEventListener(event, method, false);
        } else if (target.detachEvent !== void 0) {
          target.detachEvent("on" + event, method);
        }
      };
      async_load = function(link, options, onsuccess, onfailure) {
        var head, jsonpCallback, new_element;
        options = options || {};
        head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
        if (options.filetype === 'js') {
          new_element = document.createElement("script");
          new_element.setAttribute("type", "text/javascript");
          new_element.async = "async";
          if (options.crossDomain && !options.pluginLoad) {
            jsonpCallback = "jsonp_" + (new Date()).getTime();
            window.skroutz.jsonp_list[jsonpCallback] = __bind(function(response) {
              if (response) {
                response.plugin_params = options.params;
              }
              onsuccess(response);
              window.skroutz.jsonp_list[jsonpCallback] = null;
              delete window.skroutz.jsonp_list[jsonpCallback];
            }, this);
            link += (/\?/.test(link) ? "&" : "?") + "callback=" + encodeURIComponent("window.skroutz.jsonp_list." + jsonpCallback);
          }
          new_element.src = link;
          new_element.onerror = onfailure || {};
          new_element.onload = new_element.onreadystatechange = function() {
            if (!new_element.readyState || /loaded|complete/.test(new_element.readyState)) {
              new_element.onload = new_element.onreadystatechange = null;
              if (head && new_element.parentNode) {
                head.removeChild(new_element);
              }
              new_element = void 0;
              if (onsuccess && !options.crossDomain) {
                onsuccess(options);
              }
            }
          };
        } else if (options.filetype === 'css') {
          new_element = document.createElement("link");
          new_element.setAttribute("rel", "stylesheet");
          new_element.setAttribute("type", "text/css");
          new_element.href = link;
        }
        head.insertBefore(new_element, head.firstChild);
      };
      make_xhr = function(url, params, onsuccess, onfailure) {
        var ajaxLocParts, createActiveXHR, createStandardXHR, crossDomain, options, parts, rurl, xhr;
        options = options || {};
        createStandardXHR = function() {
          try {
            return new window.XMLHttpRequest();
          } catch (_e) {}
        };
        createActiveXHR = function() {
          try {
            return new window.ActiveXObject("Microsoft.XMLHTTP");
          } catch (_e) {}
        };
        rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/;
        parts = rurl.exec(url.toLowerCase());
        ajaxLocParts = rurl.exec(location.href.toLowerCase()) || [];
        crossDomain = !!(parts && (parts[1] !== ajaxLocParts[1] || parts[2] !== ajaxLocParts[2] || (parts[3] || (parts[1] === "http:" ? 80 : 443)) !== (ajaxLocParts[3] || (ajaxLocParts[1] === "http:" ? 80 : 443))));
        if (crossDomain) {
          options.params = params;
          options.crossDomain = true;
          options.filetype = 'js';
          async_load(url, options, onsuccess, onfailure);
        } else {
          xhr = (window.ActiveXObject ? function() {
            return createStandardXHR() || createActiveXHR();
          } : createStandardXHR());
          xhr.open("GET", url, true);
          xhr.onreadystatechange = function(oEvent) {
            if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                if (onsuccess) {
                  onsuccess(oEvent, xhr.responseText);
                }
              } else {
                if (onfailure) {
                  onfailure(oEvent, xhr.responseText);
                }
              }
            }
          };
          xhr.send(null);
        }
      };
      deep_merge_objects = function(obj1, obj2) {
        var merge_em, obj3;
        obj3 = {};
        merge_em = function(from, to) {
          var key, value;
          for (key in from) {
            value = from[key];
            if (from.hasOwnProperty(key)) {
              if (typeof value === "object") {
                to[key] = to[key] || {};
                merge_em(value, to[key]);
              } else {
                to[key] = value;
              }
            }
          }
        };
        merge_em(obj1, obj3);
        merge_em(obj2, obj3);
        return obj3;
      };
      return {
        load_widget: load,
        addEvent: addEvent,
        removeEvent: removeEvent,
        make_xhr: make_xhr,
        deep_merge_objects: deep_merge_objects
      };
    })();
    window.skroutz.load_widget = window.skroutz.load_widget || window.skroutz.helpers.load_widget;
  })(window, document);
}).call(this);
