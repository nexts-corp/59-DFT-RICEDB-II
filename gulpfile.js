var gulp = require('gulp');
var vulcanize = require('gulp-vulcanize');

gulp.task('vulcanize',function(){
  return gulp.src('src/import.html')
  .pipe(vulcanize({
    stripComments:true,
    inlineScripts:true,
    inlineCss:true
  }))
  .pipe(gulp.dest('src/dist'));
});

gulp.task('default', ['vulcanize']);
