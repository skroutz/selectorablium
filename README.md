skroutz: Selectorablium
====================

A "chosen" like jQuery plugin for rich <select> experience 
---------------------

For it to work, it requires two things

> ##attributes on the select element
>  class="selectorablium"
>  data-url="/earth/manufacturers.json"
>  data-query="query"
>  data-name="manufacturers"
>  data-default_value=""
>  data-default_text="Διάλεξε manufacturer"
>  data-selected_id="5"
>  name="manufacturer_id"
> ##Javascript call
>  $("select.selectorablium").Selectorablium({
>    app_name : "name_to_separate_the_local_storage_instances"
>  })