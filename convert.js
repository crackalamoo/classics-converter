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
        const res = sanskrit_to_lang(startWord, outLang);
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
    console.log(word);
    if (WESTERN_ROMANCE.has(lang)) {
        word = romance_to_western_romance(word, lang);
        console.log("Western Romance: " + word);
    }
    // if (lang === 'fr') {
    //     word = western_romance_to_old_french(word);
    //     console.log("Old French: " + word);
    // } else if (lang === 'es') {
    //     word = western_romance_to_old_spanish(word);
    //     console.log("Old Spanish: " + word);
    // }
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
    word.replaceAll(['dǐ', 'gǐ'], ['j','j']);

    // remove w before unstressed back vowels
    word.replaceStressed('o','O'); word.replaceStressed('ō','Ō');
    word.replaceStressed('u','U'); word.replaceStressed('ū','Ū')
    word.replaceAll(['wo','wu','wō','wū'], ['o','u','ō','ū']);
    word.replaceAll(['O','Ō','U','Ū'], ['o','ō','u','ū']);

    // delabialize /k/ before back vowels; delete /w/ before /o/; delete /j/ before /e/; replace /kwj/ with /kj/
    word.replaceAll(['qwo','qwō','qwu','qwū','ǐē','wō','ǐe','wo','qwǐ'], ['co','cō','cu','cū','ē','ō','ē','ō','cj']);
    word.replaceAll(['ttw','ccw','ppw'], ['tt','cc','pp']); // delete w after geminate
    word.replaceAll(['pt','mn','mb'], ['tt','mn','mm']);

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
        // remove final /m/, or replace with /n/ in monosyllables
        if (word.numVowels() === 1)
            word.w = word.sub(0, -1) + 'n';
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

    const intertonic = word.getIntertonic();
    for (const i of intertonic) {
        // lose intertonic vowels with l/r or sVt, except pretonic /a/
        let prev = word.at(i-1);
        let next = word.at(i+1);
        if ((prev === 'l' || prev === 'r' || next === 'l' || next === 'r' || (prev === 's' && next === 't'))
        && (i > word.stress || word.at(i) !== 'a')) {
            word.cutAt(i);
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

    word.replaceAll(['gj','dj','gJ','dJ'], ['j','j','j','j']);

    return word;
}

function romance_to_western_romance(word, finalLang='') {
    word.replace('ccJ','tç'); // ç = /ts/
    word.replaceAll(['cJ','tJ', 'x'], ['ç','ç', 'cs']); // merge /kʲ/ and /tʲ/
    word.replaceAll(['ct','cs'], ['jt','js']);

    // first diphthongization
    let didDiphthong = false;
    let i = word.stress;
    let openCriterion = openSyllable(word.w, i, false, false) || word.at(i+1) === 'j' || word.at(i+2) === 'J'; // diphthongize before a vowel or palatal
    if (finalLang === 'es') {
        // vowel raising before /j/
        word.replaceAll(['èj','òj'],['ej','oj']);
        let next_j = word.getNextVowel(word.stress) - 1;
        if (word.at(next_j) === 'j') {
            word.replaceAt('e','i',word.stress);
            word.replaceAt('è','e',word.stress);
            word.replaceAt('ò','o',word.stress);
        }
        openCriterion = true; // always diphthongize remaining /è/ and /ò/
    }
    if ((word.at(i) === 'è' || word.at(i) === 'ò')
    && (openCriterion)
    && !((word.at(i+1) === 'n' || word.at(i+1) === 'm') && CONSONANTS.has(word.at(i+2)))) {
        word.replaceAt(word.at(i), word.at(i).toUpperCase(), i);
        didDiphthong = true;
    }
    word.replaceAll(['È','Ò'], ['ye','wo']);
    if (didDiphthong)
        word.stress += 1;

    // first lenition
    const intervocal = word.getIntervocal(VOWELS, VOWELS.union(new Set(['r','w','l'])));
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
        if (lenitionMap[word.at(i)] && (word.at(i) !== 'b' || finalLang !== 'es') && (word.at(i) === 'g' || finalLang !== 'fr' || i !== word.length-1)) {
            word.replaceAt(word.at(i), lenitionMap[word.at(i)], i);
        }
    }
    word.w = replaceIntervocal(word.w, 'ð', '');
    word.w = replaceIntervocal(word.w, 'ɣ', '');
    word.replace('ɣ', 'j');
    for (const i of intervocal) {
        if (lenitionMap2[word.at(i)] && !(word.at(i) === 'c' && word.at(i+1) === 'l')) {
            if (word.at(i) === 't' && word.at(i+1) === 'l')
                word.replaceAt('t', 'c', i);
            else
                word.replaceAt(word.at(i), lenitionMap2[word.at(i)], i);
        }
    }
    if (VOWELS.has(word.at(-2))) {
        // remove final -t and -d
        word.replaceAt('t', '', word.length-1);
        word.replaceAt('d', '', word.length-1);
    }
    word.replaceAll(['pp','cc','tt','ss'], ['p','c','t','s']);
    word.replaceAll(['jn','nj','jl','y'], ['nJ','nJ','lJ','j']);

    // first unstressed vowel loss
    const intertonic = word.getIntertonic();
    for (const i of intertonic) {
        if (i > this.stress || word.at(i) !== 'a') {
            word.cutAt(i);
        }
    }

    return word;
}

function western_romance_to_old_french(word) {
    // to early Old French
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

    // loss of final unstressed vowels
    const lastVowel = word.getLastVowel();
    if (lastVowel !== word.stress && word.at(lastVowel) !== 'a') {
        word.cutAt(lastVowel);
    }
    console.log(word);

    // second diphthongization
    const isOpen = (i) => (
        openSyllable(word.w, i, true, true, VOWELS.union(LIQUIDS).union(new Set(['j','w','n'])))
    );
    if (isOpen(word.stress) && word.at(word.stress+2) !== 'J') {
        if (word.at(word.stress+1) !== 'w') {
            word.replaceAt('a','ae',word.stress);
            if (word.at(word.stress-1) !== 'w')
                word.replaceAt('o','ou',word.stress);
        }
        if (word.at(word.stress+1) !== 'j') {
            word.replaceAt('e','ei',word.stress);
        }
    }

    word.replaceAll(['ł', 'ç', 'č', 'ž', 'ż', 'ssJ','ñ'], ['lJ', 'çJ', 'čJ', 'žJ', 'żJ', 'ßJ','nJ']);
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
                // followed by stressed front vowel in open syllable
                word.replaceAt(word.at(nextVowel), 'j'+word.at(nextVowel), nextVowel);
                word.stress += 1;
            }
            if (isOpen(prevVowel) && !contains(['č','ž','ł'], word.at(i))) {
                // preceded by an open syllable
                word.replaceAt(word.at(prevVowel), word.at(prevVowel)+'j', prevVowel);
            }
        }
    }
    console.log(word);

    word.replaceAll(['nJJ','lJJ','ajrJ','jlJ'], ['ñJ','łJ','jerJ','lJ']);
    word.replaceAll(['nJ','lJ'], ['ñ','ł']);
    word.replaceAll(['ß', 'Jae', 'Jjae'], ['ss', 'jÈÈ', 'jÈÈ']);
    word.replaceAll(['aen','aem','aeñ'], ['ajn','ajm','ajñ']);
    word.replaceAll(['ae','aw','ÈÈ'], ['è','ò','è']);

    // nasalization
    word.replaceAll(['an','en','òn','won','èn'], ['ãn','ẽn','õn','õn','ẽn']);

    // second lenition
    const intervocal = word.getIntervocal(VOWELS, VOWELS.union(new Set(['w','l','r'])));
    console.log(word, intervocal);
    const lenitionMap = {
        'b':'v',
        'd':'',
        'g':''
    };
    const lenitionMap2 = {
        'p':'b',
        'c':'g',
        't':'d',
        'f':'v'
    };

    for (const i of intervocal) {
        if (lenitionMap[word.at(i)] === '') {
            word.cutAt(i);
        } else if (!!lenitionMap[word.at(i)]) {
            word.replaceAt(word.at(i), lenitionMap[word.at(i)], i);
        }
    }
    for (const i of intervocal) {
        if (lenitionMap2[word.at(i)]) {
            word.replaceAt(word.at(i), lenitionMap2[word.at(i)], i);
        }
    }
    if (word.endsWith('g'))
        word.w = word.sub(0,-1);

    // depalatalization
    word.replaceAfter('ñ','n',CONSONANTS.union(SEMIVOWELS),1,false);
    word.replaceAfter('ł','l',CONSONANTS.union(SEMIVOWELS),1,false);
    if (word.endsWith('ñ'))
        word.w = word.sub(0,-1)+'jn';
    else if (word.endsWith('ł'))
        word.w = word.sub(0,-1)+'l';
    word.replaceAt('iła','illa',word.length-3);
    word.replaceAt('iłe','ille',word.length-3);
    word.replace('ł','l');
    word.replace('J','');

    console.log(word);
    word.replaceAll(['jej','jei','woj','òjj'], ['iJ','iJ','uj','uj']);
    word.replace('J','');
    word.replace('jj','j');
    word.replaceAt('a','ë',word.length-1);
    word.replaceAt('v','f',word.length-1);
    if (LIQUIDS.has(word.at(-1)) && STOPS.has(word.at(-2))) {
        word.w += 'ë';
    }

    // to Old French
    if (contains(['f','p','k'], word.at(-2) && contains(['s','t'], word.at(-1))))
        word.w = word.sub(0,-1);

    word.replaceAll(['oub','oup','oum','ouf','ouv'], ['oúb','oúp','oúm','oúf','oúv']);
    word.replaceAll(['ou','ue','wo'], ['eu','eu','eu']);
    word.replaceBefore('að','ë',VOWELS);
    word.replaceBefore('aɣ','ë',VOWELS);
    word.replaceAll(['ɣ','ð','J'], ['','','']);
    word.replace('ú','u');
    word.replace('ei','oi');

    // to Late Old French
    // word.replace('ou','óu');
    // word.replace('o','u');
    // word.replace('ó','o');
    word.replaceAt('rn','r',word.length-2);
    word.replaceAt('rm','r',word.length-2);
    for (cons of CONSONANTS) {
        word.replaceAt('rm'+cons, 'r'+cons, word.length-3);
    }

    console.log(word);
    const isOpen2 = (i) => openSyllable(word.w, i, false, false, VOWELS);
    for (let i = word.length-2; i >= 0; i--) {
        if (CONSONANTS.has(word.at(i)) && !VOWELS.has(word.at(i+1)) && !isOpen2(word.getPrevVowel(i))
        && word.getPrevVowel(i) !== -1 && word.at(i) !== word.at(i+1)) {
            if (word.at(i) === 's') {
                if (i === 1) {
                    word.replaceAt('e','é',0);
                } else {
                    word.replaceAt('e','ê',i-1);
                }
                word.replaceAt('a','â',i-1);
                word.replaceAt('i','î',i-1);
                word.replaceAt('o','ô',i-1);
                word.replaceAt('u','û',i-1);
            }
            if (word.at(i) === 'l')
                word.replaceAt('l','w',i);
            else
                word.cutAt(i);
            console.log(word);
        }
    }
    word.replaceAt('ë','ė',word.length-1); // not pronounced as a vowel
    word.replaceAt('èr','er',word.length-2);

    return word;
}

function western_romance_to_old_spanish(word) {
    word.replaceAll(['ɣ','ð','J'], ['','','']);
    return word;
}

// https://books.google.com/books?id=J3RSHWePhXwC&pg=PA1&source=gbs_selected_pages&cad=1#v=onepage&q&f=false
function sanskrit_to_lang(sanskritWord, lang) {
    let word = sanskritOrthography(sanskritWord);
    word = new SanskritWord(word);
    // console.log(word);
    const cons = SANSKRIT_CONS;
    const vow = VOWELS.union(new Set(['R']));
    const nasals = SANSKRIT_NASALS;
    const stops = SANSKRIT_STOP_CONS;
    const labials = SANSKRIT_LABIAL_CONS;
    const glides = SANSKRIT_GLIDES;
    const sibilants = new Set(['s','z','S']);

    // Proto Indo-Aryan to Middle Indo-Aryan

    word.replaceAll(['ai','au','aya','ava'], ['è','ò','è','ò']);
    word.joinAspirate();

    if (word.startsWith('R'))
        word.replaceAt('R', 'ri', 0);
    for (let i = word.length-1; i > 0; i--) {
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
    word.replaceIntervocal('y', '');
    word.replaceAll(['ry','yy'], ['jj','jj']);
    // word.replaceAt('jñ','ñ',0);
    // word.replace('jñ','ññ');
    word.replaceAt('m','M',word.length-1);
    word.replaceAt('n','M',word.length-1);
    // lose final consonants
    if (cons.has(word.at(-1)) && word.at(-1) !== 'H')
        word.cutAt(word.length-1);

    // reduce initial clusters
    word.replaceAt('kS','K',0);
    word.replaceAt('ty','c',0);
    word.replaceAt('dy','j',0);
    word.replaceAt('Țy','C',0);
    word.replaceAt('Ðy','J',0);
    word.replaceAt('Sa','ca',0);
    word.replaceAt('dvā','vvā',0);
    if (cons.has(word.at(0))) {
        if (contains(['r','v','y'], word.at(1))) {
            word.cutAt(1);
        } else if (word.at(1) === 'l') {
            word.replaceAt('l', 'il', 1);
        }
    }
    // reduce remaining clusters
    word.replaceBefore('Dv','vv',VOWELS);
    word.replaceAfter('dv','vv',VOWELS);
    word.replaceIntervocal('nv','mm');
    word.replaceIntervocal('mr','mb');
    word.replaceIntervocal('ml','mb');
    word.replaceIntervocal('Hz','ss');
    word.replaceAll(['Țy','Ðy','ty','dy','sȚ','ts','ps'], ['CC','JJ','cc','jj','ŤŤ','CC','CC']);
    for (let i = word.length-2; i >= 0; i--) {
        if (stops.has(word.at(i)) && stops.has(word.at(i+1)))
            word.replaceAt(word.at(i), word.at(i+1), i);
        else if (((stops.union(nasals).union(sibilants)).has(word.at(i))) && glides.has(word.at(i+1))) {
            word.replaceAt(word.at(i+1), word.at(i), i+1);
        } else if (((stops.union(nasals)).has(word.at(i+1))) && contains(['l','r'], word.at(i)))
            word.replaceAt(word.at(i), word.at(i+1), i);
        else if (stops.has(word.at(i)) && sibilants.has(word.at(i+1)))
            word.replaceAt(word.at(i+1), word.at(i)+'h', i+1);
        else if (sibilants.has(word.at(i)) && stops.has(word.at(i+1))) {
            if (word.sub(i-2, i+1) !== 'niS')
                word.replaceAt(word.at(i+1), word.at(i+1)+'h', i+1);
            word.replaceAt(word.at(i), word.at(i+1), i);
        } else if (sibilants.has(word.at(i)) && nasals.has(word.at(i+1))) {
            if (i > 0)
                word.replaceAt(word.at(i)+word.at(i+1), word.at(i+1)+'h', i);
            else
                word.cutAt(1);
        } else if (stops.has(word.at(i)) && nasals.has(word.at(i+1)))
            word.replaceAt(word.at(i+1), word.at(i), i+1);
        else if (nasals.has(word.at(i)) && nasals.has(word.at(i+1)))
            word.replaceAt(word.at(i), word.at(i+1), i);
    }
    word.replace('JJy','JJ');
    word.replaceIntervocal('ly','ll'); word.replaceIntervocal('yl','ll');
    word.replaceIntervocal('lr','ll'); word.replaceIntervocal('rl','ll');
    word.replaceIntervocal('rv','vv'); word.replaceIntervocal('yv','vv');
    word.replaceIntervocal('vr','vv'); word.replaceIntervocal('vy','vv');
    word.replaceIntervocal('yr','jj'); word.replaceIntervocal('ry','jj');
    word.replaceAll(['hn','hN','hm','hl','hv','hy','yh','vh'],['nh','Nh','mh','lh','BB','JJ','JJ','BB']);
    word.replace('y','j');

    word.unjoinAspirate();
    word.replace('hh','h');

    word.replace('kš','kh');
    word.replaceAll(['z','S'], ['s','s']);

    // intervocal reduction
    word.joinAspirate();
    word.replaceIntervocal('g','y');
    word.replaceIntervocal('k','y');
    word.replaceIntervocal('c','y');
    word.replaceIntervocal('j','y');
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
    word.replaceIntervocal('Ť','Ď');
    // word.replaceAt('ti','ťi',word.length-2);
    // word.replaceAt('te','ťe',word.length-2);
    // word.replaceAt('Tiya','țiya',word.length-4);
    word.replaceIntervocal('t','y');
    word.replaceIntervocal('T','D');
    // word.replace('ť','t');
    // word.replace('ț','T');

    // shorten long vowels
    const shorten = {'ā':'a', 'ī':'i', 'ū':'u'};
    for (let i = word.length-1; i >= 0; i--) {
        if (cons.has(word.at(i+1)) && cons.has(word.at(i+2)) && shorten[word.at(i)]) {
            word.replaceAt(word.at(i), shorten[word.at(i)], i);
        }
    }

    
    const shorten2 = {'ā':'a', 'ī':'i', 'ū':'u', 'e':'i', 'o':'u','aM':'u'};
    for (const [key, val] of Object.entries(shorten2)) {
        word.replaceAt(key, val, word.length-key.length);
    }
    word.replace('aH','o'); // -e in the east
    word.replace('H','');
    word.replaceAll(['è','ò'], ['e','o']);

    word.unjoinAspirate();

    // Middle Indo-Aryan to New Indo-Aryan
    console.log("MIA:", word);
    word.replaceAll(['ava','aya','uyu','aā','āa','iī','ivā','īyi'], ['ò','è','ū','ā','ā','ī','iyā','ayi']);
    word.replaceAll(['ai','āi','au','āu','aū','aī','ayu','ayi','ave'], ['è','è','ò','ò','o','e','ò','è','e']);
    word.replaceAll(['aa','ayā','iy','īy','ii'], ['ā','ā','i','ī','ī']);
    word.replaceAll(['N','ñ','ń'], ['N','n','n']);
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

    if (lang === 'mr') {
        word.replaceIntervocal('l','L');
    }

    // lose final vowels and geminates
    word.joinAspirate();

    const lengthen = {'a':'ā', 'i':'ī','u':'ū'};
    if (lang !== 'pa') {
        // compensatory lengthening
        for (let i = word.length-1; i >= 0; i--) {
            if (lang !== 'mr' && !(i === word.getLastVowel() || numVowels(word.sub(0, -1)) === 1)) {
                continue;
            }
            if (cons.has(word.at(i+1)) && cons.has(word.at(i+2)) && lengthen[word.at(i)]) {
                word.replaceAt(word.at(i), lengthen[word.at(i)], i);
                if (lang === 'mr' && nasals.has(word.at(i+1))) {
                    word.cutAt(i+1);
                }
            }
        }
    }

    // add final -ā stem
    word.unjoinAspirate();
    if (word.endsWith('a')) {
        let hasCluster = false;
        for (let i = 1; i < word.length; i++) {
            if (cons.has(word.at(i-1)) && cons.has(word.at(i))
            && !(nasals.has(word.at(i-1)) && word.at(i) === 'h')) {
                hasCluster = true;
                break;
            }
        }
        if (!hasCluster && contains(['è','e'], word.at(word.getPrevVowel(word.length-1)))) {
            word.w = word.sub(0, -1) + 'Á';
        }
    }
    word.joinAspirate();

    // lose final vowel
    if (vow.has(word.at(-1)) && word.numVowels() > 1) {
        word.cutAt(word.length-1);
    }
    word.replaceAt('uy','ū',word.length-2);
    word.replace('Á','ā');

    // lose final geminates
    if (lang !== 'pa') {
        while (word.at(-1) === word.at(-2) && word.at(-2) !== '') {
            word.cutAt(word.length-1);
        }
    } else {
        if (word.at(-1) === word.at(-2) && !contains(['t','g','K','G','Ț','Ð','n','N','j','l','c'], word.at(-1))) {
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
    // lose initial geminates
    if (word.at(0) === word.at(1)) {
        word.cutAt(0);
    }

    // lose some more geminates
    word.replaceAll(['pp','PP','mm'], ['p','P','m']);
    if (lang !== 'pa') {
        word.replaceAll(['jj','JJ','kk'], ['j','J','k']);
    } else {
        word.replaceIntervocal(['jj','JJ'], ['j','J']);
    }

    word.unjoinAspirate();

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
        word.replaceAt('D','R',word.length-1);
        word.replaceAt('Dh','Rh',word.length-1);
        word.replaceAt('è','e',word.length-1);
    } else {
        word.replace('ch','s');
        word.replace('c','s');
        word.replaceAfter('n','?',new Set(['ā','o']));
        word.replaceBefore('?', 'N', VOWELS);
        word.replace('?', 'n');
        word.replaceAt('on','oN',word.length-2);
    }

    if (lengthen[word.at(-1)])
        word.replaceAt(word.at(-1), lengthen[word.at(-1)], word.length-1);

    return word.w;
}