SKROUTZ SELECTORABLIUM
====================

***A "chosen.js" like jQuery plugin for a richer `<select>` experience***

On plugin load, it loads via XHR the initial data and stores them into the localstorage.
It then searches the localstorage, prints sorts, and highlights the results.

If the length of the query is more than a threshold value, it makes an XHR and adds the new data (if any) to the local storage and then it displays them.

It is tested with more than 10.000 items stored in the localstorage, with the responce time while searching being < 50ms.

##HOWTO

The `<select>` elements should have no options hardcoded.

So in order for the plugin to load two things must be configured.

1. The `<select>` tag must have some **data-**attibutes
2. Javascript invocation with an argument for the localstorage namespacing

###1) `<select>` attibutes

* data-url = "url/from/where/the/data/will/come.json"
* data-query = "string_that_will_be_appended_as_a_get_param"
* data-name = "string_for_ddifferentiation_inside_a_namespaced_group"
* data-default_value = "string_value_for_the_default_and_reseted_option_element"
* data-default_text = "string_text_for_the_default_and_reseted_option_element"
* data-selected_id = "string_id_for_preselected_option"

###2) Javascript invocation

just include the following

`$("select.selectorablium").Selectorablium({app_name : "mpla_mpla"})`

'app_name' is the var that will be used for namespacing

##DATA NAMESPACING
The namespacing scheme is designed so that multiple selectorablium groups can be present in the same page.

It is implemented in the form of 
**"skr" + app_name + ".selectorablium." + data-name + "." + attributes**

* **app_name** is the param passed during the javascript invocation
* **data-name** is an attribute on the element equivalent to the [name] attribute
* **attributes** will be either 'data' or 'timestamp'

They are grouped by the **app_name** during the javascript invocation and further differentiation inside the group can be made by **data-name**.

##Authors
Bill Trikalinos

* [https://github.com/basiloungas](https://github.com/basiloungas)