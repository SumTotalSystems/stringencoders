;
(function () {
  'use strict';

  var browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    del = require('del'),
    gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    path = require('path'),
    source = require('vinyl-source-stream');

  gulp.task('clean', function (cb) {
    return del('dist/**/*.*');
  });

  gulp.task('build-concat', ['clean', 'build'], function () {
    return gulp.src(['dist/**/*.js', 'src/stringencoders.js', '!dist/**/*.min.js'])
      .pipe($.concat('stringencoders.js'))
      .pipe(gulp.dest('dist'));
  });

  gulp.task('build', ['clean'], function () {
    return gulp.src(['src/**/*.js'])
      .pipe($.umd({
        exports: function (file) {
          return path.basename(file.path, '.js').toLowerCase();
        },
        namespace: function (file) {
          return path.basename(file.path, '.js').toLowerCase();
        },
        dependencies: function (file) {
          if (path.basename(file.path, '.js').toLowerCase() === 'stringencoders') {
            return [
              {
                name: './base64',
                amd: './base64',
                global: 'Base64',
                param: 'base64'
            },
              {
                name: './urlparse',
                amd: './urlparse',
                global: 'Urlparse',
                param: 'urlparse'
            }
          ]
          } else {
            return [];
          }
        }
      }))
      .pipe(gulp.dest('dist'))
      .pipe($.uglify({
        preserveComments: 'license'
      }))
      .pipe($.rename(function (path) {
        path.basename += '.min';
      }))
      .pipe(gulp.dest('dist'));
  });

  gulp.task('default', ['clean', 'build'], function () {
    var browserified = browserify({
      entries: 'dist/stringencoders.js',
      debug: true,
      standalone: 'stringencoders'
    });

    return browserified.bundle()
      .pipe(source('stringencoders.js'))
      .pipe(buffer())
      .pipe(gulp.dest('dist'))
      .pipe($.uglify({
        preserveComments: 'license'
      }))
      .pipe($.rename('stringencoders.min.js'))
      .pipe(gulp.dest('dist'));
  });

  gulp.task('connect', ['default'], function () {
    var app = null,
      serveStatic = require('serve-static'),
      serveIndex = require('serve-index');

    app = require('connect')()
      .use(require('connect-livereload')({
        port: 35729
      }))
      .use(serveStatic('tests'))
      .use('/dist', serveStatic('dist'))
      .use('/examples', serveStatic('examples'))
      .use(serveIndex('tests'));

    require('http').createServer(app)
      .listen(9000)
      .on('listening', function () {
        console.log('Started connect web server on http://localhost:9000');
      });
  });

  gulp.task('serve', ['default', 'connect', 'watch'], function () {
    require('opn')('http://localhost:9000');
  });

  gulp.task('watch', ['default', 'connect'], function () {
    $.livereload.listen();

    // watch for changes
    gulp.watch([
      'tests/**/*.html',
      'dist/**/*.*',
      'examples/**/*.html'
    ]).on('change', $.livereload.changed);

    gulp.watch('src/**/*.*', ['default']);
  });

}());
