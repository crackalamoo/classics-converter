const inputBox = document.getElementById("input-box");
const outputBox = document.getElementById("output-box");
const outputChoices = document.getElementById("output-lang");
const orthography = document.getElementById("orthography");
const orthography2 = document.getElementById("out-orthography");

function getText() {
    let text = inputBox.value;
    return text;
}
function refreshOutput() {
    const text = getText();
    const stages = {};
    function addStage(stage, word) {
        if (!document.stage_settings.stage.checked)
            return;
        if (stages[stage] === undefined)
            stages[stage] = [];
        if (inputLang === 'sa') {
            if (stage === 'NIA')
                word = sanskritRomanOrthography(word, outputLang);
            else
                word = sanskritRomanOrthography(word, 'sa');
        }
        stages[stage].push(word);
    }
    const output = convertWords(text,
        (w) => convertWord(w, inputLang, outputLang, false, addStage), false);
    const output2 = convertWords(text,
        (w) => convertWord(w, inputLang, outputLang, true), true, (a,b) => {});
    orthography.innerHTML = convertWords(text,
        (w) => displayOrthography(w, inputLang)).replaceAll('\n\n',' <br>').replaceAll('\n',' <br>');
    outputBox.innerHTML = output.replaceAll('\n',' <br>');
    orthography2.innerHTML = output2.replaceAll('\n',' <br>');
    if (inputLang === 'sa') {
        const isGurmukhi = (outputLang === 'pa' && document.pa_settings.pa_script.value === 'gurmukhi');
        if (isRoman(text)) {
            orthography2.lang = outputLang;
            if (isGurmukhi)
                orthography2.lang += '-Guru';
            outputBox.lang = outputLang+'-Latn';
        } else {
            orthography2.lang = outputLang+'-Latn';
            outputBox.lang = outputLang;
            if (isGurmukhi)
                outputBox.lang += '-Guru';
        }
    }
    let stageBox = document.getElementById("stage-outputs");
    stageBox.innerHTML = '';
    if (inputLang === 'la' && Object.keys(stages).length > 0) {
        stageBox.innerHTML = "<b>Note:</b> Intermediate stages are a compromise between orthography and phonology, and aren't fully accurate for either.";
    }
    for (const stage in stages) {
        const stageDiv = document.createElement('div');
        stageDiv.innerHTML = '<b>' + stage + '</b>: ' + stages[stage].join(' ');
        stageBox.appendChild(stageDiv);
    }
}
function refreshAside(id) {
    for (const child of document.querySelectorAll('#'+id+' > *')) {
        if (child.dataset.lang.indexOf(inputLang) !== -1)
            child.style.display = '';
        else
            child.style.display = 'none';
    }
    for (const grandchild of document.querySelectorAll('#'+id+' > * > *')) {
        if (grandchild.dataset.lang === undefined || grandchild.dataset.lang.indexOf(outputLang) !== -1)
            grandchild.style.display = '';
        else
            grandchild.style.display = 'none';
    }
}
function refreshDisplay() {
    if (outputLang === 'hi' && document.hi_ur_settings.hi_ur_script.value === 'urdu') {
        outputLang = 'ur';
    } else if (outputLang === 'ur' && document.hi_ur_settings.hi_ur_script.value === 'hindi') {
        outputLang = 'hi';
    }
    refreshOutput();
    refreshAside('input-instructions');
    refreshAside('output-settings');
    populateExamples();
}

inputBox.addEventListener("input", refreshOutput);
for (const radioButton of document.querySelectorAll('input[type=radio]'))
    radioButton.addEventListener("change", refreshDisplay);
document.ur_pa_settings.vowel_marks.addEventListener("change", refreshOutput);
document.stage_settings.stage.addEventListener("change", refreshOutput);

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
    inputBox.placeholder = 'Type in ' + langNames[inputLang];
    outputChoices.innerHTML = '';
    if (outputLangs[l].indexOf(outputLang) === -1) {
        outputLang = outputLangs[l][0];
    }
    for (const lang of outputLangs[inputLang]) {
        const li = document.createElement('li');
        li.dataset.lang = lang;
        if (lang === 'hi')
            li.innerHTML = 'Hindi/Urdu';
        else
            li.innerHTML = langNames[lang];
        if (lang === outputLang)
            li.classList.add('active');
        outputChoices.appendChild(li);
    }
    setLangChoice(document.querySelectorAll('ul#output-lang li'), (l) => {
        outputLang = l;
        refreshDisplay();
    });
    if (inputLang === 'sa') {
        const text = getText();
        if (isRoman(text)) {
            orthography.lang = 'sa';
            inputBox.lang = 'sa-Latn';
        } else {
            orthography.lang = 'sa-Latn';
            inputBox.lang = 'sa';
        }
    }
    refreshDisplay();
}
setLangChoice(inputButtons, updateInputLang);
updateInputLang(inputLang);

setLangChoice(document.querySelectorAll('ul#output-lang li'), (l) => {
    outputLang = l;
    refreshDisplay();
});

function showSample(name) {
    for (const sample of samples) {
        if (sample['name'] === name && sample['langs'].has(outputLang)) {
            // inputBox.innerHTML = sample['in'];
            inputBox.value = sample['in'];
            refreshOutput();
            document.body.scrollTop = document.documentElement.scrollTop = 0;
            return;
        }
    }
}

function populateExamples() {
    const examplesBox = document.querySelector('.examples-box');
    const langSamples = getSampleNames(outputLang);
    examplesBox.innerHTML = '<div style="margin:5px;padding:5px 10px;">Click me!</div>';
    for (const sampleName of langSamples) {
        const button = document.createElement('button');
        button.innerHTML = sampleName;
        button.className = 'groupButton';
        button.addEventListener('click', () => showSample(sampleName));
        examplesBox.appendChild(button);
    }
}

const examplesButton = document.getElementById("examples-button");
examplesButton.addEventListener("click", () => {
    const examplesBox = document.querySelector('.examples-box');
    if (examplesBox.style.display === 'none') {
        examplesButton.innerHTML = 'Examples [-]';
        examplesBox.style.display = '';
    } else {
        examplesButton.innerHTML = 'Examples [+]';
        examplesBox.style.display = 'none';
    }
});