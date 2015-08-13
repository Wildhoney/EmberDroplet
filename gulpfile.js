(function main($gulp) {

    var babel  = require('gulp-babel'),
        rename = require('gulp-rename'),
        uglify = require('gulp-uglify'),
        jshint = require('gulp-jshint'),
        karma  = require('gulp-karma'),
        path   = require('path'),
        yaml   = require('js-yaml'),
        fs     = require('fs'),
        config = yaml.safeLoad(fs.readFileSync('./droplet.yml', 'utf8'));

    $gulp.task('compile', function() {

        return $gulp.src(config.module)
                    .pipe(babel())
                    .pipe(rename(config.name + '.js'))
                    .pipe($gulp.dest(config.locations.release))
                    .pipe($gulp.dest(config.locations.vendor + '/' + config.name))
                    .pipe(uglify())
                    .pipe(rename(function (path) {
                        path.basename += '.min';
                    }))
                    .pipe($gulp.dest(config.locations.release));

    });

    $gulp.task('lint', function() {

        return $gulp.src(config.module)
                    .pipe(jshint())
                    .pipe(jshint.reporter(require('jshint-stylish')));

    });

    $gulp.task('karma', function() {

        return $gulp.src([].concat(config.dependencies, config.tests, config.module))
                    .pipe(karma({
                        configFile: 'karma.conf.js',
                        action: 'run'
                    }))
                    .on('error', function(err) {
                        throw err;
                    });

    });

    $gulp.task('test', ['lint', 'karma']);
    $gulp.task('build', ['compile']);
    $gulp.task('default', ['test', 'build']);
    $gulp.task('watch', function watch() {
        $gulp.watch(config.module, ['build']);
    });

})(require('gulp'));
