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
  
  ###MANUALY SET VALUE FOR SELECT BY PASSING ID ONLY. 
  IF IT DOESNT EXIST ON LOCALSTORAGE, IT RETURNS FALSE###
  window.a = $(".selectorablium:nth(0)").data("selectorablium")
  # a.setSelectItem(3)


  ###SET UP THE CUSTOM SETTERS FOR THE SELECTORABLIUMS###
  $("#eshop_setter").on 'click', (e)->
    e.stopPropagation()
    window.a = $(".selectorablium:nth(0)").data("selectorablium")
    window.a.setSelectItem
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
