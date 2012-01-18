((window, document)->
  window.skroutz = window.skroutz || {}
  window.skroutz.jsonp_list = window.skroutz.jsonp_list || {}
  window.skroutz.widgets = window.skroutz.widgets || {}
  window.skroutz.ie_version = -1

  if (navigator.appName == 'Microsoft Internet Explorer')
    userAgent = navigator.userAgent
    reg_exp  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})")
    if (reg_exp.exec(userAgent) != null)
      window.skroutz.ie_version = parseFloat( RegExp.$1 )
      document.getElementsByTagName('html')[0].className += " skroutz_ie"
  
  window.skroutz.helpers = window.skroutz.helpers || (->
    widget_js_base_url = "http://192.168.6.4/widgets/js/"
    widget_css_base_url = "http://192.168.6.4/widgets/css/"
    
    load = (plugin_name, params, callback) ->
      options = options || {}
      # options.crossDomain=true
      # options.pluginLoad=true
      options.params = params
      init_callback = =>
        window.skroutz.widgets[plugin_name](params)
        if callback
          callback()
    
      if plugin_name isnt undefined and typeof plugin_name is "string" and plugin_name isnt "" and !window.skroutz.widgets[plugin_name]
        options.filetype='js'
        plugin_url = plugin_name + ".js"
        plugin_url = widget_js_base_url + plugin_url if plugin_url.substr(0,7) isnt "http://"
        async_load(plugin_url,options,init_callback)
        
        options.filetype='css'
        plugin_url = plugin_name + ".css"
        plugin_url = widget_css_base_url + plugin_url if plugin_url.substr(0,7) isnt "http://"
        async_load(plugin_url,options,init_callback)
        return true
      else
        init_callback()
        return false
    
    addEvent = (event, target, method, context) ->
      if context
        my_method = (e) ->
          method.apply context, [e]
      else
        my_method = method
      
      if target.addEventListener isnt undefined
        target.addEventListener(event, my_method, false)
      else if target.attachEvent isnt undefined
        if event is "load"
          event = "readystatechange"
          my_method2 = ->
            if (this.readyState == 'complete')
              my_method()
            return
          target.attachEvent("on" + event, my_method2)
        # else
        target.attachEvent("on" + event, my_method)
      return
    
    removeEvent = (event, target, method) ->
      if target.removeEventListener isnt undefined
        target.removeEventListener(event, method, false)
      else if target.detachEvent isnt undefined
        target.detachEvent("on" + event, method)
      return

    #taken from jQuery-1.7.1 source code
    async_load = (link, options, onsuccess, onfailure) ->
      options = options || {}
      head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement
      #different behaviour for js and css files
      if options.filetype is 'js'
        new_element = document.createElement "script"
        new_element.setAttribute("type","text/javascript")
        new_element.async = "async"
        
        #create custom JSONP onsuccess handler
        if options.crossDomain and !options.pluginLoad
          jsonpCallback = "jsonp_" + (new Date()).getTime()
          
          window.skroutz.jsonp_list[jsonpCallback] = ( response ) =>
            if response 
              response.plugin_params = options.params
            onsuccess(response)
            
            #clean this shit
            window.skroutz.jsonp_list[jsonpCallback] = null
            delete window.skroutz.jsonp_list[jsonpCallback]
            return
          
          link += (if /\?/.test(link) then "&" else "?") + "callback=" + encodeURIComponent("window.skroutz.jsonp_list." + jsonpCallback)
        
        new_element.src = link
        new_element.onerror = onfailure || {}
        new_element.onload = new_element.onreadystatechange = ->
          if ( !new_element.readyState || /loaded|complete/.test( new_element.readyState ) ) 
            # Handle memory leak in IE
            new_element.onload = new_element.onreadystatechange = null;
            # Remove the new_element
            if ( head && new_element.parentNode )
              head.removeChild( new_element );
            # Dereference the new_element
            new_element = undefined;
            if onsuccess and !options.crossDomain
              onsuccess( options );
            return
      else if options.filetype is 'css'
        new_element=document.createElement "link"
        new_element.setAttribute("rel", "stylesheet")
        new_element.setAttribute("type", "text/css")
        new_element.href = link

      head.insertBefore( new_element, head.firstChild )
      return
    
    #taken from jQuery-1.7.1 source code
    # NO ERROR CHECKING
    # if crossdomain call, it calls async_load
    make_xhr = (url,params, onsuccess, onfailure) ->
      options = options || {}
      createStandardXHR = ->
        try
          return new window.XMLHttpRequest()
        
      createActiveXHR = ->
        try
          return new window.ActiveXObject( "Microsoft.XMLHTTP" )
      
      rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/
      parts = rurl.exec( url.toLowerCase() )
      ajaxLocParts = rurl.exec( location.href.toLowerCase() ) || []

      crossDomain = !!(
        parts and 
        (
          parts[1] isnt ajaxLocParts[1] or 
          parts[2] isnt ajaxLocParts[2] or 
          (
            parts[3] or 
            (if parts[1] is "http:" then 80 else 443)
          ) isnt (
            ajaxLocParts[3] or 
            (
              if ajaxLocParts[1] is "http:" then 80 else 443)
            )
          )
        )
      
      if crossDomain
        options.params = params
        options.crossDomain = true
        options.filetype='js'
        async_load(url,options,onsuccess,onfailure)
      else
        # HAVENT CHECKED THIS CODE YET
        xhr = (if window.ActiveXObject then ->
                createStandardXHR() or createActiveXHR()
              else createStandardXHR())

        xhr.open("GET", url, true); 
        xhr.onreadystatechange = (oEvent) ->
          if xhr.readyState is 4
            if xhr.status is 200
              if onsuccess
                onsuccess oEvent, xhr.responseText
              return
            else
              if onfailure
                onfailure oEvent, xhr.responseText
              return

        xhr.send(null)
        # console.log "XHR approach"
      return
    
    deep_merge_objects = (obj1,obj2) ->
      obj3 = {}
      
      merge_em = (from, to)->
        for key, value of from
          if from.hasOwnProperty(key)
            if typeof value is "object"
              to[key] = to[key] || {}
              merge_em value, to[key]
            else
              to[key] = value
        return
      
      merge_em obj1, obj3
      merge_em obj2, obj3
      return obj3
    
    return {
      load_widget: load
      addEvent: addEvent
      removeEvent: removeEvent
      make_xhr: make_xhr
      deep_merge_objects: deep_merge_objects
    }
    
  )()
  
  window.skroutz.load_widget = window.skroutz.load_widget || window.skroutz.helpers.load_widget
  return
) window, document