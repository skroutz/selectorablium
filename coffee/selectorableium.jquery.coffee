( ($, window, document) ->
  ##PRIVATE PROPERTIES
  pluginName = "Selectorableium"
  defaults   =
    minCharsForRemoteSearch    : 2
    baseUrl                    : "/earth/"
    # http://192.168.6.56:3002/earth/shops.json?query=pla
    localCacheTimeout          : 7 * 24 * 60 * 60 * 1000 #milliseconds #one week
    XHRTimeout                 : 1200 #milliseconds
    maxResultsNum              : 10
  
  Selectorableium = (element, options) ->
    return false unless $.fn.toolsfreak
    return false unless $.fn.storagefreak
    @timers_func        = $.fn.toolsfreak.timers_handler()
    window.b            = @timers_func
    #
      # @PQ_func = $.fn.toolsfreak.priorityQueue
      # @queryWords_func = $.fn.toolsfreak.queryWordMatchesInText
      # @unique_func = $.fn.toolsfreak.filterUnique
      # @concatSliceUnique_func = $.fn.toolsfreak.concatSliceUnique
      # @wresize_func = $.fn.toolsfreak.wresize

    @el                 = $(element).attr("autocomplete", "off")
    @options            = $.extend {}, defaults, options

    if !@options.instance_name or @options.instance_name is ""
      @__error 'objectCreation', "no instance_name specified on params"
      return false

    @db                 = null
    @db_prefix          = "skr." + @options.instance_name + "."
    
    @el_container       = null
    @el_top             = null
    @el_inner_container = null
    @el_input           = null
    @el_list_cont       = null
    
    @query              = ""
    @queryLength        = ""
    
    @data               = null
    @result_list        = null
    @selected_item      = null
    @items_list         = null
    #
      # @suggestions_container = ""
      # @last_invalid_query = null
      # #default stuff
      # @_defaults = defaults
      # @_name = pluginName
      # ##custom stuff
      # @query = ""
      # @queryLength = ""
      # @queryWords = []
      # @queryWordsLength = 0
      # @we_have_books = false
      # @suggestions = []
      # @hidden = false

      # @serviceUrl = @options.serviceUrl
      # ## under this the suggestion list is appended each time
      # #local DB object
      # ##used for localDB cache
      # @local_db_timestamp = null
      # ##used to revert from text substitution from change "select" events
      # @selected_suggest_item = null
      # @list_of_manufacturers = []
      # @list_of_categories = []
      
      # @PQ = null
      # @queryWords = null
      # @unique = null
      # @concatSliceUnique = null
      # @wresize = null
      # @timers_handler = null
    
    @init()
    
    return

  Selectorableium:: =
    name     : pluginName
    defaults : defaults
    
    init: ->
      @makeDbPreparation()
      @createHtmlElements()
      @registerEventHandlers()
      return
    
    makeDbPreparation: ->
      @db = Selectorableium.getLocalDBObj()
      Selectorableium.initiateLocalData.call this
      return

    createHtmlElements: ->
      @el_container = $('<div class="selectorableium_cont">').css
        width     : @el.outerWidth()
        minHeight : @el.outerHeight()
      
      @el_container.append('<div class="top"></div><div class="inner_container clearfix"><form><input name="var_name"></form><ul class="list_container"></ul></div>')
      
      @el_top             = @el_container.find(".top").css 'height', @el.outerHeight(true)
      @el_inner_container = @el_container.find(".inner_container")
      @el_input           = @el_container.find("input").attr("autocomplete", "off")
      @el_list_cont       = @el_container.find(".list_container")

      @el.parent().css('position','relative').append @el_container
      return

    registerEventHandlers: ->
      @el_top.on 'click', (e) =>
        if @el_inner_container.is(":visible")
          @hide()
        else
          @el_inner_container.slideDown(200)
        
        @el_input.focus()

        return
      
      @el_container.on 'click', (e)->
        e.stopPropagation()
        # return false
      
      $("html").on 'click', (e)=>
        @hide()
        return

      if window.opera or $.browser.mozilla
        @el_input.on 'keypress', (e) =>
          @onKeyPress e
      else
        @el_input.on 'keydown', (e) =>
          @onKeyPress e
      
      @el_input.on 'keyup', (e) =>
        @onKeyUp e
      
      return
    
    hide: ->
      if @el_inner_container.is(":visible")
        @el_inner_container.slideUp(200)
        @el_input.val("")
        @el_list_cont.empty()
      return

    onKeyPress: (e) ->
      console.log "KeyPress:", e.keyCode
      switch e.keyCode
        when 27 #esc
          @hide()
        when 38 #up
          @moveSelectedElement("up")
          return false
        when 40 #down
          @moveSelectedElement("down")
          return false
        when 13 #enter
          @activateTheSelectedItem()
          return false
          # if @selected_suggest_item isnt null and @suggestions_container.is(":visible")
          #   @el.parents("form").attr( "action", @selected_suggest_item.attr("href") )
          return true
        when 37 #left
          return true
        when 39 #right
          return true
        when 8 #backspace
          return true
        else
          return
        
      e.stopImmediatePropagation()
      e.preventDefault()
      return
    
    onKeyUp: (e) ->
      console.log "KeyUp:", e.keyCode
      switch e.keyCode
        #KEYS SHIFT, CTRL, LEFT, UP, RIGHT, DOWN, ESC, ENTER
        when 16, 17, 37, 38, 39, 40, 27, 13
          return false
      
      @query = @el_input.val().trim()
      @queryLength = @query.length

      @beginLocalSearchFor @query
      if @queryLength >= @options.minCharsForRemoteSearch #and @query.indexOf(@last_invalid_query) is -1
        @timers_func.endAndStart =>
            @beginRemoteSearchFor @query
            return
          , @options.XHRTimeout
          ,"RemoteSearchTimeout"
            
      return false
    
    beginLocalSearchFor: (query) ->
      @makeSuggestionListFor query
      return
    
    beginRemoteSearchFor: (query) ->
      console.log "REMOTE FOR: " + query
      # @showSpinner()
      # @options.params.keyphrase = query
      # $.getJSON @serviceUrl, @options.params, (response_data) =>
      #   if response_data.length isnt 0
      #     @updateLocalDB(response_data)
      #     @makeSuggestionListFor(query, true, "remote")
      #     @last_invalid_query = null
      #   else
      #     @last_invalid_query = query
      #   @hideSpinner()
      return
    
    makeSuggestionListFor: (query) ->
      result_list = []
      lowerQuery = query.toLowerCase()
      for value in @data
        ## TODO convert it to REXEXP.test
        result_list.push(value) if value.name.toLowerCase().indexOf(lowerQuery) isnt -1
      @result_list = result_list.slice 0, @options.maxResultsNum
      
      @printSuggestionList(query)
      return
    
    printSuggestionList: (cached_result) ->
      @el_list_cont.empty()

      fragment = document.createDocumentFragment()
      for item in @result_list
        li = document.createElement "li"
        a = document.createElement "a"
        a.className = "item"
        a.setAttribute "data-value", item.id
        a.setAttribute "href", "#"
        a.appendChild document.createTextNode item.name
        li.appendChild a
        fragment.appendChild li
      @el_list_cont.append fragment
      @el_list_cont[0].innerHTML += ''
      
      @items_list = @el_list_cont.find(".item")

      me = this
      @items_list.on 'mouseenter', {me}, ->
        me.selectThisItem $(this)
      @items_list.on 'click', {me}, ->
        console.log me, "here"
        me.activateTheSelectedItem()
      
      @selected_item = @el_list_cont.find(".item:first").addClass("selected")
      
      @highlightTextAndItem()
      return 

    highlightTextAndItem: () ->
      if @query isnt ""
        @items_list.each (index, element) => 
          item_name = $(element).html()
          if @query isnt ""
            regEXP = new RegExp "(" + @query + ")", "ig"
            item_name = item_name.replace(regEXP, "<span class='highlight'>$1</span>")
          $(element).html(item_name)
          return
        
      return
    
    activateTheSelectedItem: () ->
      @el.html('<option value="' + @selected_item.data("value") + '">' + @selected_item.text() + '</option>')
      @hide()
      return false

    selectThisItem: (element) ->
      if @selected_item isnt null
        @selected_item.removeClass("selected")
        @selected_item = null
      
      @selected_item = element.addClass("selected")
      return 
    
    moveSelectedElement: (direction) ->
      count = @items_list.length
      index = @items_list.index(@selected_item) + count
      
      if direction is "up"
        custom_index = index - 1
      else if direction is "down"
        custom_index = index + 1
      index = custom_index % count

      @selectThisItem @items_list.filter(".item:nth(" + index + ")")
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
    
    #element should be a jquery selected element
    
    fix_container_location: ->
      offset        = @el.offset()
      elOuterHeight = @el.outerHeight()
      minWidth      = @el.outerWidth()
      minWidth      = @options.minWidth if @options.minWidth > @el.outerWidth()

      @suggestions_container.css
        top: (offset.top + elOuterHeight) + "px"
        left: offset.left + "px"
        minWidth: minWidth

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
    
    # hide: (user_has_requested_it) ->
    #   user_has_requested_it = false if user_has_requested_it is undefined
    #   if user_has_requested_it is true
    #     @hidden = true
      
    #   @timers_handler.end()
    #   @suggestions_container.hide()
      
    #   if user_has_requested_it is false
    #     @selected_suggest_item = null
    #     @suggestions_container.empty()
    
    showSpinner: ->
      $("#" + @options.spinnerSelectorID).show()

    hideSpinner: ->
      $("#" + @options.spinnerSelectorID).hide()
    
    __dbGet: (name)->
      return @db.get @db_prefix + name

    __dbSet: (name, data)->
      return @db.set( @db_prefix + name, data )
    
    __error: (message, func_name) ->
      if func_name
        x = message
        message = func_name
        func_name = x
      
      name = (if @options.instance_name then @options.instance_name else "[" + @name + "]" )
      where = "@" + name + ":"
      if func_name
        where = func_name + where
      
      $.fn.toolsfreak.error_func message, where

      return
  
  ##PRIVATE STATIC METHODS
  Selectorableium.getLocalDBObj = ->
    try
      return $.fn.storagefreak()
    catch e
      @__error 'getLocalDBObj', "could not get StorageFreak object"
      return null

  Selectorableium.initiateLocalData = () ->
    current_timestamp = new Date().getTime()
    @local_db_timestamp = @__dbGet "timestamp"
    
    if @local_db_timestamp isnt false
      @local_db_timestamp = parseInt @local_db_timestamp, 10
    
    if @local_db_timestamp is false or (current_timestamp - @local_db_timestamp) > @options.localCacheTimeout
      try
        $.ajax
          url: @options.baseUrl + @options.data_name + ".json"
          type: "get"
          dataType: "json"
          success: (data)=>
            @__dbSet "timestamp", new Date().getTime()
            @__dbSet @options.data_name + "_data", data
            return
          error: (a,b,c)=>
            @__error 'initiateLocalData', "XHR error"
            return
      catch e
        @__error 'initiateLocalData', "catched XHR error"
        return false
    
    @data = @__dbGet @options.data_name + "_data"
    
    return

  $.fn.Selectorableium = (options) ->
    @each ->
      $.data this, pluginName, new Selectorableium(this, options)  unless $.data(this, pluginName)
      return
    
    return
  
  return
) jQuery, window, document
