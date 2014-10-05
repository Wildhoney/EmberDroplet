module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['packages/ember-droplet/*.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> by <%= pkg.author %> created on <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: ['packages/ember-droplet/*.js'],
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
                src: ['packages/ember-droplet/*.js'],
                options: {
                    specs: 'tests/spec.js',
                    helpers: [
                      './example/scripts/vendor/sinon_server/sinon-server.js',
                      './example/scripts/vendor/jquery/jquery.js',
                      './example/scripts/vendor/handlebars/handlebars.js',
                      './example/scripts/vendor/ember/ember.js'
                    ]
                }
            }
        },
        concat: {
            options: {
                separator: ';',
                stripBanners: true
            },
            dist: {
                src: ['packages/ember-droplet/*.js'],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        copy: {
            main: {
                files: [{
                    flatten: true,
                    src: ['packages/ember-droplet/*.js'],
                    dest: 'example/scripts/package',
                    expand: true,
                    filter: 'isFile'
                }]
            }
        },
        bowerInstall: {
          target: {
            // Point to the files that should be updated when
            // you run `grunt bower-install`
            src: [
              'tests/index.html'
            ],

            // Optional:
            // ---------
            cwd: '',
            dependencies: true,
            devDependencies: false,
            exclude: [],
            fileTypes: {},
            ignorePath: '',
            overrides: {}
          }
        }
    });

    grunt.loadNpmTasks('grunt-bower-install');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('build', ['yuidoc', 'concat', 'uglify', 'copy']);
    grunt.registerTask('test', ['jshint', 'jasmine']);
    grunt.registerTask('default', ['jshint', 'jasmine', 'yuidoc', 'concat', 'uglify', 'copy']);

};
