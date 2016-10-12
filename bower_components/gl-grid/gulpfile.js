var gulp = require('gulp');
var replace = require('gulp-replace');

gulp.task('replace',function(){
     gulp.src('src/*.html')
    .pipe(replace('../bower_components/','../'))
    .pipe(gulp.dest(''));
});


gulp.task('default', ['replace']);