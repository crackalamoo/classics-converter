let inputLang = 'es';
let outputLang = 'ar';
const outputLangs = {
    'es': [],
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

function contains(set, item) {
    return (new Set(set).has(item));
}

function isRoman(word) {
    for (let i = 0; i < word.length; i++) {
        if (word[i].charCodeAt(0) > 591) {
            return false;
        }
    }
    return true;
}

function convertWords(text, mapper) {
    let chars = [];
    let isWord = [];
    for (let i = 0; i < text.length; i++) {
        chars.push(text[i]);
        if (contains([' ',',',';','.','!','?',';','-','\n','¿','¡'], text[i])) {
            isWord.push(false);
        } else {
            isWord.push(true);
        }
    }
    let words = [];
    let word = '';
    for (let i = 0; i < chars.length; i++) {
        if (isWord[i]) {
            word += chars[i];
        } else {
            if (word.length > 0) {
                words.push(mapper(word));
                word = '';
            }
            words.push(chars[i]);
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
        return spanishAljamiado(properOrthography(startWord, inLang));
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
        }
    }
    output = output.replaceAll("'", "");
    output = matchCase(output, input);
    return output;
}

function spanishAljamiado(word) {
    return word;
}