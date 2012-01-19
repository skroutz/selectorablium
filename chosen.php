<!DOCTYPE html>
<html>
  <head>
    <meta charset='UTF-8'>
    <link type="text/css" href="css/ui-lightness/jquery-ui-1.8.16.custom.css" rel="stylesheet" /> 
    <link href="css/bootstrap.min.css" rel="stylesheet" type="text/css" media="all" />
    <link href="css/chosen.css" rel="stylesheet" type="text/css" media="all" />
    <link href="css/style.css" rel="stylesheet" type="text/css" media="all" />
    
    <!--[if IE]>
      <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

    <script type="text/javascript" src="js/jquery-1.7.1.min.js"></script>
    <script type="text/javascript" src="js/jquery-ui-1.8.17.custom.min.js"></script>
    <script type="text/javascript" src="js/chosen.jquery.js"></script>
    <script type="text/javascript" src="js/storage_freak.js"></script>
    <script type="text/javascript" src="js/website.js"></script>
    <script type="text/javascript" src="js/skroutz_loader.js"></script>
  </head>  
  <body>
    <?php 
      echo '<pre id="debugging_pre">';
      echo '$SESSION=<br>';
      print_r($_SESSION);
      echo '$REQUEST=<br>';
      print_r($_REQUEST);
      echo '</pre>';
    ?>
    <form target="" action="" method="get">
      <div id="input_cont">
        <select id="chosen_default" name="bibi">
          <option value="123">Volvo</option>
          <option value="234">Saab</option>
          <option value="345">Mercedes</option>
          <option value="456" selected>Audi</option>
        </select>
        <input name="mimi">
      </div>
      <button type="submit" class="btn">Submit</button>
    </form>
  </body>
</html>
