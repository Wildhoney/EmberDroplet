module.exports = function(config) {

    config.set({

        frameworks: ['jasmine'],
        files: [
            'example/vendor/jquery/dist/jquery.js',
            'example/vendor/handlebars/handlebars.js',
            'example/vendor/ember/ember.debug.js',
            'components/*.js',
            'tests/*.test.js'
        ],
        preprocessors: {
            'components/*.js': ['babel'],
            'tests/*.js': ['babel'],
            'tests/**/*.js': ['babel']
        },
        reporters: ['spec'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['Firefox'],
        singleRun: false

    });

};
