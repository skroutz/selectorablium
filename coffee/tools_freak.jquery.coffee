(($, window, document) ->
  ##NEEDED FOR OLD EXPLORERS
  unless Array::indexOf
    Array::indexOf = (searchElement) ->
      "use strict"
      if (this is undefined || this is null)
        throw new TypeError()
      
      t = Object(this)
      len = t.length >>> 0
      
      if (len is 0)
        return -1
      
      n = 0
      if (arguments.length > 0)
        n = Number(arguments[1])
        if (n isnt n) # shortcut for verifying if it's NaN  
          n = 0
        else if (n isnt 0 and n isnt Infinity and n isnt -Infinity)
          n = (n > 0 || -1) * Math.floor(Math.abs(n))
      if (n >= len)
        return -1 
      k = (if n >= 0 then n else Math.max(len - Math.abs(n), 0))
      while k < len
        return k  if k of t and t[k] is searchElement
        k++
      return -1
  
  # ##PRIVATE METHODS
  # priorityQueue = ->
  #   #make sure always return a new priorityQueue object
  #   if this instanceof priorityQueue is false
  #     return new priorityQueue()
    
  #   #private instance variable
  #   priorityArray = []
  #   layers_array_length = 0;
  #   ordered_layers_names_array = []
  #   inited = false

  #   init = (layers_number, ordered_layers_names) ->
  #     return false if inited is true
  #     return false if layers_number is undefined 
  #     return false if typeof(layers_number) isnt "number"
      
  #     if layers_number isnt 0
  #       return false if ordered_layers_names is undefined
  #       return false if ordered_layers_names.constructor isnt Array
  #       return false if layers_number isnt ordered_layers_names.length
  #     else
  #       layers_number = 1
  #       ordered_layers_names = ["unique"]
      
  #     i = 0
  #     while i < layers_number
  #       priorityArray.push 
  #         number: i
  #         name: ordered_layers_names[i]
  #         data: []
  #       i += 1
      
  #     layers_array_length = layers_number
  #     ordered_layers_names_array = ordered_layers_names
  #     inited = true

  #     return true
    
  #   insert = (obj, priority, layer) ->
  #     return false if inited is false
  #     return false if typeof priority isnt "number"
  #     return false if typeof obj is "string" and obj is "" 
  #     return false if typeof obj is "object" and $.isEmptyObject(obj) is true
      
  #     #prepare layer
  #     layer = 0 if layer is undefined
  #     return false if layer > layers_array_length - 1
  #     if typeof layer isnt "number"
  #       layer = ordered_layers_names_array.indexOf layer        
  #     return false if layer is -1

  #     i = 0
  #     l = priorityArray[layer].data.length
      
  #     priority = priority + 1
  #     while( i <= l && priority <= ((priorityArray[layer].data[i] || {"priority": Infinity}).priority || Infinity) )
  #       i++
      
  #     priorityArray[layer].data.splice(i, 0, {"obj": obj, "priority": priority})
  #     return true
    
  #   getArrayByLayer = (layer, only_max_priority) ->
  #     return false if inited is false
  #     return false if typeof layer isnt "string" and typeof layer isnt "number"
  #     return false if typeof layer is "string" and layer is ""
  #     only_max_priority = false if only_max_priority is undefined

  #     if typeof layer is "string"
  #       layer = ordered_layers_names_array.indexOf layer        
  #     return false if typeof layer is "number" and layer > layers_array_length - 1
  #     return false if layer < 0
      
  #     result = []
  #     for layer_item in priorityArray
  #       continue if layer_item.number isnt layer
  #       if only_max_priority and layer_item.data.length > 0
  #         max_layer_priority = layer_item.data[0].priority
  #       for data_item in layer_item.data
  #         if only_max_priority
  #           if data_item.priority < max_layer_priority
  #             continue
  #         result.push data_item.obj
  #     return result      

  #   getMaxPriority = (layer) -> 
  #     return false if inited is false
  #     return false if typeof layer isnt "string" and typeof layer isnt "number"
  #     return false if typeof layer is "string" and layer is ""
      
  #     if typeof layer is "string"
  #       layer = ordered_layers_names_array.indexOf layer        
  #     return false if typeof layer is "number" and layer > layers_array_length - 1
  #     return false if layer < 0
      
  #     max_layer_priority = 0

  #     for layer_item in priorityArray
  #       continue if layer_item.number isnt layer
  #       if layer_item.data.length > 0
  #         max_layer_priority = (layer_item.data[0].priority - 1)
        
  #     return max_layer_priority
    
  #   getArray = (only_max_priority) ->
  #     return false if inited is false
  #     only_max_priority = false if only_max_priority is undefined
  #     result = []
  #     max_layer_priority = 0
  #     for layer_item in priorityArray
  #       if only_max_priority and layer_item.data.length > 0
  #         max_layer_priority = layer_item.data[0].priority

  #       for data_item in layer_item.data
  #         if only_max_priority
  #           if data_item.priority < max_layer_priority
  #             continue
  #         result.push data_item.obj
  #     return result
    
  #   #return the public API
  #   return {
  #     init: init
  #     insert:insert
  #     getArray:getArray
  #     getArrayByLayer:getArrayByLayer
  #     getMaxPriority:getMaxPriority
  #   }
      
  # queryWordMatchesInText = (query, text) ->
  #   return false if query is undefined or text is undefined

  #   if typeof query is "string"
  #     query = query.split(" ")
  #   if typeof text is "string"
  #     text = text.split(" ")
  #   # console.log "|" + query[0] + "|", "|" + text[0] + "|"
  #   return false if query.length is 0 or text.length is 0

  #   result = 0
  #   inner_match = true
    
  #   for query_word in query
  #     break if inner_match is false
  #     query_word = query_word.trim()
  #     continue if query_word is ""
  #     inner_match = false
  #     l = text.length
  #     i=0
  #     while i < l
  #       if text[i].indexOf(query_word) is 0
  #         result += 1
  #         text = text.slice i + 1
  #         inner_match = true
  #         break
  #       i++
  #   result

  # ##based upon http://www.shamasis.net/2009/09/fast-algorithm-to-find-unique-items-in-javascript-array/
  # filterUnique = (array,unique_property) ->
  #   return [] if array is undefined or array.constructor isnt Array
  #   return [] if array.length is 0
  #   return [] if array[0] is null
  #   if typeof array[0] isnt "number" and array[0].constructor is Object
  #     return [] if typeof unique_property isnt "string" or unique_property is ""
  #     return [] if array[0][unique_property] is undefined 
    
  #   o = {}
  #   l = array.length
  #   i = 0
  #   r = []
  #   while i<l
  #     if array[i].constructor is Object 
  #       if array[i][unique_property] isnt undefined
  #         o[JSON.stringify array[i][unique_property]] = array[i]
  #     else
  #       o[array[i]] = array[i]
  #     i++
  #   for i of o
  #     r.push(o[i])
  #   return r
  
  # concatSliceUnique = (array_front, array_back, start, end, wants_unique) ->
    # return false if array_front is undefined or (array_front isnt false and array_front.constructor isnt Array)
    # return false if array_back is undefined or (array_back isnt false and array_back.constructor isnt Array)
    # return false if start is undefined or typeof start isnt "number"
    # return false if end is undefined or typeof end isnt "number"
    # return false if wants_unique isnt undefined and typeof wants_unique isnt "boolean"

    # wants_unique = false if wants_unique is undefined

    # updated_array = []
    # array_front = [] if array_front is false
    # array_back = [] if array_back is false
    # updated_array = array_front.concat array_back
    # return [] if updated_array.length is 0
    
    
    # if wants_unique
    #   result = filterUnique( updated_array,"n" ).slice start, end
    # else
    #   result =  updated_array.slice start, end
    # result = [] if result is false
    # return result
  
  ##taken from http://noteslog.com/post/how-to-fix-the-resize-event-in-ie/
  wresize = (callback) ->
    @wresize_vars =
      fired: false
      width: 0

    @resizeOnce = -> 
      if $.browser.msie
        if @wresize_vars.fired is false
          @wresize_vars.fired = true
        else
          version = parseInt( $.browser.version, 10 )
          @wresize_vars.fired = false
          if version < 7
            return false
          else if version is 7 
            #a vertical resize is fired once, an horizontal resize twice 
            width = $(window).width()
            if width isnt @wresize_vars.width
              @wresize_vars.width = width
              return false
      return true
    
    @handleWResize = (e) =>
      if @resizeOnce() is true
        return callback.apply this, [e]
      return

    $(window).resize @handleWResize

    return

  timers_handler = ->
    list_of_timers = {}
    default_timer = "default_timer"

    endAndStart = (callback, time, named_timer) ->
      return false if callback is undefined
      return false if time is undefined
      
      timer = default_timer
      timer = named_timer if named_timer isnt undefined
        
      if list_of_timers[timer] isnt undefined
        window.clearTimeout(list_of_timers[timer])
      
      list_of_timers[timer] = window.setTimeout ->
        callback()
      , time
      return true
    
    end = (named_timer) ->
      timer = default_timer
      timer = named_timer if named_timer isnt undefined
      return false if list_of_timers[timer] is undefined
      window.clearTimeout(list_of_timers[timer])
      return true
    
    return {
      endAndStart: endAndStart
      end: end
      list: list_of_timers
    }
    
  error_function = (message, where)->
    message = "Error( " + where + " '" + message + "' )"

    try 
      console.log message
    catch e
      alert message

    return true
  
  ##REGISTER TO THE jQUERY fn LIST
  ##REVEALED MODULE style
  $.fn.toolsfreak = 
    # priorityQueue: priorityQueue
    # filterUnique: filterUnique
    # queryWordMatchesInText: queryWordMatchesInText
    # concatSliceUnique: concatSliceUnique
    wresize: wresize
    timers_handler: timers_handler
    error_func: error_function
) jQuery, window, document
