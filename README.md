# Classics Converter

The **Classics Converter** project is a collection of fun tools for historical linguistics. The first is the **Classics Converter** proper, an online tool using Latin and Sanskrit to predict words in their modern descendant languages. Second is **Aljamiado**, an online tool for writing Spanish, Malay, and Turkish in their historical Arabic scripts.

## Contents
1. [Classics Converter](#classics-converter)
2. [Aljamiado](#aljamiado)

## Classics Converter
Rather than translating between languages, this tool relies on phonological changes
that linguists have pieced together in order to predict a word in one language
from another. Hosted at [harysdalvi.com/classics-converter](https://www.harysdalvi.com/classics-converter).

For example, the Latin word *oculum* evolved into Spanish *ojo*. This tool
can predict that and more.

But it's not perfect: it doesn't capture phonological changes, and a lot of language evolution can't be described fully by these simple rules. Please feel free to contribute to help make this a really useful tool for studying historical phonology!

### Overview
User input is converted into an internal representation of the word in Latin or Sanskrit, which may differ slightly from the user input. The goal of this program is to map the internal representation in one language to a representation in another, and then map that to a human-readable orthography in the language.

This is done by applying a series of rules. For example, Sanskrit consonant clusters like *sr* and *kt* are often simplified in descendant languages according to a set list of rules.

* `orthography.js` contains functions for mapping between internal representations and orthographies, as well as some more things that other files depend on.
* `word.js` contains utilities for conversions, especially the `Word` class and its subclasses. This makes string manipulations in this context a lot more convenient than raw JavaScript.
* `convert.js` has the bulk of the conversions.
* `es.py` is an old file, serving as a demo of conversions from Latin to Spanish and Italian.

![Romance languages](classics-converter/img/Romance_languages.jpg)
![Indo-Aryan languages](classics-converter/img/Indo-Aryan_language_map.svg.jpg)

## Aljamiado
This is a tool to write Spanish, Malay, and Turkish in their historical Arabic scripts. These historical Arabic scripts are:

* For Spanish, the Aljamiado script used first during Muslim rule of Spain, and then secretly for some time after the Reconquista. (In Spanish, the script itself is called aljamía; aljamiado is an adjective.)
* For Malay, the Jawi script widely used in the Malay Archipelago from the 15th century until the 20th century, and still used occasionally.
* For Turkish, the Ottoman Turkish script used during the Ottoman Empire and then in Republican Turkey until 1928.

The tool is available in both English and Spanish.
![Poema de Yuçuf](aljamiado/img/Poema_de_Yusuf.jpg)