let project_folder = "dist";
//let project_folder = require("path").basename(__dirname); //задать имя папки с готовой версткой как у папки проекта 
let source_folder = "#src";

let path = {
    build: {
        html: project_folder + "/",
        css: project_folder + "/css/",
        js: project_folder + "/js/",
        img: project_folder + "/img/",
        fonts: project_folder + "/fonts/",
    },
    src: {
        html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
        css: source_folder + "/scss/style.scss",
        js: source_folder + "/js/script.js",
        img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}", // ** - искать в подпапках
        fonts: source_folder + "/fonts/*.ttf",
    },
    watch: {
        html: source_folder + "/**/*.html",
        css: source_folder + "/scss/**/*.scss",
        js: source_folder + "/js/**/*.js",
        img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
        fonts: source_folder + "/fonts/*.ttf",
    },
    // clean: "./" + project_folder + "/",
    clean: {
        css: project_folder + "/css/**",
        js: project_folder + "/js/**",
        html: project_folder + "/*.html",
    },
}

let fs = require('fs');

let { src, dest } = require('gulp'),
    gulp = require('gulp'),
    browsersync = require('browser-sync').create(),
    fileinclude = require('gulp-file-include'),
    del = require('del'),
    scss = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    group_media = require('gulp-group-css-media-queries'),
    clean_css = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify-es').default,
    imagemin = require('gulp-imagemin'),
    webp = require('gulp-webp'),
    webphtml = require('gulp-webp-html'),
    webpcss = require('gulp-webp-css'),
    svgSprite = require('gulp-svg-sprite'),
    ttf2woff = require('gulp-ttf2woff'),
    ttf2woff2 = require('gulp-ttf2woff2'),
    fonter = require('gulp-fonter');

// обновление страницы браузера
function browserSync() {
    browsersync.init({
        server: {
            baseDir: path.build
        },
        port: 3000,
        notify: false
    });
}

function html() {
    return src(path.src.html)
        .pipe(fileinclude()) //собрать все html в один
        .pipe(webphtml()) //добавить подключение webp картинок для поддерживающих этот формат браузеров
        .pipe(dest(path.build.html)) //скопировать получиышийся html в папку dist
        .pipe(browsersync.stream()); // обновить страницу браузера
}

function js() {
    return src(path.src.js)
        .pipe(fileinclude()) //собрать все js в один
        .pipe(dest(path.build.js)) //скопировать получиышийся js в папку dist
        .pipe(
            uglify() // минифицировать js
        )
        .pipe(
            rename({
                extname: ".min.js" //переименовать минифицированный js файл
            })
        )
        .pipe(dest(path.build.js)) //скопировать получиышийся js в папку dist
        .pipe(browsersync.stream()); // обновить страницу браузера
}

function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: "expanded" // сделать несжатый css из scss
            })
        )
        .pipe(group_media()) //собрать разбросанные media запросы в один и поместить в конец файла
        .pipe(
            autoprefixer({ // добавить вендорные префиксы для кроссбраузерности
                overrideBrowserslist: ["last 5 versions"],
                cascade: true
            })
        )
        .pipe(webpcss()) //подключить webp картинки для браузеров поддерживающих этот формат
        .pipe(dest(path.build.css)) //скопировать несжатый css в папку dist
        .pipe(clean_css()) // минифицировать css
        .pipe(
            rename({
                extname: ".min.css" // переименовать минифицированный css
            })
        )
        .pipe(dest(path.build.css)) //скопировать минифицированный css в папку dist
        .pipe(browsersync.stream()); // обновить страницу браузера
}

function images() {
    return src(path.src.img)
        .pipe(
            webp({ //преобразовать картинки в формат webp
                quality: 70
            })
        )
        .pipe(dest(path.build.img)) //скопировать картинки в папку dist
        .pipe(src(path.src.img)) // снова взять исходные картинки
        .pipe(
            imagemin({ //сжать картинки
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true,
                optimizationLevel: 3 // 0-7
            })
        )
        .pipe(dest(path.build.img)) //скопировать картинки в папку dist
        .pipe(browsersync.stream()); // обновить страницу браузера
}

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff()) // конвертировать шрифт
        .pipe(dest(path.build.fonts)) //скопировать шрифт в папку dist
    return src(path.src.fonts)
        .pipe(ttf2woff2()) // конвертировать шрифт
        .pipe(dest(path.build.fonts)) //скопировать шрифт в папку dist
}

// очистить папку dist
function clean() {
    return del([path.clean.css, path.clean.js, path.clean.html]);
    // return del(path.clean);
}

// следить за изменением файлов
function watchFiles() {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    // gulp.watch([path.watch.img], images);
    // gulp.watch([path.watch.fonts], fonts);
}

// подключение шрифтов в css
function fontsStyle() {
    let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname = '';
                for (let i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }

        })
    }
}
//колбек для подключения шрифтов в css
function cb() { }

//создать спрайт из svg иконок
gulp.task('svgSprite', function () {
    return gulp.src([source_folder + '/iconsprite/*.svg'])
        .pipe(
            svgSprite({
                mode: {
                    stack: {
                        sprite: "../icons/icons.svg",
                        //example: true // создать html файл с примером
                    }
                }
            })
        )
        .pipe(dest(path.build.img)) //скопировать спрайт в папку dist
})

// конвертировать otf шрифт в ttf
gulp.task('otf2ttf', function () {
    return src([source_folder + '/fonts/*.otf'])
        .pipe(
            fonter({
                formats: ['ttf'] // сконвертировать шрифт в ttf
            })
        )
        .pipe(dest(source_folder + '/fonts/')) // скопировать в папку fonts исходников
})

gulp.task('optimizeImg', function () {
    return src(path.src.img)
        .pipe(
            webp({ //преобразовать картинки в формат webp
                quality: 70
            })
        )
        .pipe(dest(path.build.img)) //скопировать картинки в папку dist
        .pipe(src(path.src.img)) // снова взять исходные картинки
        .pipe(
            imagemin({ //сжать картинки
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true,
                optimizationLevel: 3 // 0-7
            })
        )
        .pipe(dest(path.build.img)) //скопировать картинки в папку dist
})

gulp.task('convertFont', function () {
    src(path.src.fonts)
        .pipe(ttf2woff()) // конвертировать шрифт
        .pipe(dest(path.build.fonts)) //скопировать шрифт в папку dist
    return src(path.src.fonts)
        .pipe(ttf2woff2()) // конвертировать шрифт
        .pipe(dest(path.build.fonts)) //скопировать шрифт в папку dist
})

// let build = gulp.series(clean, gulp.parallel(js, css, images, fonts, html));
let build = gulp.series(clean, gulp.parallel(js, css, html), fontsStyle);
let watch = gulp.parallel(build, watchFiles, browserSync);

// exports.images = images;
exports.fontsStyle = fontsStyle;
exports.js = js;
exports.css = css;
// exports.fonts = fonts;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;