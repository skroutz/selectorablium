#remove layerX and layerY event error
(->
    all = $.event.props
    len = all.length
    res = []

    while (len--)
      el = all[len]
      res.push(el) if (el != 'layerX' && el != 'layerY') 
    $.event.props = res
)()

(($, window, document) ->
  ##PRIVATE PROPERTIES
  unless String::trim
    String::trim = ->
      @replace /^\s+|\s+$/g, ""
  
  pluginName = "suggestfreak"
  defaults =
    minCharsForRemoteSearch: 1
    minHeight: 20
    minWidth: 280
    maxWidth: 600
    zIndex: 9999
    params: {}
    delimiter: /(,|;)\s*/
    serviceUrl: "http://192.168.6.4:4000/suggest/proxy"
    initializationDataURL: "http://192.168.6.4:4000/suggest"
    caching_of_queries: false
    queryCacheTimeout: 2 * 60 * 60 * 1000 #milliseconds #2hours
    localCacheTimeout: 7 * 24 * 60 * 60 * 1000 #milliseconds #one week
    XHRTimeout: 280 #milliseconds
    suggestionFreakContainerID: "suggest_freak_cont"
    spinnerSelectorID: "search-spinner"
    select_first_entry: true
    #printed results quantities
    numberOfTotalItemsToSuggest: 10
    numberOfUnmatchedManufacturersWithMatchInProductName: 1
    numberOfProductsOfUnmatchedManufacturersWithMatchInProductName: 3
    numberOfMatchedManufacturers: 3
    numberOfProductsPerMatchedManufacturer: 3
    numberOfMatchedCategories: 2
    #localStorage quantities
    numberOfLocalProducts: 30
    numberOfLocalCategories: 50
    numberOfLocalManufacturers: 300
  
  SuggestFreak = (element, options) ->
    ##INSTANCE PRIVATE STUFF
    # test = new Date().valueOf()
    ##INSTANCE PUBLIC STUFF
    # @intervalId = 0
    
    # @XHRcalled = false
    @last_invalid_query = null
    #default stuff
    @el = $(element).attr("autocomplete", "off")
    @options = $.extend({}, defaults, options)
    @_defaults = defaults
    @_name = pluginName
    ##custom stuff
    @currentValue = ""
    @currentValueLength = ""
    @currentValueWords = []
    @currentValueWordsLength = 0
    @we_have_books = false
    @suggestions = []
    @hidden = false

    @serviceUrl = @options.serviceUrl
    ## under this the suggestion list is appended each time
    @suggestions_container = ""
    #local DB object
    @db = null
    ##used for localDB cache
    @local_db_timestamp = null
    ##used to revert from text substitution from change "select" events
    @selected_suggest_item = null
    @list_of_manufacturers = []
    @list_of_categories = []
    
    @PQ = null
    @queryWords = null
    @unique = null
    @concatSliceUnique = null
    @wresize = null
    @timers_handler = null
    
    @init()
    
    return

  SuggestFreak:: =
    name: pluginName
    init: ->
      #create the elements
      @initializeHtmlElements()
        
      #get DB connector
      @db = SuggestFreak.getLocalDBObj();
      #populate the localDB and the @lists_of_* arrays
      SuggestFreak.initiateLocalData.call this

      @PQ = $.fn.toolsfreak.priorityQueue
      @queryWords = $.fn.toolsfreak.queryWordMatchesInText
      @unique = $.fn.toolsfreak.filterUnique
      @concatSliceUnique = $.fn.toolsfreak.concatSliceUnique
      @wresize = $.fn.toolsfreak.wresize
      @timers_handler = $.fn.toolsfreak.timers_handler()

      @fix_container_location()
      #register event handlers
      @wresize =>
        @fix_container_location()
      
      if window.opera or $.browser.mozilla
        @el.keypress (e) =>
          @onKeyPress e
      else
        @el.keydown (e) =>
          @onKeyPress e
      
      @el.keyup (e) =>
        @onKeyUp e
      
      @el.click (e) =>
        if @suggestions_container.html() isnt ""
          @suggestions_container.show()
        return
      
      $("html").click (e)=>
        return if $(e.target).attr("id") is @el.attr("id")
        return if $(e.target).parents("#" + @options.suggestionFreakContainerID).length > 0
        if @suggestions_container.is(":visible")
          @hide(true)
      return
    
    fix_container_location: ->
      offset = @el.offset()
      elOuterHeight = @el.outerHeight()
      minWidth = @el.outerWidth()
      minWidth = @options.minWidth if @options.minWidth > @el.outerWidth()

      @suggestions_container.css
        top: (offset.top + elOuterHeight) + "px"
        left: offset.left + "px"
        minWidth: minWidth
      
    toString: ->
      @_name
    
    initializeHtmlElements: ->
      # offset = @el.offset()
      # elOuterHeight = @el.outerHeight()
      if $('#' + @options.spinnerSelectorID).length is 0
        @el.parent().css(position:"relative")
        @el.after $('<div id="' + @options.spinnerSelectorID + '">')
      
      @suggestions_container = $('<div id="' + @options.suggestionFreakContainerID + '">').css
        zIndex: @options.zIndex
        minHeight: @options.minHeight
        maxWidth: @options.maxWidth
      
      $("body").append @suggestions_container

      return

    onKeyPress: (e) ->
      switch e.keyCode
        when 27 #esc
          @hide(true)
        when 38 #up
          @moveSelectedElement("up")
          return false
        when 39 #right
          # @moveSelectedElement("right")
          # return false
          return true
        when 40 #down
          @moveSelectedElement("down")
          return false
        when 8 #backspace
          return true
        when 13 #enter
          if @selected_suggest_item isnt null and @suggestions_container.is(":visible")
            @el.parents("form").attr( "action", @selected_suggest_item.attr("href") )
          return true
        else
          return
        
      e.stopImmediatePropagation()
      e.preventDefault()
      return

    onKeyUp: (e) ->
      switch e.keyCode
        #KEYS SHIFT, CTRL, LEFT, UP, RIGHT, DOWN, ESC
        when 16, 17, 37, 38, 39, 40, 27
          return
      
      @hidden = false
      query = @cleanQuery(@el.val())
      @currentValue = query
      @currentValueLength = query.length
      @currentValueWords = query.toLowerCase().split(" ")
      @currentValueWordsLength = @currentValueWords.length

      if query is ""
        @hide(false)
      else
        current_timestamp = new Date().getTime()
        cached_query = @db.get("c_q_" + @currentValue)
        if @options.caching_of_queries and cached_query isnt false and (current_timestamp - cached_query.timestamp) < @.options.queryCacheTimeout
          @printSuggestionList(cached_query)
        else
          @beginLocalSearch(@currentValue)
          if @currentValueLength >= @options.minCharsForRemoteSearch and @isForbiddenQuery(@currentValue) is false and @currentValue.indexOf(@last_invalid_query) is -1
            @timers_handler.endAndStart =>
              @beginRemoteSearch(@currentValue)
            , @options.XHRTimeout
          
        delete current_timestamp
      
      return false
    
    beginLocalSearch: (query) ->
      @makeSuggestionListFor(query, true, "local")
    
    beginRemoteSearch: (query) ->
      @showSpinner()
      @options.params.keyphrase = query
      $.getJSON @serviceUrl, @options.params, (response_data) =>
        if response_data.length isnt 0
          @updateLocalDB(response_data)
          @makeSuggestionListFor(query, true, "remote")
          @last_invalid_query = null
        else
          @last_invalid_query = query
        @hideSpinner()
      return
    
    updateLocalDB: (response_data) ->
      #local variables
      product_list = []
      new_manufacturer_list = []
      new_categories_list = []
      updated_manufacturer_list = []

      #filter new data
      for index, responce_item of response_data
        if responce_item.t is "m"
          new_manufacturer_list.push responce_item
        else if responce_item.t is "c"
          new_categories_list.push responce_item
        else if responce_item.t is "b"
          @we_have_books = true
        else if responce_item.t is "k"
          my_regexp = new RegExp(" ","ig");
          product_manufacturer = responce_item.m.replace(my_regexp,"_").toLowerCase()
          product_list[product_manufacturer] = [] if product_list[product_manufacturer] is undefined
          product_list[product_manufacturer] = product_list[product_manufacturer].concat [responce_item]
          new_manufacturer_list.push 
            n: responce_item.m
            t: "m"
      
      #save new manufacturers
      @list_of_manufacturers = @concatSliceUnique( @list_of_manufacturers, new_manufacturer_list, 0, @options.numberOfLocalManufacturers, true )
      @db.set "list_of_m", @list_of_manufacturers
      
      #save new categories
      @list_of_categories = @concatSliceUnique( @list_of_categories, new_categories_list, 0, @options.numberOfLocalCategories, true )
      @db.set "list_of_c", @list_of_categories
      
      #save new products per manufacturer
      for manufacturer, items of product_list
        old_list = @db.get "products_of_" + manufacturer
        new_list = @concatSliceUnique( old_list, items, 0, @options.numberOfLocalProducts, true )
        @db.set "products_of_" + manufacturer, new_list
      
      return
    
    limitSuggestionResults: (data_arrays) -> #matched_products_list, manufacturers_list, top_categories_list, categories_list, books_list) ->
      result_list = []
      # top_categories_list = data_arrays.category_starting_match
      # categories_list = data_arrays.category_match
      # manufacturers_list = data_arrays.manufacturer_starting_match.concat data_arrays.manufacturer_match
      # matched_products_list = data_arrays.product_starting_match.concat data_arrays.product_match
      books_list = []

      # console.log data_arrays.manufacturer_starting_match
      # console.log data_arrays.manufacturer_match

      prod_start_length = data_arrays.product_starting_match.length
      i = 0
      while i < prod_start_length and i < 3 #@options.numberOfUnmatchedManufacturersWithMatchInProductName
        prods_length = data_arrays.product_starting_match[i].products.length
        if prods_length > 3 #@options.numberOfProductsOfUnmatchedManufacturersWithMatchInProductName
          prods_length = 3 #@options.numberOfProductsOfUnmatchedManufacturersWithMatchInProductName
        
        data_arrays.product_starting_match[i].products = data_arrays.product_starting_match[i].products.splice 0, prods_length
        data_arrays.product_starting_match[i].filter = "prod_start"
        result_list = result_list.concat data_arrays.product_starting_match[i]
        i += 1
      
      manu_start_length = data_arrays.manufacturer_starting_match.length
      i = 0
      while i < manu_start_length and i < 3 #@options.numberOfUnmatchedManufacturersWithMatchInProductName
        manus_length = data_arrays.manufacturer_starting_match[i].products.length
        if manus_length > 3 #@options.numberOfProductsOfUnmatchedManufacturersWithMatchInProductName
          manus_length = 3 #@options.numberOfProductsOfUnmatchedManufacturersWithMatchInProductName
        
        data_arrays.manufacturer_starting_match[i].products = data_arrays.manufacturer_starting_match[i].products.splice 0, manus_length
        data_arrays.manufacturer_starting_match[i].filter = "manu_start"
        result_list = result_list.concat data_arrays.manufacturer_starting_match[i]
        i += 1
      
      cat_start_length = data_arrays.category_starting_match.length
      i = 0
      while i < cat_start_length and i < 3 #@options.numberOfUnmatchedManufacturersWithMatchInProductName
        # cat_length = data_arrays.category_starting_match[i].products.length
        # if cat_length > 3 #@options.numberOfProductsOfUnmatchedManufacturersWithMatchInProductName
        #   cat_length = 3 #@options.numberOfProductsOfUnmatchedManufacturersWithMatchInProductName
        
        # data_arrays.category_starting_match[i].products = data_arrays.category_starting_match[i].products.splice 0, cat_length
        data_arrays.category_starting_match[i].filter = "cat_start"
        result_list = result_list.concat data_arrays.category_starting_match[i]
        i += 1
      
      console.log data_arrays
      prod_length = data_arrays.product_match.length
      i = 0
      while i < prod_length and i < 3 #@options.numberOfUnmatchedManufacturersWithMatchInProductName
        prods_length = data_arrays.product_match[i].products.length
        if prods_length > 3 #@options.numberOfProductsOfUnmatchedManufacturersWithMatchInProductName
          prods_length = 3 #@options.numberOfProductsOfUnmatchedManufacturersWithMatchInProductName
        
        data_arrays.product_match[i].products = data_arrays.product_match[i].products.splice 0, prods_length
        data_arrays.product_match[i].filter = "prod"
        result_list = result_list.concat data_arrays.product_match[i]
        i += 1
        
      max_slots = 10 #@options.numberOfMatchedManufacturers * @options.numberOfProductsPerMatchedManufacturer
      i=0
      round = 0
      which_manu = 0
      manu_length = data_arrays.manufacturer_match.length
      if manu_length > 3 #@options.numberOfMatchedManufacturers
        manu_length = 3 #@options.numberOfMatchedManufacturers
      temp_manu_array = {}
      
      if manu_length > 0
        #do a round robin for manufacturers and get the max quantity of product per manu 
        while 1
          break if i >= max_slots or round >= max_slots
          if data_arrays.manufacturer_match[which_manu].products.length is 0 and temp_manu_array[which_manu] is undefined
            temp_manu_array[which_manu] = round
            i += 1
          else if data_arrays.manufacturer_match[which_manu].products[round] isnt undefined
            temp_manu_array[which_manu] = round
            i += 1
          which_manu = which_manu + 1
          if (which_manu % manu_length) is 0
            which_manu = 0
            round += 1
      i=0
      while i < manu_length
        data_arrays.manufacturer_match[i].products = data_arrays.manufacturer_match[i].products.splice(0, parseInt(temp_manu_array[i]) + 1)
        data_arrays.manufacturer_match[i].filter = "manu"
        result_list = result_list.concat data_arrays.manufacturer_match[i]
        i++
      

      cat_length = data_arrays.category_match.length
      i = 0
      while i < cat_length and i < 3 #@options.numberOfUnmatchedManufacturersWithMatchInProductName
        # cats_length = data_arrays.category_match[i].products.length
        # if cats_length > 3 #@options.numberOfProductsOfUnmatchedManufacturersWithMatchInProductName
        #   cats_length = 3 #@options.numberOfProductsOfUnmatchedManufacturersWithMatchInProductName
        
        # data_arrays.category_match[i].products = data_arrays.category_match[i].products.splice 0, cats_length
        data_arrays.category_match[i].filter = "cat"
        result_list = result_list.concat data_arrays.category_match[i]
        i += 1
      
      ###
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
      ###
      
      return result_list
    
    makeSuggestionListFor: (query, i_should_print_them, caller_type) ->    
      return false if query isnt @currentValue
      #local variables
      # outer_productsPQ = []
      outer_productsPQ = new @PQ()
      outer_productsPQ.init(2,["starting_match","match"])
      outer_manufacturersPQ = new @PQ()
      outer_manufacturersPQ.init(2,["starting_match","match"])
      outer_categoriesPQ = new @PQ()
      outer_categoriesPQ.init(2,["starting_match","match"])
      # outer_categoriesPQ.init(0)
      # outer_topCategoriesPQ = new @PQ()
      # outer_topCategoriesPQ.init(0)
      books_array = []
      
      for manufacturer in @list_of_manufacturers
        manufacturer_name = manufacturer.n.toLowerCase()
        
        inner_productsPQ = new @PQ()
        inner_productsPQ.init(2,["starting_match","match"])
        starting_prod_match = false

        inner_manufacturersPQ = new @PQ()
        inner_manufacturersPQ.init(0)
        starting_manu_match = false
          
        manu_obj = 
          "type": "manufacturer"
          "manufacturer": manufacturer
          "products": []
        
        starting_manu_match = true if manufacturer_name.indexOf(@currentValueWords[0]) is 0
        manu_query_word_count = @queryWords(@currentValueWords, manufacturer_name)
        product_words_array = @currentValueWords.slice(manu_query_word_count)
        
        my_regexp = new RegExp(" ","ig");
        products_list = @db.get "products_of_" + manufacturer.n.replace(my_regexp,"_").toLowerCase()
        delete my_regexp
        
        for product in products_list
          my_regexp = new RegExp(manufacturer_name)
          product_name = product.n.toLowerCase().replace(my_regexp,"").trim()
          delete my_regexp
          prod_query_word_count = @queryWords(product_words_array, product_name)
          prod_query_word_count = 0 if typeof prod_query_word_count isnt "number" or prod_query_word_count < 1
          
          if manu_query_word_count > 0
            inner_manufacturersPQ.insert(product, prod_query_word_count)
            # if manufacturer_name is "vidal sassoon"
            #   console.log product_name, prod_query_word_count
            #   console.log JSON.stringify(inner_manufacturersPQ.getArray())
            
          else if manu_query_word_count is 0 and prod_query_word_count > 0
            if product_name.indexOf(product_words_array[0]) is 0
              inner_productsPQ.insert(product, prod_query_word_count, "starting_match")
            else
              inner_productsPQ.insert(product, prod_query_word_count, "match")
        
        inner_products_list_starting_match = inner_productsPQ.getArrayByLayer("starting_match", true)
        inner_products_list_match = inner_productsPQ.getArrayByLayer("match", true)
        inner_manufacturers_list = inner_manufacturersPQ.getArray()
        
        if inner_products_list_starting_match.length isnt 0
          outer_productsPQ.insert {
            "type": "manufacturer"
            "manufacturer": manufacturer
            "products": inner_products_list_starting_match
          }, inner_productsPQ.getMaxPriority("starting_match"), "starting_match"
        
        if inner_products_list_match.length isnt 0
          outer_productsPQ.insert {
            "type": "manufacturer"
            "manufacturer": manufacturer
            "products": inner_products_list_match
          }, inner_productsPQ.getMaxPriority("match"), "match"
        
        # if manu_query_word_count > 0
        #   if starting_manu_match is true
        #     layer = "starting_match"
        #   else
        #     layer = "match"
        #   if inner_manufacturers_list.length is 0
        #     inner_manufacturers_list = []
          
        #   outer_manufacturersPQ.insert({
        #     "type": "manufacturer"
        #     "manufacturer": manufacturer
        #     "products": inner_manufacturers_list
        #   }, manu_query_word_count, layer)
        
        delete inner_productsPQ
        delete inner_manufacturersPQ
      
      # for category in @list_of_categories
      #   category_name = category.n.toLowerCase()
      #   cat_query_word_count = @queryWords @currentValueWords, category_name
        
      #   if cat_query_word_count isnt 0
      #     if category_name.indexOf(@currentValueWords[0]) is 0
      #       outer_categoriesPQ.insert
      #         "type": "category"
      #         "item": category
      #       , cat_query_word_count, "starting_match"
      #     else
      #       outer_categoriesPQ.insert
      #         "type": "category"
      #         "item": category
      #       , cat_query_word_count, "match"
      
      # if @we_have_books
      #   books_array.push
      #     "type": "books"
      #     "query": query
      #   @we_have_books = false
      
      # @suggestions = @limitSuggestionResults(outer_productsPQ, outer_manufacturersPQ.getArray(), outer_categoriesPQ.getArrayByLayer("starting_match"),outer_categoriesPQ.getArrayByLayer("match"), books_array)
      @suggestions = @limitSuggestionResults {
        product_starting_match:      outer_productsPQ.getArrayByLayer("starting_match")
        product_match:               outer_productsPQ.getArrayByLayer("match")
        manufacturer_starting_match: outer_manufacturersPQ.getArrayByLayer("starting_match")
        manufacturer_match:          outer_manufacturersPQ.getArrayByLayer("match")
        category_starting_match:     outer_categoriesPQ.getArrayByLayer("starting_match")
        category_match:              outer_categoriesPQ.getArrayByLayer("match")
      }

      delete outer_productsPQ
      delete outer_manufacturersPQ
      delete outer_categoriesPQ

      if @options.caching_of_queries and caller_type is "remote"
        current_timestamp = new Date().getTime()
        @db.set "c_q_" + @currentValue,
          data: @suggestions
          timestamp: current_timestamp
        delete current_timestamp

      if i_should_print_them
        @printSuggestionList()
      return
    
    printSuggestionList: (cached_result) ->
      return if @hidden
      @suggestions_container.empty()
      
      if @options.caching_of_queries and cached_result isnt undefined
        @suggestions = cached_result.data

      fragment = document.createDocumentFragment()
      manu_label_printed = false;

      row = document.createElement "div"
      row.setAttribute "class", "r_row"
      label = document.createElement "div"
      label.setAttribute "class", "r_label"
      row.appendChild label
      
      results = document.createElement "div"
      results.setAttribute "class", "r_results"
      a = document.createElement "a"
      a.setAttribute "class", "entry"
      a.setAttribute "href", ( "/search?keyphrase=" + encodeURIComponent(@currentValue) )
      a.appendChild document.createTextNode("Αναζήτηση για " + @currentValue)
      results.appendChild a
      row.appendChild results
      fragment.appendChild row
      if @suggestions.length isnt 0
        row = document.createElement "div"
        row.setAttribute "class", "r_row"
        label = document.createElement "div"
        label.setAttribute "class", "r_label"
        label.appendChild document.createTextNode("Προϊόντα")
        row.appendChild label
        results = document.createElement "div"
        results.setAttribute "class", "r_results"
        
        for item in @suggestions
          if item.products.length > 0
            for s in item.products
              a = document.createElement "a"
              a.setAttribute "class", "entry"
              a.setAttribute "href", ( if s.u then s.u else "/search?keyphrase=" + encodeURIComponent(s.n) )
              a.appendChild document.createTextNode(s.n)
              results.appendChild a
          else
            s = item.manufacturer
            a = document.createElement "a"
            a.setAttribute "class", "entry"
            a.setAttribute "href", ( if s.u then s.u else "/search?keyphrase=" + encodeURIComponent(s.n) )
            a.appendChild document.createTextNode(s.n)
            results.appendChild a
        
        row.appendChild results
        fragment.appendChild row
        
      @suggestions_container.append(fragment);
      document.getElementById(@options.suggestionFreakContainerID).innerHTML += '';

      #had to use this or else some spans inside the a got "selected"
      me = this
      $("a.entry").mouseenter me, ->
        me.userSelectedThisItem $(this)
      
      if @options.select_first_entry
        @selected_suggest_item = $("a.entry:first").addClass("selected")
      
      @hideSpinner()
      @suggestions_container.show()
      @highlightTextAndItem()
      return 

    highlightTextAndItem: () ->
      $(".entry").each (index, element) => 
        item_name = $(element).html()
        for word, index in @currentValueWords
          if word isnt ""
            indexOfWordRegEx = new RegExp "(^" + word + ")|([ ]" + word + ")", "i"
            indexOfWord = item_name.search indexOfWordRegEx
            if indexOfWord is 0
              my_re_no_space = new RegExp("(^" + word + ")","i")
              item_name = item_name.replace(my_re_no_space, "<span class='highlight'>$&</span>")
            else if indexOfWord > 0
              my_re_space = new RegExp("([ ]" + word + ")","i")
              item_name =  item_name.replace(my_re_space, " <span class='highlight'>$&</span>")
        $(element).html(item_name)
        return
      return

    moveSelectedElement: (direction) ->
      count = $(".entry").length
      index = $(".entry").index(@selected_suggest_item) + count

      if direction is "up"
        if @selected_suggest_item is null
          @userSelectedThisItem $(".entry:last")
          return
        else
          index = (index - 1) % count
      else if direction is "down" #or direction is "right"
        if @selected_suggest_item is null
          @userSelectedThisItem $(".entry:first")
          return
        else
          index = (index + 1) % count
      
      @userSelectedThisItem $("a.entry:nth(" + index + ")")
      return
    
    #element should be a jquery selected element
    userSelectedThisItem: (element) ->
      if @selected_suggest_item isnt null
        @selected_suggest_item.removeClass("selected")
        @selected_suggest_item = null
      @selected_suggest_item = element.addClass("selected")
      return 
    
    cleanQuery: (query) ->
      return false if typeof query isnt "string"
      d = @options.delimiter
      if d
        # delimiter: /(,|;)\s*/
        arr = query.split(d)
        query = arr[arr.length - 1]
      
      #required for isForbiddenQuery() to work properly;
      if query.charAt(0) == " "
        query = query.slice(1)
      
      return query
      
    isForbiddenQuery: (query) ->
      #search for string then space (then character)+
      return true if query.search(/([ ]|[ ].)$/) isnt -1
      false
    
    hide: (user_has_requested_it) ->
      user_has_requested_it = false if user_has_requested_it is undefined
      if user_has_requested_it is true
        @hidden = true
      
      @timers_handler.end()
      @suggestions_container.hide()
      
      if user_has_requested_it is false
        @selected_suggest_item = null
        @suggestions_container.empty()
    
    showSpinner: ->
      $("#" + @options.spinnerSelectorID).show()

    hideSpinner: ->
      $("#" + @options.spinnerSelectorID).hide()
  
  ##PRIVATE STATIC METHODS
  SuggestFreak.getLocalDBObj = ->
    try
      return $.fn.storagefreak()
    catch e
      console.log "getLocalDBObj error: " + e
      return null

  SuggestFreak.initiateLocalData = () ->
    current_timestamp = new Date().getTime()
    @local_db_timestamp = @db.get("local_db_timestamp")
    
    if @local_db_timestamp isnt false
      @local_db_timestamp = parseInt @local_db_timestamp
    
    if @local_db_timestamp is false or (current_timestamp - @local_db_timestamp) > @options.localCacheTimeout
      @db.set "local_db_timestamp", new Date().getTime();
      # try
    #     $.getJSON @options.initializationDataURL, (json) => 
    #       SuggestFreak.populateLocalDB.call this, json
    #   catch e
    #     console.log "initiateLocalData error: " + e
    #     return false
    
    # @list_of_manufacturers = @db.get "list_of_m"
    # @list_of_manufacturers = [] if @list_of_manufacturers is false
    # @list_of_categories = @db.get "list_of_c"
    # @list_of_categories = [] if @list_of_categories is false
    true
  
  SuggestFreak.populateLocalDB = (json_data) ->
    @db.set "local_db_timestamp", new Date().getTime();
    for key, values_array of json_data
      @db.set "list_of_" + key, values_array
    
    @list_of_manufacturers = @db.get "list_of_m"
    @list_of_manufacturers = [] if @list_of_manufacturers is false
    @list_of_categories = @db.get "list_of_c"
    @list_of_categories = [] if @list_of_categories is false
    return 

  $.fn.suggestfreak = (options) ->
    @each ->
      $.data this, pluginName, new SuggestFreak(this, options)  unless $.data(this, pluginName)
      return
  
) jQuery, window, document
