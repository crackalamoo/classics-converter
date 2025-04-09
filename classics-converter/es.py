SHORT_VOWELS = set(['a','e','i','o','u'])
VOWELS = set(['a','e','i','o','u',
              'ā','ē','ī','ō','ū',
              'E','O','æ','œ','è','ò'])
CONSONANTS = set([
    'b','c','d','f','g','h','j','l','m','n','p','q','r','s','t','v','x','z',
    'ç'
])
DENTAL_ALVEOLAR = set(['t','d','n','r','l','s','ç','z'])
SPANISH_ACCENTS = {'a':'á','e':'é','i':'í','o':'ó','u':'ú'}
ITALIAN_ACCENTS = {'a':'à','e':'é','i':'ì','o':'ó','u':'ù', 'E':'è', 'O':'ò'}

def num_syllables(word):
    syllables = 0
    for char in word:
        syllables += (char in VOWELS)
    return syllables

def bold_at(word, index):
    return word[:index] + '\033[1m' + word[index:index+1] + '\033[0m' + word[index+1:]
def print_stress(word, stress_f):
    print(bold_at(word, stress_f(word)))
def find_set(word, choices):
    for i in range(len(word)):
        if word[i] in choices:
            return i
    return -1
def rfind_set(word, choices):
    for i in reversed(range(len(word))):
        if word[i] in choices:
            return i
    return -1
def replace_intervocal(word, prev, to, get_indices=False, extra=[], exclude=-1):
    indices = []
    vowels = VOWELS.union(extra)
    for i in reversed(range(1, len(word)-len(prev))):
        if i != exclude and word[i:i+len(prev)] == prev and word[i-1] in vowels and word[i+len(prev)] in vowels:
            word = word[:i] + to + word[i+len(prev):]
            indices.append(i)
    if get_indices:
        return word, indices
    return word
def replace_initial(word, prev, to, before_vowel=False):
    if word.startswith(prev) and len(word) > len(prev)+1:
        if not before_vowel or word[len(prev)] in VOWELS:
            word = to + word[len(prev):]
    return word
def replace_prevocal(word, prev, to, exclude=-1):
    for i in reversed(range(len(word)-len(prev))):
        if i != exclude and word[i:i+len(prev)] == prev and word[i+len(prev)] in VOWELS:
            word = word[:i] + to + word[i+len(prev):]
    return word
def replace_index(word, prev, to, index):
    return replace_indices(word, prev, to, [index])
def replace_indices(word, prev, to, indices):
    for i in reversed(range(len(word))):
        if word[i] == prev and i in indices:
            word = word[:i] + to + word[i+1:]
    return word
def replace_map(word, map):
    for key in map:
        word = word.replace(key, map[key])
    return word
def open_syllable(word, index):
    vocals = VOWELS.union(['l','r'])
    return ((index+1 < len(word) and not word[index+1] in VOWELS # followed by consonant
                and index+2 < len(word) and word[index+2] in vocals # and that consonant is followed by a vowel/glide
                )
                or index+1 < len(word) and word[index+1] in VOWELS # followed by vowel
                or index+1 == len(word)) # last vowel in word 
def get_latin_stress(word):
    word = word.lower()
    word0 = word
    word = replace_map(word, {'æ':'ae','œ':'oe','j':'i','x':'cs'})
    word = word.replace('ae','æ-').replace('oe','œ-').replace('au','aw').replace('qu','qw')
    word = replace_intervocal(word, 'i', 'j')
    word = replace_initial(word, 'i', 'j', True)
    word = replace_intervocal(word, 'u', 'w')
    word = replace_initial(word, 'u', 'w', True)
    for vowel in VOWELS:
        word = word.replace('l'+'i'+vowel, 'l'+'j'+vowel)
    word = word.replace('ll','l-') # don't treat ll as l + vocal
    word = word.replace('rr', 'r-')
    
    stress = len(word)
    vowels = 0
    
    while vowels != 2:
        stress -= 1
        vowels += (word[stress] in VOWELS)
        if stress == 0:
            return find_set(word, VOWELS)

    if word[stress] in SHORT_VOWELS and open_syllable(word, stress):
        while vowels != 3:
            stress -= 1
            vowels += (word[stress] in VOWELS)
            if stress == 0:
                return find_set(word, VOWELS)
    
    if word0.find('x') != -1 and stress > word0.find('x'):
        stress -= 1

    return stress
def get_spanish_stress(word):
    word = word.replace('qu','kk').replace('gue','gge').replace('gui','ggi')
    for vowel in VOWELS:
        word = word.replace('i'+vowel,'y'+vowel)
        word = word.replace('u'+vowel,'w'+vowel)
        # word = word.replace(vowel+'i',vowel+'y')
        # word = word.replace(vowel+'u',vowel+'w')
    stress = prev_vowel(word, len(word))
    if word[-1] in VOWELS.union(['s','n']):
        new_stress = prev_vowel(word, stress)
        if new_stress != -1:
            stress = new_stress
    return stress
def next_vowel(word, index):
    for i in range(index+1, len(word)):
        if word[i] in VOWELS:
            return i
    return -1
def prev_vowel(word, index):
    for i in reversed(range(index)):
        if word[i] in VOWELS:
            return i
    return -1
def max_cluster(word):
    res = 0
    cluster = 0
    for i in range(len(word)):
        if word[i] in VOWELS:
            cluster = 0
        else:
            cluster += 1
            res = max(res, cluster)
    return res

assert get_spanish_stress('arbor') == 3

def latin_to_romance(latin, lang):
    isCap = latin[0] == latin[0].upper()
    isAllCap = latin == latin.upper()
    word = latin.lower()

    word = latin.replace('y','i')
    stress = get_latin_stress(word)

    hi_n = 0
    def hi():
        nonlocal hi_n
        hi_n += 1
        print(hi_n, bold_at(word, stress))

    def replace_stress(prev, to):
        nonlocal word
        nonlocal stress
        replace_count = word.count(prev)
        for i in range(replace_count):
            if word.find(prev) < stress:
                stress += len(to)-len(prev)
            word = word.replace(prev, to, 1)
    def replace_stress_map(mp):
        for key in mp:
            replace_stress(key, mp[key])

    word = replace_initial(word, 'h', 'H')
    replace_stress_map({'æ':'ae','œ':'oe','j':'i','h':''})
    replace_stress_map({'ae':'e','oe':'ē','au':'aw','h':'','qu':'qw'})
    if word.endswith('m'):
        if num_syllables(word) > 1:
            word = word[:-1]
        else:
            word = word[:-1]+'n'

    if lang == 'it':
        word = replace_intervocal(word, 'i', 'G', exclude=stress)
        word = replace_intervocal(word, 'e', 'G', exclude=stress)
        replace_stress('G','ggy')
    else:
        word = replace_intervocal(word, 'i', 'y', exclude=stress)
        word = replace_intervocal(word, 'e', 'y', exclude=stress)
    word = replace_intervocal(word, 'u', 'w', exclude=stress)
    word = replace_intervocal(word, 'o', 'w', exclude=stress)
    word = replace_prevocal(word, 'i', 'y', exclude=stress)
    word = replace_prevocal(word, 'e', 'y', exclude=stress)

    # elide intertonic vowels
    def elide_intertonic_vowels(conditioned=False):
        nonlocal word
        nonlocal stress
        prev = prev_vowel(word, stress)
        if (prev != -1 and word[prev] != 'a' and word[prev] != 'ā'
                and (
                    not conditioned 
                    or ((prev > 1 and word[prev-1] in ['l','r'])
                    or (prev<len(word)-1 and word[prev+1] in ['l','r'])
                    or (prev > 1 and word[prev-1] == 's' and prev<len(word)-1 and word[prev+1] == 't'))
                )
                and prev != find_set(word, VOWELS)
                and not (word[prev-1] in VOWELS)):
            elided = word[:prev]+word[prev+1:]
            word = elided
            stress -= 1
        nxt = next_vowel(word, stress)
        if (nxt != -1 and word[nxt] != 'a' and word[nxt] != 'ā'
                and (
                    not conditioned
                    or (nxt > 1 and word[nxt-1] in ['l','r'])
                    or (nxt<len(word)-1 and word[nxt+1] in ['l','r'])
                    or (nxt > 1 and word[nxt-1] == 's' and nxt<len(word)-1 and word[nxt+1] == 't')
                )
                and nxt != rfind_set(word, VOWELS)
                and not (word[nxt+1] in VOWELS)
                and not (word[nxt-2].lower() == 'q' and word[nxt+1] not in VOWELS)):
            elided = word[:nxt]+word[nxt+1:]
            word = elided
    
    replace_stress_map({'ii':'ī','ee':'ē','oo':'ō','uu':'ū'})

    if lang == 'es':
        elide_intertonic_vowels(conditioned=True)

    # simplify clusters
    if lang == 'es':
        replace_stress_map({'ps':'s','rs':'s','pt':'tt','ns':'ss'})
        replace_stress_map({'ci':'cyi', 'ce':'cye', 'cī':'cyī', 'cē':'cyē'})
    elif lang == 'it':
        replace_stress_map({'ps':'s','rs':'s','pt':'tt','ns':'s','bt':'tt'})
    if word.endswith('st') or word.endswith('ss'):
        word = word[:-1]

    for vowel in VOWELS:
        replace_stress_map({'ll'+vowel:'LL'+vowel, 'rr'+vowel:'RR'+vowel})
    replace_stress_map({'ll':'l', 'rr':'r'})
    replace_stress_map({'LL':'ll', 'RR':'rr'})

    # change vowels
    word = replace_index(word, 'e', 'E', stress)
    word = replace_index(word, 'o', 'O', stress)
    word = replace_map(word, {
        'ā':'a',
        'ē':'e',
        'i':'e',
        'ī':'i',
        'ō':'o',
        'u':'o',
        'ū':'u'
    })
    
    if lang == 'es':
        if word.startswith('y') and not (stress == 1 and word[1] not in ['u','ū','o','ō','O']):
            word = 'X'+word[1:]
        word = word.replace('j','y').replace('X','j')
    elif lang == 'it':
        if word.startswith('y') and not (stress == 1 and word[1] not in ['u','ū','o','ō','O']):
            word = 'X'+word[1:]
        replace_stress_map({'j':'y','X':'gy'})

    # lenition
    if lang == 'es':
        for cons in ['d','g','b']:
            elided, elisions = replace_intervocal(word, cons, '', get_indices=True, extra=['w'])
            bad_diph = ['ao','aa','oa','āo','ōa','oā','aō','āō','aE','aO','Oa','ēE','uE','uO','ūO']
            if not any(map(lambda diph: diph in elided, bad_diph)):
                word = elided
                for elision in elisions:
                    if stress > elision:
                        stress -= 1
    elif lang == 'it':
        word = replace_intervocal(word, 'b', 'v')
    
    # voicing
    for cons in [('p','B'), ('t','D'), ('c','G'), ('s','s'), ('b','b'),
                 ('d','d'), ('g','g'), ('f','v'), ('q','Q')]:
        if lang == 'es':
            word = replace_intervocal(word, cons[0], cons[1])
            for vowel in VOWELS:
                word = word.replace(vowel+cons[0]+'r', vowel+cons[1]+'r')
                word = word.replace(vowel+cons[0]+'w', vowel+cons[1]+'w')
                word = word.replace(vowel+cons[0]+'l', vowel+cons[1]+'l')
                word = word.replace('l'+cons[0]+vowel, 'l'+cons[1]+vowel)
            replace_stress(cons[0]+cons[0], cons[0])
    
    if lang == 'es' and word.endswith('ee'):
        word = word[:-1]+'y'
    
    if lang == 'es':
        elide_intertonic_vowels(conditioned=False)
    replace_stress_map({'ii':'i','ee':'e','oo':'o','uu':'u','oO':'o','eE':'e','Oo':'o'
                        #'wo':'ō','ye':'ē'
                        })
    
    word = word.replace('B','b').replace('D','d').replace('G','g').replace('Q','g').replace('q','c')

    # adjust clusters
    if word.endswith('r') and word[len(word)-2] in VOWELS and word[len(word)-3] in ['b','d','p','t']:
        word = word[:-2] + 'r' + word[-2]
    word = word.replace('nm','lm')

    # remove final consonants
    if lang == 'es':
        if word[-1] in CONSONANTS and not word[-1] in ['l','s','n']:
            word = word[:-1]
    elif lang == 'it':
        if word[-1] in CONSONANTS:
            if word.endswith('os'):
                word = word[:-1]+'y'
            else:
                word = word[:-1]
    
    replace_stress_map({'mb':'mm', 'mn': 'nn'})
    word = word.replace('cwa','qua')
    replace_stress('cw','k')
    word = word.replace('qua','cwa')
    
    word = replace_intervocal(word, 'gn', 'ny')
    if lang == 'es':
        word = replace_intervocal(word, 'ngn', 'ngr')
        for vowel in VOWELS.union(['r','w','y']):
            word = word[0]+word[1:].replace('c'+vowel, 'C'+vowel)
            word = word[0]+word[1:].replace('g'+vowel, 'G'+vowel)
        word = word[0]+word[1:].replace('c','y')
        word = word[0]+word[1:].replace('g','y')
        replace_stress_map({'olt':'oyt', 'old':'oyt'})
    
        # vowel raising
        for vowel in VOWELS:
            replace_stress_map({'oy'+vowel: 'oY'+vowel})
            replace_stress_map({'oy':'uy'})
        replace_stress_map({
            'Ey':'éY', 'Oy':'óY'
        })
    elif lang == 'it':
        word = replace_intervocal(word, 'ngn', 'ngw')
    
    
    for i in range(len(word)-2):
        if word[i] in ['E','O'] and (word[i+1] not in VOWELS) and word[i+2] == 'y':
            word = word[:i]+word[i].lower()+word[i+1:]
    
    if lang == 'es':
        # palatalization stuff
        word = word.replace('Y','y')
        word = replace_intervocal(word, 'yt','ch', extra=['ó','é'])
        word = replace_intervocal(word, 'yly', 'chh', extra=['ó','é'])
        for cons in CONSONANTS:
            word = replace_intervocal(word, cons+'yl','chh')
        word = replace_intervocal(word, 'yl','JJ')
        replace_stress('JJ','j')
        word = replace_intervocal(word, 'x', 'j')
        replace_stress_map({'L':'l','C':'c','G':'g'})
        replace_stress_map({'yl':'j', 'ly':'j'})
        replace_stress_map({'cy':'ç','chh':'ch'})
        word = replace_intervocal(word, 'ty', 'ÇÇ')
        word = replace_intervocal(word, 'dy', 'YY')
        replace_stress_map({'ÇÇ':'ç', 'YY':'y', 'dy':'ç', 'ty':'ç'})
        for vowel in VOWELS.union(['l','r','ó','é']):
            word = word.replace('yt'+vowel, 'TT'+vowel)
        replace_stress('yt','y')
        replace_stress_map({'TT':'yt', 'x': 'ys', 'tç':'ç', 'dç':'ç', 'çs':'ç', 'chE':'chi'})

        replace_stress('aw', 'o')
    elif lang == 'it':
        word = replace_prevocal(word, 'ty', 'gy')
        word = replace_prevocal(word, 'ly', 'Gy')
        replace_stress_map({'S':'sy', 'G':'gl', 'x':'ss', 'ct':'tt','dy':'gy','vy':'ggy'})
        replace_stress_map({'cgly':'cky','aw':'o'})
    replace_stress_map({'ii':'i','ee':'e','oo':'o','uu':'u','oO':'o','eE':'e','Oo':'o'
                        #'wo':'ō','ye':'ē'
                        })
        

    # vocalization
    vocals = VOWELS.union(['l','r','y','w'])
    for i in range(1, len(word)-1):
        if word[i-1] in VOWELS and word[i] in ['p','b','v'] and not word[i+1] in vocals:
            if i>=1 and word[i-1] in ['o','u']:
                word = word[:i]+'Ø'+word[i+1:]
            else:
                word = word[:i]+'w'+word[i+1:]
    replace_stress('Ø','')

    if lang == 'es':
        # Word-initial [ɟ]
        if stress == 1:
            word = replace_initial(word, 'ge', 'ye')
            word = replace_initial(word, 'gi', 'yi')
            word = replace_initial(word, 'gE', 'yE')
        else:
            word = replace_initial(word, 'ge', 'he')
            word = replace_initial(word, 'gi', 'hi')
        # Intervocalic [ɟ]
        word = replace_intervocal(word, 'gy', 'y')
        word = replace_intervocal(word, 'ge', 'y')
        word = replace_intervocal(word, 'gi', 'y')
        word = replace_intervocal(word, 'gE', 'y')
    elif lang == 'it':
        word = replace_intervocal(word, 'sy','cy')

    # final /i/ to /e/
    if word.endswith('ī') or word.endswith('i'):
        word = word[:-1] + 'e'

    if lang == 'es':
        # apocope of final /e/
        if len(word) > 3 and word.endswith('e') and word[len(word)-2] in DENTAL_ALVEOLAR and word[len(word)-3] in VOWELS:
            word = word[:-1]

    # vowel raising
    if lang == 'es':
        raise_map = {'o':'u', 'e':'i', 'E':'e', 'O':'o'}
        first_vowel = next_vowel(word, -1)
        for i in range(first_vowel+1):
            if word[i] in raise_map and (i != stress or word[i] in ['O','E','o']) and word[i+1:i+3] in ['ch','ny','my','mE','nE','vy','by']:
                word = word[:i] + raise_map[word[i]] + word[i+1:]
    elif lang == 'it':
        raise_map = {'e':'i', 'E':'e'}
        first_vowel = next_vowel(word, -1)
        for i in range(first_vowel+1):
            if word[i] in raise_map and (i != stress or word[i] in ['O','E','o']) and open_syllable(word, i):
                word = word[:i] + raise_map[word[i]] + word[i+1:]
        first_vowel = next_vowel(word, -1)
    word = word.replace('é','e').replace('ó','o')

    # diphthongization
    for i in reversed(range(len(word))):
        if word[i] == 'E' or word[i] == 'O':
            if i == stress and (lang == 'es' or open_syllable(word, i)):
                if lang == 'it':
                    word = word[:i] + {'E':'Ye','O':'Wo'}[word[i]] + word[i+1:]
                elif lang == 'es':
                    word = word[:i] + {'E':'Ye','O':'We'}[word[i]] + word[i+1:]
                stress += 1
            else:
                if lang == 'it':
                    word = word[:i] + {'E':'è','O':'ò'}[word[i]] + word[i+1:]
                else:
                    word = word[:i] + {'E':'e','O':'o'}[word[i]] + word[i+1:]

    if lang == 'es':
        # consonant cluster stuff
        word = replace_initial(word,'pl','ll',before_vowel=True)
        word = replace_initial(word,'fl','ll',before_vowel=True)
        word = replace_initial(word,'cl','ll',before_vowel=True)
        word = replace_initial(word,'f','h',before_vowel=True)
        for cons in ['n','m']:
            replace_stress(cons+'pl', 'nch')
            replace_stress(cons+'fl', 'nch')
            replace_stress(cons+'cl', 'nch')
        for key, val in {'dYe':'dII', 'tYe':'tII', 'chYe':'chII'}.items():
            word = replace_intervocal(word, key, val)
            replace_stress('II','i')
        replace_stress_map({'Yey':'ey'})
        # word = word.replace('Y','i').replace('W','u').replace('x','s')
        word = word.replace('W','u').replace('x','s')
        if word.startswith('s') and not word[1] in VOWELS:
            word = 'e'+word
            stress += 1
        for vowel in VOWELS:
            for cons in ['j','s','z']:
                word = word.replace(vowel+cons+'re',vowel+cons+'er')
    elif lang == 'it':
        # word = replace_initial(word,'pl','py',before_vowel=True)
        # word = replace_initial(word,'fl','fy',before_vowel=True)
        # word = replace_initial(word,'cl','ky',before_vowel=True)
        word = replace_prevocal(word, 'pl','py')
        word = replace_prevocal(word, 'fl','fy')
        word = replace_prevocal(word, 'cl','ky')
    
    for cons in ['t','d','k','g']:
        word = word.replace('m'+cons, 'n'+cons)
    for cons in ['p','b']:
        word = word.replace('n'+cons, 'm'+cons)
    replace_stress_map({'nyt':'nt','nyd':'nd',
                        'pd':'t','pt':'t',
                        'dg':'g'})

    # spelling quirks
    if lang == 'es':
        replace_stress_map({'ny':'ñ', 'nn':'ñ', 'mm':'m'})
        word = word.replace('Y', 'y')
        word = replace_initial(word, 'y', 'Y')
        word = replace_intervocal(word, 'y', 'Y')
        if word[-1] == 'y':
            word = word[:-1]+'Y'
        word = word.replace('y', 'i').replace('w', 'u').replace('Y','y')
        word = replace_map(word, {'çe':'ce','çi':'ci'}).replace('ç','z')
        replace_stress_map({'ke':'que','ki':'qui','sce':'ce','sci':'ci','yie':'ye'})
        word = replace_initial(word, 'ue', 'UU')
        word = replace_initial(word, 'ie', 'II')
        replace_stress_map({'UU':'hue','II':'hie','eya':'ea','iya':'ia','ieo':'io','iyo':'io'})
        word = word.replace('k','c').replace('H','h')
        for cons in ['t','d','k','g']:
            word = word.replace('m'+cons, 'n'+cons)
        for cons in ['p','b']:
            word = word.replace('n'+cons, 'm'+cons)
        if stress != get_spanish_stress(word) and word[stress] in SPANISH_ACCENTS:
            word = word[:stress] + SPANISH_ACCENTS[word[stress]] + word[stress+1:]
    elif lang == 'it':
        replace_stress_map({'cwa':'qua','cwo':'quo'})
        word = replace_prevocal(word, 'nY','ni')
        replace_stress_map({'W':'w', 'Y':'y'})
        replace_stress_map({'ny':'gn', 'tts':'zz', 'ts':'z'})
        replace_stress_map({'y':'i', 'w':'u'})
        replace_stress_map({'ke':'che','ki':'chi'})
        replace_stress_map({'k':'c','H':''})
        word = word.replace('è','E').replace('ò','O')
        n_syll = num_syllables(word)
        if n_syll > 1 and stress == prev_vowel(word, len(word)) and word[stress] in ITALIAN_ACCENTS:
            word = word[:stress] + ITALIAN_ACCENTS[word[stress]] + word[stress+1:]
        word = word.replace('E','e').replace('O','o')


    if isCap:
        word = word[0].upper()+word[1:]
    if isAllCap:
        word = word.upper()

    word = bold_at(word, stress)

    return word

def latin_to_spanish(latin):
    return latin_to_romance(latin, 'es')

samples = [
    'mūtāre',
    'metum','nebulam','baasium','praemium','lectum','venio','regulam',
    'meetioo','trees','quattuor','octoo',
    'podium','multum','pluus','folia','ostream',
    'pugnum','caementum','cognaatum','cochleaare'
]
for sample in samples:
    sample = sample.replace('aa','ā').replace('ee','ē').replace('ii','ī').replace('oo','ō').replace('uu','ū')
    print(f"{bold_at(sample, get_latin_stress(sample))} -> {latin_to_spanish(sample)}")
    print(f"{bold_at(sample, get_latin_stress(sample))} -> {latin_to_romance(sample, 'it')}")

while True:
    s = input(">>> ").replace('aa','ā').replace('ee','ē').replace('ii','ī').replace('oo','ō').replace('uu','ū')
    print(latin_to_spanish(s))
    print(latin_to_romance(s, 'it'))