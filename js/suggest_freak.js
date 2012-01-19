(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  (function() {
    var all, el, len, res;
    all = $.event.props;
    len = all.length;
    res = [];
    while (len--) {
      el = all[len];
      if (el !== 'layerX' && el !== 'layerY') {
        res.push(el);
      }
    }
    return $.event.props = res;
  })();
  (function($, window, document) {
    var SuggestFreak, defaults, pluginName;
    if (!String.prototype.trim) {
      String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, "");
      };
    }
    pluginName = "suggestfreak";
    defaults = {
      minCharsForRemoteSearch: 1,
      minHeight: 20,
      minWidth: 280,
      maxWidth: 600,
      zIndex: 9999,
      params: {},
      delimiter: /(,|;)\s*/,
      serviceUrl: "http://www.skroutz.gr/suggest",
      caching_of_queries: true,
      queryCacheTimeout: 2 * 60 * 60 * 1000,
      localCacheTimeout: 7 * 24 * 60 * 60 * 1000,
      XHRTimeout: 280,
      suggestionFreakContainerID: "suggest_freak_cont",
      spinnerSelectorID: "search-spinner",
      select_first_entry: true,
      numberOfTotalItemsToSuggest: 10,
      numberOfUnmatchedManufacturersWithMatchInProductName: 1,
      numberOfProductsOfUnmatchedManufacturersWithMatchInProductName: 3,
      numberOfMatchedManufacturers: 3,
      numberOfProductsPerMatchedManufacturer: 3,
      numberOfMatchedCategories: 2,
      numberOfLocalProducts: 30,
      numberOfLocalCategories: 50,
      numberOfLocalManufacturers: 300
    };
    SuggestFreak = function(element, options) {
      this.last_invalid_query = null;
      this.el = $(element).attr("autocomplete", "off");
      this.options = $.extend({}, defaults, options);
      this._defaults = defaults;
      this._name = pluginName;
      this.currentValue = "";
      this.currentValueLength = "";
      this.currentValueWords = [];
      this.currentValueWordsLength = 0;
      this.we_have_books = false;
      this.suggestions = [];
      this.hidden = false;
      this.serviceUrl = this.options.serviceUrl;
      this.suggestions_container = "";
      this.db = null;
      this.local_db_timestamp = null;
      this.selected_suggest_item = null;
      this.list_of_manufacturers = [];
      this.list_of_categories = [];
      this.PQ = null;
      this.queryWords = null;
      this.unique = null;
      this.concatSliceUnique = null;
      this.wresize = null;
      this.timers_handler = null;
      this.init();
    };
    SuggestFreak.prototype = {
      name: pluginName,
      init: function() {
        this.initializeHtmlElements();
        this.db = SuggestFreak.getLocalDBObj();
        SuggestFreak.initiateLocalData.call(this);
        this.PQ = $.fn.toolsfreak.priorityQueue;
        this.queryWords = $.fn.toolsfreak.queryWordMatchesInText;
        this.unique = $.fn.toolsfreak.filterUnique;
        this.concatSliceUnique = $.fn.toolsfreak.concatSliceUnique;
        this.wresize = $.fn.toolsfreak.wresize;
        this.timers_handler = $.fn.toolsfreak.timers_handler();
        this.fix_container_location();
        this.wresize(__bind(function() {
          return this.fix_container_location();
        }, this));
        if (window.opera || $.browser.mozilla) {
          this.el.keypress(__bind(function(e) {
            return this.onKeyPress(e);
          }, this));
        } else {
          this.el.keydown(__bind(function(e) {
            return this.onKeyPress(e);
          }, this));
        }
        this.el.keyup(__bind(function(e) {
          return this.onKeyUp(e);
        }, this));
        this.el.click(__bind(function(e) {
          if (this.suggestions_container.html() !== "") {
            this.suggestions_container.show();
          }
        }, this));
        $("html").click(__bind(function(e) {
          if ($(e.target).attr("id") === this.el.attr("id")) {
            return;
          }
          if ($(e.target).parents("#" + this.options.suggestionFreakContainerID).length > 0) {
            return;
          }
          if (this.suggestions_container.is(":visible")) {
            return this.hide(true);
          }
        }, this));
      },
      fix_container_location: function() {
        var elOuterHeight, minWidth, offset;
        offset = this.el.offset();
        elOuterHeight = this.el.outerHeight();
        minWidth = this.el.outerWidth();
        if (this.options.minWidth > this.el.outerWidth()) {
          minWidth = this.options.minWidth;
        }
        return this.suggestions_container.css({
          top: (offset.top + elOuterHeight) + "px",
          left: offset.left + "px",
          minWidth: minWidth
        });
      },
      toString: function() {
        return this._name;
      },
      initializeHtmlElements: function() {
        if ($('#' + this.options.spinnerSelectorID).length === 0) {
          this.el.parent().css({
            position: "relative"
          });
          this.el.after($('<div id="' + this.options.spinnerSelectorID + '">'));
        }
        this.suggestions_container = $('<div id="' + this.options.suggestionFreakContainerID + '">').css({
          zIndex: this.options.zIndex,
          minHeight: this.options.minHeight,
          maxWidth: this.options.maxWidth
        });
        $("body").append(this.suggestions_container);
      },
      onKeyPress: function(e) {
        var search_value;
        switch (e.keyCode) {
          case 27:
            this.hide(true);
            break;
          case 38:
            this.moveSelectedElement("up");
            return false;
          case 39:
            return true;
          case 40:
            this.moveSelectedElement("down");
            return false;
          case 8:
            return true;
          case 13:
            e.stopImmediatePropagation();
            e.preventDefault();
            if (this.selected_suggest_item !== null && this.suggestions_container.is(":visible")) {
              if (this.selected_suggest_item.text() !== this.suggestions_container.find(".entry:first").text()) {
                search_value = this.selected_suggest_item.attr("href");
                if (search_value.indexOf("/search?keyphrase=") === 0) {
                  search_value = search_value.replace("/search?keyphrase=", "");
                  this.el.val(decodeURIComponent(search_value));
                } else {
                  this.el.parents("form").attr("action", this.selected_suggest_item.attr("href"));
                }
              }
            }
            this.el.parents("form").submit();
            return false;
          default:
            return;
        }
        e.stopImmediatePropagation();
        e.preventDefault();
      },
      onKeyUp: function(e) {
        var cached_query, current_timestamp, query;
        switch (e.keyCode) {
          case 16:
          case 17:
          case 37:
          case 38:
          case 39:
          case 40:
          case 27:
          case 13:
            return;
        }
        this.hidden = false;
        query = this.cleanQuery(this.el.val());
        this.currentValue = query;
        this.currentValueLength = query.length;
        this.currentValueWords = query.toLowerCase().split(" ");
        this.currentValueWordsLength = this.currentValueWords.length;
        if (query === "") {
          this.hide(false);
        } else {
          current_timestamp = new Date().getTime();
          cached_query = this.db.get("c_q_" + this.currentValue);
          if (this.options.caching_of_queries && cached_query !== false && (current_timestamp - cached_query.timestamp) < this.options.queryCacheTimeout) {
            this.printSuggestionList(cached_query);
          } else {
            if (this.currentValueLength >= this.options.minCharsForRemoteSearch && this.currentValue.indexOf(this.last_invalid_query) === -1) {
              this.timers_handler.endAndStart(__bind(function() {
                return this.beginRemoteSearch(this.currentValue);
              }, this), this.options.XHRTimeout);
            } else {
              this.printSuggestionList();
            }
          }
          delete current_timestamp;
        }
        return false;
      },
      beginRemoteSearch: function(query) {
        this.showSpinner();
        this.options.params.keyphrase = query;
        $.getJSON(this.serviceUrl, this.options.params, __bind(function(response_data) {
          var current_timestamp;
          if (response_data.length !== 0) {
            this.suggestions = response_data;
            if (this.options.caching_of_queries) {
              current_timestamp = new Date().getTime();
              this.db.set("c_q_" + this.currentValue, {
                data: this.suggestions,
                timestamp: current_timestamp
              });
              delete current_timestamp;
            }
            this.last_invalid_query = null;
          } else {
            this.suggestions = [];
            this.last_invalid_query = query;
          }
          this.hideSpinner();
          return this.printSuggestionList();
        }, this));
      },
      printSuggestionList: function(cached_result) {
        var a, fragment, item, label, latest_label, manu_label_printed, me, results, row, _i, _len, _ref;
        this.suggestions_container.empty();
        if (this.options.caching_of_queries && cached_result !== void 0) {
          this.suggestions = cached_result.data;
        }
        fragment = document.createDocumentFragment();
        manu_label_printed = false;
        row = document.createElement("div");
        row.setAttribute("class", "r_row");
        label = document.createElement("div");
        label.setAttribute("class", "r_label");
        row.appendChild(label);
        results = document.createElement("div");
        results.setAttribute("class", "r_results");
        a = document.createElement("a");
        a.setAttribute("class", "entry");
        a.setAttribute("href", "/search?keyphrase=" + encodeURIComponent(this.currentValue));
        a.appendChild(document.createTextNode("Αναζήτηση για " + this.currentValue));
        results.appendChild(a);
        row.appendChild(results);
        fragment.appendChild(row);
        console.log(this.suggestions);
        if (this.suggestions.length !== 0) {
          latest_label = "";
          _ref = this.suggestions;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            item = _ref[_i];
            if (item.t !== latest_label) {
              if (latest_label !== "") {
                row.appendChild(results);
                fragment.appendChild(row);
              }
              latest_label = item.t;
              row = document.createElement("div");
              row.setAttribute("class", "r_row");
              label = document.createElement("div");
              label.setAttribute("class", "r_label");
              if (item.t === "k") {
                label.appendChild(document.createTextNode("ΠΡΟΙΟΝΤΑ"));
              } else if (item.t === "b") {
                label.appendChild(document.createTextNode("ΒΙΒΛΙΑ"));
                item.n = "Αναζήτηση για βιβλία";
              } else if (item.t === "s") {
                label.appendChild(document.createTextNode("ΚΑΤΑΣΤΗΜΑΤΑ"));
              } else if (item.t === "c") {
                label.appendChild(document.createTextNode("ΚΑΤΗΓΟΡΙΕΣ"));
              }
              row.appendChild(label);
              results = document.createElement("div");
              results.setAttribute("class", "r_results");
            }
            a = document.createElement("a");
            a.setAttribute("class", "entry");
            if (item.t === "b") {
              a.setAttribute("href", "/search?keyphrase=" + encodeURIComponent(this.currentValue));
            } else {
              a.setAttribute("href", (item.u ? item.u : "/search?keyphrase=" + encodeURIComponent(item.n)));
            }
            a.appendChild(document.createTextNode(item.n));
            results.appendChild(a);
          }
          row.appendChild(results);
          fragment.appendChild(row);
        }
        this.suggestions_container.append(fragment);
        document.getElementById(this.options.suggestionFreakContainerID).innerHTML += '';
        me = this;
        $("a.entry").mouseenter(me, function() {
          return me.userSelectedThisItem($(this));
        });
        if (this.options.select_first_entry) {
          this.selected_suggest_item = $("a.entry:first").addClass("selected");
        }
        this.hideSpinner();
        this.suggestions_container.show();
        this.highlightTextAndItem();
      },
      highlightTextAndItem: function() {
        $(".entry").each(__bind(function(index, element) {
          var indexOfWord, indexOfWordRegEx, item_name, my_re_no_space, my_re_space, word, _len, _ref;
          item_name = $(element).html();
          _ref = this.currentValueWords;
          for (index = 0, _len = _ref.length; index < _len; index++) {
            word = _ref[index];
            if (word !== "") {
              indexOfWordRegEx = new RegExp("(^" + word + ")|([ ]" + word + ")", "i");
              indexOfWord = item_name.search(indexOfWordRegEx);
              if (indexOfWord === 0) {
                my_re_no_space = new RegExp("(^" + word + ")", "i");
                item_name = item_name.replace(my_re_no_space, "<span class='highlight'>$&</span>");
              } else if (indexOfWord > 0) {
                my_re_space = new RegExp("([ ]" + word + ")", "i");
                item_name = item_name.replace(my_re_space, " <span class='highlight'>$&</span>");
              }
            }
          }
          $(element).html(item_name);
        }, this));
      },
      moveSelectedElement: function(direction) {
        var count, index;
        count = $(".entry").length;
        index = $(".entry").index(this.selected_suggest_item) + count;
        if (direction === "up") {
          if (this.selected_suggest_item === null) {
            this.userSelectedThisItem($(".entry:last"));
            return;
          } else {
            index = (index - 1) % count;
          }
        } else if (direction === "down") {
          if (this.selected_suggest_item === null) {
            this.userSelectedThisItem($(".entry:first"));
            return;
          } else {
            index = (index + 1) % count;
          }
        }
        this.userSelectedThisItem($("a.entry:nth(" + index + ")"));
      },
      userSelectedThisItem: function(element) {
        if (this.selected_suggest_item !== null) {
          this.selected_suggest_item.removeClass("selected");
          this.selected_suggest_item = null;
        }
        this.selected_suggest_item = element.addClass("selected");
      },
      cleanQuery: function(query) {
        var arr, d;
        if (typeof query !== "string") {
          return false;
        }
        d = this.options.delimiter;
        if (d) {
          arr = query.split(d);
          query = arr[arr.length - 1];
        }
        return jQuery.trim(query);
      },
      isForbiddenQuery: function(query) {
        if (query.search(/([ ]|[ ].)$/) !== -1) {
          return true;
        }
        return false;
      },
      hide: function(user_has_requested_it) {
        if (user_has_requested_it === void 0) {
          user_has_requested_it = false;
        }
        if (user_has_requested_it === true) {
          this.hidden = true;
        }
        this.timers_handler.end();
        this.suggestions_container.hide();
        if (user_has_requested_it === false) {
          this.selected_suggest_item = null;
          return this.suggestions_container.empty();
        }
      },
      showSpinner: function() {
        return $("#" + this.options.spinnerSelectorID).show();
      },
      hideSpinner: function() {
        return $("#" + this.options.spinnerSelectorID).hide();
      }
    };
    SuggestFreak.getLocalDBObj = function() {
      try {
        return $.fn.storagefreak();
      } catch (e) {
        console.log("getLocalDBObj error: " + e);
        return null;
      }
    };
    SuggestFreak.initiateLocalData = function() {
      var current_timestamp;
      current_timestamp = new Date().getTime();
      this.local_db_timestamp = this.db.get("local_db_timestamp");
      if (this.local_db_timestamp !== false) {
        this.local_db_timestamp = parseInt(this.local_db_timestamp);
      }
      if (this.local_db_timestamp === false || (current_timestamp - this.local_db_timestamp) > this.options.localCacheTimeout) {
        this.db.set("local_db_timestamp", new Date().getTime());
      }
      return true;
    };
    SuggestFreak.populateLocalDB = function(json_data) {
      var key, values_array;
      this.db.set("local_db_timestamp", new Date().getTime());
      for (key in json_data) {
        values_array = json_data[key];
        this.db.set("list_of_" + key, values_array);
      }
      this.list_of_manufacturers = this.db.get("list_of_m");
      if (this.list_of_manufacturers === false) {
        this.list_of_manufacturers = [];
      }
      this.list_of_categories = this.db.get("list_of_c");
      if (this.list_of_categories === false) {
        this.list_of_categories = [];
      }
    };
    return $.fn.suggestfreak = function(options) {
      return this.each(function() {
        if (!$.data(this, pluginName)) {
          $.data(this, pluginName, new SuggestFreak(this, options));
        }
      });
    };
  })(jQuery, window, document);
}).call(this);
