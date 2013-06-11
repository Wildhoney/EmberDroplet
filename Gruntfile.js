module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['packages/ember-droplet/ember-droplet-mixin.js', 'packages/ember-droplet/ember-droplet-view.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> by <%= pkg.author %> created on <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: ['packages/ember-droplet/ember-droplet-mixin.js', 'packages/ember-droplet/ember-droplet-view.js'],
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        yuidoc: {
            compile: {
                name: '<%= pkg.name %>',
                options: {
                    paths: 'packages/ember-droplet/',
                    outdir: 'docs/'
                }
            }
        },
        jasmine: {
            pivotal: {
                src: ['packages/ember-droplet/ember-droplet-mixin.js', 'packages/ember-droplet/ember-droplet-view.js'],
                options: {
                    specs: 'tests/spec.js',
                    helpers: ['lib/jquery-1.10.1.js', 'lib/handlebars-1.0.rc.4.js', 'lib/ember-1.0.0-rc.5.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
//    grunt.loadNpmTasks('grunt-contrib-jasmine');

    // Default task(s).
    grunt.registerTask('default', ['jshint', 'yuidoc', 'uglify']);

};