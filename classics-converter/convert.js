function convertWords(text, mapper, inOrthoBox=false) {
    let chars = [];
    let isWord = [];
    for (let i = 0; i < text.length; i++) {
        chars.push(text[i]);
        if (contains([' ',',',':',';','.','!','?',';','-','\n','¿','¡','#','"','“','”'], text[i])) {
            isWord.push(false);
        } else {
            isWord.push(true);
        }
    }
    let words = [];
    let word = '';
    let nonWordMapper = (nw) => {
        if (inputLang === 'la' && inOrthoBox)
            return '';
        return nw;
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

function convertWord(startWord, inLang, outLang, inOrthoBox=false, mapStage=null) {
    if (inLang === 'la') {
        if (inOrthoBox)
            return '';
        return latin_to_lang(startWord, outLang, mapStage);
    } else if (inLang === 'sa') {
        let res = startWord;
        let roman = isRoman(startWord)
        if (!roman)
            res = devanagari_to_roman(res);
        res = sanskrit_to_lang(res, outLang, mapStage);
        if (outLang === 'pi')
            roman = true; // make Roman script the default output for Pali
        if (roman != inOrthoBox)
            return sanskritRomanOrthography(res, outLang);
        else
            return nativeOrthography(res, outLang);
    }
    return startWord;
}

function latin_to_lang(latinWord, lang, mapStage=null) {
    let word = latinOrthography(latinWord.toLowerCase());
    if (mapStage === null) {
        mapStage = (a, b) => console.log(a + ': ' + b);
    }
    mapStage("Latin", new LatinateWord(word));
    word = latin_to_proto_romance(word, lang);
    mapStage("Proto-Romance", word.toString());
    if (WESTERN_ROMANCE.has(lang)) {
        word = romance_to_western_romance(word, lang);
        mapStage("Western Romance", word.toString());
        if (lang === 'fr') {
            word = western_romance_to_french(word);
            mapStage("French", romanceOrthography(word, latinWord, lang));
        } else if (lang === 'es') {
            word = western_romance_to_spanish(word);
            mapStage("Spanish", romanceOrthography(word, latinWord, lang));
        } else if (lang === 'pt') {
            word = western_romance_to_portuguese(word);
            mapStage("Portuguese", romanceOrthography(word, latinWord, lang));
        }
    } else if (lang === 'it') {
        word = romance_to_italian(word);
        mapStage("Italian", romanceOrthography(word, latinWord, lang));
    }
    // word = word.toString();
    word = romanceOrthography(word, latinWord, lang);
    // word = word.toString() + ' ('+romanceOrthography(word,latinWord,lang)+')';
    return word;
}

function latin_to_proto_romance(word, finalLang='') {
    word = new LatinateWord(word);
    
    if (finalLang === 'fr') {
        word.replace('ph','pH');
    } else {
        word.replace('ph','f');
    }
    word.replaceAll(['h','rs','ps','y','ȳ','z','H'], ['','ss','ss','i','ī','s','h']);
    if (finalLang !== 'fr') {
        // keep French clusters for orthography purposes
        word.replaceAll(['pt'], ['tt']);
    }
    word.replaceAt('ins','iNs',0); // retain -ns- as part of prefix
    word.replaceAt('inf','iNf',0);
    word.replaceAt('cons','coNs',0);
    word.replaceAt('conf','coNf',0);
    for (let i = 0; i < 5; i++) {
        // replace -ns- with -s-, plus lengthening
        let short = ['a','e','i','o','u'][i];
        let long = ['ā','ē','ī','ō','ū'][i];
        word.replaceAll([short+'ns', short+'nf', long+'ns', long+'nf'], [long+'s', long+'f', long+'s', long+'f']);
    }
    word.replace('N','n');
    word.replaceAll(['æ','œ'], ['e','ē']);
    word.replaceStressed('e', 'è');
    word.replaceStressed('o', 'ò');
    word.replaceAt('è','e',word.length-1);
    word.replaceAt('ò','o',word.length-1);
    word.replaceAll(['au','ii','iī','īi','īī', 'qu'], ['aw','i','i','i','i', 'qw']);

    // hiatus
    // replace if unstressed
    word.replaceBefore('e', 'ǐ', VOWELS, 1, true);
    word.replaceBefore('i', 'ǐ', VOWELS, 1, true);
    word.replaceBefore('o', 'w', VOWELS, 1, true);
    word.replaceBefore('u', 'w', VOWELS, 1, true);
    // if stressed antepenultimate, shift stress
    let intertonic = word.getIntertonic();
    if (new Set(['e','i','u','o']).has(word.atStress()) && contains(intertonic, word.stress+1)) {
        if (word.atStress() === 'e' || word.atStress() === 'i') {
            word.replaceBefore('e', 'ǐ', VOWELS, 1, false);
            word.replaceBefore('i', 'ǐ', VOWELS, 1, false);
            word.stress += 1;
        } else {
            word.replaceBefore('o', 'w', VOWELS, 1, false);
            word.replaceBefore('u', 'w', VOWELS, 1, false);
            word.stress = word.getLastVowel(VOWELS, 2);
        }
    }
    word.replaceAll(['dǐ', 'gǐ'], ['dJ','gJ']);

    // remove w before unstressed back vowels
    word.replaceStressed('o','O'); word.replaceStressed('ō','Ō');
    word.replaceStressed('u','U'); word.replaceStressed('ū','Ū');
    word.replaceAll(['wo','wu','wō','wū'], ['o','u','ō','ū']);
    word.replaceAll(['O','Ō','U','Ū'], ['o','ō','u','ū']);

    // delabialize /k/ before back vowels; delete /w/ before /o/; delete /j/ before /e/; replace /kwj/ with /kj/
    word.replaceAll(['qwo','qwō','qwu','qwū','ǐē','wō','ǐe','wo','qwǐ'], ['co','cō','cu','cū','ē','ō','ē','ō','cj']);
    word.replaceAll(['ttw','ccw','ppw'], ['tt','cc','pp']); // delete w after geminate
    word.replaceAll(['mn'], ['nn']);
    if (finalLang !== 'pt')
        word.replace('mb','mm');

    // raise /u/ before /i/ or /j/; vocalize /g/ before /m/ (/g/ becomes /j/ before front vowel)
    word.replaceAll(['ui','uj','uJ','uī','gm'], ['ūj','ūj','ūj','ūj', 'wm']);
    word.replaceAll(['uge','ugē','ugi','ugī'], ['ūge','ūgē','ūgi','ūgī']);
    // raise /ē/ and /ō/ before /stj/
    word.replaceAll(['ōstj','ēstj','ōstǐ','ēstǐ'], ['ūstJ','īstJ','ūstǐ','īstǐ']);
    // add supporting vowel to /sC/
    if (word.at(0) === 's' && CONSONANTS.has(word.at(1))) {
        word.replaceAt('s','is',0);
    }
    if (finalLang === 'es' || finalLang === 'pt' || finalLang === 'fr')
        word.replace('ult','ułt'); // dark L

    // vowel shift
    word.replaceAll(['ā','e','ē','i','ī','o','ō','u','ū'],
                    ['A','E','E','Ì','I','O','O','O','U']);
    word.lower();
    // palatalization of cons + /j/ sequences from hiatus
    word.replaceAll(['ee','oo','ǐ'], ['e','o','J']);


    if (word.endsWith('m')) {
        // remove final /m/, or replace with /ne/ in monosyllables
        if (word.numVowels() === 1)
            word.w = word.sub(0, -1) + 'ne';
        else
            word.w = word.sub(0, -1);
    }
    if (finalLang === 'it') {
        if (word.numVowels() === 1)
            word.replace('ì','e');
        word.replaceAt('ì','e',word.length-1);
        word.replace('ì','i');
    } else {
        word.replace('ì','e');
    }
    if (word.numVowels() > 1 && (word.endsWith('er') || word.endsWith('or'))) {
        // final /er/, /or/ become /re/, /ro/
        word.w = word.sub(0, -2) + 'r' + word.sub(-2, -1);
    }
    if (finalLang !== 'es' && finalLang !== 'pt') {
        // replace /ks/ with /s/ finally and before/after a consonant
        word.replaceAt('x', 's', word.length-1);
        word.replaceBefore('x', 's', CONSONANTS);
        word.replaceAfter('x', 's', CONSONANTS);
    }
    if (word.numVowels() === 1 && contains(['n','m'], word.at(-1))) {
        word.w += 'e'; // add final epenthetic /e/ for monosyllables
    }

    // palatalization of /k/ and /g/ before front vowels
    word.replaceBefore('c', 'cJ', FRONT_VOWELS);
    word.replaceBefore('g', 'gJ', FRONT_VOWELS);

    intertonic = word.getIntertonic();
    for (const i of intertonic.reverse()) {
        // lose intertonic vowels with l/r or sVt, except /a/
        let prev = word.at(i-1);
        let next = word.at(i+1);
        if ((prev === 'l' || prev === 'r' || next === 'l' || next === 'r' || (prev === 's' && next === 't'))
        // && (i > word.stress || word.at(i) !== 'a')
        && (word.at(i) !== 'a') && (finalLang === 'fr' || !noLostIntertonic(word, i))
        ) {
            // word.cutAt(i);
            word.replaceAt(word.at(i),'ë',i);
        }
    }

    // replace/remove /b/, /w/ with /β/
    if (finalLang === 'pt')
        word.replace('rb','rv');
    word.replaceIntervocal('b','B');
    word.replaceIntervocal('v','W');
    word.replaceAll(['oBo','uBu', 'oBu', 'uBo'], ['obo', 'ubu', 'obu', 'ubo']);
    word.replaceAll(['oWo','uWu', 'oWu', 'uWo'], ['ovo', 'uvu', 'ovu', 'uvo']);
    word.replaceAll(['òWo','òWu','òBo','òBu'], ['òvo','òvu','òbo','òbu']);
    // maintain b for orthography in Spanish
    if (finalLang !== 'es') {
        word.replace('B', 'W');
    }
    if (finalLang !== 'it')
        word.replaceAll(['Bo','Bu','Bò','Wo','Wu','Wò'], ['o','u','ò','o','u','ò']);
    word.replace('W', 'v');
    word.replace('B', 'b');

    if (finalLang === 'it')
        word.replaceAll(['gj','dj','gJ','dJ'], ['gJ','gJ','gJ','gJ']);
    else if (finalLang === 'es' || finalLang === 'pt')
        word.replaceAll(['gj','dj','gJ','dJ'], ['gJ','dJ','gJ','dJ']);
    else
        word.replaceAll(['gj','dj','gJ','dJ'], ['j','j','j','j']);

    return word;
}

function romance_to_italian(word) {

    // vowel raising in stressed syllables
    // if (CONSONANTS.has(word.at(word.stress+2))) {
    //     if (word.sub(word.stress,word.stress+2) === 'aj') {
    //         word.replaceAt('ca','qwa',word.stress-1);
    //         word.replaceAt('ga','gwa',word.stress-1);
    //         word.replaceStressed('aj','ej');
    //     }
    // }
    word.replace('ë','');
    word.replaceStressed('èj','ej');
    word.replaceStressed('òj','oj');
    let next_j = word.getNextVowel(word.stress) - 1;
    if (word.at(next_j) === 'j' || word.at(next_j) === 'J') {
        // word.replaceStressed('e','i');
        word.replaceStressed('o','u');
        word.replaceStressed('è','e');
        word.replaceStressed('ò','o');
    }

    if (contains(['e','i'], word.at(0)) && word.at(1) === 's' && CONSONANTS.has(word.at(2))) {
        word.cutAt(0);
    }

    // first diphthongization
    let didDiphthong = 0;
    for (let i = word.length-1; i >= 0; i--) {
        let openCriterion = openSyllable(word.w, i, true, true, VOWELS);
        if (i === word.stress && openCriterion) {
            if ((word.at(i) === 'è' || word.at(i) === 'ò')
            && !(word.at(i) === 'ò' && (word.at(i+1) === 'n' || word.at(i+1) === 'm') && CONSONANTS.has(word.at(i+2)))) {
                word.replaceAt(word.at(i), word.at(i).toUpperCase(), i);
                didDiphthong++;
            }
        } else {
            if ((word.at(i) === 'i' || word.at(i) === 'u') && word.numVowels() > 1) {
                word.replaceAt('i','e',i);
                word.replaceAt('u','o',i);
            }
        }
    }
    word.replaceAll(['È','Ò'], ['yè','wò']);
    word.stress += didDiphthong;

    if (word.stress != 0)
        word.replaceAt('aw','u',0);
    word.replace('aw','ò');
    word.replaceAll(['ct','x','bt'], ['tt','ss','tt']);
    word.replaceAll(['cJi','cJe','cJè','cJy'], ['ci','ce','cè','cy']);
    word.replaceAll(['gJi','gJe','gJè','gJy'], ['gi','ge','gè','gy']);
    word.replaceAll(['cyi','cye','cyè','gyi','gye','gyè'], ['ci','ce','cè','gi','ge','gè']);
    word.replaceAll(['qwi','qwe','qwu'], ['chi','che','cu']);

    word.replaceAll(['nnJ','llJ'], ['nJ','lJ']);
    word.replace('gnJ','nJ');
    word.replaceAll(['tJ','sJ','vJ','nJ'], ['z','cJ','ggJ','gn']);
    word.replaceIntervocal('cl','cchj');
    word.replaceBefore('cl','chj',VOWELS);
    word.replaceBefore('gl','ghj',VOWELS);
    for (var i = word.length-2; i > 0; i--) {
        if (CONSONANTS.has(word.at(i-1)) && word.at(i-1) !== 'l'
        && word.at(i) === 'l' && VOWELS.union(SEMIVOWELS).has(word.at(i+1))) {
            word.replaceAt('l','j',i);
        }
    }
    word.replaceAll(['clJ'], ['cchj']);
    word.replace('lJ', 'glj');
    word.replaceIntervocal('j','ggj');
    word.replace('J','j');
    word.replace('jw','j');
    word.replace('ji','i');
    word.replace('ij','i');
    word.replaceAll(['jj','ww'], ['j','w']);

    // prevent words ending in a consonant
    if (STOPS.has(word.at(-1))) {
        if (VOWELS.has(word.at(-2)) && !LIQUIDS.has(word.at(-1))) {
            word.cutAt(word.length-1);
        } else {
            word.w += 'e';
        }
    }
    word.replaceAt('os','oY',word.length-2);
    if (CONSONANTS.has(word.at(-1))) {
        if (word.at(-1) === 'l') {
            word.w += 'e';
        } else {
            word.cutAt(word.length-1);
        }
    }
    word.replace('Y','y');

    // prevent initial and final geminates
    if (CONSONANTS.has(word.at(0)) && word.at(0) === word.at(1)) {
        word.cutAt(0);
    }
    if (CONSONANTS.has(word.at(-1)) && word.at(-1) === word.at(-2)) {
        word.cutAt(word.length-1);
    }

    return word;
}

function romance_to_western_romance(word, finalLang='') {
    word.replace('ccJ','tç'); // ç = /ts/
    word.replaceAll(['cJ','tJ', 'x'], ['ç','ç', 'cs']); // merge /kʲ/ and /tʲ/
    word.replaceAll(['ct','cs'], ['jt','js']); // syllable-final velars
    word.replaceIntervocal('cl', 'lJ', VOWELS.union(SEMIVOWELS));
    word.replaceIntervocal('cël', 'lJ', VOWELS.union(SEMIVOWELS));
    word.replaceIntervocal('gl', 'lJ', VOWELS.union(SEMIVOWELS));
    word.replaceIntervocal('gël', 'lJ', VOWELS.union(SEMIVOWELS));
    word.replaceIntervocal('gn', 'nJ', VOWELS.union(SEMIVOWELS));
    word.replace('gnJ','nJ');

    // first diphthongization
    let didDiphthong = false;
    let i = word.stress;
    let openCriterion = openSyllable(word.w, i, true, false, VOWELS) || word.at(i+1) === 'j' || word.at(i+2) === 'J'; // diphthongize before a vowel or palatal
    if (finalLang === 'es' || finalLang === 'pt') {
        // vowel raising in stressed syllables
        if (CONSONANTS.has(word.at(word.stress+2))) {
            if (word.sub(word.stress,word.stress+2) === 'aj') {
                word.replaceAt('ca','qwa',word.stress-1);
                word.replaceAt('ga','gwa',word.stress-1);
                word.replaceStressed('aj','ej');
            }
        }
        word.replaceStressed('èj','ej');
        word.replaceStressed('òj','oj');
        if (finalLang === 'pt') {
            word.replaceStressed('os','òs');
            word.replaceStressed('es','ès');
        }
        let next_j = word.getNextVowel(word.stress) - 1;
        if (word.at(next_j) === 'j' || word.at(next_j) === 'J') {
            // word.replaceStressed('e','i');
            word.replaceStressed('o','u');
            word.replaceStressed('è','e');
            word.replaceStressed('ò','o');
        }
        if (contains(['asJ','arJ'], word.sub(word.stress,word.stress+3))) {
            word.replaceAt('ca','qwa',word.stress-1);
            word.replaceAt('ga','gwa',word.stress-1);
            word.replaceStressed('asJ','esJ');
            word.replaceStressed('arJ','erJ');
        }
    }
    word.replace('ołt','ułt');
    if (finalLang === 'fr')
        word.replace('ł','');
    else
        word.replace('ł','j');
    if (finalLang === 'es') {
        openCriterion = openCriterion || word.numVowels() > 1; // always diphthongize remaining /è/ and /ò/ for Spanish, except 1-syllable closed syllables
    } else if (finalLang === 'pt') {
        openCriterion = false; // no diphthongization
    }

    // first lenition
    // const intervocal = word.getIntervocal(VOWELS, VOWELS.union(new Set(['r','w','y'])));
    word.replaceAll(['dJ','gJ'], ['D','G']);
    // let prevVowels = VOWELS.union(new Set(['r','l','w','y']));
    let prevVowels = VOWELS;
    const intervocal = word.getIntervocal(prevVowels, VOWELS.union(new Set(['r','w','y','l'])));
    const lenitionMap = {
        'b':'v',
        'd':'ð',
        'g':'ɣ',
        'D':'j',
        'G':'Γ',
        's':'z'
    };
    const lenitionMap2 = {
        'p':'b',
        'c':'g',
        'q':'g',
        't':'d',
        'T':'d',
        'f':'v',
        'F':'v',
        'ç':'ż'
    };
    if (finalLang === 'fr') {
        word.replaceAll(['ph','pt'], ['F','T']);
    }
    
    if (VOWELS.has(word.at(word.length-2)))
        intervocal.push(word.length-1);
    for (const i of intervocal) {
        if (finalLang === 'fr' && word.at(i) === 's' && !VOWELS.has(word.at(i-1)) && !SEMIVOWELS.has(word.at(i-1))) {
            // skip many lenitions
            continue;
        }
        if (contains(['c','g'], word.at(i)) && word.at(i+1) === 'l') {
            continue;
        }
        if (word.at(i-1) === 'ë' || word.at(i+1) === 'ë') {
            continue;
        }
        if (lenitionMap[word.at(i)] && (finalLang !== 'es' || word.at(i) !== 'b')
            && (i !== word.length-1 || (word.at(i) !== 't' && word.at(i) !== 'd'))) {
            // This if statement leaves /b/ unchanged for Spanish (because of the orthography). Leaves final /t/ and /d/ unchanged.
            // Final /t/ and /d/ after a vowel are handled later
            word.replaceAt(word.at(i), lenitionMap[word.at(i)], i);
        }
    }
    if (finalLang === 'es') {
        word.replace('bye','vye'); // partial lenition of /b/
    }
    word.replaceAt('Γe','je',word.length-2);
    word.replace('Γ','ɣ');
    word.replaceAll(['aðo','aɣo','oðè'], ['ado','ago','odè']);
    if (finalLang === 'es' || finalLang === 'pt') {
        word.replaceAll(['ɣr', 'ðr', 'oða'], ['gr', 'dr', 'ola']);
    }
    word.replaceIntervocal('ð', '=', VOWELS.union(SEMIVOWELS)); // to be deleted
    word.replaceIntervocal('ɣ', '=', VOWELS.union(SEMIVOWELS));
    word.replace('ɣ', 'j');
    word.replace('ð', 'd');
    for (const i of intervocal) {
        if (finalLang === 'fr' && word.at(i) === 't' && i === word.length-1) // preserve final -t for French
            continue;
        if (finalLang === 'fr' && !VOWELS.has(word.at(i-1)) && contains(['t','p','c','q','T','F','f','ç'], word.at(i))) {
            // skip many lenitions
            if (!(word.at(i-1) === 'r' && contains(['c'], word.at(i)))) {
                continue;
            }
        }
        if (lenitionMap2[word.at(i)] && !(word.at(i) === 'c' && word.at(i+1) === 'l')) {
            if (word.at(i) === 't' && word.at(i+1) === 'l')
                word.replaceAt('t', 'c', i);
            else if (word.at(i-1) !== 'w' || contains['s', word.at(i)]) // /w/ before prevents lenition
                word.replaceAt(word.at(i), lenitionMap2[word.at(i)], i);
        }
    }
    if (VOWELS.has(word.at(-2))) {
        // remove final -t and -d (except French -t for orthography reasons)
        if (finalLang !== 'fr')
            word.replaceAt('t', '', word.length-1);
        word.replaceAt('d', '', word.length-1);
    }
    if (finalLang === 'fr')
        word.replace('a=a','aga');
    word.replaceAll(['D','G','='], ['dJ','gJ','']);
    if (finalLang !== 'fr')
        word.replaceAll(['pp','cc','tt','ss'], ['p','c','t','s']);
    word.replaceAll(['jn','nj','jl'], ['nJ','nJ','lJ']);
    word.replaceAll(['aa','ee','èe','ii','oo','òo','uu'], ['a','e','è','i','o','ò','u']);
    word.replace('ë','');
    // word.replace('y','j');

    // first unstressed vowel loss
    const intertonic = word.getIntertonic();
    for (const i of intertonic) {
        if (i > this.stress || word.at(i) !== 'a') {
            if (finalLang === 'es' && word.at(i-1) == 'm') {
                word.replaceAt('en','r',i);
            } else if (!noLostIntertonic(word, i)) {
                word.cutAt(i);
            }
        }
    }
    word.replaceAt('tm','m',word.stress-2);
    word.replaceAt('Tm','m',word.stress-2);
    if (finalLang === 'fr') {
        word.replaceAll(['T','F'], ['pt','ph']);
    }


    i = word.stress;
    if ((word.at(i) === 'è' || word.at(i) === 'ò') && (openCriterion)
    // && !((word.at(i+1) === 'n' || word.at(i+1) === 'm') && CONSONANTS.has(word.at(i+2)))
    ) {
        word.replaceAt(word.at(i), word.at(i).toUpperCase(), i);
        didDiphthong = true;
    }
    word.replaceAll(['È','Ò'], ['yè','wò']);
    word.replace('wy','y');
    if (didDiphthong)
        word.stress += 1;

    // loss of final consonants
    if (finalLang !== 'fr' && CONSONANTS.has(word.at(-1)) && !contains(['l','s','n','z','r'], word.at(-1))) {
        word.cutAt(word.length-1);
    }

    return word;
}

function western_romance_to_french(word) {
    // to early Old French

    if (word.numVowels() > 1)
        word.replaceAt('je','j',word.length-2);
    word.w = replaceIntervocal(word.w, 'j', 'ž');
    if (word.at(0) === 'j' && (VOWELS.union(SEMIVOWELS)).has(word.at(1)))
        word.replaceAt('j','ž',0)
        // word.w = 'ž'+word.sub(1);

    word.replaceAll(['ca','ga'], ['ča', 'ža']);
    for (const cons of CONSONANTS) {
        // word.replaceAll([cons+'fl',cons+'pl',cons+'cl'], ['cJ','cJ','cJ']);
        word.replaceAll([cons+'cl'], [cons+'l']);
    }
    word.replace('clJ','lJ');

    const isOpen = (i) => (
        openSyllable(word.w, i, false, true, VOWELS.union(new Set(['j','w'])))
    );

    word.replaceAll(['ç', 'č', 'ž', 'ż', 'ssJ'], ['çJ', 'čJ', 'žJ', 'żJ', 'ßJ']);
    for (let i = word.length-1; i >= 0; i--) {
        if (word.at(i) === 'J' && CONSONANTS.has(word.at(i-1))) {
            if (i-1 > 0 && i < word.length-1) {
                word.replaceAt('p','č',i-1);
                word.replaceAt('f','č',i-1);
                word.replaceAt('b','ž',i-1);
                word.replaceAt('v','ž',i-1);
                word.replaceAt('m','nž',i-1);
            }
            const nextVowel = word.getNextVowel(i);
            const prevVowel = word.getPrevVowel(i);
            // palatal consonant
            if (nextVowel !== -1 && isOpen(nextVowel) && nextVowel === word.stress && contains(['e','a'], word.at(nextVowel))) {
                // followed by stressed front vowel in open syllable: eject following /j/
                word.replaceAt(word.at(nextVowel), 'j'+word.at(nextVowel), nextVowel);
                word.stress += 1;
            }
            if (prevVowel !== -1 && isOpen(prevVowel) && !contains(['č','ž','l'], word.at(i))) {
                // preceded by an open syllable: eject preceding /j/
                word.replaceAt(word.at(prevVowel), word.at(prevVowel)+'j', prevVowel);
            }
        }
    }
    word.replaceAfter('jaw','aw',new Set(['čJ','žJ','lJ']),2);

    // second diphthongization, and related vowel changes
    // const isOpen = (i) => (
    //     openSyllable(word.w, i, true, true, VOWELS.union(LIQUIDS).union(new Set(['j','w','n'])))
    // );
    // const isOpen = (i) => openSyllable(word.w, i, false, true, VOWELS.union(SEMIVOWELS));//.union(new Set(['r'])));
    if (word.sub(word.stress+1,word.stress+3) === 'nJ' || word.sub(word.stress+1,word.stress+4) === 'jnJ') {
        word.replaceAt('j','',word.stress+1);
        if (isOpen(word.stress)) {
            word.replaceAt('e','eí',word.stress);
            word.replaceAt('o','ó',word.stress);
            // word.replaceAt('a', 'ae', word.stress);
        } else {
            word.replaceAt('a','áj',word.stress);
            // word.replaceAt('è','ê',word.stress);
            word.replaceAt('e','eí',word.stress);
            word.replaceAt('o','óí',word.stress);
            // word.replaceAt('Ja', 'Jè', word.stress-1);
            // word.replaceAt('Je', 'Ji', word.stress-1);
            // word.replaceAt('e', 'a', word.stress);
        }
    } else if (contains(['n','m'], word.at(word.stress+1))) {
        // vowels + /n/ or /m/
        if (isOpen(word.stress)) {
            word.replaceAt('e','ei',word.stress);
            word.replaceAt('a', 'ae', word.stress);
        } else {
            word.replaceAt('a','á',word.stress);
            word.replaceAt('è','ê',word.stress);
            word.replaceAt('e','á',word.stress);
            // word.replaceAt('Ja', 'Jè', word.stress-1);
            // word.replaceAt('Je', 'Ji', word.stress-1);
            // word.replaceAt('e', 'a', word.stress);
        }
    } else if (contains(['j','i'], word.at(word.stress+1))) {
        word.replaceAt('Ja','Je',word.stress-1);
        word.replaceAt('Jja','je',word.stress-2);
        word.replaceAt('ajrJ','ájrJ',word.stress);
        word.replaceAt('a','á',word.stress);
        word.replaceAt('o','ó',word.stress);
        word.replaceAt('aw','ó',word.stress);
    } else {
        // all other vowels
        if (isOpen(word.stress)) {
            word.replaceAt('ao', 'ò', word.stress);
            if (word.at(word.stress+2) === 's' && VOWELS.has(word.at(word.stress+3))) {
                word.replaceAt('aws', 'ós', word.stress);
            }
            word.replaceAt('aw', 'ò', word.stress);
            word.replaceAt('au', 'ò', word.stress);
            if (word.atStress() === 'è') {
                word.replaceAt('è', 'jè', word.stress);
                word.stress += 1;
            }
            word.replaceAt('a', 'è', word.stress);
            // prevent diphthongization of existing Western Romance diphthongs
            if (word.at(word.stress-1) !== 'y')
                word.replaceAt('e','ej',word.stress);
            if (word.at(word.stress-1) !== 'w')
                word.replaceAt('o','ow',word.stress);
        } else {
            word.replaceAt('allJ','ajllJ',word.stress);
            if (word.stress === word.length-2 && word.at(word.stress+1) === 'z') {
                word.replaceAt('e','ej',word.stress);
            }
        }
    }
    word.replaceAll(['pp','cc','tt','ss'], ['p','c','t','s']);
    console.log('->', word);

    // loss of final unstressed vowels
    word.replace('òjlJo','òYlJo');
    word.replace('jlJo','lJo');
    word.replaceBefore('nJ','ñ',CONSONANTS);
    const lastVowel = word.getLastVowel();
    if (lastVowel !== word.stress && word.at(lastVowel) !== 'a') {
        word.cutAt(lastVowel);
    }
    if (word.at(-1) === word.at(-2) && word.at(-1) !== 'l') {
        word.cutAt(word.length-1); // will handle final -l later
    }
    word.replace('Y','y');
    word.replace('ñ','n');

    // open -> late closed stage
    if (new Set(['n', 'm']).has(word.at(word.stress+1)) && word.sub(word.stress+1,word.stress+3) !== 'nJ') {
        if (isOpen(word.stress)) {
            // "late open" is really just open
        } else {
            // late closed
            if (word.atStress() === 'è') {
                word.replaceAt('è','jè',word.stress);
                word.stress += 1;
            } else {
                word.replaceAt('a','è',word.stress);
                if (word.atStress() === 'á' && contains(['j','J'], word.at(word.stress-1))) {
                    word.replaceAt('á','è',word.stress);
                    word.replaceAt('J','j',word.stress-1);
                }
            }
        }
    }

    if (word.sub(word.stress,word.stress+4) === 'ajrJ') {
        word.replaceStressed('ajrJ','jerJ');
        word.stress += 1;
    }
    word.replaceAll(['nJJ','lJJ','ajrJ','jlJa','jlJjè'], ['nJ','lJ','jerJ','yllJa','yllJjè']);
    word.replaceAll(['á','ê'], ['a','è']);
    word.replaceAll(['nJ','lJ'], ['ñ','ł']);
    word.replaceAll(['ß', 'Jae', 'Jjae'], ['s', 'jÈÈ', 'jÈÈ']);
    word.replaceAll(['aen','aem','aeñ'], ['ajn','ajm','ajñ']);
    word.replaceAll(['ae','ÈÈ','yj','ij'], ['è','è','y','i']);

    // second lenition
    word.replace('J','');
    const intervocal = word.getIntervocal(VOWELS.union(new Set(['w','j','y'])), VOWELS.union(new Set(['r','w','j','y'])));
    const lenitionMap = {
        'b':'v',
        'd':'ð',
        'g':'ɣ',
        // 's':'z',
        'ž':'ɣ'
    };
    const lenitionMap2 = {
        // 'p':'b',
        'c':'g',
        't':'d',
        'f':'v',
        'ç':'ż'
    };
    
    // if (VOWELS.has(word.at(word.length-2)))
    //     intervocal.push(word.length-1);
    for (const i of intervocal) {
        if (lenitionMap[word.at(i)] && i !== word.length-1) {
            // Leaves final consonants unchanged because of orthography and liaison.
            word.replaceAt(word.at(i), lenitionMap[word.at(i)], i);
        }
    }
    for (const i of intervocal) {
        if (lenitionMap2[word.at(i)] && !(word.at(i) === 'c' && word.at(i+1) === 'l')
        && (i !== word.length-1 || (word.at(i) !== 't' && word.at(i) !== 'd'))) {
            word.replaceAt(word.at(i), lenitionMap2[word.at(i)], i);
        }
    }
    word.replaceAll(['tç','dż'],['ç','ż']);
    word.replaceAll(['ðr'], ['rr']);
    word.replaceAll(['ð', 'ɣ'], ['', '']);

    // depalatalization
    word.replaceAfter('ñ','n',CONSONANTS,1,false);
    word.replaceAfter('ł','l',CONSONANTS,1,false);
    if (word.endsWith('ñ'))
        word.w = word.sub(0,-1)+'jn';
    else if (word.endsWith('ł'))
        word.w = word.sub(0,-1)+'l';
    word.replaceAt('iła','illa',word.length-3);
    word.replaceAt('iłe','ille',word.length-3);
    word.replace('ł','l');
    word.replace('ñ','gn');

    // further vocalic changes
    if (contains(['jej','jèj','jei','yej','yèj','wòj'], word.sub(word.stress-1, word.stress+2)))
        word.stress -= 1;
    word.replaceAll(['jej','jei','yej','yèj','wòj','òjj','jèj'], ['iJ','iJ','iJ','iJ','uj','uj','jè']);
    word.replaceAt('a','ë',word.length-1);
    word.replaceAt('at','ë',word.length-2);

    word.replace('jj','j');
    word.replaceAt('v','f',word.length-1);
    if (LIQUIDS.has(word.at(-1)) && CONSONANTS.has(word.at(-2))
    && !(word.sub(-2) === 'll')) {
        word.w += 'ë';
    }

    // to Old French

    // nasalization
    word.replaceAll(['an','en','wòn','òn','èn','own','ein','on','ojn'], ['ãn','ẽn','õn','õn','ẽn','õwn','ẽin','õn','õjn']);
    word.replaceAll(['am','em','wòm','òm','èm','owm','eim','om','ojm'], ['ãm','ẽm','õm','õm','ẽm','õwm','ẽim','õm','õjm']);


    if (contains(['f','p','k'], word.at(-2) && contains(['s','t'], word.at(-1))))
        word.w = word.sub(0,-1);

    word.replaceAll(['owb','owp','owm','owf','owv'], ['oúb','oúp','oúm','oúf','oúv']);
    for (const combo of ['ow','ue','wò']) {
        if (contains(CONSONANTS, word.at(-1)) && word.numVowels() === 1) {
            word.replaceAt('c'+combo, 'cœw', word.length-combo.length-2);
        }
        word.replaceAt(combo, 'œw', 0);
    }
    word.replaceAll(['cow','cue','cwò'], ['qwew','qwew','qwew']);
    word.replaceAll(['ow','ue','wò'], ['ew','ew','ew']);
    if (word.atStress() === 'w' && contains(['e','œ'], word.at(word.stress-1)))
        word.stress -= 1;
    word.replaceBefore('að','ë',VOWELS);
    word.replaceBefore('aɣ','ë',VOWELS);
    word.replaceBefore('ž','',CONSONANTS);
    word.replaceAll(['ɣ','ð','J'], ['','','']);
    word.replace('ú','u');
    word.replace('ej','ój');

    // to Late Old French
    word.replace('ou','ów');
    word.replace('o','ów');
    word.replace('ó','o');
    word.replaceAt('rn','r',word.length-2);
    word.replaceAt('rm','r',word.length-2);
    for (cons of CONSONANTS) {
        word.replaceAt('rm'+cons, 'r'+cons, word.length-3);
    }

    word.replace('aw','aW');
    // const isOpen2 = (i) => openSyllable(word.w, i, false, false, VOWELS.union(SEMIVOWELS));
    const isOpen2 = (i) => openSyllable(word.w, i, false, false, VOWELS);
    // syllable-final consonant loss
    for (let i = word.length-1; i >= 0; i--) {
        if (CONSONANTS.has(word.at(i)) && !VOWELS.has(word.at(i+1)) && !isOpen2(word.getPrevVowel(i))
        && word.getPrevVowel(i) !== -1 && word.at(i) !== word.at(i+1) && (word.at(i) === 's' || word.at(i) === 'ż')
        && i != word.length-1) {
            // (non-geminate consonants, not followed by a vowel, where the previous vowel is in a closed syllable)
            // lose syllable-final /s/
            if (i === 1) {
                word.replaceAt('e','é',0);
            } else {
                word.replaceAt('e','ê',i-1);
            }
            word.replaceAt('a','â',i-1);
            word.replaceAt('è','ê',i-1);
            word.replaceAt('i','î',i-1);
            word.replaceAt('o','ô',i-1);
            word.replaceAt('ò','ô',i-1);
            word.replaceAt('u','û',i-1);
            word.replaceAt('w','û',i-1);
            if (VOWELS.has(word.at(i-2)) && word.at(i-1) === 'j') {
                word.replaceAt('j','î',i-1);
            }
            word.cutAt(i);
        } else if (word.at(i) === 'l' && (CONSONANTS.has(word.at(i+1)) || i==word.length-1) && !(word.at(i+1) == 'l' && word.at(i+2) === 'ë')) {
            // lose syllable-final /l/
            // if (i-1 !== word.stress && !(i-2 === word.stress && contains(['ew','œw','ow','aW'], word.sub(i-2,i))))
            //     continue;
            if (word.at(i-1) === 'a') {
                word.replaceAt('l','',i+1);
                word.replaceAt('l','w',i);
            } else if (word.at(i-1) === 'è') {
                word.replaceAt('l','',i+1);
                if (contains(['j','y'], word.at(i-2)))
                    word.replaceAt('l','w',i);
                else
                    word.replaceAt('l','aw',i);
            } else if (word.at(i-1) === 'e') {
                word.replaceAt('l','',i+1);
                word.replaceAt('l','w',i);
            } else if (word.at(i-1) === 'ò') {
                word.replaceAt('l','',i+1);
                word.replaceAt('l','w',i);
            } else if (contains(['ew','œw','ow'], word.sub(i-2,i))) {
                word.replaceAt('l','',i+1);
                word.cutAt(i);
            } else if (word.sub(i-2,i) === 'aW') {
                word.replaceAt('l','',i+1);
                word.replaceAt('aWl','ou',i-2);
            }
        }
    }
    word.replaceAt('èr','er',word.length-2);
    word.replaceAt('ll','l',word.length-2);
    word.replaceAll(['œwj','œwy'],['œj','œy']);
    word.replace('aW','ò');
    // word.replaceAt('ž','',word.length-1);

    // final devoicing
    word.replaceAt('b','p',word.length-1);
    word.replaceAt('d','t',word.length-1);

    word.replaceAt('mn','mmë',word.length-2);
    word.replaceAt('nm','mmë',word.length-2);
    word.replaceAll(['nm','mn'], ['mm','mm']);
    for (const cons of ['t','z'])
        word.replaceAt('v'+cons,cons,word.length-2);
    if (CONSONANTS.has(word.at(-1)) && contains(['i','î'], word.at(-2)) && !contains(['g','c','ż','n','m','l','t','r'], word.at(-1))) {
        word.w += 'ë';
    } else if (word.at(-2) === 'î' && contains(['n','m'], word.at(-1))) {
        word.w += 'ë';
    } else if (word.at(-2) === 'õ' && word.at(-1) === 'm') {
        word.w += 'më';
    }

    // To Middle French:
    word.replace('õun','õn');
    // word.replace('W','w');

    if (VOWELS.union(SEMIVOWELS).has(word.at(word.length-2)))
        word.replaceAt('ż','x',word.length-1);
    word.replaceAll(['że','żê','żè','ży','żj','żi'], ['ce','cê','cè','cy','cj','ci']);
    word.replace('ż','z');
    word.replaceAt('wz','wx',word.length-2);
    word.replaceAt('ž','žë',word.length-1);
    word.replaceAll(['oj','òj','aj'],['oí','òí','aí']);
    word.replaceAt('è','é',word.length-1);
    word.replaceAt('èd','é',word.length-2);
    word.replaceBefore('q','qw',CONSONANTS.union(new Set(['y','w','j'])));
    word.replace('qww','qw');

    return word;
}

function western_romance_to_spanish(word) {
    word.replace('wò','we');
    word.replaceAll(['è','ò','aw'], ['e','o','o']);
    // apocope of final /e/
    word.replaceAll(['ll','js'], ['L','X']);
    word.replaceAll(['sç','tç','dż'], ['ç','ç','ż']);
    if (word.stress !== word.length-1)
        word.replaceAt('i','e',word.length-1);
    if (word.numVowels() > 1 && word.at(-1) === 'e') {
        if (VOWELS.has(word.at(-3)) && contains(['r','n','d','l','s','z','ç','ż','x','L'], word.at(-2))) {
            word.cutAt(word.length-1);
        }
    }
    word.replaceAll(['L','X','x'], ['ll','js','js']);
    word.replaceAt('ll','l',word.length-2);
    if (VOWELS.union(new Set(['y'])).has(word.at(1))) {
        word.replaceAt('f','h',0);
    } else if (VOWELS.has(word.at(2))) {
        word.replaceAt('fl','ll',0);
        word.replaceAt('pl','ll',0);
        word.replaceAt('cl','ll',0);
    }
    for (const nas of ['n','m']) {
        word.replaceAll([nas+'fl',nas+'pl',nas+'cl'], ['ncJ','ncJ','ncJ']);
    }
    for (const cons of CONSONANTS) {
        word.replaceAll([cons+'fl',cons+'pl',cons+'cl'], ['cJ','cJ','cJ']);
    }
    word.replaceAfter('dJ','ç',CONSONANTS);
    word.replaceIntervocal('dJ','y');
    word.replaceAll(['yell'], ['ill']);
    word.replaceAfter('lwe', 'le', CONSONANTS);
    // word.replaceAfter('rwe', 're', CONSONANTS);

    // initial Latin j
    word.replaceAt('ja','ya',0);
    if (word.stress === 1) {
        word.replaceAt('je','ye',0);
    }
    word.replaceAt('jw','∫w',0);
    word.replaceAt('jo','∫u',0);
    word.replaceAt('ju','∫u',0);
    word.replaceIntervocal('j','y');
    word.replace('∫','x');

    word.replaceAll(['yeo','eo'], ['io','io']);

    // vowel raising in unstressed syllables
    for (let i = word.length-3; i >= 0; i--) {
        if (i === word.stress)
            continue;
        let next_j = word.getNextVowel(i) - 1;
        if (contains(['J','y'], word.at(next_j))
            && (next_j <= i+2 || (next_j === i+3 && word.at(next_j-1) === 'l' && word.at(next_j-2) === 'c'))) {
            word.replaceAt('e','i',i);
            word.replaceAt('o','u',i);
        }
    }

    word.replaceAll(['nnJ','llJ'], ['nJ','lJ']);
    word.replace('gJ','ɟ');
    word.replaceIntervocal('ɟ','y');
    if (word.stress == 1)
        word.replaceAt('ɟ','y',0);
    word.replaceAt('ɟ','h',0);
    word.replaceAll(['nɟ','rɟ'], ['nç','rç']);
    word.replace('ɟ','');
    word.replace('clJ','cJ');
    word.replace('lJ','x');
    word.replace('ijt','it');

    // syllable-final vocalization
    for (let i = word.length-1; i > 0; i--) {
        if (STOPS.union(new Set(['s','ç','ż'])).has(word.at(i+1)) && VOWELS.has(word.at(i-1))) {
            word.replaceAt('b','w',i);
            word.replaceAt('v','w',i);
            word.replaceAt('al','aw',i-1);
            word.replaceAt('ow','o',i-1);
            if (VOWELS.has(word.at(i+2))) {
                word.replaceAt('jt','cJ',i);
                word.replaceAt('js','x',i);
            } else if (word.at(i) === 'j') {
                word.replaceAt('j','y',i);
                if (CONSONANTS.has(word.at(i+2)) && !LIQUIDS.has(word.at(i+2)))
                    word.cutAt(i+1);
            }
        }
    }
    word.replace('j','');
    word.replace('uw','u');

    word.replaceAll(['qwi','qwe'], ['qi','qe']);
    word.replaceAll(['mn','qw','ct','dg','pd','mr','nçg','nsg','ml'],
                    ['nn','cw','cJ','çg','t','mbr','ng','ng','mbl']); // simplifying clusters
    word.replaceAll(['iva','eya','aye','eye','iy','eyo'], ['ia','ea','ae','ey','i','eo']); // vowel-related clusters
    if (word.stress !== 0)
        word.replaceAt('u','o',0);
    if (word.stress != word.length-1)
        word.replaceAt('u','o',word.length-1);

    word.replaceAll(['qi','qe','qy'], ['Qwi','Qwe','Qwy']);
    word.replace('q','c');
    word.replace('Q','q');

    word.replaceAll(['nn','mm','nm'], ['nJ','m','lm']); // double nasals
    word.replaceAll(['z','ż'], ['s','ç']); // devoicing of the sibilants
    word.replaceAll(['nJ','cJ','sJ','rJ'], ['ñ','č','s','r']);
    word.replace('ñJ','ñ');
    // remove geminates
    for (const cons of ['b','c','ç','d','f','g','h','j','p','q','s','t','v','w','x','y']) {
        word.replace(cons+cons, cons);
    }
    word.replaceBefore('ñ','n',CONSONANTS);
    word.replaceAll(['mt','md','nb','np'], ['nt','nd','mb','mp']); // simplifying clusters
    word.replace('J','y');
    return word;
}

function western_romance_to_portuguese(word) {
    word.replaceAll(['aw'], ['ow']);
    // apocope of final /e/
    word.replaceAll(['ll','js'], ['L','X']);
    if (word.stress !== word.length-1)
        word.replaceAt('i','e',word.length-1);
    if (word.numVowels() > 1 && word.at(-1) === 'e') {
        if (VOWELS.has(word.at(-3)) && contains(['r','n','m','l','s','z','ż','x'], word.at(-2))) {
            word.cutAt(word.length-1);
        }
    }
    word.replaceAll(['L','X','x'], ['ll','js','js']);
    word.replaceAt('ll','l',word.length-2);
    if (VOWELS.has(word.at(2))) {
        word.replaceAt('fl','cJ',0);
        word.replaceAt('pl','cJ',0);
        word.replaceAt('cl','cJ',0);
    }
    word.replaceBefore('pl','pr',VOWELS);
    word.replaceBefore('bl','br',VOWELS);
    for (const nas of ['n','m']) {
        word.replaceAll([nas+'fl',nas+'pl',nas+'cl'], ['ncJ','ncJ','ncJ']);
    }
    for (const cons of CONSONANTS) {
        word.replaceAll([cons+'fl',cons+'pl',cons+'cl'], ['lJ','lJ','lJ']);
    }
    word.replaceAfter('dJ','ç',CONSONANTS);
    word.replaceIntervocal('dJ','y');

    // initial Latin j
    word.replaceAt('ja','ʒa',0);
    word.replaceAt('je','ge',0);
    word.replaceAt('jè','gè',0);
    word.replaceAt('ji','gi',0);
    if (word.stress !== 2) {
        word.replaceAt('jo','ʒu',0);
    } else {
        word.replaceAt('jo','ʒo',0);
    }
    word.replaceAt('jò','ʒò',0);
    word.replaceAt('ju','ʒu',0);
    word.replaceIntervocal('j','y');
    word.replace('∫','x');

    // vowel raising in unstressed syllables
    for (let i = word.length-3; i >= 0; i--) {
        if (i === word.stress)
            continue;
        let next_j = word.getNextVowel(i) - 1;
        if (contains(['J','y'], word.at(next_j)) && next_j <= i+2) {
            word.replaceAt('e','i',i);
            word.replaceAt('o','u',i);
        }
    }

    word.replace('gJ','ɟ');
    word.replaceIntervocal('ɟ','y');
    if (word.stress == 1)
        word.replaceAt('ɟ','y',0);
    word.replaceAt('ɟe','i',0);
    word.replaceAt('ɟi','i',0);
    word.replaceAt('ɟ','ʒ',0);
    word.replaceAll(['nɟ','rɟ'], ['nç','rç']);
    word.replace('ɟ','');
    word.replace('clJ','lJ');
    word.replace('lJ','lh');
    word.replace('ijt','it');

    // syllable-final vocalization
    for (let i = word.length-1; i > 0; i--) {
        if (STOPS.union(new Set(['s','ç','ż'])).has(word.at(i+1)) && VOWELS.has(word.at(i-1))) {
            word.replaceAt('b','w',i);
            word.replaceAt('v','',i);
            word.replaceAt('al','aw',i-1);
            word.replaceAt('ow','o',i-1);
            if (VOWELS.has(word.at(i+2))) {
                word.replaceAt('ajs','aix',i-1);
                word.replaceAt('js','x',i);
            } else if (word.at(i) === 'j') {
                word.replaceAt('j','y',i);
                if (CONSONANTS.has(word.at(i+2)) && !LIQUIDS.has(word.at(i+2)))
                    word.cutAt(i+1);
            }
        }
    }

    // elision of /n/ and /l/
    const intervocal = word.getIntervocal(VOWELS.union(SEMIVOWELS), VOWELS.union(SEMIVOWELS));
    for (const i of intervocal.reverse()) {
        if (word.at(i) === 'n') {
            word.replaceAt('a','ã',i-1);
            word.replaceAt('e','ẽ',i-1);
            word.replaceAt('è','ẽ',i-1);
            word.replaceAt('i','ĩ',i-1);
            word.replaceAt('o','õ',i-1);
            word.replaceAt('ò','õ',i-1);
            word.replaceAt('u','ũ',i-1);
            word.cutAt(i);
        } else if (word.at(i) === 'l') {
            word.cutAt(i)
        }
    }
    word.replaceAll(['ãa','oe','ẽa','ĩo','õo','ũa','ũo'], ['ã','o','eja','inJo','om','uma','umo']);
    word.replaceAll(['ẽ','ĩ','ũ'], ['e','i','u']);
    word.replaceAll(['aa','ee','èè','ii','oo','òò','uu'], ['a','e','è','i','o','ò','u']);
    if (word.stress === word.length-1)
        word.replaceAt('o','ow',word.length-1);
    word.replaceAll(['owe','owi'], ['owve','owvi']);

    word.replaceAll(['mn','tç','sç','dż','ct','dg','pd','mr','nçg','nsg','ml','rç','str'],
                    ['mm','ç','jx','ż','cJ','çg','t','mbr','ng','ng','m','rʒ','s']); // simplifying clusters
    word.replaceAll(['iva','eya','aye','eye','iy','eyo'], ['ia','ea','ae','ey','i','eo']); // vowel-related clusters
    word.replaceAll(['mme'], ['mem']);
    if (word.stress !== 0)
        word.replaceAt('u','o',0);
    if (word.stress === word.length-2 && !contains(['ò','i'], word.atStress()))
        word.replaceAt('o','u',word.length-1);

    word.replaceAll(['nn','mm','nm'], ['n','m','lm']); // double nasals
    word.replaceAll(['esJ','erJ','evJ'], ['ejʒ','ejr','ejv']);
    word.replaceAll(['nJ','cJ','sJ','rJ','vJ'], ['nh','č','ʒ','r','v']);
    // remove geminates
    for (const cons of ['b','c','ç','d','f','g','h','j','l','p','q','s','t','v','w','x','y','z']) {
        word.replace(cons+cons, cons);
    }
    word.replaceBefore('nh','n',CONSONANTS);
    word.replaceAll(['mt','md','nb','np'], ['nt','nd','mb','mp']); // simplifying clusters
    word.replace('J','y');
    word.replace('ij','i');

    // nasalization
    word.replaceAt('an','ão',word.length-2);
    if (word.numVowels() > 1 && word.stress === word.length-2) {
        word.replaceAt('on','ão',word.length-2);
    } else {
        word.replaceAt('n','m',word.length-1);
    }
    word.replaceAt('ãu','ão',word.length-2);
    word.replaceAt('z','s',word.length-1);

    return word;
}

function sanskrit_to_lang(sanskritWord, lang, mapStage=null) {
    let word = sanskritOrthography(sanskritWord);
    word = new SanskriticWord(word);
    const cons = SANSKRIT_CONS;
    const vow = VOWELS.union(new Set(['R']));
    const nasals = SANSKRIT_NASALS;
    const stops = SANSKRIT_STOP_CONS;
    const labials = SANSKRIT_LABIAL_CONS;
    const glides = SANSKRIT_GLIDES;
    const sibilants = new Set(['s','z','S']);

    if (mapStage === null) {
        mapStage = (a, b) => console.log(a + ': ' + b);
    }
    mapStage("OIA", word.w);

    // Proto Indo-Aryan to Middle Indo-Aryan

    word.replaceAll(['ai','au'], ['è','ò']);
    if (lang === 'pi') {
        word.replaceAt('aya','aYa',word.length-3);
        word.replaceAt('ava','aVa',word.length-3);
        word.replaceAll(['aya','ava','āya','ayā','avā','avi','ayū'], ['e','o','ā','ā','ā','e','o']);
        word.replaceAll(['Y','V'], ['y','v']);
        word.replaceAll(['è','ò'], ['e','o']);
    } else {
        word.replaceAll(['aya','ava'], ['è','ò']);
    }
    word.replaceAt('aH','o',word.length-2);
    word.replace('H','');
    word.joinAspirate();

    if (word.startsWith('R') && lang !== 'pi')
        word.replaceAt('R', 'ri', 0);
    for (let i = word.length-1; i >= 0; i--) {
        if (word.at(i) === 'R') {
            const nextVowel = word.getNextVowel(i);
            let addVowel = 'i';
            if (labials.has(word.at(i-1))) {
                addVowel = 'u';
            } else if (nextVowel !== -1) {
                addVowel = word.at(nextVowel);
                addVowel = {'ā':'a', 'ī':'i', 'ū':'u', 'e':'i', 'o':'u'}[addVowel] || addVowel;
            }
            if (i === word.length-1)
                addVowel += 'r'+addVowel;
            word.replaceAt('R', addVowel, i);
        }
    }
    if (lang === 'pi') {
        word.replaceAt('jñ','ñ',0);
        word.replaceAt('ny','ñ',0);
        word.replace('jñ','ññ');
        word.replaceIntervocal('ny','ññ');
        word.replaceIntervocal('Ny','ññ');
        word.replaceIntervocal('zn','sñ');
        word.replaceAt('m','',word.length-1);
        word.replaceAt('n','',word.length-1);
    } else {
        word.replaceIntervocal('y', '');
        word.replaceAll(['ry','yy'], ['jj','jj']);
        word.replaceAt('m','M',word.length-1);
        word.replaceAt('n','M',word.length-1);
    }
    // lose final consonants
    if (cons.has(word.at(-1)) && word.at(-1) !== 'H' && word.at(-1) !== 'M')
        word.cutAt(word.length-1);

    // reduce initial clusters
    word.replaceAt('kS','K',0);
    word.replaceAt('ty','c',0); // dental + y becomes palatal
    word.replaceAt('dy','j',0);
    word.replaceAt('Țy','C',0);
    word.replaceAt('Ðy','J',0);
    word.replaceAt('Sa','cha',0);
    if (lang === 'pi')
        word.replaceAt('dvā','bā',0);
    else
        word.replaceAt('dvā','vvā',0);
    if (cons.has(word.at(0))) {
        if (contains(['r','v','y'], word.at(1))) {
            word.cutAt(1);
        } else if (word.at(1) === 'l') {
            word.replaceAt('l', 'il', 1);
        }
    }
    // reduce remaining clusters
    if (lang === 'pi') {
        word.replaceBefore('Dv','bb',VOWELS);
        word.replaceAfter('dv','bb',VOWELS);
    } else {
        word.replaceBefore('Dv','vv',VOWELS);
        word.replaceAfter('dv','vv',VOWELS);
        word.replaceIntervocal('tm','pp');
    }
    word.replaceIntervocal('nv','mm');
    word.replaceIntervocal('mr','mb');
    word.replaceIntervocal('ml','mb');
    word.replaceIntervocal('Hz','ss');
    // word.replaceAll(['Țy','Ðy','ty','dy','sȚ','ts','ps'], ['CC','JJ','cc','jj','ŤŤ','CC','CC']);
    word.replaceAll(['Țy','Ðy','ty','dy','ts','ps'], ['CC','JJ','cc','jj','CC','CC']);
    for (let i = word.length-2; i >= 0; i--) {
        if (stops.has(word.at(i)) && stops.has(word.at(i+1))) {
            // stop + stop: C1C2 -> C2C2
            word.replaceAt(word.at(i), word.at(i+1), i);
        } else if (((stops.union(nasals).union(sibilants)).has(word.at(i))) && glides.has(word.at(i+1))) {
            // stop, nasal, or sibilant + y, r, l, v: CL -> CC
            word.replaceAt(word.at(i+1), word.at(i), i+1);
        } else if (contains(['l','r'], word.at(i)) && ((stops.union(nasals).union(sibilants)).has(word.at(i+1)))) {
            // l, r + stop, nasal, or sibilant: LC -> CC
            word.replaceAt(word.at(i), word.at(i+1), i);
        } else if (stops.has(word.at(i)) && sibilants.has(word.at(i+1))) {
            // stop + sibilant: CS -> CCh
            word.replaceAt(word.at(i+1), word.at(i)+'h', i+1);
        } else if (sibilants.has(word.at(i)) && stops.has(word.at(i+1))) {
            // sibilant + stop: SP -> PPh (sometimes SP -> PP)
            if (word.sub(i-2, i+1) !== 'niS')
                word.replaceAt(word.at(i+1), word.at(i+1)+'h', i+1);
            word.replaceAt(word.at(i), word.at(i+1), i);
        } else if (sibilants.has(word.at(i)) && nasals.has(word.at(i+1))) {
            // sibilant + nasal: SN -> Nh
            if (i > 0)
                word.replaceAt(word.at(i)+word.at(i+1), word.at(i+1)+'h', i);
            else
                word.cutAt(1); // initially: SN -> S
        } else if (stops.has(word.at(i)) && nasals.has(word.at(i+1))) {
            // stop + nasal: PN -> PP
            word.replaceAt(word.at(i+1), word.at(i), i+1);
        } else if (nasals.has(word.at(i)) && nasals.has(word.at(i+1))) {
            // nasal + nasal: N1N2 -> N2N2
            word.replaceAt(word.at(i), word.at(i+1), i);
        }
    }
    word.replace('JJy','JJ');
    word.replaceIntervocal('ly','ll'); word.replaceIntervocal('yl','ll');
    word.replaceIntervocal('lr','ll'); word.replaceIntervocal('rl','ll');
    word.replaceIntervocal('lv','ll'); word.replaceIntervocal('vl','ll');
    if (lang !== 'pi') {
        word.replaceIntervocal('rv','vv'); word.replaceIntervocal('yv','vv');
        word.replaceIntervocal('vr','vv'); word.replaceIntervocal('vy','vv');
        word.replaceIntervocal('yr','jj'); word.replaceIntervocal('ry','jj');
    } else {
        word.replaceIntervocal('rv','bb'); word.replaceIntervocal('yv','bb');
        word.replaceIntervocal('vr','bb'); word.replaceIntervocal('vy','bb');
        word.replaceIntervocal('yr','yy');
        word.replaceIntervocal('ry','yy');
    }
    word.replaceAll(['hn','hN','hm','hl','vh'],['nh','Nh','mh','lh','BB']);
    if (lang !== 'pi') {
        word.replaceAll(['hv', 'yh', 'hy'], ['BB', 'JJ', 'JJ']);
        word.replace('y','j');
    } else {
        word.replaceAll(['hv', 'hy'], ['vh', 'yh']);
        word.replaceBefore('ey','eyy',VOWELS);
    }

    word.unjoinAspirate();
    word.replace('hh','h');
    word.replace('kš','kh');
    word.replaceAll(['āi','āu'], ['e','o']);

    if (lang !== 'pi') {
        // intervocal reduction
        word.joinAspirate();
        word.replaceIntervocal('g','y');
        word.replaceIntervocal('k','y');
        word.replaceIntervocal('c','y');
        word.replaceIntervocal('j','y');
        word.replaceIntervocal('t','y');
        word.replaceIntervocal('d','y');
        word.replaceIntervocal('p','v');
        word.replaceIntervocal('b','v');
        word.replaceIntervocal('P','h');
        word.replaceIntervocal('B','h');
        word.replaceIntervocal('Ț','h');
        word.replaceIntervocal('G','h');
        word.replaceIntervocal('K','h');
        word.replaceIntervocal('Ð','h');
        // word.replaceIntervocal('s','h');
        // word.replaceIntervocal('z','h');
        // word.replaceIntervocal('S','h');
        // modify retroflex only after short vowels (?)
        for (const cons of ['a','i','u']) {
            // word.replaceIntervocal('Ť','Ď');
            // word.replaceIntervocal('T','D');
            word.replaceBefore(cons+'T', cons+'D', vow);
            word.replaceBefore(cons+'Ť', cons+'Ď', vow);
        }

        word.replaceAll(['āya','ayā','aya'], ['āYa','aYā','aYa']);
        word.replace('y', '');
        word.replace('Y', 'y');
    }
    word.replaceAll(['z','S'], ['s','s']);

    // shorten long vowels before two consonants
    const shorten = {'ā':'a', 'ī':'i', 'ū':'u'};
    for (let i = word.length-1; i >= 0; i--) {
        if (cons.has(word.at(i+1)) && cons.has(word.at(i+2))) {
            if (shorten[word.at(i)]) {
                word.replaceAt(word.at(i), shorten[word.at(i)], i);
            } else if (lang === 'pi' && word.at(i+1) === word.at(i+2) && word.at(i+1) === 'y') {
                word.replaceAt('a', 'e', i);
            }
        }
    }

    if (lang === 'pi') {
        word.replaceIntervocal('D','L');
        word.replaceIntervocal('Dh','Lh');

        for (let i = word.length-2; i > 0; i--) {
            if (word.at(i) === 'H' && SANSKRIT_STOP_CONS.union(new Set(['s'])).has(word.at(i+1)))
                word.replaceAt('H',word.at(i+1),i);
        }

        // lose ChC and CCC sequences
        for (let i = word.length-3; i >= 0; i--) {
            if (cons.has(word.at(i)) && word.at(i) === word.at(i+2) && word.at(i+1) === 'h') {
                if (word.at(i+3) === 'h')
                    word.cutAt(i+3);
                word.cutAt(i+2);
            } else if (cons.has(word.at(i)) && word.at(i) === word.at(i+2) && word.at(i+1) === word.at(i+2)) {
                word.cutAt(i+2);
            }
        }

        word.replaceAll(['āM','īM','ūM'], ['aM','iM','uM']);

        word.joinAspirate();
        if (SANSKRIT_CONS.has(word.at(0)) && word.at(0) === word.at(1))
            word.cutAt(0);
        word.unjoinAspirate();
    }

    if (lang === 'pi') {
        mapStage("MIA", word.w);
        return word.w;
    }

    // shorten final long vowels
    const shorten2 = {'ā':'a', 'ī':'i', 'ū':'u', 'aM':'u'};
    for (const [key, val] of Object.entries(shorten2)) {
        word.replaceAt(key, val, word.length-key.length);
    }
    word.replaceAll(['è','ò'], ['e','o']);

    word.unjoinAspirate();

    // Middle Indo-Aryan to New Indo-Aryan
    mapStage("MIA", word.w);
    // coalescing vowels
    word.replaceAll(['uyu','aā','āa','iī','īyi'], ['ū','ā','ā','ī','ayi']);
    word.replaceAt('aya','á',word.length-3);
    word.replaceAll(['ava', 'aya'], ['ò', 'è']);
    word.replaceAll(['ai','āi','au','āu','aū','aī','ayu','ayi'], ['è','è','ò','ò','o','e','ò','è']);
    word.replaceAll(['aa','ayā','iy','īy','ii'], ['ā','ā','i','ī','ī']);
    if (lang !== 'mr')
        word.replaceAll(['oā','ovā','eā','eyā'], ['vā','vā','yā','yā']);

    word.replaceAll(['N','ñ','ń'], ['N','n','n']); // nasals merger

    word.replace('vv','b');
    if (lang === 'hi' || lang === 'ur') {
        word.replaceAt('v','b',0);
        // word.replace('v','b');
    }
    if (lang !== 'mr') {
        if (word.sub(word.length-3,word.length) === 'āya') {
            word.w = word.sub(0,-2) + 'Mv';
        }
    }
    word.replaceIntervocal('m','Mv');

    if (lang === 'mr') {
        word.replaceIntervocal('l','L');
    }

    // sibilant split
    if (lang === 'mr') {
        word.replace('siyā', 'zā');
        word.replaceAt('si', 'zi', 0);
        word.replaceAt('sī', 'zī', 0);
        word.replaceAt('se', 'ze', 0);
        word.replaceAt('sè', 'ze', 0);
    }

    // lose final vowels and geminates

    // add final -ā stem
    word.joinAspirate();
    let noTripleGeminates = ['p','P','B','Ð'];
    if (lang !== 'pa') {
        noTripleGeminates = noTripleGeminates.concat(['j','J','k','K','m','g','G']);
    }
    
    let hasCluster = false;
    let tripleCluster = null;
    for (let i = 1; i < word.length; i++) {
        if (cons.has(word.at(i-1)) && cons.has(word.at(i))
        && !(nasals.has(word.at(i-1)) && word.at(i) === 'h')) {
            hasCluster = true;
            break;
        }
    }
    for (let i = 2; i < word.length; i++) {
        if (cons.has(word.at(i-2)) && cons.has(word.at(i-1)) && cons.has(word.at(i))
            && word.at(i-2) === word.at(i-1) && word.at(i-1) === word.at(i)) {
                tripleCluster = word.at(i-1);
                break;
        }
    }
    if (word.endsWith('a') || word.endsWith('i')) {
        if (
        (tripleCluster !== null && lang !== 'mr' && !contains(noTripleGeminates, tripleCluster)) ||
        (nasals.has(word.at(-3)) && word.at(-2) === 'h')) {
            word.w = word.sub(0, -1) + {'a':'Á','i':'Í'}[word.at(-1)];
        }
    } else {
        if (tripleCluster !== null) {
            word.replace(tripleCluster+tripleCluster+tripleCluster, tripleCluster+tripleCluster);
        }
    }

    // lose final vowel
    if (vow.has(word.at(-1)) && !(new Set(['á','ó']).has(word.at(-1))) && word.numVowels() > 1) {
        word.cutAt(word.length-1);
    }

    // compensatory lengthening before losing geminates
    const lengthen = {'a':'ā', 'i':'ī','u':'ū'};
    if (lang !== 'pa') {
        for (let i = word.length-1; i >= 0; i--) {
            // do not lengthen the last vowel, unless there is only one vowel 
            let noLengthen = (i === word.getLastVowel() && word.numVowels() !== 1)
                || (new Set(['ā','e','è','ī','o','ò','ū']).has(word.at(word.getNextVowel(i))));
            if (lang !== 'mr' && noLengthen) {
                continue;
            }
            if (cons.has(word.at(i+1)) && cons.has(word.at(i+2)) && (word.at(i+1) !== 'M' || lang === 'mr' || word.at(i) === 'a')
                && ( !( cons.has(word.at(i+3)) && word.at(i+3) === word.at(i+2) && word.at(i+2) === word.at(i+1) )  || lang === 'mr')
                && lengthen[word.at(i)]) {
                word.replaceAt(word.at(i), lengthen[word.at(i)], i);
                if (lang === 'mr') {
                    if (nasals.has(word.at(i+1)) && word.at(i+2) !== 'h')
                        word.cutAt(i+1);
                }
            }
        }
    }
    word.unjoinAspirate();

    // lose ChC and CCC sequences
    for (let i = word.length-3; i >= 0; i--) {
        if (cons.has(word.at(i)) && word.at(i) === word.at(i+2) && word.at(i+1) === 'h') {
            if (word.at(i+3) === 'h')
                word.cutAt(i+3);
            word.cutAt(i+2);
        } else if (cons.has(word.at(i)) && word.at(i) === word.at(i+2) && word.at(i+1) === word.at(i+2)) {
            word.cutAt(i+2);
            if (lang === 'mr') {
                word.cutAt(i+1);
            }
        }
    }

    word.joinAspirate();

    word.replaceAt('uy','ū',word.length-2);

    // vowel merger
    if (lang === 'mr' && word.numVowels() === 1) {
        word.replaceAll(['i', 'u'], ['ī', 'ū']);
    }

    // lose final geminates
    if (lang === 'pa') {
        if (word.at(-1) === word.at(-2) && !contains(['t','g','K','G','Ț','Ð','n','N','m','j','l','c'], word.at(-1))) {
            word.cutAt(word.length-1);
        }
        if (nasals.has(word.at(-2)) && stops.has(word.at(-1))) {
            word.replaceAt('t','d',word.length-1);
            word.replaceAt('c','j',word.length-1);
            word.replaceAt('k','g',word.length-1);
            word.replaceAt('T','D',word.length-1);
            word.replaceAt('p','b',word.length-1);
        }
    } else {
        while (word.at(-1) === word.at(-2) && word.at(-2) !== '') {
            word.cutAt(word.length-1);
        }
    }
    word.replaceAll(['Á','á','Í'], ['ā','ā','ī']);
    // lose initial geminates
    if (word.at(0) === word.at(1)) {
        word.cutAt(0);
    }

    // lose some more geminates
    word.replaceAll(['pp','PP','BB','ÐÐ'], ['p','P','B','Ð']);
    if (lang === 'pa') {
        word.replaceIntervocal(['jj','JJ'], ['j','J']);
        word.replaceAll(['ll'], ['llh']);
    } else {
        word.replaceAll(['jj','JJ','kk','KK','mm','gg','GG'], ['j','J','k','K','m','g','G']);
        word.replaceAll(['ŤŤ','ȚȚ'], ['Ť','Ț']);
    }

    word.unjoinAspirate();

    // vowel hiatus
    word.replaceAll(['eā'], ['iā']);
    if (lang === 'mr') {
        word.replaceAll(['iā', 'ia', 'ie', 'io','āvu', 'āya'], ['ivā', 'iva', 'ive', 'ivo','āū', 'āva']);
    } else if (lang === 'hi' || lang === 'ur') {
        word.replaceAll(['iā', 'ivā', 'ia', 'ie', 'io', 'iu', 'iū', 'īvā'], ['iyā', 'iyā', 'iya', 'iye', 'iyo', 'iyu', 'iyū', 'iyā']);
    }
    if (lang !== 'mr') {
        word.replaceAll(['ave', 'ivā', 'èvu'], ['e', 'iā', 'ò']);
    }
    if (lang === 'pa') {
        word.replaceAll(['iā', 'ie', 'io', 'iu'], ['īā', 'īe', 'īo', 'īu']);
    }
    if (lang === 'mr' || lang === 'pa') {
        word.replaceAll(['āe', 'āè'], ['āve', 'āvè']);
    } else {
        word.replaceAll(['āe', 'āè'], ['āye', 'āyè']);
    }
    word.replaceAll(['avu','īa'], ['ò','ī']);
    word.replaceAll(['āā', 'īī', 'ūū', 'ee', 'oo'], ['ā', 'ī', 'ūū', 'e', 'o']);
    for (const stop of ['p','b','k','g'])
        word.replaceAt(stop+'iyā', stop+'yā', 0);
    if (lang === 'mr') {
        word.replaceAll(['aha','āha','ahā','āhā'], ['ā','ā','ā','ā']);
    } else if (lang === 'pa') {
        word.replaceAll(['aha'], ['ahi']);
    }

    // lose final aspirates
    word.replaceAt('mh','m',word.length-2);
    word.replaceAt('nh','n',word.length-2);
    if (lang === 'mr') {
        if (contains(['t','T'], word.at(-2)) && word.at(-1) === 'h')
            word.cutAt(word.length-1);
        word.replaceAll(['Mv'], ['v']);
    }
    if (lang === 'pa') {
        word.replaceIntervocal('Mv','V');
        word.replaceAll(['Mv'], ['M']);
        word.replace('V', 'Mv');
    }

    word.replace('N','n');
    if (lang === 'mr') {
        word.replaceBefore('cch','s',VOWELS);
        word.replaceBefore('ch','s', VOWELS);
        word.replaceAt('ch','s',word.length-2);
        word.replaceAt('on','oN',word.length-2);
        word.replaceAt('M','',word.length-1); // remove nasalization
    } else {
        word.replaceIntervocal('D','R');
        word.replaceIntervocal('Dh','Rh');
        if (!cons.has(word.at(-2)))
            word.replaceAt('D','R',word.length-1);
        if (!cons.has(word.at(-3)))
            word.replaceAt('Dh','Rh',word.length-1);
        // word.replaceAt('è','e',word.length-1);
        word.replaceAt('aM','āM',word.length-2);
        word.replaceAt('iM','īM',word.length-2);
        word.replaceAt('uM','ūM',word.length-2);
        word.replaceAt('mb','m',word.length-2);
    }
    if (lang === 'mr' || lang === 'pa') {
        word.replaceAfter('n','?',new Set(['ā','o','a']));
        word.replaceBefore('?', 'N', VOWELS);
        word.replace('?', 'n');
        word.replaceAt('an','aN',word.length-2);
    }

    if (lengthen[word.at(-1)])
        word.replaceAt(word.at(-1), lengthen[word.at(-1)], word.length-1);

    mapStage("NIA", word.w);
    return word.w;
}