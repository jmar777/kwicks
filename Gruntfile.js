module.exports = function(grunt) {
	grunt.initConfig({
		uglify: {
			options: {
				//banner: '/*! teamphoria.min.js <%= grunt.template.today("dd-mm-yyyy") %> */\n'
				preserveComments: 'some'
			},
			dist: {
				files: {
					'jquery.kwicks.min.js': ['jquery.kwicks.js']
				}
			}
		},
		cssmin: {
			css: {
				src: 'jquery.kwicks.css',
				dest: 'jquery.kwicks.min.css'
			}
		},
		jshint: {
			file: ['jquery.kwicks.js'],
			options: {
				camelcase: true,
				eqeqeq: true,
				es3: true,
				undef: true,
				unused: true,
				trailing: true,
				boss: true,
				browser: true,
				globals: {
					jQuery: true
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	
	grunt.registerTask('default', ['uglify', 'cssmin']);
};