(function () {
  'use strict';

  var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    rimraf = require('rimraf'); //,
  //runsequence = require('run-sequence');

  gulp.task('clean', function (cb) {
    rimraf('dist', cb);
  });

  gulp.task('build-concat', ['clean'], function () {

  });

  gulp.task('build', ['clean'], function () {
    return gulp.src('src/**/*.js')
      .pipe($.uglify({
        preserveComments: 'license'
      }))
      .pipe($.rename(function (path) {
        path.basename += '.min';
      }))
      .pipe(gulp.dest('dist'));
  });

  gulp.task('default', ['clean', 'build'], function () {
    return gulp.src('dist/**/*.js')
      .pipe($.concat('stringencoders.min.js'))
      .pipe(gulp.dest('dist'));
  });

  gulp.task('connect', function () {
    var app = null,
      serveStatic = require('serve-static'),
      serveIndex = require('serve-index');

    app = require('connect')()
      .use(require('connect-livereload')({
        port: 35729
      }))
      .use(serveStatic('tests'))
      .use('/src', serveStatic('src'))
      .use('/examples', serveStatic('examples'))
      .use(serveIndex('tests'));

    require('http').createServer(app)
      .listen(9000)
      .on('listening', function () {
        console.log('Started connect web server on http://localhost:9000');
      });
  });

  gulp.task('serve', ['connect', 'watch'], function () {
    require('opn')('http://localhost:9000');
  });

  gulp.task('watch', ['connect'], function () {
    $.livereload.listen();

    // watch for changes
    gulp.watch([
      'tests/**/*.*',
      'src/**/*.*',
      'examples/**/*.*'
    ]).on('change', $.livereload.changed);
  });

}());
