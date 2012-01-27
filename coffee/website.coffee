##
##ONDOMREADY START
$(->
  ###INVOKE THE SELECTORABLIUM PLUGIN###
  $("select.selectorablium").Selectorablium
    app_name : "selectorablium_dev"
  
  ###SET THE ONRESET EVENT HANDLERS FOR THE SELECTORABLIUMS###
  $("[type=reset]").on 'click', ->
    my_selectorabliums = $(this).parents('form').find('.selectorablium')
    my_selectorabliums.each ->
      $(this).data('selectorablium').resetSelectItem()
      return
    return
  
  ###SET UP THE CUSTOM SETTERS FOR THE SELECTORABLIUMS###
  $("#eshop_setter").on 'click', (e)->
    e.stopPropagation()
    my_obj = $(".selectorablium:nth(0)").data("selectorablium")
    my_obj.setSelectItem
      value: 9999
      text: "niamaniaima"
    
    return false
  $("#manufacturer_setter").on 'click', (e)->
    e.stopPropagation()
    my_obj = $(".selectorablium:nth(1)").data("selectorablium")
    my_obj.setSelectItem
      value: 123123123
      text: "ZZZZZZZZ"

    return false
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
