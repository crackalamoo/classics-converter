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
                if (i <= pos)
                    pos -= 1;
            }
        }
    }
    const p1 = string.substring(pos+1, pos+2);
    const p2 = string.substring(pos+2, pos+3);
    return (!vowels.has(p1) && !vowels.has(p2) && p1 !== ''
        && !(useLiquids && STOPS.has(p1) && LIQUIDS.has(p2)));
}
function openSyllable(string, pos, useLiquids=true, removePalatal=false, vowels=VOWELS) {
    return !closedSyllable(string, pos, useLiquids, removePalatal, vowels);
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

    
    string = string.replaceAll('au','ó').replaceAll('qu','qw').replaceAll('y','i').replaceAll('ȳ','ī');

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
    replaceIntervocal(prev, to, vowels=VOWELS) {
        for (let i = this.w.length-1-prev.length; i >= 1; i--) {
            if (vowels.has(this.w.substring(i-1,i)) && vowels.has(this.w.substring(i+prev.length,i+prev.length+1))
                && this.w.substring(i,i+prev.length) === prev) {
                    // this.w = word.substring(0,i) + to + word.substring(i+prev.length);
                    this.replaceAt(prev, to, i);
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

function filterString(s, predicate) {
    return s.split('').filter(predicate).join('');
}

function noLostIntertonic(word, i) {
    // prevent loss of intertonic vowel due to an invalid cluster
    const cons = CONSONANTS;
    const cons2 = CONSONANTS.union(SEMIVOWELS);
    const sonorants = LIQUIDS.union(SEMIVOWELS).union(new Set(['s','z','n','m','v','f']));
    // let prev2 = word.sub(i-2,i);
    // let prev1 = word.sub(i-1,i);
    // let next1 = word.sub(i+1,i+2);
    // let next2 = word.sub(i+1,i+3);
    let cluster = filterString(word.sub(i-2,i) + word.sub(i+1,i+3), (c) => cons2.has(c));
    let cluster2 = cluster.substring(1,4);
    cluster = cluster.substring(0,3);
    let isBadCluster = (cl) => (
    (contains(cons2, cl.substring(0,1)) && contains(sonorants, cl.substring(1,2)) && contains(cons, cl.substring(2,3)))
    || (contains(STOPS, cl.substring(0,1)) && contains(STOPS, cl.substring(1,2)) && !contains(sonorants, cl.substring(0,1)))
    || (contains(STOPS, cl.substring(1,2)) && contains(STOPS, cl.substring(2,3) && !contains(sonorants, cl.substring(0,1)))   
    )
    );
    res = isBadCluster(cluster) || (isBadCluster(cluster2) && cluster2.length === 3);
    return res;
}

function contains(set, item) {
    return (new Set(set).has(item));
}

function allContains(set, string) {
    for (let i = 0; i < string.length; i++) {
        if (!contains(set, string.substring(i,i+1)))
            return false;
    }
    return true;
}

const samples = [
    {'name':'numbers', 'in':'dvau triiNi panca sapta aSTa dasha lakSa', 'langs':['hi']},
    {'name':'numbers', 'in':'dvau panca sapta aSTa dasha lakSa', 'langs':['pa']},
    {'name':'numbers', 'in':'panca sapta aSTa dasha lakSa', 'langs':['mr']},
    {'name':'time', 'in':'adya raatri sthita param dina dvau prahara saMdhya alagna', 'langs':['hi']},
    {'name':'merchant', 'in':'deshiiya shreSTi kRta saartha yaH aagata sthaa pRccha dadiiya kaHpunar sthaa', 'langs':['hi']},
    {'name':'body parts', 'in':'hasta karNa akSa shiras paada mukha danta', 'langs':['hi']},
    {'name':'body parts', 'in':'hasta karNa akSa shiras danta', 'langs':['pa','mr']},
    {'name':'moon', 'in':'puuraka priyakaaraka candra duura sthaa adya raatri', 'langs':['hi']},
    {'name':'moon', 'in':'puuraka candra duura adya', 'langs':['pa']},
    {'name':'food', 'in':'ghRt jiiraka shatapuSpa dhaaneyaka roTika daala dugdha pulaaka aamra caNaka phala phulla kadala gaarjara guDa pattra naarikela paalakyaa tila parNa khaad', 'langs':['hi']},
    {'name':'Maharashtra', 'in':'mahaaraaSTra mahaaraaSTriiya', 'langs':['mr']},
    {'name':'time', 'in':'adya kaalya kaala divasa', 'langs':['mr']},
    {'name':'thief', 'in':'tvam dina rajani graama caurika karo param karma na karo', 'langs':['hi']},
    {'name':'misc', 'in':'mrakSaNa prastara satya', 'langs':['pa']},

    {'name':'Eightfold Path', 'in':'dRSTi saMkalpa vaac karmaanta aajiiva vyaayaama smRti samaadhi', 'langs':['pi']},
    {'name':'Ten Perfections', 'in':'daana shiila naiSkraamya prajnaa viirya kSaanti satya adhiSThaana maitrii upekSaa', 'langs':['pi']},
    {'name':'misc', 'in':'bhikSu shramaNa tathaagata dharma', 'langs':['pi']},

    {'name':'numbers', 'in':'uunum duoos trees quattuor sex septem octoo novem decem quiindecim', 'langs':['es']},
    {'name':'numbers', 'in':'trees quattuor sex septem octoo novem decem quiindecim', 'langs':['pt']},
    {'name':'numbers', 'in':'uunum septem octoo novem decem centum', 'langs':['fr']},
    {'name':'numbers', 'in':'uunum trees quattuor septem octoo centum', 'langs':['it']},
    {'name':'cloud', 'in':'illoos sunt dee uunam nebulam grandem quid stat creescendum tootum ille tempum et iibant ad suii casam', 'langs':['es']},
    {'name':'animals', 'in':'taurum vaccam ursum piscees galliinam cuniculum oviculam palumbum araaneam caballum cervum', 'langs':['es']},
    {'name':'food', 'in':'paanem caaseum viinum ovum pira ceepullam ostream apium lactem gelaatum carnem pullum friictum saal in furnum', 'langs':['es']},
    {'name':'food', 'in':'paanem caaseum viinum ovum friictum pira ceepullam lactem carnem saal in furnum', 'langs':['pt']},
    {'name':'food', 'in':'paanem fruuctum viinum ovum friictum pira lactem furnum', 'langs':['fr']},
    {'name':'food', 'in':'paanem caaseum viinum ovum lactem gelaatum carnem pullum saal pastam oliiva furnum', 'langs':['it']},
    {'name':'pronouns', 'in':'tuu ille illa illoos illaas mee tee noos voos tuii suii nostrum', 'langs':['es']},
    {'name':'pronouns', 'in':'tuu illa illoos mee tee nostrum', 'langs':['fr']},
    {'name':'pronouns', 'in':'ego tuu ille illa illoos illaas mee tee noos voos nostrum', 'langs':['pt']},
    {'name':'unlike', 'in':'tuu es passum quoomodo mee magis poor-quid', 'langs':['fr']},
    {'name':'misc', 'in':'faminem muutaare metum baasium praemium reegulam podium multum folia pugnum cognaatum speculum portam iinsulam super montaaneam corpum bonum bonam benem populum viridim sitim', 'langs':['es']},
    {'name':'misc', 'in':'liineam folia portam iinsulam montaaneam corpus bonum bonam benem steela', 'langs':['fr']},
    {'name':'misc', 'in':'fluumen folia portam montaaneam corpum bonum bonam steella viridim', 'langs':['it']},
];
for (const sample of samples) {
    sample['langs'] = new Set(sample['langs']);
    if (sample['langs'].has('hi'))
        sample['langs'].add('ur');
}

function getSampleNames(lang) {
    return samples.filter((s) => s['langs'].has(lang)).map((s) => s['name']);
}