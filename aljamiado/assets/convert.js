let inputLang = 'es';
let outputLang = 'Aljamiado';
const outputLangs = {
    'es': ['Aljamiado'],
    'ms': ['Jawi'],
    'tr': ['Ottoman'],
};

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
    let punct = [' ',',',':',';','.','!','?',';','\n','¿','¡','#','"','“','”'];
    if (inputLang !== 'ms')
        punct.push('-');
    for (let i = 0; i < text.length; i++) {
        chars.push(text[i]);
        if (contains(punct, text[i])) {
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
    } else if (inLang === 'ms') {
        return malayJawi(properOrthography(startWord, inLang).toLowerCase());
    } else if (inLang === 'tr') {
        return ottomanTurkish(properOrthography(startWord, inLang).toLowerCase());
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
    let output = input;
    if (lang !== 'tr') {
        output = input.toLowerCase();
    }
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
    } else if (lang === 'tr') {
        output = output.replaceAll('I','ı').replaceAll('İ','i');
        output = output.toLowerCase();
    }
    output = output.replaceAll("'", "");
    if (lang !== 'tr')
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
        '“' : '”',
        '”' : '“',
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
            ...PREDEFINED_ALJAMIADO,
        };
        predefined['elicsir'] = predefined['elixir'];
        predefined['taça'] = predefined['taza'];
        predefined['açúcar'] = predefined['azúcar'];
        for (const word of Object.keys(predefined)) {
            if (!(word.endsWith('o') || word.endsWith('a') || word.endsWith('e'))) {
                if (word.endsWith('ón')) {
                    let base = word.substring(0,word.length-2);
                    let current = predefined[word];
                    predefined[base+'ones'] = current.substring(0,current.length-1) + 'َاشْ';
                }
                continue;
            }
            if (predefined[word].endsWith('ة')) {
                let current = predefined[word];
                predefined[word+'s'] = current.substring(0,current.length-1) + 'شْ';
                continue;
            }
            predefined[word+'s'] = predefined[word] + 'شْ';
        }
    }
    const predefined_latin = PREDEFINED_SPANISH;
    if (word === 'y')
        word = 'i';
    for (const [key, value] of Object.entries(predefined)) {
        if (word === key) {
            word = value.replaceAll('ٗ','');
            if (document.es_output.maghrebi.checked) {
                word = word.replaceAll('ف','ڢ').replaceAll('ق','ڧ');
            }
            return word;
        }
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
    word = word.replaceAll('de:e','de').replaceAll('sobre:e','sobre').replaceAll('s:s','s s').replaceAll('l:l','l l')
        .replaceAll(':h',':H').replaceAll('y:','i:').replaceAll(':r',':rr')
        .replaceAll('a:i','a\'i').replaceAll('e:i','e\'i').replaceAll('o:i','o\'i')
        .replaceAll('a:u','a\'u').replaceAll('e:u','e\'u').replaceAll('o:u','o\'u')
        .replaceAll(':','');
    word = word.replaceAll('aí','ayi').replaceAll('eí','eyi').replaceAll('oí','oyi').replaceAll('uí','uyi');
    word = word.replaceAll('aú','awu').replaceAll('eú','ewu').replaceAll('iú','iwu').replaceAll('oú','owu');
    word = word.replaceAll('á','a').replaceAll('é','e').replaceAll('í','i').replaceAll('ó','o').replaceAll('ú','u');
    word = word.replaceAll('ge','je').replaceAll('gi','ji').replaceAll('gue','ge').replaceAll('gui','gi');
    word = word.replaceAll('ce','çe').replaceAll('ci','çi').replaceAll('que','ke').replaceAll('qui','ki')
        .replaceAll('q','k').replaceAll('güe','guwe').replaceAll('güi','guwi').replaceAll('ü','u');
    word = word.replaceAll('ch','č').replaceAll('c','k').replaceAll('zk','çk');
    word = word.replaceAll('ia','iya').replaceAll('ie','iye').replaceAll('io','iyo').replaceAll('iu','iyu');
    word = word.replaceAll('ua','uwa').replaceAll('ue','uwe').replaceAll('ui',"uwi").replaceAll('uo','uwo');
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
    word = word.replaceAll('ai','ay').replaceAll('ei','ey').replaceAll('oi','oy');
    word = word.replaceAll('au','aw').replaceAll('eu','ew').replaceAll('ou','ow');
    word = "'" + word;
    word = word.replaceAll('ee',"é").replaceAll('aa','á').replaceAll('oo','ú').replaceAll('uu','ú');
    for (const strong of ['a','e','o']) {
        for (const strong2 of ['a','o']) {
            word = word.replaceAll(strong+strong2, strong + "'" + strong2);
        }
        word = word.replaceAll(strong+'e', strong+"'é");
    }
    word = word.replaceAll('o','u');

    const cons_map = CONS_MAP_ALJAMIADO;
    const vow_map = VOW_MAP_ALJAMIADO;
    const vow_map_2 = VOW_MAP_2_ALJAMIADO;
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

    const consSet = new Set(Object.values(cons_map));
    const diacritic_set = new Set(['َ','ِ','ُ','ّ','ٗ','ْ']);
    for (let i = word.length; i >= 0; i--) {
        let char = word.substring(i,i+1);
        let next;
        if (i === word.length)
            next = '';
        else
            next = word.substring(i+1,i+2);
        if ((consSet.has(char) || char === 'ّ') && !diacritic_set.has(next)) {
            word = word.substring(0,i+1) + 'ْ' + word.substring(i+1);
        }
    }
    word = word.replaceAll('ٗ','');
    if (document.es_output.maghrebi.checked) {
        word = word.replaceAll('ف','ڢ').replaceAll('ق','ڧ');
    }

    return word;
}

function malayJawi(word) {
    if (word === '-')
        return word;
    const predefined = PREDEFINED_JAWI;
    if (predefined[word] !== undefined) {
        return predefined[word];
    }

    const hyphen = word.indexOf('-');
    let vowelCount = 0;
    for (let i = 0; i < (hyphen === -1 ? word.length : hyphen); i++) {
        if (VOWELS.has(word.substring(i,i+1)))
            vowelCount++;
    }
    if (hyphen !== -1) {
        if (word.substring(0,hyphen) === word.substring(hyphen+1)) {
            if (vowelCount <= 2) {
                return malayJawi(word.substring(0,hyphen)) + '۲';
            }
        }
        return malayJawi(word.substring(0,hyphen)) + '-' + malayJawi(word.substring(hyphen+1));
    }
    console.log(word);
    const colon = word.indexOf(':');
    if (colon !== -1) {
        return malayJawi(word.substring(0,colon)) + '\u200c' + malayJawi(word.substring(colon+1));
    }
    word = word.replaceAll('´','');
    word = word.replaceAll('ĕ','e').replaceAll('x','Ks');
    word = word.replaceAll('sy','š').replaceAll('sh','š');
    word = word.replaceAll('ny','ñ').replaceAll('ng','ŋ').replaceAll('kh','X');
    word = word.replaceAll('ai','à').replaceAll('au','ä').replaceAll('oi','ò');
    word = word.replaceAll('o','u');

    word = word.replaceAll('K','k').replaceAll('aa','a`').replaceAll('ua','u`a')
    .replaceAll('ea','ì').replaceAll('ee','ì').replaceAll('ei','ìy').replaceAll('eu','ìw')
    .replaceAll('éi','é`i').replaceAll('ié','i`é');
    const closedSyllable = []
    for (let i = 0; i < word.length; i++) {
        let prev = word.substring(i-1,i);
        let here = word.substring(i, i+1);
        let next = word.substring(i+1, i+2);
        let next2 = word.substring(i+2, i+3);
        if (VOWELS.has(here) && (VOWELS.has(next) || VOWELS.has(next2) || prev === '`' || next === '`')) {
            closedSyllable.push(false);
        } else {
            closedSyllable.push(true);
        }
    }
    for (let i = 1; i < word.length; i++) {
        let here = word.substring(i, i+1);
        let prev = word.substring(i-1,i);
        if (VOWELS.has(prev) && closedSyllable[i-1] && here === 'k')
            word = word.substring(0,i) + 'q' + word.substring(i+1);
    }
    
    if (word.startsWith("w") && vowelCount === 1 && VOWELS.has(word.substring(1,2))) {
        closedSyllable[1] = false;
    } else if (word.length === 5 && !VOWELS.has(word.substring(0,1))
        && word.substring(1,4) === 'éwa' && !VOWELS.has(word.substring(4,5))) {
        closedSyllable[3] = false;
    }
    
    if (vowelCount >= 2 && word.match(/[^aeéiou]a[btpsgnñckjmy]a$/)) {
        word = word.substring(0, word.length-1);
    }
    if (vowelCount >= 2 && word.match(/^[^aeéiou]aha/)) {
        word = word.substring(0, 1) + 'e' + word.substring(2);
    }

    const cons_map = CONS_MAP_JAWI;
    const vow_map_1 = VOW_MAP_1_JAWI;
    const vow_map_open = VOW_MAP_OPEN_JAWI;
    const vow_map_closed = VOW_MAP_CLOSED_JAWI;
    const vow_map_2 = VOW_MAP_2_JAWI;

    word = "'" + word + "'";
    closedSyllable.unshift(false);
    closedSyllable.push(false);

    for (const [key, value] of Object.entries(cons_map)) {
        word = word.replaceAll(key, value);
    }
    for (const [key, value] of Object.entries(vow_map_1)) {
        word = word.replaceAll("'"+key, value);
    }
    for (const [key, value] of Object.entries(vow_map_2)) {
        word = word.replaceAll(key+"'", value);
    }
    for (let i = word.length-2; i >= 0; i--) {
        let char = word.substring(i,i+1);
        if (!closedSyllable[i] && vow_map_open[char] !== undefined) {
            word = word.substring(0,i) + vow_map_open[char] + word.substring(i+1);
        } else if (closedSyllable[i] && vow_map_closed[char] !== undefined) {
            word = word.substring(0,i) + vow_map_closed[char] + word.substring(i+1);
        }
    }
    word = word.replaceAll('يءي', 'يئي').replaceAll('وءا', 'وا');

    word = word.replaceAll("'",'');

    return word;
}

function ottomanTurkish(word) {
    const predefined = PREDEFINED_OTTOMAN;
    if (predefined[word] !== undefined) {
        return predefined[word];
    }
    if (predefined[word.replace(/\_$/g, '')] !== undefined) {
        return predefined[word.replace(/\_$/g, '')];
    }
    if (PREDEFINED_TURKISH[word] !== undefined) {
        word = PREDEFINED_TURKISH[word];
    }
    if (PREDEFINED_TURKISH[word.replace(/\_$/g, '')] !== undefined) {
        word = PREDEFINED_TURKISH[word.replace(/\_$/g, '')] + '_';
    }

    const backMap = {
        'k':'q', 't':'T', 'd':'T', 'g':'G', 's':'S',
    };

    word = word.replaceAll('ğ', 'g');
    word = word.replace(/[ˆ¨]/g, '');
    word = word.replace(/(\S+)([aı])([^aıoueiöüâû0]+)lı$/g, '$1$2$3_-lu');
    word = word.replace(/(\S+)([ei])([^aıoueiöüâû0]+)li$/g, '$1$2$3_-lü');
    word = word.replace(/(\S+)([ou])([^aıoueiöüâû0]+)lu$/g, '$1$2$3_-lu');
    word = word.replace(/(\S+)([öü])([^aıoueiöüâû0]+)lü$/g, '$1$2$3_-lü');
    if (word.indexOf('-') !== -1) {
        let hyphen = word.indexOf('-');
        let first = word.substring(0, hyphen);
        let second = word.substring(hyphen+1);
        word = ottomanTurkish(first) + ottomanTurkish(second);
        word = word.replace(/یی$/g, 'Y').replace(/^یی/g, 'Y');
        word = word.replaceAll('یی', 'ی').replaceAll('Y', 'یی');
        word = word.replace(/ییه$/g, 'یه');
        return word;
    }

    // plurals
    word = word.replace(/(\S+)ler(|i|e|de|den|in)$/g, '$1_-l0r$2');
    word = word.replace(/(\S+)lar(|ı|a|da|dan|ın)$/g, '$1_-l0r$2');

    // cases
    word = word.replace(/(\S+)([^aıoueiöüâû0])([ıiuü])$/g, '$1$2-0$3');
    word = word.replace(/(\S+)([aıoueiöüâû0])y([ıiuü])$/g, '$1$2_-y$3');
    word = word.replace(/(\S+)([^aıoueiöüâûtd0])([ae])$/g, '$1$2-0$3');
    word = word.replace(/(\S+)([aıoueiöüâû0])y([ae])$/g, '$1$2_-y$3');
    word = word.replace(/(\S+)da$/g, '$1_-Da');
    word = word.replace(/(\S+)([ptçkfsş])ta$/g, '$1$2-Da');
    word = word.replace(/(\S+)de$/g, '$1_-de');
    word = word.replace(/(\S+)([ptçkfsş])te$/g, '$1$2-de');
    word = word.replace(/(\S+)dan$/g, '$1_-d0n');
    word = word.replace(/(\S+)([ptçkfsş])tan$/g, '$1$2-d0n');
    word = word.replace(/(\S+)den$/g, '$1_-d0n');
    word = word.replace(/(\S+)([ptçkfsş])ten$/g, '$1$2-d0n');
    word = word.replace(/(\S+)([^aıoueiöüâû0])(?:[ıiuü])n$/g, '$1$2_-0n');
    word = word.replace(/(\S+)([aıoueiöüâû0])n(?:[ıiuü])n$/g, '$1$2_-n0n');

    word = word.replace(/([kg])([aıou])/g, (_, p1, p2) => backMap[p1] + p2);
    word = word.replace(/^([tds])([aıou])/g, (_, p1, p2) => backMap[p1] + p2);
    word = word.replace(/^D([aıou])/g, 'd$1');
    word = word.replace(/([aıou])([kgs])/g, (_, p1, p2) => p1 + backMap[p2]);

    word = word.replace(/(\S+)maq/g, '$1m0q');
    word = word.replace(/([ei])([^aıoueiöüâû0]*)lik$/g, '$1$2_-l0k');
    word = word.replace(/([ouû])([^aıoueiöüâû0]*)luq$/g, '$1$2_-l0q');
    word = word.replace(/([öü])([^aıoueiöüâû0]*)lük$/g, '$1$2_-l0k');
    word = word.replace(/([ei])([^aıoueiöüâû0]*)dir$/g, '$1$2_-d0r');
    word = word.replace(/([ouû])([^aıoueiöüâû0]*)dur$/g, '$1$2_-d0r');
    word = word.replace(/([öü])([^aıoueiöüâû0]*)dür$/g, '$1$2_-d0r');
    word = word.replace(/n([r])/g, 'ñ$1');
    if (word.indexOf('-') !== -1) {
        let hyphen = word.indexOf('-');
        let first = word.substring(0, hyphen);
        let second = word.substring(hyphen+1);
        word = ottomanTurkish(first) + ottomanTurkish(second);
        word = word.replace(/یی$/g, 'Y').replace(/^یی/g, 'Y');
        word = word.replaceAll('یی', 'ی').replaceAll('Y', 'یی');
        word = word.replace(/ییه$/g, 'یه');
        return word;
    }

    let cons_map = CONS_MAP_OTTOMAN;
    cons_map['g'] = cons_map['k'];
    cons_map['ñ'] = cons_map['k'];
    const vow_map_1 = VOW_MAP_1_OTTOMAN;
    const vow_map_m = VOW_MAP_MID_OTTOMAN;
    const vow_map_2 = VOW_MAP_2_OTTOMAN;
    word = word.replaceAll('_','0');
    word = word.replace(/([^aıoueiöüâû0])/g, (_, p1) => cons_map[p1]);
    word = word.replace(/^([aıoueiöüâû0])/g, (_, p1) => vow_map_1[p1]);
    word = word.replace(/([aıoueiöüâû0])$/g, (_, p1) => vow_map_2[p1]);
    word = word.replace(/([aıoueiöüâû0])/g, (_, p1) => vow_map_m[p1]);
    word = word.replace(/یی$/g, 'Y').replace(/^یی/g, 'Y');
    word = word.replaceAll('یی', 'ی').replaceAll('Y', 'یی');
    word = word.replace(/ییه$/g, 'یه');

    return word;
}