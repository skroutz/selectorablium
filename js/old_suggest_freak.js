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
      serviceUrl: "http://192.168.6.4:4000/suggest/proxy",
      initializationDataURL: "http://192.168.6.4:4000/suggest",
      caching_of_queries: false,
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
            if (this.selected_suggest_item !== null && this.suggestions_container.is(":visible")) {
              this.el.parents("form").attr("action", this.selected_suggest_item.attr("href"));
            }
            return true;
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
            this.beginLocalSearch(this.currentValue);
            if (this.currentValueLength >= this.options.minCharsForRemoteSearch && this.isForbiddenQuery(this.currentValue) === false && this.currentValue.indexOf(this.last_invalid_query) === -1) {
              this.timers_handler.endAndStart(__bind(function() {
                return this.beginRemoteSearch(this.currentValue);
              }, this), this.options.XHRTimeout);
            }
          }
          delete current_timestamp;
        }
        return false;
      },
      beginLocalSearch: function(query) {
        return this.makeSuggestionListFor(query, true, "local");
      },
      beginRemoteSearch: function(query) {
        this.showSpinner();
        this.options.params.keyphrase = query;
        $.getJSON(this.serviceUrl, this.options.params, __bind(function(response_data) {
          if (response_data.length !== 0) {
            this.updateLocalDB(response_data);
            this.makeSuggestionListFor(query, true, "remote");
            this.last_invalid_query = null;
          } else {
            this.last_invalid_query = query;
          }
          return this.hideSpinner();
        }, this));
      },
      updateLocalDB: function(response_data) {
        var index, items, manufacturer, my_regexp, new_categories_list, new_list, new_manufacturer_list, old_list, product_list, product_manufacturer, responce_item, updated_manufacturer_list;
        product_list = [];
        new_manufacturer_list = [];
        new_categories_list = [];
        updated_manufacturer_list = [];
        for (index in response_data) {
          responce_item = response_data[index];
          if (responce_item.t === "m") {
            new_manufacturer_list.push(responce_item);
          } else if (responce_item.t === "c") {
            new_categories_list.push(responce_item);
          } else if (responce_item.t === "b") {
            this.we_have_books = true;
          } else if (responce_item.t === "k") {
            my_regexp = new RegExp(" ", "ig");
            product_manufacturer = responce_item.m.replace(my_regexp, "_").toLowerCase();
            if (product_list[product_manufacturer] === void 0) {
              product_list[product_manufacturer] = [];
            }
            product_list[product_manufacturer] = product_list[product_manufacturer].concat([responce_item]);
            new_manufacturer_list.push({
              n: responce_item.m,
              t: "m"
            });
          }
        }
        this.list_of_manufacturers = this.concatSliceUnique(this.list_of_manufacturers, new_manufacturer_list, 0, this.options.numberOfLocalManufacturers, true);
        this.db.set("list_of_m", this.list_of_manufacturers);
        this.list_of_categories = this.concatSliceUnique(this.list_of_categories, new_categories_list, 0, this.options.numberOfLocalCategories, true);
        this.db.set("list_of_c", this.list_of_categories);
        for (manufacturer in product_list) {
          items = product_list[manufacturer];
          old_list = this.db.get("products_of_" + manufacturer);
          new_list = this.concatSliceUnique(old_list, items, 0, this.options.numberOfLocalProducts, true);
          this.db.set("products_of_" + manufacturer, new_list);
        }
      },
      limitSuggestionResults: function(data_arrays) {
        var books_list, cat_length, cat_start_length, i, manu_length, manu_start_length, manus_length, max_slots, prod_length, prod_start_length, prods_length, result_list, round, temp_manu_array, which_manu;
        result_list = [];
        books_list = [];
        prod_start_length = data_arrays.product_starting_match.length;
        i = 0;
        while (i < prod_start_length && i < 3) {
          prods_length = data_arrays.product_starting_match[i].products.length;
          if (prods_length > 3) {
            prods_length = 3;
          }
          data_arrays.product_starting_match[i].products = data_arrays.product_starting_match[i].products.splice(0, prods_length);
          data_arrays.product_starting_match[i].filter = "prod_start";
          result_list = result_list.concat(data_arrays.product_starting_match[i]);
          i += 1;
        }
        manu_start_length = data_arrays.manufacturer_starting_match.length;
        i = 0;
        while (i < manu_start_length && i < 3) {
          manus_length = data_arrays.manufacturer_starting_match[i].products.length;
          if (manus_length > 3) {
            manus_length = 3;
          }
          data_arrays.manufacturer_starting_match[i].products = data_arrays.manufacturer_starting_match[i].products.splice(0, manus_length);
          data_arrays.manufacturer_starting_match[i].filter = "manu_start";
          result_list = result_list.concat(data_arrays.manufacturer_starting_match[i]);
          i += 1;
        }
        cat_start_length = data_arrays.category_starting_match.length;
        i = 0;
        while (i < cat_start_length && i < 3) {
          data_arrays.category_starting_match[i].filter = "cat_start";
          result_list = result_list.concat(data_arrays.category_starting_match[i]);
          i += 1;
        }
        console.log(data_arrays);
        prod_length = data_arrays.product_match.length;
        i = 0;
        while (i < prod_length && i < 3) {
          prods_length = data_arrays.product_match[i].products.length;
          if (prods_length > 3) {
            prods_length = 3;
          }
          data_arrays.product_match[i].products = data_arrays.product_match[i].products.splice(0, prods_length);
          data_arrays.product_match[i].filter = "prod";
          result_list = result_list.concat(data_arrays.product_match[i]);
          i += 1;
        }
        max_slots = 10;
        i = 0;
        round = 0;
        which_manu = 0;
        manu_length = data_arrays.manufacturer_match.length;
        if (manu_length > 3) {
          manu_length = 3;
        }
        temp_manu_array = {};
        if (manu_length > 0) {
          while (1) {
            if (i >= max_slots || round >= max_slots) {
              break;
            }
            if (data_arrays.manufacturer_match[which_manu].products.length === 0 && temp_manu_array[which_manu] === void 0) {
              temp_manu_array[which_manu] = round;
              i += 1;
            } else if (data_arrays.manufacturer_match[which_manu].products[round] !== void 0) {
              temp_manu_array[which_manu] = round;
              i += 1;
            }
            which_manu = which_manu + 1;
            if ((which_manu % manu_length) === 0) {
              which_manu = 0;
              round += 1;
            }
          }
        }
        i = 0;
        while (i < manu_length) {
          data_arrays.manufacturer_match[i].products = data_arrays.manufacturer_match[i].products.splice(0, parseInt(temp_manu_array[i]) + 1);
          data_arrays.manufacturer_match[i].filter = "manu";
          result_list = result_list.concat(data_arrays.manufacturer_match[i]);
          i++;
        }
        cat_length = data_arrays.category_match.length;
        i = 0;
        while (i < cat_length && i < 3) {
          data_arrays.category_match[i].filter = "cat";
          result_list = result_list.concat(data_arrays.category_match[i]);
          i += 1;
        }
        /*
                max_cat_length = @options.numberOfMatchedCategories
                top_cat_length = top_categories_list.length
                if top_cat_length > max_cat_length
                  top_cat_length = max_cat_length
                top_categories_list = top_categories_list.splice 0, top_cat_length
                result_list = result_list.concat top_categories_list
        
                prod_manu_length = matched_products_list.length
                i = 0
                while i < @options.numberOfUnmatchedManufacturersWithMatchInProductName and i < prod_manu_length
                  prods_length = matched_products_list[i].products.length
                  if prods_length > @options.numberOfProductsOfUnmatchedManufacturersWithMatchInProductName
                    prods_length = @options.numberOfProductsOfUnmatchedManufacturersWithMatchInProductName
                  matched_products_list[i].products = matched_products_list[i].products.splice 0, prods_length
                  matched_products_list[i].filter = "matched_prods"
                  result_list = result_list.concat matched_products_list[i]
                  i += 1
                
                max_slots = @options.numberOfMatchedManufacturers * @options.numberOfProductsPerMatchedManufacturer
                i=0
                round = 0
                which_manu = 0
                manu_length = manufacturers_list.length
                if manu_length > @options.numberOfMatchedManufacturers
                  manu_length = @options.numberOfMatchedManufacturers
                temp_manu_array = {}
                if manu_length > 0
                  #do a round robin for manufacturers and get the max quantity of product per manu 
                  while 1
                    break if i >= max_slots or round >= max_slots
                    if manufacturers_list[which_manu].products.length is 0 and temp_manu_array[which_manu] is undefined
                      temp_manu_array[which_manu] = round
                      i += 1
                    else if manufacturers_list[which_manu].products[round] isnt undefined
                      temp_manu_array[which_manu] = round
                      i += 1
                    which_manu = which_manu + 1
                    if (which_manu % manu_length) is 0
                      which_manu = 0
                      round += 1
                i=0
                while i < manu_length
                  manufacturers_list[i].products = manufacturers_list[i].products.splice(0, parseInt(temp_manu_array[i]) + 1)
                  manufacturers_list[i].filter = "matched_manus"
                  result_list = result_list.concat manufacturers_list[i]
                  i++
                
                available_cat_length = max_cat_length - top_cat_length
                cat_length = categories_list.length
                if cat_length > max_cat_length
                  cat_length = max_cat_length
                if available_cat_length < cat_length
                  cat_length = available_cat_length
                categories_list = categories_list.splice 0, (max_cat_length - top_cat_length)
                result_list = result_list.concat categories_list
                result_list = result_list.concat books_list
              */
        return result_list;
      },
      makeSuggestionListFor: function(query, i_should_print_them, caller_type) {
        var books_array, current_timestamp, inner_manufacturersPQ, inner_manufacturers_list, inner_productsPQ, inner_products_list_match, inner_products_list_starting_match, manu_obj, manu_query_word_count, manufacturer, manufacturer_name, my_regexp, outer_categoriesPQ, outer_manufacturersPQ, outer_productsPQ, prod_query_word_count, product, product_name, product_words_array, products_list, starting_manu_match, starting_prod_match, _i, _j, _len, _len2, _ref;
        if (query !== this.currentValue) {
          return false;
        }
        outer_productsPQ = new this.PQ();
        outer_productsPQ.init(2, ["starting_match", "match"]);
        outer_manufacturersPQ = new this.PQ();
        outer_manufacturersPQ.init(2, ["starting_match", "match"]);
        outer_categoriesPQ = new this.PQ();
        outer_categoriesPQ.init(2, ["starting_match", "match"]);
        books_array = [];
        _ref = this.list_of_manufacturers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          manufacturer = _ref[_i];
          manufacturer_name = manufacturer.n.toLowerCase();
          inner_productsPQ = new this.PQ();
          inner_productsPQ.init(2, ["starting_match", "match"]);
          starting_prod_match = false;
          inner_manufacturersPQ = new this.PQ();
          inner_manufacturersPQ.init(0);
          starting_manu_match = false;
          manu_obj = {
            "type": "manufacturer",
            "manufacturer": manufacturer,
            "products": []
          };
          if (manufacturer_name.indexOf(this.currentValueWords[0]) === 0) {
            starting_manu_match = true;
          }
          manu_query_word_count = this.queryWords(this.currentValueWords, manufacturer_name);
          product_words_array = this.currentValueWords.slice(manu_query_word_count);
          my_regexp = new RegExp(" ", "ig");
          products_list = this.db.get("products_of_" + manufacturer.n.replace(my_regexp, "_").toLowerCase());
          delete my_regexp;
          for (_j = 0, _len2 = products_list.length; _j < _len2; _j++) {
            product = products_list[_j];
            my_regexp = new RegExp(manufacturer_name);
            product_name = product.n.toLowerCase().replace(my_regexp, "").trim();
            delete my_regexp;
            prod_query_word_count = this.queryWords(product_words_array, product_name);
            if (typeof prod_query_word_count !== "number" || prod_query_word_count < 1) {
              prod_query_word_count = 0;
            }
            if (manu_query_word_count > 0) {
              inner_manufacturersPQ.insert(product, prod_query_word_count);
            } else if (manu_query_word_count === 0 && prod_query_word_count > 0) {
              if (product_name.indexOf(product_words_array[0]) === 0) {
                inner_productsPQ.insert(product, prod_query_word_count, "starting_match");
              } else {
                inner_productsPQ.insert(product, prod_query_word_count, "match");
              }
            }
          }
          inner_products_list_starting_match = inner_productsPQ.getArrayByLayer("starting_match", true);
          inner_products_list_match = inner_productsPQ.getArrayByLayer("match", true);
          inner_manufacturers_list = inner_manufacturersPQ.getArray();
          if (inner_products_list_starting_match.length !== 0) {
            outer_productsPQ.insert({
              "type": "manufacturer",
              "manufacturer": manufacturer,
              "products": inner_products_list_starting_match
            }, inner_productsPQ.getMaxPriority("starting_match"), "starting_match");
          }
          if (inner_products_list_match.length !== 0) {
            outer_productsPQ.insert({
              "type": "manufacturer",
              "manufacturer": manufacturer,
              "products": inner_products_list_match
            }, inner_productsPQ.getMaxPriority("match"), "match");
          }
          delete inner_productsPQ;
          delete inner_manufacturersPQ;
        }
        this.suggestions = this.limitSuggestionResults({
          product_starting_match: outer_productsPQ.getArrayByLayer("starting_match"),
          product_match: outer_productsPQ.getArrayByLayer("match"),
          manufacturer_starting_match: outer_manufacturersPQ.getArrayByLayer("starting_match"),
          manufacturer_match: outer_manufacturersPQ.getArrayByLayer("match"),
          category_starting_match: outer_categoriesPQ.getArrayByLayer("starting_match"),
          category_match: outer_categoriesPQ.getArrayByLayer("match")
        });
        delete outer_productsPQ;
        delete outer_manufacturersPQ;
        delete outer_categoriesPQ;
        if (this.options.caching_of_queries && caller_type === "remote") {
          current_timestamp = new Date().getTime();
          this.db.set("c_q_" + this.currentValue, {
            data: this.suggestions,
            timestamp: current_timestamp
          });
          delete current_timestamp;
        }
        if (i_should_print_them) {
          this.printSuggestionList();
        }
      },
      printSuggestionList: function(cached_result) {
        var a, fragment, item, label, manu_label_printed, me, results, row, s, _i, _j, _len, _len2, _ref, _ref2;
        if (this.hidden) {
          return;
        }
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
        if (this.suggestions.length !== 0) {
          row = document.createElement("div");
          row.setAttribute("class", "r_row");
          label = document.createElement("div");
          label.setAttribute("class", "r_label");
          label.appendChild(document.createTextNode("Προϊόντα"));
          row.appendChild(label);
          results = document.createElement("div");
          results.setAttribute("class", "r_results");
          _ref = this.suggestions;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            item = _ref[_i];
            if (item.products.length > 0) {
              _ref2 = item.products;
              for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                s = _ref2[_j];
                a = document.createElement("a");
                a.setAttribute("class", "entry");
                a.setAttribute("href", (s.u ? s.u : "/search?keyphrase=" + encodeURIComponent(s.n)));
                a.appendChild(document.createTextNode(s.n));
                results.appendChild(a);
              }
            } else {
              s = item.manufacturer;
              a = document.createElement("a");
              a.setAttribute("class", "entry");
              a.setAttribute("href", (s.u ? s.u : "/search?keyphrase=" + encodeURIComponent(s.n)));
              a.appendChild(document.createTextNode(s.n));
              results.appendChild(a);
            }
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
        if (query.charAt(0) === " ") {
          query = query.slice(1);
        }
        return query;
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
