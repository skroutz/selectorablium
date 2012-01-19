#remove layerX and layerY event jQuery error
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
    serviceUrl: "http://www.skroutz.gr/suggest"
    caching_of_queries: true
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
    ##local DB object
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
          e.stopImmediatePropagation()
          e.preventDefault()
          if @selected_suggest_item isnt null and @suggestions_container.is(":visible") #and @selected_suggest_item.text() isnt @suggestions_container.find(".entry:first").text()
            if @selected_suggest_item.text() isnt @suggestions_container.find(".entry:first").text()
              search_value = @selected_suggest_item.attr("href")
              if( search_value.indexOf("/search?keyphrase=") is 0 )
                search_value = search_value.replace("/search?keyphrase=","")
                @el.val( decodeURIComponent(search_value) )
              else
                @el.parents("form").attr( "action", @selected_suggest_item.attr("href") )
          @el.parents("form").submit()
          return false

        else
          return
        
      e.stopImmediatePropagation()
      e.preventDefault()
      return

    onKeyUp: (e) ->
      switch e.keyCode
        #KEYS SHIFT, CTRL, LEFT, UP, RIGHT, DOWN, ESC, ENTER
        when 16, 17, 37, 38, 39, 40, 27, 13
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
          # @beginLocalSearch(@currentValue)
          if @currentValueLength >= @options.minCharsForRemoteSearch and  @currentValue.indexOf(@last_invalid_query) is -1
            @timers_handler.endAndStart =>
              @beginRemoteSearch(@currentValue)
            , @options.XHRTimeout
          else
            @printSuggestionList()
          
        delete current_timestamp
      
      return false
    
    beginRemoteSearch: (query) ->
      @showSpinner()
      @options.params.keyphrase = query
      $.getJSON @serviceUrl, @options.params, (response_data) =>
        if response_data.length isnt 0
          @suggestions = response_data
          if @options.caching_of_queries
            current_timestamp = new Date().getTime()
            @db.set "c_q_" + @currentValue,
              data: @suggestions
              timestamp: current_timestamp
            delete current_timestamp
          @last_invalid_query = null
        else
          @suggestions = []
          @last_invalid_query = query
        
        @hideSpinner()
        @printSuggestionList()
      return
    
    printSuggestionList: (cached_result) ->
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
      
      console.log @suggestions

      if @suggestions.length isnt 0
        latest_label = ""
        for item in @suggestions
          if item.t isnt latest_label
            if latest_label isnt ""
              row.appendChild results
              fragment.appendChild row
            latest_label = item.t
            row = document.createElement "div"
            row.setAttribute "class", "r_row"
            label = document.createElement "div"
            label.setAttribute "class", "r_label"
            
            if item.t is "k"
              label.appendChild document.createTextNode("ΠΡΟΙΟΝΤΑ")
            else if item.t is "b"
              label.appendChild document.createTextNode("ΒΙΒΛΙΑ")
              item.n = "Αναζήτηση για βιβλία"
            else if item.t is "s"
              label.appendChild document.createTextNode("ΚΑΤΑΣΤΗΜΑΤΑ")
            else if item.t is "c"
              label.appendChild document.createTextNode("ΚΑΤΗΓΟΡΙΕΣ")
            row.appendChild label
            results = document.createElement "div"
            results.setAttribute "class", "r_results"
              

          a = document.createElement "a"
          a.setAttribute "class", "entry"
          if item.t is "b"
            a.setAttribute "href", ( "/search?keyphrase=" + encodeURIComponent(@currentValue) )
          else
            a.setAttribute "href", ( if item.u then item.u else "/search?keyphrase=" + encodeURIComponent(item.n) )
          a.appendChild document.createTextNode(item.n)
          results.appendChild a
        
        row.appendChild results
        fragment.appendChild row
        
      @suggestions_container.append(fragment);
      document.getElementById(@options.suggestionFreakContainerID).innerHTML += '';

      #had to use 'me = this' or else some spans inside the a got "selected"
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
      else if direction is "down"
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
        arr = query.split(d)
        query = arr[arr.length - 1]
      
      #required for isForbiddenQuery() to work properly;
      # if query.charAt(0) == " "
      #   query = query.slice(1)
      
      return jQuery.trim( query )
      
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
    return true
  
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
