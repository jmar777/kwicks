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
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	
	grunt.registerTask('default', ['uglify', 'cssmin']);
};