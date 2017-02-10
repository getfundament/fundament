const gulp       = require('gulp'),
      plumber    = require('gulp-plumber'),
      watch      = require('gulp-watch'),
      concat     = require('gulp-concat'),
      rename     = require('gulp-rename'),
      uglify     = require('gulp-uglify'),
      prefixer   = require('gulp-autoprefixer'),
      sourcemaps = require('gulp-sourcemaps'),
      sass       = require('gulp-sass'),
      cssnano    = require('gulp-cssnano'),
      filter     = require('gulp-filter');

/**
 * Fundament source and dist paths.
 */
const Fundament = {
    js : {
        src  : 'src/js/*.js',
        dist : 'dist/js'
    },
    sass : {
        src   : 'src/scss/build.scss',
        watch : 'src/scss/**/*.scss',
        dist  : 'dist/css'
    }
};

/**
 * Gulp tasks.
 */
const tasks = {

    js: function() {
        gulp.src(Fundament.js.src)
            .pipe(plumber())
            .pipe(sourcemaps.init())
            .pipe(concat('fundament.js'))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(Fundament.js.dist)) // compressed
            .pipe(filter('**/*.js'))
            .pipe(rename({suffix: '.min'}))
            .pipe(uglify({preserveComments: 'license'}))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(Fundament.js.dist)); // minified
    },

    sass: function() {
        gulp.src(Fundament.sass.src)
            .pipe(plumber())
            .pipe(sourcemaps.init())
            .pipe(sass())
            .pipe(prefixer())
            .pipe(concat('fundament.css'))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(Fundament.sass.dist)) // compressed
            .pipe(filter('**/*.css'))
            .pipe(rename({suffix: '.min'}))
            .pipe(cssnano({zindex: false}))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(Fundament.sass.dist)); // minified
    },

    watch: function() {
        gulp.watch(Fundament.js.src, ['js']);
        gulp.watch(Fundament.sass.watch, ['sass']);
    },

    default: ['js', 'sass']

};

for (var task in tasks) {
    gulp.task(task, tasks[task]);
}
