# -*- coding: utf-8 -*-
"""يبني data/lessons.json من ملفات المحتوى في tools/content.
التشغيل: python3 tools/build_lessons.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(HERE, "content"))

from letters import LETTERS, GROUPS, NON_CONNECTING  # noqa: E402
from harakat import HARAKAT  # noqa: E402
from values_new import UNITS as NEW_UNITS  # noqa: E402
from stories_old import EXTRA  # noqa: E402

L = lambda ar, en, fr, es, de, it: {"ar": ar, "en": en, "fr": fr, "es": es, "de": de, "it": it}
LANGS = ["ar", "en", "fr", "es", "de", "it"]

CHARS = {
    "yusuf": {"emoji": "👦", "name": L("يوسف", "Yusuf", "Youssouf", "Yusuf", "Yusuf", "Yusuf")},
    "maryam": {"emoji": "👧", "name": L("مريم", "Maryam", "Maryam", "Maryam", "Maryam", "Maryam")},
    "mama": {"emoji": "👩", "name": L("الأم", "Mum", "Maman", "Mamá", "Mama", "Mamma")},
    "baba": {"emoji": "👨", "name": L("الأب", "Dad", "Papa", "Papá", "Papa", "Papà")},
    "grandpa": {"emoji": "👴", "name": L("الجدّ", "Grandpa", "Papi", "Abuelo", "Opa", "Nonno")},
    "grandma": {"emoji": "👵", "name": L("الجدّة", "Grandma", "Mamie", "Abuela", "Oma", "Nonna")},
    "friend": {"emoji": "🧒", "name": L("سامي", "Sami", "Sami", "Sami", "Sami", "Sami")},
    "guest": {"emoji": "🧔", "name": L("الضيف", "The guest", "L'invité", "El invitado", "Der Gast", "L'ospite")},
    "neighbor": {"emoji": "🧓", "name": L("الجار", "The neighbour", "Le voisin", "El vecino", "Der Nachbar", "Il vicino")},
    "teacher": {"emoji": "👩‍🏫", "name": L("المعلّمة", "The teacher", "La maîtresse", "La maestra", "Die Lehrerin", "La maestra")},
}

STAGES = [
    {"id": "letters", "icon": "🔤",
     "title": L("المرحلة الأولى: الحروف والحركات", "Stage 1: Letters and vowels", "Étape 1 : les lettres et les voyelles", "Etapa 1: letras y vocales", "Stufe 1: Buchstaben und Vokale", "Tappa 1: lettere e vocali"),
     "desc": L("تعرّف على الحروف الثمانية والعشرين وأصواتها، ثم تعلّم كيف تقرأ.",
               "Meet the 28 letters and their sounds, then learn how to read.",
               "Découvre les 28 lettres et leurs sons, puis apprends à lire.",
               "Conoce las 28 letras y sus sonidos y aprende a leer.",
               "Lerne die 28 Buchstaben und ihre Laute kennen – und dann das Lesen.",
               "Scopri le 28 lettere e i loro suoni, poi impara a leggere.")},
    {"id": "values", "icon": "🌿",
     "title": L("المرحلة الثانية: كلمات وجمل وقيم", "Stage 2: Words, sentences and values", "Étape 2 : mots, phrases et valeurs", "Etapa 2: palabras, frases y valores", "Stufe 2: Wörter, Sätze und Werte", "Tappa 2: parole, frasi e valori"),
     "desc": L("كلمات وجمل وقصص وأحاديث عن أجمل أخلاق الإسلام.",
               "Words, sentences, stories and hadiths about the most beautiful Islamic manners.",
               "Des mots, des phrases, des histoires et des hadiths sur les plus belles valeurs de l'islam.",
               "Palabras, frases, historias y hadices sobre los valores más bellos del islam.",
               "Wörter, Sätze, Geschichten und Hadithe über die schönsten Werte des Islam.",
               "Parole, frasi, storie e hadith sui valori più belli dell'islam.")},
]

# ترتيب تدريجي لوحدات القيم
VALUE_ORDER = ["greet", "parents", "kindword", "table", "clean", "prayer", "guest", "neighbor",
               "help", "knowledge", "truth", "trust", "order", "respect", "mercy", "zakat",
               "forgive", "goodthought", "gentle", "sick", "brother"]


def letter_units():
    by_char = {row[0]: row for row in LETTERS}
    units = []
    for uid, icon, chars in GROUPS:
        letters = []
        for ch in chars:
            c, name, tr, word, wtr, emoji, m, tip = by_char[ch]
            item = {"ch": c, "name": name, "tr": tr, "word": word, "wtr": wtr, "emoji": emoji, "m": m,
                    "join": c not in NON_CONNECTING}
            if tip:
                item["tip"] = tip
            letters.append(item)
        spaced = " ".join(chars)
        units.append({
            "id": uid, "icon": icon, "stage": "letters", "kind": "letters",
            "title": L("الحروف " + spaced, "Letters " + spaced, "Les lettres " + spaced, "Letras " + spaced, "Buchstaben " + spaced, "Lettere " + spaced),
            "value": L("نتعلّم شكل كل حرف وصوته وكلمة تبدأ به.",
                       "We learn each letter's shape, its sound and a word that starts with it.",
                       "On apprend la forme de chaque lettre, son son et un mot qui commence par elle.",
                       "Aprendemos la forma de cada letra, su sonido y una palabra que empieza por ella.",
                       "Wir lernen Form und Laut jedes Buchstabens und ein Wort, das mit ihm beginnt.",
                       "Impariamo la forma di ogni lettera, il suo suono e una parola che inizia con essa."),
            "letters": letters,
        })
    return units


def main():
    old = json.load(open(os.path.join(ROOT, "data", "lessons.json"), encoding="utf-8"))
    old_units = {u["id"]: u for u in old["units"] if u.get("stage") != "letters" and "kind" not in u}
    for uid, extra in EXTRA.items():
        old_units[uid].update(extra)
    for u in NEW_UNITS:
        old_units[u["id"]] = u
    values = []
    for uid in VALUE_ORDER:
        u = dict(old_units[uid])
        u["stage"] = "values"
        values.append(u)
    missing = set(old_units) - set(VALUE_ORDER)
    assert not missing, missing

    units = letter_units() + [dict(HARAKAT)] + values

    # فحص بسيط: كل نص مترجم إلى اللغات الست
    def check(obj, path):
        if isinstance(obj, dict):
            if set(obj.keys()) >= {"en", "fr"} and not ({"ar", "tr"} <= set(obj.keys())):
                for lang in ["en", "fr", "es", "de", "it"]:
                    assert obj.get(lang), (path, lang)
            for k, v in obj.items():
                check(v, path + "." + str(k))
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                check(v, path + "[" + str(i) + "]")
    check(units, "units")

    out = {"version": 2, "chars": CHARS, "stages": STAGES, "units": units}
    with open(os.path.join(ROOT, "data", "lessons.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    words = sum(len(u.get("words", [])) + len(u.get("sentences", [])) for u in units)
    print("units:", len(units), "letters:", sum(len(u.get("letters", [])) for u in units),
          "words+sentences:", words, "stories:", sum(1 for u in units if u.get("story")))


if __name__ == "__main__":
    main()
