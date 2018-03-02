const gulp = require('gulp');
const browserSync = require('browser-sync').create();

// need to nunjucks
const nunjucksRender = require('gulp-nunjucks-render');
const plumber = require('gulp-plumber');
const prettify = require('gulp-jsbeautifier');

// need to sass
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const notify = require('gulp-notify');
const gulpif = require('gulp-if');

// need to babel
const babel = require('rollup-plugin-babel');
const rollup = require('rollup-stream');
const source = require('vinyl-source-stream');

// utilities
const uglify = require('gulp-uglify');
const pump = require('pump');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const svgstore = require('gulp-svgstore');
const svgmin = require('gulp-svgmin');

// browserSync
// minify-js
// minify-css
// sass
// nunjucks
// svg-o
// svgstore
// watch
// build

const isProd = process.argv[2] === 'build';

// browserSync
gulp.task('browser-sync', () =>
  browserSync.init({
    server: {
      baseDir: 'dist',
    },
    ui: false,
  }));

// uglify js
gulp.task('minify-js', (next) => 
  pump([
    gulp.src('src/lib/*.js'),
    uglify(),
    rename({
      suffix: '.min',
    }), // add .min suffix
    gulp.dest('dist/js'),
  ], next));

// minify css
gulp.task('minify-css', () => gulp.src(['src/lib/*.css', '!src/lib/*.min.css'])
  .pipe(cleanCSS({
    compatibility: 'ie8',
  }))
  .pipe(rename({
    suffix: '.min',
  })) // add .min suffix
  .pipe(gulp.dest('dist/css')));

// sass
gulp.task('sass', () => gulp.src('./src/sass/style.scss') 
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(sass({
      outputStyle: 'expanded',
      includePaths: ['node_modules']
    })
    .on('error', function(err) {
      this.emit('end');
      return notify().write(err);
    }))
    .pipe(autoprefixer({
      browsers: ['> 1%', 'last 2 versions'],
      cascade: true
    }))
    .pipe(gulpif(!isProd, sourcemaps.write()))
    .pipe(gulp.dest('./dist/css'))
    .pipe(browserSync.stream())); // inject css

// babel
gulp.task('babel', () =>
  rollup({
    input: 'src/js/main.js',
    sourcemap: true,
    format: 'iife',
    name: 'simple-html-project',
    plugins: [
      babel({
        exclude: 'node_modules/**',
        babelrc: false,
        presets: ['es2015-rollup'],
      }),
    ],
  })
  .on('error', function callback(err) {
    this.emit('end');
    return notify().write(err);
  })
  .pipe(source('main.js', 'src/js'))
  .pipe(gulp.dest('dist/js'))
  .on('end', browserSync.reload));

// nunjucks template + htmlbeautify
gulp.task('nunjucks', () => gulp.src('src/pages/**/*.njk')
  .pipe(plumber())
  .pipe(nunjucksRender({
    path: ['src/templates/'],
  }))
  .pipe(prettify({
    indent_size: 2,
    preserve_newlines: true,
    max_preserve_newlines: 0,
  })) // html beautify
  .pipe(gulp.dest('dist'))
  .on('end', browserSync.reload));

// svg opimization
gulp.task('svg-o', () => gulp
  .src('src/svg/*.svg')
  .pipe(svgmin({
    js2svg: {
      pretty: true,
    },
    removeDoctype: false,
  }))
  .pipe(gulp.dest('dist/img/')));

// svg sprite
// TODO: Add pipe for beautify in dev and uglify in prod
gulp.task('svg-sprite', () => gulp
  .src('src/svg/sprite/*.svg')
  .pipe(svgmin({
    removeDoctype: false,
  }))
  .pipe(svgstore())
  .pipe(gulp.dest('dist/img/')));

// watcher
gulp.task('watch', () => {
  gulp.start('browser-sync');
  gulp.watch('src/sass/**/*.scss', ['sass']);
  gulp.watch(['src/pages/**/*.njk', 'src/templates/**/*.njk'], ['nunjucks']);
  gulp.watch(['src/js/*.js'], ['babel']);
});

// build
gulp.task('build', ['sass', 'nunjucks', 'babel'], () => {
  console.log('Building files');
});
