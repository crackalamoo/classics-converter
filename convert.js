// rs

function convertWords(text, mapper) {
    let words = text.split(' ').filter((w) => w.length > 0);
    words = words.map((w) => w === '\n' ? w : mapper(w));
    words = words.join(' ').replaceAll(' \n ','\n').replaceAll(' \n','\n').replaceAll('\n ','\n');
    return words;
}

function convertWord(startWord, inLang, outLang, inOrthoBox=false) {
    if (inLang === 'la') {
        if (inOrthoBox)
            return '';
        return latin_to_lang(startWord, outLang);
    } else if (inLang === 'sa') {
        let res = startWord;
        res = sanskrit_to_lang(startWord, outLang);
        if (isRoman(startWord) != inOrthoBox)
            return sanskritRomanOrthography(res, outLang);
        else
            return nativeOrthography(res, outLang);
    }
    return startWord;
}

function latin_to_lang(latinWord, lang) {
    let word = latinOrthography(latinWord.toLowerCase());
    console.log("Latin: " + new LatinateWord(word));
    word = latin_to_proto_romance(word, lang);
    console.log("Proto-Romance: " + word);
    if (WESTERN_ROMANCE.has(lang)) {
        word = romance_to_western_romance(word, lang);
        console.log("Western Romance: " + word);
        if (lang === 'fr') {
            word = western_romance_to_french(word);
            console.log("French: " + word);
        } else if (lang === 'es') {
            word = western_romance_to_old_spanish(word);
            console.log("Old Spanish: " + word);
        }
    } else if (lang === 'it') {
        word = romance_to_italian(word);
        console.log("Italian: " + word);
    }
    word = word.toString();
    // word = romanceOrthography(word, latinWord, lang);
    return word;
}

function latin_to_proto_romance(word, finalLang='') {
    word = new LatinateWord(word);
    
    word.replaceAll(['h','rs','ps','pt','y','ȳ'], ['','ss','ss','tt','i','ī']);
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
    word.replaceStressed('e', 'è');
    word.replaceStressed('o', 'ò');
    word.replaceAt('è','e',word.length-1);
    word.replaceAt('ò','o',word.length-1);
    word.replaceAll(['æ','œ','au','ii','iī','īi','īī', 'qu'], ['e','ē','aw','i','i','i','i', 'qw']);

    // hiatus
    // replace if unstressed
    word.replaceBefore('e', 'ǐ', VOWELS, 1, true);
    word.replaceBefore('i', 'ǐ', VOWELS, 1, true);
    word.replaceBefore('o', 'w', VOWELS, 1, true);
    word.replaceBefore('u', 'w', VOWELS, 1, true);
    // if stressed antepenultimate, shift stress
    if (new Set(['e','i','u','o']).has(word.atStress()) && VOWELS.has(word.at(word.stress+1))) {
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
    word.replaceAll(['pt','mn','mb'], ['tt','nn','mm']);

    // raise /u/ before /i/ or /j/; vocalize /g/ before /m/ (/g/ becomes /j/ before front vowel)
    word.replaceAll(['ui','uj','uJ','gm'], ['ūi','ūj','ūJ', 'wm']);
    word.replaceAll(['uge','ugē','ugi','ugī'], ['ūge','ūgē','ūgi','ūgī']);
    // raise /ē/ and /ō/ before /stj/
    word.replaceAll(['ōstj','ēstj','ōstǐ','ēstǐ'], ['ūstJ','īstJ','ūstǐ','īstǐ']);
    // add supporting vowel to /sC/
    if (word.at(0) === 's' && CONSONANTS.has(word.at(1))) {
        word.replaceAt('s','is',0);
    }

    // vowel shift
    word.replaceAll(['ā','e','ē','i','ī','o','ō','u','ū'],
                    ['A','E','E','E','I','O','O','O','U']);
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
    if (word.numVowels() > 1 && (word.endsWith('er') || word.endsWith('or'))) {
        // final /er/, /or/ become /re/, /ro/
        word.w = word.sub(0, -2) + 'r' + word.sub(-2, -1);
    }
    // replace /ks/ with /s/ finally and before/after a consonant
    word.replaceAt('x', 's', word.length-1);
    word.replaceBefore('x', 's', CONSONANTS);
    word.replaceAfter('x', 's', CONSONANTS);
    if (word.numVowels() === 1 && CONSONANTS.has(word.at(-1))) {
        word.w += 'e'; // add final epenthetic /e/ for monosyllables
    }

    // palatalization of /k/ and /g/ before front vowels
    word.replaceBefore('c', 'cJ', FRONT_VOWELS);
    word.replaceBefore('g', 'gJ', FRONT_VOWELS);

    if (finalLang !== 'it') {
        const intertonic = word.getIntertonic();
        for (const i of intertonic) {
            // lose intertonic vowels with l/r or sVt, except pretonic /a/
            let prev = word.at(i-1);
            let next = word.at(i+1);
            if ((prev === 'l' || prev === 'r' || next === 'l' || next === 'r' || (prev === 's' && next === 't'))
            && (i > word.stress || word.at(i) !== 'a')
            ) {
                word.cutAt(i);
            }
        }
    }

    // replace/remove /b/, /w/ with /β/
    word.replace('rb','rB');
    word.replaceIntervocal('b','B');
    word.replaceIntervocal('v','W');
    word.replaceAll(['oBo','uBu', 'oBu', 'uBo'], ['obo', 'ubu', 'obu', 'ubo']);
    word.replaceAll(['oWo','uWu', 'oWu', 'uWo'], ['ovo', 'uvu', 'ovu', 'uvo']);
    word.replaceAll(['òWo','òWu','òBo','òBu'], ['òvo','òvu','òbo','òbu']);
    // maintain b for orthography in Spanish
    if (finalLang !== 'es') {
        word.replace('B', 'W');
    }
    word.replaceAll(['Bo','Bu','Bò','Wo','Wu','Wò'], ['o','u','ò','o','u','ò']);
    word.replace('W', 'v');
    word.replace('B', 'b');

    if (finalLang === 'it')
        word.replaceAll(['gj','dj','gJ','dJ'], ['gJ','gJ','gJ','gJ']);
    else
        word.replaceAll(['gj','dj','gJ','dJ'], ['j','j','j','j']);

    return word;
}

function romance_to_italian(word) {
    word.replace('aw','o');

    // first diphthongization
    let didDiphthong = 0;
    for (let i = word.length-1; i >= 0; i--) {
        let openCriterion = openSyllable(word.w, i, false, false, VOWELS) || word.at(i+1) === 'j' || word.at(i+2) === 'J'; // diphthongize before a vowel or palatal
        if (openCriterion) {
            if ((word.at(i) === 'è' || word.at(i) === 'ò')
            && !((word.at(i+1) === 'n' || word.at(i+1) === 'm') && CONSONANTS.has(word.at(i+2)))) {
                word.replaceAt(word.at(i), word.at(i).toUpperCase(), i);
                didDiphthong++;
            }
            // else if (word.at(i) === 'e' && (i !== word.length-1 || word.numVowels() === 1)) {
            //     word.replaceAt('e','i',i);
            // }
        } else {
            if (word.at(i) === 'i' || word.at(i) === 'u') {
                word.replaceAt('i','e',i);
                word.replaceAt('u','o',i);
            }
        }
    }
    word.replaceAll(['È','Ò'], ['yè','wò']);
    word.stress += didDiphthong;

    if (word.at(0) === 'e' && word.at(1) === 's' && CONSONANTS.has(word.at(2))) {
        word.cutAt(0);
    }

    word.replaceAll(['ct','x'], ['tt','ss']);
    word.replaceAll(['qwi','qwe','qwu'], ['ki','ke','cu']);

    word.replaceAll(['tJ'], ['z']);
    word.replaceBefore('cl','kj',VOWELS);
    word.replaceBefore('gl','ghj',VOWELS);
    for (var i = word.length-2; i > 0; i--) {
        if (CONSONANTS.has(word.at(i-1)) && word.at(i-1) !== 'l'
        && word.at(i) === 'l' && VOWELS.has(word.at(i+1))) {
            word.replaceAt('l','j',i);
        }
    }

    return word;
}

function romance_to_western_romance(word, finalLang='') {
    word.replace('ccJ','tç'); // ç = /ts/
    word.replaceAll(['cJ','tJ', 'x'], ['ç','ç', 'cs']); // merge /kʲ/ and /tʲ/
    word.replaceAll(['ct','cs'], ['jt','js']); // syllable-final velars
    word.replaceIntervocal('cl', 'lJ', VOWELS.union(SEMIVOWELS));
    word.replaceIntervocal('gl', 'lJ', VOWELS.union(SEMIVOWELS));
    word.replaceIntervocal('gn', 'nJ', VOWELS.union(SEMIVOWELS));

    // first diphthongization
    let didDiphthong = false;
    let i = word.stress;
    let openCriterion = openSyllable(word.w, i, false, false, VOWELS) || word.at(i+1) === 'j' || word.at(i+2) === 'J'; // diphthongize before a vowel or palatal
    if (finalLang === 'es') {
        // vowel raising before /j/
        word.replaceAll(['èj','òj'],['ej','oj']);
        let next_j = word.getNextVowel(word.stress) - 1;
        if (word.at(next_j) === 'j') {
            word.replaceAt('e','i',word.stress);
            word.replaceAt('è','e',word.stress);
            word.replaceAt('ò','o',word.stress);
        }
        openCriterion = true; // always diphthongize remaining /è/ and /ò/ for Spanish
    }
    if ((word.at(i) === 'è' || word.at(i) === 'ò') && (openCriterion)
    && !((word.at(i+1) === 'n' || word.at(i+1) === 'm') && CONSONANTS.has(word.at(i+2)))) {
        word.replaceAt(word.at(i), word.at(i).toUpperCase(), i);
        didDiphthong = true;
    }
    word.replaceAll(['È','Ò'], ['ye','wo']);
    if (didDiphthong)
        word.stress += 1;

    // first lenition
    const intervocal = word.getIntervocal(VOWELS, VOWELS.union(new Set(['r','w','y'])));
    const lenitionMap = {
        'b':'v',
        'd':'ð',
        'g':'ɣ',
        's':'z'
    };
    const lenitionMap2 = {
        'p':'b',
        'c':'g',
        't':'d',
        'f':'v',
        'ç':'ż'
    };
    
    if (VOWELS.has(word.at(word.length-2)))
        intervocal.push(word.length-1);
    for (const i of intervocal) {
        if (lenitionMap[word.at(i)] && (word.at(i) !== 'b' || finalLang !== 'es') && (i !== word.length-1 || (word.at(i) !== 't' && word.at(i) !== 'd'))) {
            // This if statement leaves /b/ unchanged for Spanish (because of the orthography). Leaves final /t/ and /d/ unchanged.
            // Final /t/ and /d/ after a vowel are handled later (but /t/ is kept for French, because of orthography and liaison.)
            word.replaceAt(word.at(i), lenitionMap[word.at(i)], i);
        }
    }
    if (finalLang === 'fr') {
        if (word.at(-2) === 'ð' && VOWELS.has(word.at(-1)) && word.at(-1) !== 'a')
            word.replaceAt('ð', 'd', word.length-2); // final -d kept in French with orthography/liaison
    }
    word.replaceIntervocal('ð', '');
    word.replaceIntervocal('ɣ', '');
    word.replace('ɣ', 'j');
    word.replace('ð', 'd');
    for (const i of intervocal) {
        if (finalLang === 'fr' && word.at(i) === 't' && i === word.length-1) // preserve final -t for French
            continue;
        if (lenitionMap2[word.at(i)] && !(word.at(i) === 'c' && word.at(i+1) === 'l')) {
            if (word.at(i) === 't' && word.at(i+1) === 'l')
                word.replaceAt('t', 'c', i);
            else
                word.replaceAt(word.at(i), lenitionMap2[word.at(i)], i);
        }
    }
    if (VOWELS.has(word.at(-2))) {
        // remove final -t and -d
        if (finalLang !== 'fr')
            word.replaceAt('t', '', word.length-1);
        word.replaceAt('d', '', word.length-1);
    }
    word.replaceAll(['pp','cc','tt','ss'], ['p','c','t','s']);
    word.replaceAll(['jn','nj','jl'], ['nJ','nJ','lJ']);
    word.replaceAll(['aa','ee','ii','oo','uu'], ['a','e','i','o','u'])
    // word.replace('y','j');

    // first unstressed vowel loss
    const intertonic = word.getIntertonic();
    for (const i of intertonic) {
        if (i > this.stress || word.at(i) !== 'a') {
            word.cutAt(i);
        }
    }

    return word;
}

function western_romance_to_french(word) {
    // to early Old French

    // convert /j/ to /dʒ/ in some contexts
    // for (let i = word.length-1; i >= 0; i--) {
    //     if (word.at(i) === 'j' && !VOWELS.has(word.at(i-1))) {
    //         word.replaceAt('j', 'ž', i);
    //     } if (word.at(i) === 'j' && !VOWELS.has(word.at(i+1))) {
    //         word.replaceAt(word.at(i+1), word.at(i+1)+'J', i+1);
    //     }
    // }
    word.w = replaceIntervocal(word.w, 'j', 'ž');
    if (word.at(0) === 'j' && (VOWELS.union(SEMIVOWELS)).has(word.at(1)))
        word.w = 'ž'+word.sub(1);

    word.replaceAll(['ca','ga'], ['ča', 'ža']);

    const isOpen = (i) => (
        openSyllable(word.w, i, true, true, VOWELS.union(new Set(['j','w'])))
    );

    word.replaceAll(['ç', 'č', 'ž', 'ż', 'ssJ'], ['çJ', 'čJ', 'žJ', 'żJ', 'ßJ']);
    console.log(word);
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
            if (isOpen(nextVowel) && nextVowel === word.stress && contains(['e','a'], word.at(nextVowel))) {
                // followed by stressed front vowel in open syllable: eject following /j/
                word.replaceAt(word.at(nextVowel), 'j'+word.at(nextVowel), nextVowel);
                word.stress += 1;
            }
            if (isOpen(prevVowel) && !contains(['č','ž','l'], word.at(i))) {
                // preceded by an open syllable: eject preceding /j/
                word.replaceAt(word.at(prevVowel), word.at(prevVowel)+'j', prevVowel);
            }
        }
    }

    // second diphthongization, and related vowel changes
    // const isOpen = (i) => (
    //     openSyllable(word.w, i, true, true, VOWELS.union(LIQUIDS).union(new Set(['j','w','n'])))
    // );
    // const isOpen = (i) => openSyllable(word.w, i, false, true, VOWELS.union(SEMIVOWELS));//.union(new Set(['r'])));
    console.log(word);
    if (contains(['n','m'], word.at(word.stress+1))) {
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
        word.replaceAt('a','á',word.stress);
        word.replaceAt('ej','ei',word.stress);
        word.replaceAt('o','ó',word.stress);
        word.replaceAt('aw','ó',word.stress);
    } else {
        // all other vowels
        if (isOpen(word.stress)) {
            word.replaceAt('ao', 'ò', word.stress);
            console.log(word.w, word.stress);
            if (word.at(word.stress+2) === 's' && VOWELS.has(word.at(word.stress+3))) {
                word.replaceAt('aws', 'ós', word.stress);
            }
            word.replaceAt('aw', 'ò', word.stress);
            word.replaceAt('au', 'ò', word.stress);
            word.replaceAt('a', 'è', word.stress);
            if (word.atStress() === 'è') {
                word.replaceAt('è', 'jè', word.stress);
                word.stress += 1;
            }
            // prevent diphthongization of existing Western Romance diphthongs
            if (word.at(word.stress-1) !== 'y')
                word.replaceAt('e','ei',word.stress);
            if (word.at(word.stress-1) !== 'w')
                word.replaceAt('o','ou',word.stress);
        } else {
        }
    }
    console.log('->', word);

    // loss of final unstressed vowels
    const lastVowel = word.getLastVowel();
    if (lastVowel !== word.stress && word.at(lastVowel) !== 'a') {
        word.cutAt(lastVowel);
    }
    if (word.at(-1) === word.at(-2)) {
        word.cutAt(word.length-1);
    }

    // late open/late closed stage
    if (new Set(['n', 'm']).has(word.at(word.stress+1))) {
        if (isOpen(word.stress)) {

        } else {
            word.replaceAt('è','jè',word.stress);
            word.replaceAt('a','è',word.stress);
            if (word.atStress() === 'á' && contains(['j','J'], word.at(word.stress-1))) {
                word.replaceAt('á','è',word.stress);
                word.replaceAt('J','j',word.stress-1);
            }
        }
    }
    word.replaceAll(['á','ê'], ['a','è']);

    word.replaceAll(['nJJ','lJJ','ajrJ','jlJ'], ['nJ','lJ','jerJ','lJ']);
    word.replaceAll(['nJ','lJ'], ['ñ','ł']);
    word.replaceAll(['ß', 'Jae', 'Jjae'], ['s', 'jÈÈ', 'jÈÈ']);
    word.replaceAll(['aen','aem','aeñ'], ['ajn','ajm','ajñ']);
    word.replaceAll(['ae','ÈÈ'], ['è','è']);

    // second lenition
    const intervocal = word.getIntervocal(VOWELS, VOWELS.union(new Set(['r','w'])));
    const lenitionMap = {
        'b':'v',
        'd':'ð',
        'g':'ɣ',
        // 's':'z' // intervocal /s/ not changed for orthography reasons
    };
    const lenitionMap2 = {
        'p':'b',
        'c':'g',
        't':'d',
        'f':'v',
        'ç':'ż'
    };
    
    if (VOWELS.has(word.at(word.length-2)))
        intervocal.push(word.length-1);
    for (const i of intervocal) {
        if (lenitionMap[word.at(i)] && (i !== word.length-1 || (word.at(i) !== 't' && word.at(i) !== 'd'))) {
            // Leaves final /t/ and /d/ unchanged because of orthography and liaison.
            word.replaceAt(word.at(i), lenitionMap[word.at(i)], i);
        }
    }
    for (const i of intervocal) {
        if (lenitionMap2[word.at(i)] && !(word.at(i) === 'c' && word.at(i+1) === 'l')) {
            word.replaceAt(word.at(i), lenitionMap2[word.at(i)], i);
        }
    }
    word.replace('tç','ç');
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
    word.replace('J','');

    // further vocalic changes
    if (contains(['jej', 'jèj', 'woj'], word.sub(word.stress-1, word.stress+2)))
        word.stress += 1;
    word.replaceAll(['jej','jei','yej','woj','òjj','jèj'], ['iJ','iJ','iJ','uj','uj','jè']);
    word.replaceAt('a','ë',word.length-1);

    word.replace('J','');
    word.replace('jj','j');
    word.replaceAt('v','f',word.length-1);
    if (LIQUIDS.has(word.at(-1)) && STOPS.has(word.at(-2))) {
        word.w += 'ë';
    }

    // to Old French

    // nasalization
    word.replaceAll(['an','en','òn','won','èn','oun','ein','on','ojn'], ['ãn','ẽn','õn','õn','ẽn','õun','ẽin','õn','õjn']);
    word.replaceAll(['am','em','òm','wom','èm','oum','eim','om','ojm'], ['ãm','ẽm','õm','õm','ẽm','õum','ẽim','õm','õjm']);

    if (contains(['f','p','k'], word.at(-2) && contains(['s','t'], word.at(-1))))
        word.w = word.sub(0,-1);

    word.replaceAll(['oub','oup','oum','ouf','ouv'], ['oúb','oúp','oúm','oúf','oúv']);
    word.replaceAll(['ou','ue','wo'], ['eu','eu','eu']);
    word.replaceBefore('að','ë',VOWELS);
    word.replaceBefore('aɣ','ë',VOWELS);
    word.replaceAll(['ɣ','ð','J'], ['','','']);
    word.replace('ú','u');
    word.replace('ei','ói');

    // to Late Old French
    word.replace('ou','óu');
    word.replace('o','óu');
    word.replace('ó','o');
    word.replaceAt('rn','r',word.length-2);
    word.replaceAt('rm','r',word.length-2);
    for (cons of CONSONANTS) {
        word.replaceAt('rm'+cons, 'r'+cons, word.length-3);
    }

    // const isOpen2 = (i) => openSyllable(word.w, i, false, false, VOWELS.union(SEMIVOWELS));
    const isOpen2 = (i) => openSyllable(word.w, i, false, false, VOWELS);
    // syllable-final consonant loss
    for (let i = word.length-2; i >= 0; i--) {
        if (CONSONANTS.has(word.at(i)) && !VOWELS.has(word.at(i+1)) && !isOpen2(word.getPrevVowel(i))
        && word.getPrevVowel(i) !== -1 && word.at(i) !== word.at(i+1)) {
            // (non-geminate consonants, not followed by a vowel, where the previous vowel is in a closed syllable)
            if (word.at(i) === 's' || word.at(i) === 'ż') {
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
                if (VOWELS.has(word.at(i-2)) && word.at(i-1) === 'j') {
                    word.replaceAt('j','î',i-1);
                }
                word.cutAt(i);
            } /* else if (word.at(i) === 'l' && !(word.at(i+1) == 'l')) {
                // lose syllable-final /l/
                word.replaceAt('l','W',i);
            } */
            // nasal vowels are kept as-is for orthography reasons
        }
    }
    word.replaceAt('èr','er',word.length-2);
    // word.replaceAt('ž','',word.length-1);

    // To Middle French:
    word.replace('õun','õn');
    word.replace('aw','ò');
    // word.replace('W','w');

    return word;
}

function western_romance_to_old_spanish(word) {
    word.replaceAll(['J','y'], ['','j']);
    return word;
}

function sanskrit_to_lang(sanskritWord, lang) {
    let word = sanskritOrthography(sanskritWord);
    word = new SanskriticWord(word);
    const cons = SANSKRIT_CONS;
    const vow = VOWELS.union(new Set(['R']));
    const nasals = SANSKRIT_NASALS;
    const stops = SANSKRIT_STOP_CONS;
    const labials = SANSKRIT_LABIAL_CONS;
    const glides = SANSKRIT_GLIDES;
    const sibilants = new Set(['s','z','S']);

    // Proto Indo-Aryan to Middle Indo-Aryan

    word.replaceAll(['ai','au'], ['è','ò']);
    if (lang === 'pi') {
        word.replaceAt('aya','aYa',word.length-3);
        word.replaceAt('ava','aVa',word.length-3);
        word.replaceAll(['aya','ava'], ['è','ò']);
        word.replaceAll(['Y','V'], ['y','v']);
        word.replaceAll(['è','ò'], ['e','o']);
    } else {
        word.replaceAll(['aya','ava'], ['è','ò']);
    }
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
    }
    word.replaceIntervocal('nv','mm');
    word.replaceIntervocal('mr','mb');
    word.replaceIntervocal('ml','mb');
    word.replaceIntervocal('Hz','ss');
    word.replaceAll(['Țy','Ðy','ty','dy','sȚ','ts','ps'], ['CC','JJ','cc','jj','ŤŤ','CC','CC']);
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
        word.replace('y','j');
        word.replaceAll(['hv', 'yh', 'hy'], ['BB', 'JJ', 'JJ']);
    } else {
        word.replaceAll(['hv', 'hy'], ['vh', 'yh']);
    }

    word.unjoinAspirate();
    word.replace('hh','h');
    word.replace('kš','kh');
    word.replaceAll(['z','S'], ['s','s']);
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
        word.replaceIntervocal('z','h');
        word.replaceIntervocal('S','h');
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

    // shorten long vowels before two consonants
    const shorten = {'ā':'a', 'ī':'i', 'ū':'u'};
    for (let i = word.length-1; i >= 0; i--) {
        if (cons.has(word.at(i+1)) && cons.has(word.at(i+2)) && shorten[word.at(i)]) {
            word.replaceAt(word.at(i), shorten[word.at(i)], i);
        }
    }

    if (lang === 'pi') {
        word.replaceIntervocal('D','L');
        word.replaceIntervocal('Dh','Lh');

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
    }

    word.replace('aH','o');
    word.replace('H','');

    if (lang === 'pi') {
        return word.w;
    }

    // shorten final long vowels
    const shorten2 = {'ā':'a', 'ī':'i', 'ū':'u', 'e':'i', 'o':'u','aM':'u'};
    for (const [key, val] of Object.entries(shorten2)) {
        word.replaceAt(key, val, word.length-key.length);
    }
    word.replaceAll(['è','ò'], ['e','o']);

    word.unjoinAspirate();

    // Middle Indo-Aryan to New Indo-Aryan
    console.log("MIA:", word);
    // coalescing vowels
    word.replaceAll(['uyu','aā','āa','iī','īyi'], ['ū','ā','ā','ī','ayi']);
    word.replaceAt('aya','á',word.length-3);
    word.replaceAll(['ava', 'aya'], ['ò', 'è']);
    word.replaceAll(['ai','āi','au','āu','aū','aī','ayu','ayi'], ['è','è','ò','ò','o','e','ò','è']);
    word.replaceAll(['aa','ayā','iy','īy','ii'], ['ā','ā','i','ī','ī']);
    if (lang !== 'mr')
        word.replaceAll(['oā','ovā','eā','eyā'], ['vā','vā','yā','yā']);

    word.replaceAll(['N','ñ','ń'], ['N','n','n']); // nasals merger

    if (lang === 'hi' || lang === 'ur') {
        word.replace('vv','b');
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
    }

    // lose final vowels and geminates

    // add final -ā stem
    word.joinAspirate();
    if (word.endsWith('a')) {
        let hasCluster = false;
        let hasTripleCluster = false;
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
                    hasTripleCluster = true;
                    break;
            }
        }
        if (
        // (!hasCluster && contains(['è','e'], word.at(word.getPrevVowel(word.length-1)))) ||
        (hasTripleCluster && lang !== 'mr') ||
        (nasals.has(word.at(-3)) && word.at(-2) === 'h')) {
            word.w = word.sub(0, -1) + 'Á';
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
            if (cons.has(word.at(i+1)) && cons.has(word.at(i+2))
                && ( !( cons.has(word.at(i+3)) && word.at(i+3) === word.at(i+2) )  || lang === 'mr')
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
    if (lang !== 'pa') {
        while (word.at(-1) === word.at(-2) && word.at(-2) !== '') {
            word.cutAt(word.length-1);
        }
    } else {
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
    }
    word.replaceAll(['Á','á'], ['ā','ā']);
    // lose initial geminates
    if (word.at(0) === word.at(1)) {
        word.cutAt(0);
    }

    // lose some more geminates
    word.replaceAll(['pp','PP','BB'], ['p','P','B']);
    if (lang !== 'pa') {
        word.replaceAll(['jj','JJ','kk','mm'], ['j','J','k','m']);
    } else {
        word.replaceIntervocal(['jj','JJ'], ['j','J']);
    }
    if (lang === 'mr') {
        word.replaceAll(['ŤŤ'], ['Ť']);
    }

    word.unjoinAspirate();

    // break vowel hiatus
    if (lang === 'mr') {
        word.replaceAll(['iā', 'ia', 'ie', 'io'], ['ivā', 'iva', 'ive', 'ivo']);
    } else if (lang === 'hi' || lang === 'ur') {
        word.replaceAll(['iā', 'ivā', 'ia', 'ie', 'io', 'iu', 'iū'], ['iyā', 'iyā', 'iya', 'iye', 'iyo', 'iyu', 'iyū']);
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
    for (const stop of ['p','b','k','g'])
        word.replaceAt(stop+'iyā', stop+'yā', 0);

    // lose final aspirates
    word.replaceAt('mh','m',word.length-2);
    word.replaceAt('nh','n',word.length-2);
    if (lang === 'mr') {
        if (contains(['t'], word.at(-2)) && word.at(-1) === 'h')
            word.cutAt(word.length-1);
        word.replaceAll(['Mv'], ['v']);
    }

    word.replace('N','n');
    if (lang !== 'mr') {
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
    } else {
        word.replaceBefore('cch','s',VOWELS);
        word.replaceBefore('ch','s', VOWELS);
        // word.replaceBefore('c','s', VOWELS);
        word.replaceAfter('n','?',new Set(['ā','o']));
        word.replaceBefore('?', 'N', VOWELS);
        word.replace('?', 'n');
        word.replaceAt('on','oN',word.length-2);
    }

    if (lengthen[word.at(-1)])
        word.replaceAt(word.at(-1), lengthen[word.at(-1)], word.length-1);

    console.log("NIA:", word.w);
    return word.w;
}