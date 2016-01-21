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
}());
