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

function convertWords(text, mapper, nonWordMapper=null, noSpaceAfter=null) {
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
    if (noSpaceAfter === null) {
        noSpaceAfter = new Set([]);
    }
    let combineNextWord = [];
    let needsMap = [];
    for (let i = 0; i < chars.length; i++) {
        if (isWord[i]) {
            word += chars[i];
        } else {
            if (word.length > 0) {
                combineNextWord.push(noSpaceAfter.has(word.toLowerCase()));
                needsMap.push(true);
                words.push(word);
                word = '';
            }
            words.push(nonWordMapper(chars[i]));
            needsMap.push(false);
            combineNextWord.push(false);
        }
    }
    if (word.length > 0) {
        words.push(word);
        combineNextWord.push(false);
        needsMap.push(true);
    }
    for (let i = words.length-3; i >= 0; i--) {
        if (combineNextWord[i] && words[i+1] === ' ') {
            words[i] = words[i] + ':' + words[i+2];
            words.splice(i+1, 2);
            needsMap.splice(i+1, 2);
            combineNextWord.splice(i+1, 2);
        }
    }
    for (let i = 0; i < words.length; i++) {
        if (needsMap[i]) {
            words[i] = mapper(words[i]);
        }
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
        if (document.es_input.era.value === 'old') {
            output = output.replaceAll('nn','ñ');
            if (!VOWELS.has(output.substring(1,2)) && output.substring(0,1) === 'y') {
                output = 'i' + output.substring(1);
            }
        } else {
            output = output.replaceAll('méxico','méjico').replaceAll('mexicano','mejicano')
                .replaceAll('mexicana','mejicana');
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
    let predefined = {
        'alá':'اٗلٗلٗهٗ',
        'hay':'اَيْ',
    };
    if (document.es_output.arabic.checked) {
        predefined = {
            ...predefined,
            'almohada':'اَلْمُخَدَّة',
            'elixir':'اَلْإكْسِيٗرْ',
            'elicsir':'اَلْإكْسِيٗرْ',
            'alcohol':'اَلْكُحُلْ',
            'sandía':'سَنْدِيَّة',
            'tarea':'طَرِيٗحَة',
            'cifra':'صِفْرَ',
            'albahaca':'اَلبَحَقَ',
            'asesino':'حَشَاشِيٗنُ',
            'hay':'اَيْ',
            'taza':'طَاسَ','taça':'طَاسَ',
            'limón':'لِيٗمُوٗنْ',
            'algodón':'اَلْقُطُنْ',
            'azúcar':'اَلْسُّكَّرْ','açúcar':'اَلْسُّكَّرْ',
        };
    }
    const predefined_latin = {
        'haber':'aber',
        'ha':'a',
        'he':'e',
        'has':'as',
        'hay':'ay',
        'ha':'a',
        'hemos':'emos',
        'habéis':'abéis',
        'han':'an',
        'había':'abía',
        'habrá':'abrá',
        'habían':'abían',
        'habría':'abría',
        'habrían':'abrían',
        'hubiera':'ubiera',
        'hubieras':'ubieras',
        'hubieran':'ubieran',
    };
    if (word === 'y')
        word = 'i';
    for (const [key, value] of Object.entries(predefined)) {
        if (word === key)
            return value.replaceAll('ٗ','');
        word = word.replaceAll(':'+key+':', ':'+value+':');
        if (word.startsWith(key+':'))
            word = value + ':' + word.substring(key.length+1);
        else if (word.endsWith(':'+key))
            word = word.substring(0,word.length-key.length-1) + ':' + value;
    }
    for (const [key, value] of Object.entries(predefined_latin)) {
        if (word === key)
            word = value;
        word = word.replaceAll(':'+key+':', ':'+value+':');
        if (word.startsWith(key+':'))
            word = value + ':' + word.substring(key.length+1);
        else if (word.endsWith(':'+key))
            word = word.substring(0,word.length-key.length-1) + ':' + value;
    }
    word = word.replaceAll('de:e','de').replaceAll('s:s','s s').replaceAll('l:l','l l').replaceAll(':h',':H').replaceAll('y:','i:').replaceAll(':','');
    word = word.replaceAll('á','a').replaceAll('é','e').replaceAll('í','i').replaceAll('ó','o').replaceAll('ú','u');
    word = word.replaceAll('ge','je').replaceAll('gi','ji').replaceAll('gue','ge').replaceAll('gui','gi');
    word = word.replaceAll('ce','çe').replaceAll('ci','çi').replaceAll('que','ke').replaceAll('qui','ki')
        .replaceAll('q','k').replaceAll('güe','guwe').replaceAll('güi','guwi');
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
    if (word.startsWith('h')) {
        word = 'H'+word.substring(1);
    }
    word = word.replaceAll('Huwa','huwa').replaceAll('Huwe','huwe');
    word = word.replaceAll('h','').replaceAll('H','h');
    word = word.replaceAll('ai','ayi').replaceAll('ei','eyi').replaceAll('oi','oyi');
    word = "'" + word;
    word = word.replaceAll('au','ao').replaceAll('eu','eo');
    word = word.replaceAll('ee',"é").replaceAll('aa','á').replaceAll('oo','ú').replaceAll('uu','ú');
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
        'é':'َاَا',
        'á':'َأَ',
        'ú':'ُؤُ'
    };
    const vow_map_2 = {
        'a':'اَ',
        'e':'ءَا',
        'i':'اِ',
        'u':'اُ',
        'é':'اَا',
        'á':'اَأَ',
        'ú':'اُؤُ'
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

    word = word.replaceAll("'",'').replaceAll('´','').replaceAll('˜','');

    const cons_set = new Set(Object.values(cons_map));
    console.log(word);
    const diacritic_set = new Set(['َ','ِ','ُ','ّ','ٗ','ْ']);
    for (let i = word.length; i >= 0; i--) {
        let char = word.substring(i,i+1);
        let next;
        if (i === word.length)
            next = '';
        else
            next = word.substring(i+1,i+2);
        if ((cons_set.has(char) || char === 'ّ') && !diacritic_set.has(next)) {
            word = word.substring(0,i+1) + 'ْ' + word.substring(i+1);
        }
    }
    word = word.replaceAll('ٗ','');

    return word;
}