var gulp = require('gulp');
var vulcanize = require('gulp-vulcanize');
var concat = require('gulp-concat');

gulp.task('vulcanize',function(){
  return gulp.src('src/import.html')
  .pipe(vulcanize({
    stripComments:true,
    inlineScripts:true,
    inlineCss:true
  }))
  .pipe(gulp.dest('src/dist'));
});

gulp.task('html', function() {
return gulp.src([
    'bower_components/paper-drawer-panel/paper-drawer-panel.html',
    'bower_components/paper-header-panel/paper-header-panel.html', 
    'bower_components/paper-toolbar/paper-toolbar.html'
])
.pipe(concat('test.html'))
.pipe(gulp.dest('./'));
});

gulp.task('vulcanize2',function(){
  return gulp.src('im.html')
  .pipe(vulcanize({
    stripComments:true,
    inlineScripts:true,
    inlineCss:true
  }))
  .pipe(gulp.dest('dist'));
});

gulp.task('default', ['vulcanize2']);
