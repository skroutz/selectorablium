fs     = require 'fs'
{exec} = require 'child_process'


appFiles  = [
  # omit src/ and .coffee to make the below lines a little shorter
  'tools_freak.jquery'
  'storage_freak.jquery'
  'selectorablium.jquery'
]

task 'build', 'Build single and concatenated files and their minified versions', ->
  console.log '** Initiating single files task **'
  build_single_files()
  console.log '** Initiating files concatenation task **'
  build_bundle_file()

task 'build:single', 'Build single js files and their minified versions', ->
  console.log '** Initiating single files task **'
  build_single_files()

task 'build:bundle', 'Build one concatenated js file and its minified version', ->
  console.log '** Initiating files concatenation task **'
  build_bundle_file()



build_single_files = (callback) ->
  exec 'sass --update --force scss:css --style compressed', (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr if stdout isnt "" or stderr isnt ""
    console.log 'Compilation of SCSS files complete.'

  exec 'coffee --compile --output js/ coffee/', (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr if stdout isnt "" or stderr isnt ""
    console.log 'Compilation of single files complete.'
    remaining = appFiles.length
    for file, index in appFiles then do (file, index) ->
      exec "uglifyjs -o js/#{file}.min.js js/#{file}.js", (err, stdout, stderr) ->
        throw err if err
        console.log stdout + stderr if stdout isnt "" or stderr isnt ""
      console.log('** Minification of single files complete **') if --remaining is 0



build_bundle_file = (callback) ->
  appContents = new Array remaining = appFiles.length
  for file, index in appFiles then do (file, index) ->
    fs.readFile "coffee/#{file}.coffee", 'utf8', (err, fileContents) ->
      throw err if err
      appContents[index] = fileContents
      process() if --remaining is 0
  process = ->
    fs.writeFile 'coffee/selectorablium.jquery.bundle.coffee', appContents.join('\n\n'), 'utf8', (err) ->
      throw err if err
      console.log 'File concatenation complete.'
      exec 'coffee --compile --output js/ coffee/selectorablium.jquery.bundle.coffee', (err, stdout, stderr) ->
        throw err if err
        console.log stdout + stderr if stdout isnt "" or stderr isnt ""
        console.log 'Concatenated file complilation compete.'
        exec 'uglifyjs -o js/selectorablium.jquery.bundle.min.js js/selectorablium.jquery.bundle.js', (err, stdout, stderr) ->
          throw err if err
          console.log stdout + stderr if stdout isnt "" or stderr isnt ""
          console.log 'Concatenated file minification compete.'
          fs.unlink 'coffee/selectorablium.jquery.bundle.coffee', (err) ->
            throw err if err
            console.log '** File concatenation and minification complete **'