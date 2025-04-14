const inputBox = document.getElementById("input-box");
const outputBox = document.getElementById("output-box");
const outputChoices = document.getElementById("output-lang");
const orthography = document.getElementById("orthography");
const specialChars = document.getElementById("special-chars");

const specialCharsSet = {
    'es': ['ñ','á','é','í','ó','ú','ü'],
    'ms': ['é','ĕ'],
    'tr': ['ç','ğ','ş', 'ı','ö','ü', 'â','û'],
};
const languageNames = {
    'es': 'Spanish',
    'ms': 'Malay',
    'tr': 'Turkish',
};

function getText() {
    let text = inputBox.value;
    return text;
}
function refreshOutput() {
    const text = getText();
    const output = getOutput(text);
    // orthography.innerHTML = convertWords(text,
    //     (w) => properOrthography(w, inputLang)).replaceAll('\n\n',' <br>').replaceAll('\n',' <br>');
    outputBox.innerHTML = output.replaceAll('\n',' <br>');
}
function refreshAside(id) {
    for (const child of document.querySelectorAll('#'+id+' > *')) {
        if (!child.dataset.lang)
            continue;
        if (child.dataset.lang.indexOf(inputLang) !== -1)
            child.style.display = '';
        else
            child.style.display = 'none';
    }
    // for (const grandchild of document.querySelectorAll('#'+id+' > * > *')) {
    //     if (grandchild.dataset.lang === undefined || grandchild.dataset.lang.indexOf(outputLang) !== -1)
    //         grandchild.style.display = '';
    //     else
    //         grandchild.style.display = 'none';
    // }
}
function refreshDisplay() {
    refreshOutput();
    refreshAside('input-instructions');
    refreshAside('input-settings');
    refreshAside('output-settings');
}
function getOutput(text) {
    if (inputLang === 'es') {
        const noSpaceAfter = document.es_output.abbr.checked ?
            new Set(['el','la','los','las', 'lo', 'que', 'a', 'al', 'y', 'de', 'del', 'para', 'por', 'si', 'en', 'con',
                'no', 'porque','sobre', 'mi','tu','su', 'me','te','se','le',
            ])
            : null;
        return convertWords(text,
            (w) => convertWord(w, inputLang, outputLang),
            punctMapper, noSpaceAfter);
    }
    return convertWords(text,
        (w) => convertWord(w, inputLang, outputLang), punctMapper);
}

inputBox.addEventListener("input", refreshOutput);
for (const radioButton of document.querySelectorAll('input[type=radio]'))
    radioButton.addEventListener("change", refreshDisplay);
document.es_output.abbr.addEventListener("change", refreshOutput);
document.es_output.arabic.addEventListener("change", refreshOutput);
document.es_output.maghrebi.addEventListener("change", refreshOutput);

const inputButtons = document.querySelectorAll('ul#input-lang li');

function setLangChoice(ulSub, callback) {
    ulSub.forEach((b) => {
        b.addEventListener('click', (event) => {
            for (const b2 of ulSub) {
                b2.classList.remove('active');
            }
            event.target.classList.add('active');
            callback(event.target.dataset.lang);
        });
    });
}
const updateInputLang = (l) => {
    if (l !== inputLang)
        inputBox.value = '';
    inputLang = l;
    inputBox.placeholder = 'Type in ' + languageNames[inputLang];

    // outputChoices.innerHTML = '';
    // if (outputLangs[l].indexOf(outputLang) === -1) {
    //     outputLang = outputLangs[l][0];
    // }
    // for (const lang of outputLangs[inputLang]) {
    //     const li = document.createElement('li');
    //     li.dataset.lang = lang;
    //     li.innerHTML = lang;
    //     if (lang === outputLang)
    //         li.classList.add('active');
    //     outputChoices.appendChild(li);
    // }
    // setLangChoice(document.querySelectorAll('ul#output-lang li'), (l) => {
    //     outputLang = l;
    //     refreshDisplay();
    // });

    // refreshAside('input-instructions')
    specialChars.innerHTML = '';
    let special = specialCharsSet[inputLang];
    if (inputLang === 'es' && document.es_input.era.value === 'old') {
        special = ['ç'].concat(special);
    }
    for (const char of special) {
        const button = document.createElement('button');
        button.innerHTML = char;
        button.addEventListener('click', () => {
            const start = inputBox.selectionStart;
            const end = inputBox.selectionEnd;
            const text = inputBox.value;
            inputBox.value = text.substring(0, start) + char + text.substring(end);
            inputBox.setSelectionRange(start + 1, start + 1);
            inputBox.focus();
            refreshOutput();
        });
        specialChars.appendChild(button);
    }

    refreshDisplay();
}
setLangChoice(inputButtons, updateInputLang);
updateInputLang(inputLang);
for (const radioButton of document.querySelectorAll('form[name="es_input"] input[type=radio]')) {
    radioButton.removeEventListener("change", refreshDisplay);
    radioButton.addEventListener("change", () => updateInputLang('es'));
}

// setLangChoice(document.querySelectorAll('ul#output-lang li'), (l) => {
//     outputLang = l;
//     refreshDisplay();
// });
