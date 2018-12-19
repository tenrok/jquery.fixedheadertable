module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		bower: {
			install: {
				options: {
					// targetDir: "demo/lib/"
				}
			}
		},

		jshint: {
			// define the files to lint
			files: ['gruntfile.js', '*.js', 'demo/src/*.js'],
			options: {
				// more options here if you want to override JSHint defaults
				globals: {
					jQuery: true,
					console: true,
					module: true
				}
			}
		},

		copy: {
			src: {
				src: "src/jquery.fixedheadertable.js",
				dest: "demo/"
			},
			css: {
				src: "css/*.css",
				dest: "demo/"
			}
		},

		watch: {
			options: {
				livereload: true
			},
			src: {
				files: ["src/jquery.fixedheadertable.js"],
				tasks: ["check", "copy:src", "uglify"],
				options: {
					atBegin: true
				}
			},
			bower: {
				files: "bower.json",
				tasks: "bower"
			}
		},

		clean: {
			build: ['demo/lib'],
			bower: ['bower_components'],
			src: [
				'demo/src/jquery.fixedheadertable.js',
				'demo/css/defaultTheme.css'
			]
		},

		connect: {
			server: {
				options: {
					port: 9001,
					base: 'demo'
				}
			}
		},

		uglify: {
			options: {
				output: {
					comments: '/^!/'
				}
			},
			main: {
				files: {
					'jquery.fixedheadertable.min.js': [
						'demo/lib/jquery-mousewheel/jquery.mousewheel.js',
						'src/jquery.fixedheadertable.js'
					]
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-bower-task');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	// Default task(s).
	grunt.registerTask('check', ['jshint']);

	grunt.registerTask('install', [
		'bower',
		'copy'
	]);

	grunt.registerTask('minify', [
		'install',
		'uglify'
	]);

	grunt.registerTask('server', [
		'connect', 
		'watch'
	]);

	grunt.registerTask('default', [
		'check',
		'minify',
		'server'
	]);
};