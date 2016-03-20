import gulp from 'gulp';
import babel from 'gulp-babel';
import webpack from 'webpack-stream';


gulp.task('build', () => {
  return gulp.src('./app/index.js')
    .pipe(webpack(require('./webpack.config.js')))
    .pipe(gulp.dest('./public/pitt/build'));
});

gulp.task('default', ['build']);