define [
  'jquery'
  'shims/local_storage_shim'
], ($, LocalStorageShim)->
  # TODO ADD JSON2 SHIM
  #jQuery Stuff
  # $.getScript "assets/json2.js" if StorageFreak.JSON_support() is false

  class StorageFreak
    _defaults:
      namespace  : 'selectorablium'
      sort_func  : (a,b)-> if a.name < b.name then -1 else 1
      match_func : (RE, name)->
        result = RE.test(name)
        RE.lastIndex = 0
        return result

    _required: [
      'url'
      'name'
      'query'
      'app_name'
      'XHRTimeout'
      'maxResultsNum'
      'localCacheTimeout'
      'minCharsForRemoteSearch'
      'list_of_replacable_chars'
    ]

    constructor: (options)->
      return new StorageFreak(options) if @ instanceof StorageFreak is false

      @options = options
      @config  = $.extend {}, @_defaults, @options
      for attr in @_required
        throw new Error("'#{attr}' option is required") if !@config[attr]

      @_db_prefix = "#{@config.namespace}.#{@config.app_name}"
      @_data_key      = "#{@config.name}_data"
      @_timestamp_key = "#{@config.name}_timestamp"

      @_data = {}
      @_events = {}
      @timeout = null
      @XHR_dfd = null

      @_storage = @_getStorage()

    on: (event_name, callback, context = null)->
      @_events[event_name] ?= []
      @_events[event_name].push
        callback: callback
        context: context

    init: ->
      if @_isInvalidData()
        return @_getRemoteData '', {event_name: 'dbcreate'}
      else
        @_data = @_get @_data_key
        return new $.Deferred().resolve()

    add: (key, value)->
      return if @_data[key]
      new_data = {}
      new_data[key] = value
      @_data = $.extend {}, @_data, new_data
      @_updateDB @_data

    searchByKey: (key)-> @_data[key] or false

    ###*
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
    ###
    search: (query, options = {})->
      results = @_searchData(query, options)
      @_trigger 'dbsearch_results', results, query

      @_resetRemote()
      if query.length >= @config.minCharsForRemoteSearch
        @_trigger 'dbremote_search_in', @config.XHRTimeout
        @timeout = setTimeout (=>
          @_getRemoteData(query, options).then =>
            results = @_searchData(query, options)
            @_trigger 'dbsearch_results', results, query, 'xhr'
        ), @config.XHRTimeout

    cleanup: -> @_resetRemote()

    _resetRemote: ->
      @_trigger 'dbremote_search_reset'
      @timeout and clearTimeout(@timeout)
      @XHR_dfd and @XHR_dfd.abort?()

    _searchData: (query, options)->
      results = []
      match_func = options.match_func or @config.match_func
      sort_func  = options.sort_func or @config.sort_func

      re = @_createAccentIndependentRE(query)
      for id, name of @_data
        results.push({id: id, name: name}) if match_func(re, name)

      results = results.sort sort_func
      results.slice 0, @config.maxResultsNum

    _getRemoteData: (query, options)->
      @_trigger "#{options.event_name or 'dbremote_search'}_start"

      dfd = new $.Deferred()

      params = {}
      if query
        query_param = options.query or @config.query
        params[query_param] = query

      @XHR_dfd = $.getJSON(options.url or @config.url, params)
      @XHR_dfd.then (json_data)=>
        @_getRemoteSuccess(json_data, dfd, options)
      , (xhr)=>
        @_getRemoteError(xhr, dfd, options)

      dfd

    _getRemoteSuccess: (json_data, dfd, options)->
      @_data = $.extend {}, @_data, @_parseResponseData(json_data)
      @_updateDB(@_data)

      @_trigger "#{options.event_name or 'dbremote_search'}_end"

      dfd.resolve()

    _getRemoteError: (xhr, dfd, options)->
      @_trigger "#{options.event_name or 'dbremote_search'}_error", xhr
      dfd.reject(xhr)

    _getStorage: -> if localStorage then localStorage else new LocalStorageShim()

    _trigger: (event_name, data...)->
      return unless @_events[event_name]

      ## TODO REPLACE WITH DEFERREDS
      # while entry = @_events[event_name].shift()
      for entry in @_events[event_name]
        context = entry.context or null
        entry.callback.apply context, data

    _isInvalidData: ->
      ts    = new Date().getTime()
      db_ts = @_get @_timestamp_key
      db_ts = parseInt(db_ts, 10) if db_ts
      db_ts is false or (ts - db_ts) > @config.localCacheTimeout

    _parseResponseData: (json_data)->
      result = {}
      result[item.id] = item.name for item in json_data
      return result

    _updateDB: (data)->
      @_set @_data_key, data
      @_set @_timestamp_key, new Date().getTime()
      @_trigger 'dbupdated'

    _createAccentIndependentRE: (query)->
      for value in @config.list_of_replacable_chars
        re = new RegExp "#{value[0]}|#{value[1]}", 'ig'
        query = query.replace re, "(?:#{value[0]}|#{value[1]})"

      re = null
      return new RegExp "#{query}", 'ig'

    ## REFACTOR THOSE
    ## MAYBE REMOVE THOSE??
    _get: (key) ->
      return false if typeof key isnt 'string' or key is ''
      key = "#{@_db_prefix}.#{key}"
      try
        value = JSON.parse @_storage.getItem(key)
      catch
        return false

      if value is null or value is '' then false else value

    _set: (key, value) ->
      return false if typeof key isnt 'string' or key is ''
      return false if value is null or value is undefined
      key = "#{@_db_prefix}.#{key}"
      try
        @_storage.setItem key, JSON.stringify(value)
      catch
        return false

      true

  return StorageFreak
