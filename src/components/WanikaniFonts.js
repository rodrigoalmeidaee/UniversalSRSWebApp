function init() {
    const fonts = [
        // Default Windows fonts
        "Meiryo, メイリオ",
        "MS PGothic, ＭＳ Ｐゴシック, MS Gothic, ＭＳ ゴック",
        "MS PMincho, ＭＳ Ｐ明朝, MS Mincho, ＭＳ 明朝",
        "Yu Gothic, YuGothic",
        "Yu Mincho, YuMincho",

        // Default OS X fonts
        "Hiragino Kaku Gothic Pro, ヒラギノ角ゴ Pro W3",
        "Hiragino Maru Gothic Pro, ヒラギノ丸ゴ Pro W3",
        "Hiragino Mincho Pro, ヒラギノ明朝 Pro W3",

        // Common Linux fonts
        "Takao Gothic, TakaoGothic",
        "Takao Mincho, TakaoMincho",
        "Sazanami Gothic",
        "Sazanami Mincho",
        "Kochi Gothic",
        "Kochi Mincho",
        "Dejima Mincho",
        "Ume Gothic",
        "Ume Mincho",

        // Other Japanese fonts people use.
        // You might want to try some of these!
        "EPSON 行書体Ｍ",
        "EPSON 正楷書体Ｍ",
        "EPSON 教科書体Ｍ",
        "EPSON 太明朝体Ｂ",
        "EPSON 太行書体Ｂ",
        "EPSON 丸ゴシック体Ｍ",
        "cinecaption",
        "nagayama_kai",
        "A-OTF Shin Maru Go Pro",
        "Hosofuwafont",
        "ChihayaGothic",
        "'chifont+', chifont",
        "darts font",
        "santyoume-font",
        "FC-Flower",
        "ArmedBanana", // This one is completely absurd. I recommend it.
        "Hakushy Kaisho Bold",
        "aoyagireisyosimo2, AoyagiKouzanFont2OTF",
        "aquafont",
    ];

    let lastCheck = 0;
    let existingFonts = [];

    function getExistingFonts() {
        if ((new Date().getTime() - lastCheck) > 5000) {
            for (var i = 0; i < fonts.length; i++) {
                var fontName = fonts[i];
                if (!existingFonts.includes(fontName) && fontExists(fontName)) {
                    existingFonts.push(fontName);
                }
            }
            lastCheck = new Date().getTime();
        }
        return existingFonts;
    }


    const cache = {};

    return {
        getRandomFont: glyphs => {
            if (glyphs) {
                const randomlyOrdered = getShuffledFonts(getExistingFonts());
                if (cache[glyphs]) {
                    return cache[glyphs];
                }
                cache[glyphs] = randomlyOrdered.find(font => canRepresentGlyphs(font, glyphs));
                return cache[glyphs];
            }
        },
    };
}

function fontExists(fontName) {
    // Approach from kirupa.com/html5/detect_whether_font_is_installed.htm - thanks!
    // Will return false for the browser's default monospace font, sadly.
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var text = "wim-—l~ツ亻".repeat(100); // Characters with widths that often vary between fonts.

    context.font = "72px monospace";
    var defaultWidth = context.measureText(text).width;

    // Microsoft Edge raises an error when a context's font is set to a string
    // containing certain special characters... so that needs to be handled.
    try {
        context.font = "72px " + fontName + ", monospace";
    } catch (e) {
        return false;
    }
    var testWidth = context.measureText(text).width;

    return testWidth != defaultWidth;
}

function canRepresentGlyphs(fontName, glyphs) {
    var canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;
    var context = canvas.getContext("2d");
    context.textBaseline = 'top';

    var blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    var blankDataUrl = blank.toDataURL();

    context.font = "24px \"" + fontName + "\"";

    var result = true;
    for (var i = 0; i < glyphs.length; i++) {
        context.fillText(glyphs[i], 0, 0);
        if (canvas.toDataURL() === blankDataUrl) {
            result = false;
            break;
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    console.log("canRepresentGlyphs", fontName, glyphs, result);

    return result;
}

function getShuffledFonts(existingFonts) {
    var fonts = existingFonts.slice();
    for (var i = fonts.length; i > 0;) {
        var otherIndex = Math.floor(Math.random() * i);
        i--;

        var temp = fonts[i];
        fonts[i] = fonts[otherIndex];
        fonts[otherIndex] = temp;
    }
    return fonts;
}

export default init();

