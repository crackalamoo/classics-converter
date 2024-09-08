const outputLangs = {
    'la': ['es','fr','it'],
    'sa': ['hi','ur','pa','mr','pi']
};
const langNames = {
    'es':'Spanish', 'fr':'French', 'it':'Italian',
    'hi':'Hindi', 'ur':'Urdu', 'pa':'Punjabi', 'mr':'Marathi',
    'pi':'Pali'
};

const SHORT_VOWELS = new Set(['a','e','i','o','u']);
const VOWELS = new Set(['a','e','i','o','u','ā','ē','ī','ō','ū',
    'æ','œ','ó' /* au */, 'è' /* ɛ */, 'ò' /* ɔ */,
    'ã','ẽ','ĩ','õ','ũ','ë',
    'á','é','í','ó','ú',
    'â','ê','î','ô','û']);
const FRONT_VOWELS = new Set(['e','i','è','ē','ī']);
const BACK_VOWELS = new Set(['u','o','ū','ō','ó','ò']);
const LIQUIDS = new Set(['l', 'r']);
const SEMIVOWELS = new Set(['j','w']);
const CONSONANTS = new Set(['b','c','d','f','g','h','k','l','m','n','p','q','r','s','t','v','x','z',
    'č','ž','ç','ñ','ł','ß','ż'
]);
const STOPS = new Set(['p','b','t','d','c','g']);

let inputLang = 'la';
let outputLang = 'es';
const WESTERN_ROMANCE = new Set(['es','fr']);

const SANSKRIT_CONS = new Set([
    'k','g','ń',
    'c','j','ñ',
    'T','D','N',
    't','d','n',
    'p','b','m',
    'y','r','l','v',
    'S','š','z','s','h',
    'K','G','C','J','Ț','Ť','Ď','Ð','P','B','M','H'
]);
const SANSKRIT_NASALS = new Set([
    'ń','ñ','N','n','m'
]);
const SANSKRIT_VOICED_CONS = new Set([
    'g','j','D','d','b','y','r','l','v','B'
]);
const SANSKRIT_STOP_CONS = new Set([
    'k','g',
    'c','j',
    'T','D',
    't','d',
    'p','b',
    'K','G','C','J','Ț','Ð','Ť','Ď','P','B'
]);
const SANSKRIT_LABIAL_CONS = new Set([
    'm','p','b','P','B','v'
]);
const SANSKRIT_GLIDES = new Set(['y','r','l','v']);

const SANSKRIT_DOUBLE_MAP = {
    'kh':'ख', 'gh':'घ',
    'ch':'छ', 'jh':'झ',
    'Th':'ठ', 'Dh':'ढ',
    'th':'थ', 'dh':'ध',
    'ph':'फ', 'bh':'भ',
    'řh':'Ř'
};
const SANSKRIT_CONS_MAP = {
    'k':'क','g':'ग','ń':'ङ',
    'c':'च','j':'ज','ñ':'ञ',
    'T':'ट','D':'ड','N':'ण',
    't':'त','d':'द','n':'न',
    'p':'प','b':'ब','m':'म',
    'y':'य','r':'र','l':'ल','v':'व','L':'ळ',
    'z':'श','S':'ष','s':'स','h':'ह',
    'ř':'ř'
};
const SANSKRIT_VOW_MAP_1 = {
    'ā':'ा','i':'ि','ī':'ी','u':'ु','ū':'ू',
    'e':'े','è':'ै','o':'ो','ò':'ौ',
    'R':'ृ',
    'H':'ः','M':'ं'
};
const SANSKRIT_VOW_MAP_2 = {
    'a':'अ','ā':'आ','i':'इ','ī':'ई','u':'उ','ū':'ऊ',
    'e':'ए','è':'ऐ','o':'ओ','ò':'औ',
    'R':'ऋ','H':'ः','M':'ं'
};

const URDU_CONS_MAP = {
    'k': 'ک', 'g': 'گ',
    'c': 'چ', 'j': 'ج',
    'T': 'ٹ', 'D': 'ڈ',
    't': 'ت', 'd': 'د', 'n': 'ن',
    'p': 'پ', 'b': 'ب', 'm': 'م',
    'y': 'ی', 'r': 'ر', 'l': 'ل', 'v': 'و',
    's': 'س', 'h': 'ہ',
    'ř': 'ڑ', 'M': 'ن'
};
const URDU_VOW_MAP = {
    'a': 'َ', 'ā': 'َا', 'i': 'ِ', 'ī': 'ِی', 'u': 'ُ', 'ū': 'ُو',
    'e': 'ی', 'è': 'َی', 'o': 'و', 'ò': 'َو',
};
const URDU_VOW_MAP_2 = {
    'a': 'ئَ', 'i': 'ئِ', 'ī': 'ئِی', 'u': 'ئُ', 'ū': 'ؤُ',
    'e': 'ئی', 'è': 'ئَی', 'o': 'ؤ', 'ò': 'ؤَ'
};
const URDU_MAP_F = {
    'e': 'ے', 'è': 'ے', 'M': 'ں'
}

function matchCase(word, caseModel) {
    if (caseModel.toUpperCase() === caseModel) {
        return word.toUpperCase();
    } else if (caseModel.substring(0,1).toUpperCase() === caseModel.substring(0,1)) {
        return word.substring(0,1).toUpperCase() + word.substring(1);
    }
    return word;
}

function latinOrthography(input, display=false) {
    let output = input.toLowerCase()
    output = output.replaceAll('aa','ā').replaceAll('ee','ē').replaceAll('ii','ī')
    .replaceAll('oo','ō').replaceAll('uu','ū').replaceAll('yy','ȳ')
    .replaceAll('ae','æ').replaceAll('oe','œ').replaceAll('k','c');
    output = output.replaceAll("'", "");
    output = replaceIntervocal(output, 'i', 'j');
    if (!display)
        output = replaceIntervocal(output, 'y', 'j');
    const startOut = output.substring(0, 1);
    if (VOWELS.has(output.substring(1,2)) && (startOut === 'i' || startOut === 'y')) {
        output = 'j'+output.substring(1);
    }
    output = matchCase(output, input);
    return output;
}

function romanceOrthography(input, latinWord, lang) {
    let output = input;

    if (lang === 'fr') {
        output = output.replaceAll('č','ch');
        output = output.replaceAll('an','ann').replaceAll('en','enn').replaceAll('on','onn')
            .replaceAll('am','amm').replaceAll('em','emm').replaceAll('om','omm');
        output = output.replaceAll('ě','e').replaceAll('ė','e').replaceAll('ẽ','e');
        output = output.replaceAll('çe','ce').replaceAll('çi','ci').replaceAll('çè','cè');
        // õnë
    }
    if (lang === 'fr' || lang === 'it') {
        output = output.replaceAll('j','i');
        output = output.replaceAll('w','u');
    }
    if (lang === 'fr') {
        output = output.replaceAll('ž','j');
        output = replaceIntervocal(output, 's', 'ss');
        output = replaceIntervocal(output, 'ż', 's').replaceAll('ż','z');
    }
    if (lang === 'es') {
        output = replaceIntervocal(output, 'j', 'y');
        output = output.replaceAll('j', 'i');
    }
    if (lang === 'it') {
        output = output.replaceAll('lJ','gl');
    }
    if ((lang === 'fr' || lang === 'es') && latinWord.startsWith('h') && !output.startsWith('h')) {
        output = 'h'+output;
    }

    output = matchCase(output, latinWord);
    return output;
}

function sanskritOrthography(input, doubles=true) {
    let output = input;
    output = output.replaceAll('ṣ','S').replaceAll('ṅ','ń').replaceAll('ṭ','T').replaceAll('ḍ','D')
    .replaceAll('ś','z').replaceAll('sh','z').replaceAll('aa','ā').replaceAll('ii','ī')
    .replaceAll('uu','ū').replaceAll('w','v').replaceAll('ṛ','R').replaceAll('ḥ','H')
    .replaceAll('ṁ','M').replaceAll('ṇ','N');
    if (doubles) {
        output = output.replaceAll('ny','ñ')
        .replaceAll('nk','ńk').replaceAll('nj','ñj').replaceAll('nc','ñc')
        .replaceAll('ng','ń');
    }
    output = output.replaceAll("'", "");
    // output = output.replaceAll('ai','è').replaceAll('au','ò').replaceAll("'","")
    return output;
}
function sanskritDisplay(input, doubles=true) {
    let output = sanskritOrthography(input, doubles);
    output = output.replaceAll('S','ṣ').replaceAll('ń','ṅ').replaceAll('z','ś')
    .replaceAll('T','ṭ').replaceAll('D','ḍ').replaceAll('R','ṛ').replaceAll('H','ḥ')
    .replaceAll('M','ṁ').replaceAll('N','ṇ').replaceAll('L','ḷ');
    return output;
}

function inputOrthography(input, lang) {
    if (lang === 'la')
        return latinOrthography(input);
    return input;
}
function displayOrthography(input, lang) {
    if (lang === 'la')
        return latinOrthography(input, true);
    if (lang === 'sa') {
        if (isRoman(input))
            return nativeOrthography(input, 'sa');
        return sanskritDisplay(input);
    }
    return input;
}

const isRoman = (w) => (SANSKRIT_CONS.union(VOWELS)).intersection(new Set(w.split(''))).size > 0;

function nativeOrthography(word, lang) {
    word = sanskritOrthography(word, lang === 'sa');

    const last = word.substring(word.length-1);
    const isBrahmic = !(lang === 'pa' || lang === 'ur');
    if (lang !== 'sa' && lang !== 'pi' && isBrahmic && SANSKRIT_CONS.has(last) && last != 'M' && last != 'H') {
        word += 'a'; // no schwa deletion in writing
    }
    if (lang !== 'sa') {
        for (const stop of ['k', 'g', 'c', 'j', 'T', 'D', 't', 'd', 'p', 'b'])
            word = word.replaceAll('n'+stop, 'M'+stop);
        for (const stop of ['p', 'b'])
            word = word.replaceAll('m'+stop, 'M'+stop);
        word = word.replaceAll('R','ř');
    } else {
        word = word.replaceAll('au','ò').replaceAll('ai','è');
    }
    if (!isBrahmic) {
        word = schwaDeletion(word);
    }

    if (isBrahmic) {
        // Brahmic script
        const doubleMap = SANSKRIT_DOUBLE_MAP;
        const consMap = SANSKRIT_CONS_MAP;
        const vowMap1 = SANSKRIT_VOW_MAP_1;
        const vowMap2 = SANSKRIT_VOW_MAP_2;
        const getAt = (j) => word.substring(j, j+1);
        const isCons = (a) => (Boolean(doubleMap[a]) || Boolean(consMap[a])
            || Object.values(consMap).indexOf(a) !== -1
            || Object.values(doubleMap).indexOf(a) !== -1);
        for (const [key, val] of Object.entries(doubleMap)) {
            word = word.replaceAll(key, val);
        }
        for (const [key, val] of Object.entries(consMap)) {
            word = word.replaceAll(key, val);
        }
        for (let i = word.length-1; i >= 0; i--) {
            if (isCons(getAt(i)) && (isCons(getAt(i+1)) || (i === word.length-1 && lang === 'sa'))) {
                word = word.substring(0, i+1) + '्' + word.substring(i+1);
            }
        }

        for (let i = word.length-1; i >= 1; i--) {
            if (isCons(getAt(i-1))) {
                if (vowMap1[getAt(i)])
                    word = word.substring(0,i) + vowMap1[getAt(i)] + word.substring(i+1);
                else if (getAt(i) === 'a')
                    word = word.substring(0,i) + word.substring(i+1);
            }
        }
        for (const [key, val] of Object.entries(vowMap2)) {
            word = word.replaceAll(key, val);
        }
        word = word.replaceAll('Ř','ढ़').replaceAll('ř','ड़').replaceAll('L','ळ');
    } else {
        // Perso-Arabic script
        let res = word;
        const getAt = (j) => res.substring(j, j+1);
        if (res.endsWith('āMv'))
            res = res.substring(0, res.length-3) + 'āoM';
        for (let i = res.length-2; i >= 0; i--) {
            if (URDU_VOW_MAP[getAt(i+1)]) {
                if (getAt(i) === 'i')
                    res = res.substring(0, i) + 'ī' + res.substring(i+1);
                else if (getAt(i) === 'u')
                    res = res.substring(0, i) + 'ū' + res.substring(i+1);
            }
        }
        for (let i = res.length-1; i > 0; i--) {
            if (URDU_VOW_MAP_2[getAt(i)] && VOWELS.has(getAt(i-1))) {
                let mapped = URDU_VOW_MAP_2[getAt(i)];
                if (i === res.length-1 && URDU_MAP_F[getAt(i)])
                    mapped = mapped.substring(0, mapped.length-1) + URDU_MAP_F[getAt(i)];
                res = res.substring(0, i) + mapped + res.substring(i+1);
            }
        }
        for (let i = res.length-1; i > 0; i--) {
            if (getAt(i) === 'h' && URDU_CONS_MAP[getAt(i-1)]) {
                res = res.substring(0, i) + 'ھ' + res.substring(i+1);
            } else if (URDU_CONS_MAP[getAt(i)] && getAt(i) === getAt(i-1)) {
                res = res.substring(0, i) + 'ّ' + res.substring(i+1);
            }
        }
        for (let i = res.length-1; i >= 0; i--) {
            if (URDU_VOW_MAP[getAt(i)]) {
                let mapped = URDU_VOW_MAP[getAt(i)];
                if (i === res.length-1 && URDU_MAP_F[getAt(i)])
                    mapped = mapped.substring(0, mapped.length-1) + URDU_MAP_F[getAt(i)];
                res = res.substring(0, i) + mapped + res.substring(i+1);
            } else if (URDU_CONS_MAP[getAt(i)]) {
                let mapped = URDU_CONS_MAP[getAt(i)];
                if (i === res.length-1 && URDU_MAP_F[getAt(i)])
                    mapped = mapped.substring(0, mapped.length-1) + URDU_MAP_F[getAt(i)];
                res = res.substring(0, i) + mapped + res.substring(i+1);
            }
        }
        if (VOWELS.has(word.substring(0, 1))) {
            res = 'ا' + res;
            if (res.substring(0, 3) === 'اَا')
                res = 'آ' + res.substring(3);
        }
        word = res;
    }

    return word;
}

function sanskritRomanOrthography(word, lang) {
    let res = sanskritDisplay(word, lang === 'sa');
    if (lang !== 'sa' && lang !== 'pi') {
        const getAt = (j) => res.substring(j, j+1);
        res = schwaDeletion(res);
        if (lang === 'mr' && SANSKRIT_CONS.has(getAt(res.length-2)) && getAt(res.length-1) === 'ṁ')
            res = res.substring(0, res.length-1) + 'a';
        res = res.replaceAll('ś','sh');
        if (lang === 'mr') {
            res = res.replaceAll('j','z');
        } else {
            if (res.endsWith('āṁv'))
                res = res.substring(0, res.length-3) + 'āõṁ';
            res = res.replaceAll('cch','CCH').replaceAll('c','ch').replaceAll('CCH','cch');
            res = res.replaceAll('āṁ','ãṁ').replaceAll('īṁ','ĩṁ').replaceAll('ūṁ','ũṁ')
            .replaceAll('eṁ','ẽṁ').replaceAll('oṁ','õṁ');
        }
        res = res.replaceAll('è','ai').replaceAll('ò','au');
        res = res.replaceAll('ṁ','n');
    }
    return res;
}