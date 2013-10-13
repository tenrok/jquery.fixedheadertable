## Version 1.3.1
 - jquery.fixedheadertable.js

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

First install the grunt:
```shell
npm install -g grunt-cli
```

Obtain all the required modules:
```shell
npm install
```

###Install:
After you install the required grunt tasks, you can install the project and check the examples:

```shell
grunt
```
This command will test the code with [jshint](http://www.jshint.com/), install the required files, start the server with port 9001, minify the js files of mousewheel and fixedheadertable and watch the changes of the source files to rebuild the files.

###Minified file (include jquery mousewheel plugin)
If you just want to minify the files, you can just run the command
```
grunt minify
```

 
## Methods:

* show - `$('selector').fixedHeaderTable('show');`
* hide - `$('selector').fixedHeaderTable('hide');`
* destroy - `$('selector').fixedHeaderTable('destroy');`

## Options:

* width - Number - Default: 100%
* height - Number - Default: 100%
* fixedColumns - Number - Default: 0
* footer - Boolean - Default: false
* cloneHeadToFoot - Boolean - Default: false
* autoShow - Boolean - Default: true
* altClass - String - Default: none
* themeClass - String - Default: none

### Notes:

If you aren't using the minified version, be sure to include `lib/jquery.mousewheel.js` in your page if you require mousewheel scrolling via fixed columns.