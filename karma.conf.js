module.exports = function(config) {

    config.set({

        frameworks: ['jasmine', 'browserify'],
        files: [
            'example/vendor/jquery/dist/jquery.js',
            'example/vendor/handlebars/handlebars.js',
            'example/vendor/ember/ember.debug.js',
            'components/*.js',
            'tests/*.test.js'
        ],
        preprocessors: {
            'components/*.js': ['browserify'],
            'tests/*.js': ['browserify'],
            'tests/**/*.js': ['browserify']
        },
        reporters: ['spec'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['Firefox'],
        singleRun: false,
        browserify: {
            debug: true,
            transform: [["babelify", { stage: 0 }]]
        }

    });

};
