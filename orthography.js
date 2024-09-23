const outputLangs = {
    'la': ['es','fr','pt','it'],
    'sa': ['hi','ur','pa','mr','pi']
};
const langNames = {
    'es':'Spanish', 'fr':'French', 'pt': 'Portuguese', 'it':'Italian',
    'hi':'Hindi', 'ur':'Urdu', 'pa':'Punjabi', 'mr':'Marathi',
    'pi':'Pali'
};

const SHORT_VOWELS = new Set(['a','e','i','o','u']);
const VOWELS = new Set(['a','e','i','o','u','ā','ē','ī','ō','ū',
    'æ','œ','ó' /* au */, 'è' /* ɛ */, 'ò' /* ɔ */,
    'ã','ẽ','ĩ','õ','ũ','ë','ì',
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
const WESTERN_ROMANCE = new Set(['es','fr','pt']);

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
    'H':'ः','M':'ं','~':'ँ'
};
const SANSKRIT_VOW_MAP_2 = {
    'a':'अ','ā':'आ','i':'इ','ī':'ई','u':'उ','ū':'ऊ',
    'e':'ए','è':'ऐ','o':'ओ','ò':'औ',
    'R':'ऋ','H':'ः','M':'ं','~':'ँ'
};
const GURMUKHI_DOUBLE_MAP = {
    'kh':'ਖ', 'gh':'ਘ',
    'ch':'ਛ', 'jh':'ਝ',
    'Th':'ਠ', 'Dh':'ਢ',
    'th':'ਥ', 'dh':'ਧ',
    'ph':'ਫ', 'bh':'ਭ'
};
const GURMUKHI_CONS_MAP = {
    'k':'ਕ','g':'ਗ','ń':'ਙ',
    'c':'ਚ','j':'ਜ','ñ':'ਞ',
    'T':'ਟ','D':'ਡ','N':'ਣ',
    't':'ਤ','d':'ਦ','n':'ਨ',
    'p':'ਪ','b':'ਬ','m':'ਮ',
    'y':'ਯ','r':'ਰ','l':'ਲ','v':'ਵ','L':'ਲ਼',
    'z':'ਸ਼','S':'ਸ਼','s':'ਸ','h':'ਹ',
    'ř':'ੜ'
};
const GURMUKHI_VOW_MAP_1 = {
    'ā':'ਾ','i':'ਿ','ī':'ੀ','u':'ੁ','ū':'ੂ',
    'e':'ੇ','è':'ੈ','o':'ੋ','ò':'ੌ',
    'M':'ੰ','~':'ੰ'
};
const GURMUKHI_VOW_MAP_2 = {
    'a':'ਅ','ā':'ਆ','i':'ਇ','ī':'ਈ','u':'ਉ','ū':'ਊ',
    'e':'ਏ','è':'ਐ','o':'ਓ','ò':'ਔ',
    'M':'ੰ','~':'ੰ'
};
const THAI_DOUBLE_MAP = {
    'kh':'ข', 'gh':'ฆ',
    'ch':'ฉ', 'jh':'ฌ',
    'Th':'ฐ', 'Dh':'ฒ',
    'th':'ถ', 'dh':'ธ',
    'ph':'ผ', 'bh':'ภ'
};
const THAI_CONS_MAP = {
    'k':'ก','g':'ค','ń':'ง',
    'c':'จ','j':'ช','ñ':'ญ',
    'T':'ฏ','D':'ฑ','N':'ณ',
    't':'ต','d':'ท','n':'น',
    'p':'ป','b':'พ','m':'ม',
    'y':'ย','r':'ร','l':'ล','v':'ว','L':'ฬ',
    'z':'ศ','S':'ษ','s':'ส','h':'ห'
};
const THAI_VOW_MAP_1 = {
    'ā':'า','i':'ิ','ī':'ี','u':'ุ','ū':'ู',
    'e':'เ','è':'ไ','o':'โ','ò':'เา',
    'R':'ฺฤ',
    'H':'ะ','M':'ํ'
};
const THAI_VOW_MAP_2 = {
    'a':'อ','ā':'อา','i':'อิ','ī':'อี','u':'อุ','ū':'อู',
    'e':'เอ','è':'ไอ','o':'โอ','ò':'เอา',
    'R':'ฤ','H':'ะ','M':'ํ'
};
const KHMER_DOUBLE_MAP = {
    'kh':'ខ', 'gh':'ឃ',
    'ch':'ឆ', 'jh':'ឈ',
    'Th':'ឋ', 'Dh':'ឍ',
    'th':'ថ', 'dh':'ធ',
    'ph':'ផ', 'bh':'ភ'
};
const KHMER_CONS_MAP = {
    'k':'ក','g':'គ','ń':'ង',
    'c':'ច','j':'ជ','ñ':'ញ',
    'T':'ដ','D':'ឌ','N':'ណ',
    't':'ត','d':'ទ','n':'ន',
    'p':'ប','b':'ព','m':'ម',
    'y':'យ','r':'រ','l':'ល','v':'វ','L':'ឡ',
    'z':'ឝ','S':'ឞ','s':'ស','h':'ហ'
};
const KHMER_VOW_MAP_1 = {
    'ā':'ា','i':'ិ','ī':'ី','u':'ុ','ū':'ូ',
    'e':'េ','è':'ៃ','o':'ោ','ò':'ៅ',
    'R':'ឫ',
    'H':'ះ','M':'ំ'
};
const KHMER_VOW_MAP_2 = {
    'a':'អ','ā':'អា','i':'ឥ','ī':'ឦ','u':'ឧ','ū':'ឩ',
    'e':'ឯ','è':'ឰ','o':'ឱ','ò':'ឳ',
    'R':'ឫ','H':'ះ','M':'ំ'
};
const NON_DEVANAGARI_CONS_MAP = {'pa':GURMUKHI_CONS_MAP, 'th':THAI_CONS_MAP, 'km':KHMER_CONS_MAP};
const NON_DEVANAGARI_DOUBLE_MAP = {'pa':GURMUKHI_DOUBLE_MAP, 'th':THAI_DOUBLE_MAP, 'km':KHMER_DOUBLE_MAP};
const NON_DEVANAGARI_VOW_MAP_1 = {'pa':GURMUKHI_VOW_MAP_1, 'th':THAI_VOW_MAP_1, 'km':KHMER_VOW_MAP_1};
const NON_DEVANAGARI_VOW_MAP_2 = {'pa':GURMUKHI_VOW_MAP_2, 'th':THAI_VOW_MAP_2, 'km':KHMER_VOW_MAP_2};

const URDU_CONS_MAP = {
    'k': 'ک', 'g': 'گ',
    'c': 'چ', 'j': 'ج',
    'T': 'ٹ', 'D': 'ڈ',
    't': 'ت', 'd': 'د', 'n': 'ن',
    'p': 'پ', 'b': 'ب', 'm': 'م',
    'y': 'ی', 'r': 'ر', 'l': 'ل', 'v': 'و',
    's': 'س', 'h': 'ہ',
    'ř': 'ڑ', 'M': 'ن', 'N': 'ن'
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
    'e': 'ے', 'è': 'ے', 'M': 'ں', '~': 'ں'
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
    let output = input.w;
    let stress = input.stress;

    const charAt = (j) => output.substring(j,j+1);
    if (lang === 'fr') {
        output = output.replaceAll('èlë','elle');
        if (stress === output.length-3 && charAt(output.length-3) === 'è' && CONSONANTS.has(charAt(output.length-2)) && charAt(output.length-1) === 'ë') {
            output = output.substring(0, output.length-3) + 'È' + output.substring(output.length-2);
        }
        output = output.replaceAll('è','e').replaceAll('È','è');
        output = output.replaceAll('č','ch');
        output = output.replaceAll('an','ann').replaceAll('en','enn').replaceAll('on','onn')
            .replaceAll('am','amm').replaceAll('em','emm').replaceAll('om','omm');
        output = output.replaceAll('ě','e').replaceAll('ë','e');
        output = output.replaceAll('çe','ce').replaceAll('çi','ci').replaceAll('çè','cè');
        if (output.substring(output.length-2) === 'qw') {
            output = output.substring(0, output.length-1);
        }
    }
    if (lang === 'it') {
        if (stress === output.length-1 && numVowels(output) > 1) {
            if (output.endsWith('è') || output.endsWith('ò')) {
                output = output.substring(0,output.length-1)+output.substring(output.length-1).toUpperCase();
            }
            if (output.endsWith('e')) {
                output = output.substring(0,output.length-1)+'é';
            }
            if (output.endsWith('a')) {
                output = output.substring(0,output.length-1)+'à';
            }
        }
        output = output.replaceAll('è','e').replaceAll('ò','o');
        output = output.toLowerCase();
        output = output.replaceAll('jy','j').replaceAll('y','j');
        output = output.replaceAll('j','i');
        output = output.replaceAll('w','u');
    }
    if (lang === 'es' || lang === 'fr' || lang === 'pt') {
        if (output.startsWith('w') || (lang === 'fr' && output.startsWith('y'))) {
            output = 'h'+output;
            stress += 1;
        }
        output = output.replaceAll('y','j');
        if (output.startsWith('j'))
            output = 'y'+output.substring(1);
        if (output.endsWith('j') && lang === 'es')
            output = output.substring(0,output.length-1)+'y';
        output = replaceIntervocal(output, 'j', 'y');
        output = output.replaceAll('j', 'i');
        output = output.replaceAll('w','u');
    }
    if (lang === 'pt') {
        // add accent marks
        const accent_map = {'a':'á','e':'ê','è':'é','i':'í','o':'ô','ò':'ó','u':'ú'};
        let stress_c = output.substring(stress, stress+1);
        let last = output.substring(output.length-1);
        let last2 = output.substring(output.length-2);
        let useAccent = (stress !== getPortugueseStress(output)
            || (numVowels(output) === 1 && (contains(['a','e','è','o','ò'], last) || contains(['as','es','ès','os','òs'], last2))));
        if (useAccent && accent_map[stress_c]) {
            output = output.substring(0,stress) + accent_map[stress_c] + output.substring(stress+1);
        }
        output = output.replaceAll('è','e').replaceAll('ò','o');
    }
    if (lang === 'fr') {
        for (const vow of ['e','i','ê','î','è']) {
            output = output.replaceAll('ž'+vow,'g'+vow);
        }
        output = output.replaceAll('ž','j');
        output = replaceIntervocal(output, 's', 'ss');
        output = output.replaceAll('z','s');
        output = replaceIntervocal(output, 'ż', 's').replaceAll('ż','z');
    }
    if (lang === 'pt') {
        output = replaceIntervocal(output, 's', 'ss');
        output = output.replaceAll('z','s');
        output = output.replaceAll('ż','z');
    }
    if (lang === 'it') {
        output = output.replaceAll('lJ','gl');
        output = output.replaceAll('cJi','ci').replaceAll('cJe','ce').replaceAll('cJè','cè').replaceAll('cJ','ci');
    }
    if (lang === 'es') {
        output = output.replaceAll('çe','ce').replaceAll('çi','ci').replaceAll('ç','z');
    }
    if (lang === 'pt') {
        output = output.replaceAll('çe','ce').replaceAll('çi','ci').replaceAll('çé','cé').replaceAll('çê','cê').replaceAll('çí','cí');
        if (output.startsWith('ç'))
            output = 's' + output.substring(1);
    }
    if (lang === 'fr') {
        output = output.replaceAll('çi','ci');
    }
    if (lang === 'es') {
        // add accent marks
        const accent_map = {'a':'á','e':'é','i':'í','o':'ó','u':'ú'};
        let stress_c = output.substring(stress, stress+1);
        if (stress !== getSpanishStress(output) && accent_map[stress_c]) {
            output = output.substring(0,stress) + accent_map[stress_c] + output.substring(stress+1);
        }
        output = output.replaceAll('č','ch').replaceAll('x','j');
    }
    if ((lang === 'es' || lang === 'pt') && latinWord.startsWith('h') && !output.startsWith('h')) {
        output = 'h'+output;
    }
    if (lang === 'pt') {
        output = output.replaceAll('č','ch').replaceAll('ʒ','j');
    }
    if (lang === 'fr') {
        output = output.replaceAll('õne','õnne').replaceAll('ãne','ãnne').replaceAll('ẽne','ẽnne');
        output = output.replaceAll('ã','a').replaceAll('ẽ','e').replaceAll('õ','o');
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
        .replaceAll('ng','ń').replaceAll('jn','jñ');
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
        return sanskritDisplay(devanagari_to_roman(input));
    }
    return input;
}

const isRoman = (w) => (SANSKRIT_CONS.union(VOWELS).union(new Set(['R']))).intersection(new Set(w.split(''))).size > 0;

function nativeOrthography(word, lang) {
    word = sanskritOrthography(word, lang === 'sa');

    const last = word.substring(word.length-1);
    const isGurmukhi = (lang === 'pa' && document.pa_settings.pa_script.value === 'gurmukhi');
    const vowelMarks = document.ur_pa_settings.vowel_marks.checked;
    const isBrahmic = !(lang === 'ur' || (lang === 'pa' && !isGurmukhi));
    if (lang !== 'sa' && lang !== 'pi' && isBrahmic && SANSKRIT_CONS.has(last) && last != 'M' && last != 'H') {
        word += 'a'; // no schwa deletion in writing
    }
    if (lang !== 'sa' && lang !== 'pi') {
        if (lang !== 'mr' && isBrahmic) {
            word = word.replaceAll('āM','ā~').replaceAll('aM','a~').replaceAll('uM','u~').replaceAll('ūM','ū~');
        }
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
        let scriptLang = lang;
        if (lang === 'pi')
            scriptLang = document.pi_settings.pi_script.value;
        const consMap = NON_DEVANAGARI_CONS_MAP[scriptLang] || SANSKRIT_CONS_MAP;
        const doubleMap = NON_DEVANAGARI_DOUBLE_MAP[scriptLang] || SANSKRIT_DOUBLE_MAP;
        const vowMap1 = NON_DEVANAGARI_VOW_MAP_1[scriptLang] || SANSKRIT_VOW_MAP_1;
        const vowMap2 = NON_DEVANAGARI_VOW_MAP_2[scriptLang] || SANSKRIT_VOW_MAP_2;
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
        
        if (isGurmukhi) {
            const ADDAK = 'ੱ';
            for (const cons of Object.keys(consMap)) {
                word = word.replaceAll(consMap[cons]+'्'+consMap[cons], ADDAK+consMap[cons]);
                if (doubleMap[cons+"h"]) {
                    word = word.replaceAll(consMap[cons]+'्'+doubleMap[cons+"h"], ADDAK+doubleMap[cons+"h"]);
                }
            }
            for (const vow of ['ā','ē','è','o']) {
                const TIPPI = 'ੰ';
                const BINDI = 'ਂ';
                word = word.replaceAll(vowMap1[vow]+TIPPI, vowMap1[vow]+BINDI);
                word = word.replaceAll(vowMap2[vow]+TIPPI, vowMap2[vow]+BINDI);
            }
            word = word.replaceAll('्'+consMap['r'], '੍'+consMap['r']);
            word = word.replaceAll('्'+consMap['v'], vowMap1['u']);
            word = word.replaceAll('्'+consMap['y'], vowMap1['i']);
            word = word.replaceAll('्'+consMap['h'], '੍'+consMap['h']);
            word = word.replaceAll('्','');
        } else if (scriptLang === 'th') {
            for (let i = word.length-1; i > 0; i--) {
                let here = word.substring(i, i+1);
                let prev = word.substring(i-1, i);
                if (contains(['เ','ไ','โ'], here)) {
                    word = word.substring(0, i-1) + here + prev + word.substring(i+1);
                }
            }
            word = word.replaceAll('्', 'ฺ');
        } else if (scriptLang === 'km') {
            word = word.replaceAll('्', '្');
        } else {
            word = word.replaceAll('Ř','ढ़').replaceAll('ř','ड़').replaceAll('L','ळ');
        }
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
        if (!vowelMarks) {
            for (const mark of ['ِ','َ','ُ','ّ']) {
                res = res.replaceAll(mark, '')
            }
        }
        word = res;
    }

    return word;
}

function sanskritRomanOrthography(word, lang) {
    let res = sanskritDisplay(word, lang === 'sa');
    if (lang !== 'sa' && lang !== 'pi') {
        const getAt = (j) => res.substring(j, j+1);
        res = res.replaceAll('aṁ','áṁ');
        res = schwaDeletion(res);
        res = res.replaceAll('á','a');
        if (lang === 'mr' && SANSKRIT_CONS.has(getAt(res.length-2)) && getAt(res.length-1) === 'ṁ')
            res = res.substring(0, res.length-1) + 'a';
        res = res.replaceAll('ś','sh');
        if (lang === 'mr') {
            res = res.replaceAll('j','z');
        } else {
            if (res.endsWith('āṁv'))
                res = res.substring(0, res.length-3) + 'āõṁ';
            res = res.replaceAll('cch','CCH').replaceAll('cc','CCH').replaceAll('c','ch').replaceAll('CCH','cch');
            res = res.replaceAll('āṁ','ãṁ').replaceAll('īṁ','ĩṁ').replaceAll('ūṁ','ũṁ')
            .replaceAll('eṁ','ẽṁ').replaceAll('oṁ','õṁ');
        }
        res = res.replaceAll('è','ai').replaceAll('ò','au');
        if (res.endsWith('ṁ') && contains(['ã','ẽ','ĩ','õ','ũ'], res.substring(res.length-2,res.length-1))) {
            res = res.substring(0, res.length-1);
        }
        res = res.replaceAll('ṁ','n');
    }
    return res;
}

function devanagari_to_roman(word) {
    const cons_map = {};
    const vow_map_1 = {};
    const vow_map_2 = {};
    for (const [rom, dev] of Object.entries(SANSKRIT_CONS_MAP)) {
        cons_map[dev] = rom;
    }
    for (const [rom, dev] of Object.entries(SANSKRIT_DOUBLE_MAP)) {
        cons_map[dev] = rom;
    }
    for (const [rom, dev] of Object.entries(SANSKRIT_VOW_MAP_1)) {
        vow_map_1[dev] = rom;
    }
    for (const [rom, dev] of Object.entries(SANSKRIT_VOW_MAP_2)) {
        vow_map_2[dev] = rom;
    }
    let res = '';
    let i = 0;
    while (i < word.length) {
        let c = word.substring(i,i+1);
        if (cons_map[c]) {
            res += cons_map[c];
            let next_c = word.substring(i+1,i+2);
            if (vow_map_1[next_c]) {
                if (contains(['ं','ः'], next_c))
                    res += 'a';
                res += vow_map_1[next_c];
                i += 1;
            } else if (next_c === '्') {
                i += 1;
            } else {
                res += 'a';
            }
        } else if (vow_map_2[c]) {
            res += vow_map_2[c];
        } else {
            res += c;
        }
        i++;
    }
    return res;
}

function getSpanishStress(word) {
    word = word.replaceAll('qu','kk').replaceAll('gue','gge').replaceAll('gui','ggi');
    for (const vow of ['a','e','i','o','u']) {
        word = word.replaceAll('i'+vow,'y'+vow);
        word = word.replaceAll('u'+vow,'w'+vow);
        word = word.replaceAll(vow+'i',vow+'y');
        word = word.replaceAll(vow+'u',vow+'w');
    }
    let stress = getPrevVowel(word, word.length);
    if (contains(['a','e','i','o','u','s','n'], word.substring(word.length-1))) {
        let newStress = getPrevVowel(word, stress);
        if (newStress !== -1)
            stress = newStress;
    }
    return stress;
}
function getPortugueseStress(word) {
    word = word.replaceAll('qu','kk').replaceAll('gue','gge').replaceAll('gui','ggi');
    for (const vow of ['a','e','è','i','o','ò','u']) {
        word = word.replaceAll(vow+'i',vow+'y');
        word = word.replaceAll(vow+'u',vow+'w');
    }
    let stress = getPrevVowel(word, word.length);
    if (contains(['a','e','o'], word.substring(word.length-1))
        || contains(['as','es','os','am','em'], word.substring(word.length-2))
        || word.endsWith('ens')) {
        let newStress = getPrevVowel(word, stress);
        if (newStress !== -1)
            stress = newStress;
    }
    return stress;
}

function getNextVowel(word, start, vowels=VOWELS) {
    for (let i = start+1; i < word.length; i++) {
        if (vowels.has(word.substring(i,i+1))) {
            return i;
        }
    }
    return -1;
}
function getPrevVowel(word, start, vowels=VOWELS) {
    for (let i = start-1; i >= 0; i--) {
        if (vowels.has(word.substring(i,i+1))) {
            return i;
        }
    }
    return -1;
}