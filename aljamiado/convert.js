let inputLang = 'es';
let outputLang = 'Arab';
const outputLangs = {
    'es': [],
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

function contains(set, item) {
    return (new Set(set).has(item));
}

function isRoman(word) {
    for (let i = 0; i < word.length; i++) {
        if (word[i].charCodeAt(0) > 897) {
            return false;
        }
    }
    return true;
}

function convertWords(text, mapper, nonWordMapper=null) {
    let chars = [];
    let isWord = [];
    for (let i = 0; i < text.length; i++) {
        chars.push(text[i]);
        if (contains([' ',',',':',';','.','!','?',';','-','\n','¿','¡'], text[i])) {
            isWord.push(false);
        } else {
            isWord.push(true);
        }
    }
    let words = [];
    let word = '';
    if (nonWordMapper === null) {
        nonWordMapper = (char) => char;
    }
    for (let i = 0; i < chars.length; i++) {
        if (isWord[i]) {
            word += chars[i];
        } else {
            if (word.length > 0) {
                words.push(mapper(word));
                word = '';
            }
            words.push(nonWordMapper(chars[i]));
        }
    }
    if (word.length > 0) {
        words.push(mapper(word));
    }
    words = words.join('');
    return words;
}

function convertWord(startWord, inLang, outLang) {
    if (inLang === 'es') {
        return spanishAljamiado(properOrthography(startWord, inLang).toLowerCase());
    }
    return startWord;
}

function matchCase(word, caseModel) {
    if (caseModel.toUpperCase() === caseModel) {
        return word.toUpperCase();
    } else if (caseModel.substring(0,1).toUpperCase() === caseModel.substring(0,1)) {
        return word.substring(0,1).toUpperCase() + word.substring(1);
    }
    return word;
}

function properOrthography(input, lang) {
    let output = input.toLowerCase();
    if (lang === 'es') {
        if (document.es_settings.es.value === 'old') {
            output = output.replaceAll('nn','ñ');
            if (!VOWELS.has(output.substring(1,2)) && output.substring(0,1) === 'y') {
                output = 'i' + output.substring(1);
            }
        } else {
            output = output.replaceAll('x','cs');
            output = output.replaceAll('z','ç');
        }
    }
    output = output.replaceAll("'", "");
    output = matchCase(output, input);
    return output;
}

function punctMapper(char) {
    const punct_map = {
        '?' : '؟',
        '¿' : '',
        '¡' : '',
        ',' : '،',
        ';' : '؛',
        '.' : '۔',
    };
    return punct_map[char] !== undefined ? punct_map[char] : char;
};

function spanishAljamiado(word) {
    if (word === 'y')
        word = 'i';
    if (word === 'alá')
        return 'الله';
    word = word.replaceAll('á','a').replaceAll('é','e').replaceAll('í','i').replaceAll('ó','o').replaceAll('ú','u');
    word = word.replaceAll('ge','je').replaceAll('gi','ji').replaceAll('gue','ge').replaceAll('gui','gi');
    word = word.replaceAll('ce','çe').replaceAll('ci','çi').replaceAll('que','ke').replaceAll('qui','ki')
        .replaceAll('q','k');
    word = word.replaceAll('ch','č').replaceAll('c','k').replaceAll('zk','çk');
    word = word.replaceAll('ia','iya').replaceAll('ie','iye').replaceAll('io','iyo').replaceAll('iu','iyu');
    word = word.replaceAll('ua','uwa').replaceAll('ue','uwe').replaceAll('ui',"u'i").replaceAll('uo','uwo');
    word = word.replaceAll('v','b').replaceAll('ll','L').replaceAll('rr','R');
    word = word.replaceAll('nd','nD').replaceAll('md','mD');
    word = word.replaceAll('ss','s');
    if (word.startsWith('d'))
        word = 'D' + word.substring(1);
    if (word.startsWith('r'))
        word = 'R' + word.substring(1);
    if (word.startsWith('h'))
        word = 'h'+word.substring(1).replaceAll('h','');
    else
        word = word.replaceAll('h','');
    word = "'" + word;
    word = word.replaceAll('au','ao').replaceAll('eu','eo');
    for (const strong of ['a','e','o']) {
        for (const strong2 of ['a','o']) {
            word = word.replaceAll(strong+strong2, strong + "'" + strong2);
        }
        word = word.replaceAll(strong+'e', strong+"'é");
    }
    word = word.replaceAll('o','u');

    const cons_map = {
        'b':'ب',
        'p':'بّ',
        't':'ت',
        'j':'ج',
        'č':'جّ',
        'D':'د',
        'd':'ذ',
        'r':'ر',
        'R':'رّ',
        'z':'ز',
        'ç':'س',
        's':'ش',
        'x':'شّ',
        'g':'غ',
        'f':'ف',
        'k':'ک',
        'l':'ل',
        'L':'لّ',
        'm':'م',
        'n':'ن',
        'ñ':'نّ',
        'w':'و',
        'h':'ه',
        'y':'ي',
    }
    const vow_map = {
        'a':'َ',
        'e':'َا',
        'i':'ِ',
        'u':'ُ',
    };
    const vow_map_2 = {
        'a':'اَ',
        'e':'ءَا',
        'i':'اِ',
        'u':'اُ',
        'é':'اَا'
    };
    for (const [key, value] of Object.entries(cons_map)) {
        word = word.replaceAll(key, value);
    }
    for (const [key, value] of Object.entries(vow_map_2)) {
        word = word.replaceAll("'"+key, value);
    }
    for (const [key, value] of Object.entries(vow_map)) {
        word = word.replaceAll(key, value);
    }

    // word = word.replaceAll('a','').replaceAll('e','').replaceAll('i','').replaceAll('u','');

    word = word.replaceAll("'",'');
    return word;
}