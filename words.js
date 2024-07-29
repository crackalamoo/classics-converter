function numVowels(string) {
    return string.split('').filter((c) => VOWELS.has(c)).length;
}

const replaceIntervocal = (word, prev, to, vowels=VOWELS) => {
    for (let i = word.length-1-prev.length; i >= 1; i--) {
        if (vowels.has(word.substring(i-1,i)) && vowels.has(word.substring(i+prev.length,i+prev.length+1))
            && word.substring(i,i+prev.length) === prev) {
                word = word.substring(0,i) + to + word.substring(i+prev.length);
        }
    }
    return word;
}

function closedSyllable(string, pos, useLiquids=true, removePalatal=false, vowels=VOWELS) {
    if (removePalatal) {
        for (let i = string.length-1; i >= 0; i--) {
            if (string.substring(i,i+1) === 'J') {
                string = string.substring(0,i) + string.substring(i+1);
                if (i < pos)
                    pos -= 1;
            }
        }
    }
    const p1 = string.substring(pos+1, pos+2);
    const p2 = string.substring(pos+2, pos+3);
    return (!vowels.has(p1) && !vowels.has(p2) && p1 !== ''
        && !(useLiquids && LIQUIDS.has(p2)));
}
function openSyllable(string, pos, useLiquids=true, removePalatal=false, vowels=VOWELS) {
    return !closedSyllable(string, pos, useLiquids, removePalatal, vowels);
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
class Word {
    constructor(word) {
        this.word = word;
    }

    at(i) {
        if (i < 0)
            return this.word.substring(this.word.length + i, this.word.length + i + 1);
        return this.word.substring(i, i+1);
    }
    sub(a,b=null) {
        if (b === null) {
            if (a < 0)
                return this.word.substring(this.word.length+a);
            return this.word.substring(a);
        }
        if (b < 0) {
            if (a < 0)
                return this.word.substring(this.word.length+a, this.word.length+b);
            return this.word.substring(a, this.word.length+b);
        }
        return this.word.substring(a,b);
    }
    replace(prev,to) {
        this.word = this.word.replaceAll(prev, to);
    }
    replaceAll(prevs, tos) {
        for (let i = 0; i < prevs.length; i++) {
            this.replace(prevs[i], tos[i]);
        }
    }
    replaceAt(prev, to, at) {
        if (this.word.substring(at,at+prev.length) === prev) {
            this.word = this.word.substring(0, at) + to + this.word.substring(at+prev.length);
        }
    }
    replaceAts(prev, to, ats) {
        for (const at of ats.sort((a,b) => b - a)) {
            if (this.word.substring(at,at+prev.length) === prev) {
                this.word = this.word.substring(0, at) + to + this.word.substring(at+prev.length);
            }
        }
    }
    replaceExcept(prev, to, at) {
        for (let i = this.word.length-1; i >= 0; i--) {
            if (this.word.substring(i,i+prev.length) === prev && i !== at) {
                this.word = this.word.substring(0, i) + to + this.word.substring(i+prev.length);
            }
        }
    }
    replaceBefore(prev, to, before, beforeLen=1) {
        for (let i = this.word.length - prev.length; i >= 0; i--) {
            if (this.word.substring(i, i+prev.length) === prev
            && before.has(this.word.substring(i+prev.length, i+prev.length+beforeLen))) {
                this.word = this.word.substring(0, i) + to + this.word.substring(i + prev.length);
            }
        }
    }
    replaceAfter(prev, to, after, afterLen=1) {
        for (let i = this.word.length - prev.length; i >= 0; i--) {
            if (this.word.substring(i, i+prev.length) === prev
            && after.has(this.word.substring(i-afterLen, i))) {
                this.word = this.word.substring(0, i) + to + this.word.substring(i + prev.length);
            }
        }
    }
    cutAt(at) {
        this.word = this.word.substring(0, at) + this.word.substring(at+1);
    }
    indexOf(s) {
        return this.word.indexOf(s);
    }
    find(s) {
        return this.word.indexOf(s);
    }
    rfind(s) {
        return this.word.lastIndexOf(s);
    }

    startsWith(s) {
        return this.word.startsWith(s);
    }
    endsWith(s) {
        return this.word.endsWith(s);
    }
    lower() {
        this.word = this.word.toLowerCase();
    }
    numVowels() {
        return numVowels(this.word);
    }
    getIntervocal(vowelsBefore=VOWELS, vowelsAfter=VOWELS) {
        const res = [];
        for (let i = this.word.length-1; i >= 1; i--) {
            if (vowelsBefore.has(this.word.substring(i-1,i)) && vowelsAfter.has(this.word.substring(i+1,i+2))) {
                res.push(i);
            }
        }
        return res;
    }
    getFirstVowel(vowels=VOWELS, nBefore=0) {
        let v1;
        let before = 0;
        for (let i = 0; i < this.word.length; i++) {
            if (vowels.has(this.word.substring(i,i+1))) {
                v1 = i;
                if (before === nBefore)
                    break;
                before += 1;
            }
        }
        return v1;
    }
    getLastVowel(vowels=VOWELS, nAfter=0) {
        let v2;
        let after = 0;
        for (let i = this.word.length-1; i >= 0; i--) {
            if (vowels.has(this.word.substring(i,i+1))) {
                v2 = i;
                if (after === nAfter)
                    break;
                after += 1;
            }
        }
        return v2;
    }
    getNextVowel(start, vowels=VOWELS) {
        // for (let i = start+1; i < this.word.length; i++) {
        //     if (vowels.has(this.word.substring(i,i+1))) {
        //         return i;
        //     }
        // }
        // return -1;
        return getNextVowel(this.word, start, vowels);
    }
    getPrevVowel(start, vowels=VOWELS) {
        // for (let i = start-1; i >= 0; i--) {
        //     if (vowels.has(this.word.substring(i,i+1))) {
        //         return i;
        //     }
        // }
        // return -1;
        return getPrevVowel(this.word, start, vowels);
    }
    replaceIntervocal(prev, to, vowels=VOWELS) {
        this.word = replaceIntervocal(this.word, prev, to, vowels);
    }
    
    get w() {
        return this.word;
    }
    set w(w) {
        this.word = w;
    }
    get length() {
        return this.word.length;
    }
}

function getLatinStress(string) {
    string = string.toLowerCase();

    
    string = string.replaceAll('au','ó').replaceAll('qu','qw').replaceAll('y','i');

    let vowels = 0;
    let stress = -1;
    for (let i = string.length-1; i >= 0; i--) {
        if (VOWELS.has(string.substring(i, i+1))) {
            vowels++;
        }
        if (vowels === 1 && numVowels(string) === 1) {
            stress = i;
            break;
        }
        if (vowels === 2) {
            stress = i;
            break;
        }
    }
    string = string.substring(0, stress) + string.substring(stress).replace('x','cs');
    if (numVowels(string) >= 3 && SHORT_VOWELS.has(string.substring(stress,stress+1)) && openSyllable(string, stress)) {
        while (vowels < 3) {
            stress--;
            if (VOWELS.has(string.substring(stress,stress+1))) {
                vowels = 3;
            }
        }
    }
    for (let i = 0; i < stress; i++) {
        if (string.substring(i,i+1) === 'ó')
            stress += 1; // ó -> au
    }

    return stress;
}

class LatinateWord extends Word {
    constructor(word) {
        super(word.toLowerCase());
        this.stress = getLatinStress(this.word);
    }
    toString() {
        if (this.stress === -1) {
            return '-' + this.word + '-';
        }
        let res = this.sub(0, this.stress) + '<b>'+this.at(this.stress)+'</b>' + this.sub(this.stress+1);
        return res;
    }
    replace(prev, to) {
        for (let i = this.word.length - prev.length; i >= 0; i--) {
            if (this.word.substring(i, i+prev.length) === prev) {
                this.word = this.word.substring(0, i) + to + this.word.substring(i + prev.length);
                if (i < this.stress)
                    this.stress += to.length - prev.length;
            }
        }
    }
    replaceAt(prev, to, at) {
        if (this.word.substring(at,at+prev.length) === prev) {
            this.word = this.word.substring(0, at) + to + this.word.substring(at+prev.length);
            if (at < this.stress) {
                this.stress += to.length - prev.length;
            }
        }
    }
    cutAt(at) {
        this.word = this.word.substring(0, at) + this.word.substring(at+1);
        if (at <= this.stress)
            this.stress -= 1;
    }
    replaceStressed(prev, to) {
        this.replaceAt(prev, to, this.stress);
    }
    replaceBefore(prev, to, before, beforeLen=1, unstressedOnly=false) {
        for (let i = this.word.length - prev.length; i >= 0; i--) {
            if (this.word.substring(i, i+prev.length) === prev
            && before.has(this.word.substring(i+prev.length, i+prev.length+beforeLen))
            && (!unstressedOnly || i !== this.stress)) {
                this.word = this.word.substring(0, i) + to + this.word.substring(i + prev.length);
                if (i < this.stress)
                    this.stress += to.length - prev.length;
            }
        }
    }
    replaceAfter(prev, to, after, afterLen=1, unstressedOnly=false) {
        for (let i = this.word.length - prev.length; i >= 0; i--) {
            if (this.word.substring(i, i+prev.length) === prev
            && after.has(this.word.substring(i-afterLen, i))
            && (!unstressedOnly || i !== this.stress)) {
                this.word = this.word.substring(0, i) + to + this.word.substring(i + prev.length);
                if (i < this.stress)
                    this.stress += to.length - prev.length;
            }
        }
    }
    getIntertonic() {
        let v1;
        for (let i = 0; i < this.word.length; i++) {
            if (VOWELS.has(this.word.substring(i,i+1))) {
                v1 = i;
                break;
            }
        }
        let v2 = this.getLastVowel();
        const notIntertonic = new Set([v1, v2, this.stress]);
        const res = [];
        for (let i = this.word.length-1; i >= 0; i--) {
            if (VOWELS.has(this.word.substring(i, i+1)) && !notIntertonic.has(i)) {
                res.push(i);
            }
        }
        return res;
    }
    atStress() {
        return this.at(this.stress);
    }
}

class SanskriticWord extends Word {
    constructor(word) {
        const w = word;
        super(word);
        this.word = w;
    }

    joinAspirate() {
        this.replaceAll(['ph','bh','ch','jh','Dh','Th','dh','th','kh','gh'],
            ['P', 'B', 'C', 'J', 'Ď', 'Ť', 'Ð', 'Ț', 'K', 'G']);
        this.replaceAll(['kK','gG', 'tȚ', 'dÐ', 'pP', 'bB', 'cC', 'jJ', 'TŤ', 'DĎ'],
            ['KK','GG', 'ȚȚ', 'ÐÐ', 'PP', 'BB', 'CC', 'JJ', 'ŤŤ', 'ĎĎ']);
    }
    unjoinAspirate() {
        this.replaceAll(['KK','GG', 'ȚȚ', 'ÐÐ', 'PP', 'BB', 'CC', 'JJ', 'ŤŤ', 'ĎĎ'],
                        ['kK','gG', 'tȚ', 'dÐ', 'pP', 'bB', 'cC', 'jJ', 'TŤ', 'DĎ']);
        this.replaceAll(['P', 'B', 'C', 'J', 'Ď', 'Ť', 'Ð', 'Ț', 'K', 'G'],
                        ['ph','bh','ch','jh','Dh','Th','dh','th','kh','gh']);
    }

    replaceIntervocal(prev, to, vowels=VOWELS.union(new Set(['R']))) {
        super.replaceIntervocal(prev, to, vowels);
    }
}

function schwaDeletion(word) {
    let res = word;
    const at = (i) => res.substring(i, i+1);
    for (let i = res.length-1; i >= 0; i--) {
        if (at(i) === 'a'
        && !VOWELS.has(at(i+1)) && !VOWELS.has(at(i-1))
        && getNextVowel(word, i) !== -1 && getPrevVowel(word, i) !== -1) {
            res = res.substring(0, i) + res.substring(i+1);
        }
    }
    return res;
}

function contains(set, item) {
    return (new Set(set).has(item));
}

const samples = {
    'sa': ['pañca sapta aSTa', 'adya dugdha niSkaalay'],
    'hi': ['vaMsha apara karpaasa','duura graama','saMdhya raatri vaarttaa','tvam dina rajani caurika karo param karma na karo',
        'hasta karNa shiras paada', 'shvashura parNa na khaad'
    ],
    'pa': ['duura candra','hasta karNa akSa shiras pakSa paada','mrakSaNa'],
    'hi-pa': ['kathay', 'deziiya shreSTin kRta saartha', 'yaH priyakaaraka pattra'],
    'mr': ['duura graama', 'hasta karNa paada',
        'SaSTi', 'saubhaagya'
    ]
};
samples['hi'].concat(samples['hi-pa']);
samples['pa'].concat(samples['hi-pa']);
samples['ur'] = samples['hi'];
for (const [key, val] of Object.entries(outputLangs)) {
    for (const ol of val) {
        if (samples[ol] && samples[key])
            samples[ol].concat(samples[key]);
    }
}