#!/usr/bin/env python3
"""Build <lang>/index.html from index.html and i18n/<lang>.json.

In the English page, data-i18n="key" marks an element's contents for
translation and data-i18n-<attr>="key" marks an attribute.
"""

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://www.harysdalvi.com'
PAGES = ['classics-converter', 'aljamiado']
SOURCE_LANG = 'en'
LANG_NAMES = {
    'en': 'English',
    'es': 'Español',
}

VOID_TAGS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
             'link', 'meta', 'source', 'track', 'wbr'}
I18N_ATTR = re.compile(r'\s+data-i18n(?:-[\w-]+)?="[^"]*"')


class Element:
    def __init__(self, tag, attrs, start, raw, parent):
        self.tag = tag
        self.attrs = dict(attrs)
        self.start = start                # offset of '<'
        self.raw = raw                    # the start tag as written
        self.inner_start = start + len(raw)
        self.inner_end = None             # offset of the matching '</'
        self.parent = parent
        self.children = []


class Scanner(HTMLParser):
    """Records each element's source offsets so edits keep the formatting."""

    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.line_starts = [0]
        for m in re.finditer('\n', source):
            self.line_starts.append(m.end())
        self.root = Element('#root', [], 0, '', None)
        self.stack = [self.root]
        self.elements = []
        self.feed(source)
        self.close()

    def source_offset(self):
        line, col = self.getpos()
        return self.line_starts[line - 1] + col

    def handle_starttag(self, tag, attrs):
        parent = self.stack[-1]
        el = Element(tag, attrs, self.source_offset(), self.get_starttag_text(), parent)
        parent.children.append(el)
        self.elements.append(el)
        if tag not in VOID_TAGS:
            self.stack.append(el)

    def handle_startendtag(self, tag, attrs):
        parent = self.stack[-1]
        el = Element(tag, attrs, self.source_offset(), self.get_starttag_text(), parent)
        parent.children.append(el)
        self.elements.append(el)

    def handle_endtag(self, tag):
        # Stray end tags are ignored.
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                for el in self.stack[i:]:
                    if el.inner_end is None:
                        el.inner_end = self.source_offset()
                del self.stack[i:]
                return


def page_url(page, lang):
    prefix = '' if lang == SOURCE_LANG else '/' + lang
    return f'{SITE}{prefix}/{page}/'


def escape_attr(text):
    return (text.replace('&', '&amp;').replace('"', '&quot;')
            .replace('<', '&lt;').replace('>', '&gt;'))


def set_attr(raw, name, value):
    pattern = re.compile(r'(\s' + re.escape(name) + r'=)("[^"]*"|\'[^\']*\')')
    new, n = pattern.subn(lambda m: m.group(1) + '"' + escape_attr(value) + '"', raw, count=1)
    if n == 0:
        raise ValueError(f'attribute {name!r} not found in {raw!r}')
    return new


def is_relative(url):
    return not re.match(r'^([a-z][a-z0-9+.-]*:|//|#)', url, re.I)


def render(page, source, scan, lang, langs, strings):
    """For English, only the language switcher and hreflang links change."""
    translating = lang != SOURCE_LANG
    asset_base = f'{SITE}/sub/projects/classics-converter/{page}/'
    used, missing = set(), []
    edits = []  # (start, end, replacement)

    def lookup(key, english):
        used.add(key)
        if key in strings:
            return strings[key]
        missing.append(key)
        return english

    alternates = [el for el in scan.elements
                  if el.tag == 'link' and el.attrs.get('rel') == 'alternate' and 'hreflang' in el.attrs]
    if alternates:
        first, last = alternates[0], alternates[-1]
        line_start = source.rfind('\n', 0, first.start) + 1
        indent = source[line_start:first.start]
        links = [f'<link rel="alternate" hreflang="{l}" href="{page_url(page, l)}">' for l in langs]
        edits.append((first.start, last.inner_start, ('\n' + indent).join(links)))

    for el in scan.elements:
        if el in alternates:
            continue
        raw = el.raw
        if translating:
            for attr, key in el.attrs.items():
                if attr.startswith('data-i18n-'):
                    target = attr[len('data-i18n-'):]
                    raw = set_attr(raw, target, lookup(key, el.attrs.get(target, '')))
            raw = I18N_ATTR.sub('', raw)
            if el.tag == 'html':
                raw = set_attr(raw, 'lang', lang)
            for attr in ('src', 'href') if el.tag == 'link' else ('src',):
                url = el.attrs.get(attr)
                if url and is_relative(url):
                    raw = set_attr(raw, attr, asset_base + url.removeprefix('./'))
        if raw != el.raw:
            edits.append((el.start, el.inner_start, raw))

        inner = None
        if el.attrs.get('id') == 'lang-switch':
            items = [LANG_NAMES[l] if l == lang else f'<a href="{page_url(page, l)}">{LANG_NAMES[l]}</a>'
                     for l in langs]
            inner = ' | '.join(items)
        elif translating and 'data-i18n' in el.attrs:
            if el.inner_end is None:
                raise ValueError(f'{page}: <{el.tag} data-i18n="{el.attrs["data-i18n"]}"> is never closed')
            english = source[el.inner_start:el.inner_end].strip()
            inner = lookup(el.attrs['data-i18n'], english)
        if inner is not None:
            current = source[el.inner_start:el.inner_end]
            lead = current[:len(current) - len(current.lstrip())]
            trail = current[len(current.rstrip()):]
            edits.append((el.inner_start, el.inner_end, lead + inner + trail))

    # Drop edits nested inside a replaced element's contents.
    edits.sort(key=lambda e: (e[0], -e[1]))
    out, pos = [], 0
    for start, end, text in edits:
        if start < pos:
            continue
        out.append(source[pos:start])
        out.append(text)
        pos = end
    out.append(source[pos:])
    result = ''.join(out)

    if translating:
        result, n = re.subn(r"const PAGE_LANG = '[^']*';", f"const PAGE_LANG = '{lang}';", result)
        if n != 1:
            raise ValueError(f'{page}: expected one PAGE_LANG declaration, found {n}')
        doctype = re.match(r'<!DOCTYPE html>\n', result, re.I)
        note = (f'<!-- Generated by tools/build_i18n.py from ../index.html and '
                f'../i18n/{lang}.json. Edit those instead. -->\n')
        result = result[:doctype.end()] + note + result[doctype.end():] if doctype else note + result

    unused = sorted(set(strings) - used)
    return result, missing, unused


def build_page(page):
    page_dir = ROOT / page
    source = (page_dir / 'index.html').read_text(encoding='utf-8')
    translations = {p.stem: json.loads(p.read_text(encoding='utf-8'))
                    for p in sorted((page_dir / 'i18n').glob('*.json'))}
    langs = [SOURCE_LANG] + sorted(translations)
    for lang in langs:
        if lang not in LANG_NAMES:
            raise ValueError(f'add a display name for {lang!r} to LANG_NAMES')

    scan = Scanner(source)
    english, _, _ = render(page, source, scan, SOURCE_LANG, langs, {})
    if english != source:
        (page_dir / 'index.html').write_text(english, encoding='utf-8')
        print(f'updated {page}/index.html')
        source, scan = english, Scanner(english)

    ok = True
    for lang, strings in translations.items():
        result, missing, unused = render(page, source, scan, lang, langs, strings)
        out = page_dir / lang / 'index.html'
        out.parent.mkdir(exist_ok=True)
        out.write_text(result, encoding='utf-8')
        print(f'wrote {out.relative_to(ROOT)}')
        for key in missing:
            print(f'  warning: {lang}.json has no "{key}"; using the English text')
        for key in unused:
            print(f'  warning: {lang}.json has unused key "{key}"')
        ok = ok and not missing and not unused
    return ok


def main():
    ok = all([build_page(page) for page in PAGES])
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
