##
##ONDOMREADY START
$(->
  $("select.selectorablium").Selectorablium
    app_name      : "selectorablium_dev"
  
  window.a = $("select.selectorablium").data("selectorablium")
  return
)
##ONDOMREADY END
##

##
##ONWINDOWLOAD START
$(window).load ->
  
  return
##ONWINDOWLOAD END
##
