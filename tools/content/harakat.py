# -*- coding: utf-8 -*-
"""وحدة الحركات: كيف نقرأ الحروف مع الفتحة والكسرة والضمة والمدّ والسكون والشدّة والتنوين."""

L = lambda ar, en, fr, es, de, it: {"ar": ar, "en": en, "fr": fr, "es": es, "de": de, "it": it}


def W(ar, tr, emoji, m):
    return {"ar": ar, "tr": tr, "emoji": emoji, "m": m}


HARAKAT = {
    "id": "harakat",
    "icon": "🎵",
    "stage": "letters",
    "title": L("الحركات: كيف نقرأ", "Vowel marks: how we read", "Les voyelles : comment on lit", "Las vocales: cómo leemos", "Vokalzeichen: so lesen wir", "Le vocali: come si legge"),
    "value": L("الحركات الصغيرة فوق الحروف وتحتها تعلّمنا كيف ننطقها.",
               "The little marks above and below the letters tell us how to say them.",
               "Les petits signes au-dessus et au-dessous des lettres nous disent comment les prononcer.",
               "Las marcas pequeñas encima y debajo de las letras nos dicen cómo pronunciarlas.",
               "Die kleinen Zeichen über und unter den Buchstaben zeigen, wie man sie ausspricht.",
               "I piccoli segni sopra e sotto le lettere ci dicono come pronunciarle."),
    "words": [
        W("بَ", "ba", "⬆️", L("الفتحة: صوت a قصير", "fatḥa (line above): short 'a'", "fatḥa (trait au-dessus) : « a » court", "fatḥa (raya encima): «a» corta", "Fatḥa (Strich oben): kurzes „a“", "fatḥa (trattino sopra): «a» breve")),
        W("بِ", "bi", "⬇️", L("الكسرة: صوت i قصير", "kasra (line below): short 'i'", "kasra (trait au-dessous) : « i » court", "kasra (raya debajo): «i» corta", "Kasra (Strich unten): kurzes „i“", "kasra (trattino sotto): «i» breve")),
        W("بُ", "bu", "➰", L("الضمة: صوت u قصير", "ḍamma (small wāw above): short 'u'", "ḍamma (petit wāw au-dessus) : « ou » court", "ḍamma (pequeña wāw encima): «u» corta", "Ḍamma (kleines Wāw oben): kurzes „u“", "ḍamma (piccola wāw sopra): «u» breve")),
        W("با", "bā", "↔️", L("مدّ بالألف: aa طويلة", "long 'aa' with alif", "« aa » long avec alif", "«aa» larga con alif", "langes „aa“ mit Alif", "«aa» lunga con alif")),
        W("بي", "bī", "↔️", L("مدّ بالياء: ii طويلة", "long 'ii' with yāʾ", "« ii » long avec yāʾ", "«ii» larga con yāʾ", "langes „ii“ mit Yāʾ", "«ii» lunga con yāʾ")),
        W("بو", "bū", "↔️", L("مدّ بالواو: uu طويلة", "long 'uu' with wāw", "« ou » long avec wāw", "«uu» larga con wāw", "langes „uu“ mit Wāw", "«uu» lunga con wāw")),
        W("مِنْ", "min", "⭕", L("السكون: الحرف بلا حركة (من)", "sukūn (small circle): no vowel — min, 'from'", "sukūn (petit rond) : pas de voyelle — min, « de »", "sukūn (circulito): sin vocal — min, «de»", "Sukūn (kleiner Kreis): kein Vokal — min, „von“", "sukūn (cerchietto): nessuna vocale — min, «da»")),
        W("أُمّ", "umm", "🔁", L("الشدّة: الحرف مرّتين (أمّ)", "shadda (small w): the letter is doubled — umm, 'mother'", "shadda (petit w) : la lettre est doublée — umm, « mère »", "shadda (pequeña w): la letra se duplica — umm, «madre»", "Schadda (kleines w): Buchstabe doppelt — umm, „Mutter“", "shadda (piccola w): la lettera è doppia — umm, «madre»")),
        W("بابٌ", "bābun", "🚪", L("تنوين الضمّ: un في آخر الكلمة (باب)", "tanwīn ḍamm: '-un' at the end — bābun, 'a door'", "tanwīn ḍamm : « -oun » à la fin — bābun, « une porte »", "tanwīn ḍamm: «-un» al final — bābun, «una puerta»", "Tanwīn Ḍamm: „-un“ am Ende — bābun, „eine Tür“", "tanwīn ḍamm: «-un» alla fine — bābun, «una porta»")),
        W("كِتابًا", "kitāban", "📖", L("تنوين الفتح: an في آخر الكلمة (كتابًا)", "tanwīn fatḥ: '-an' at the end — kitāban, 'a book'", "tanwīn fatḥ : « -an » à la fin — kitāban, « un livre »", "tanwīn fatḥ: «-an» al final — kitāban, «un libro»", "Tanwīn Fatḥ: „-an“ am Ende — kitāban, „ein Buch“", "tanwīn fatḥ: «-an» alla fine — kitāban, «un libro»")),
        W("بَيْتٍ", "baytin", "🏠", L("تنوين الكسر: in في آخر الكلمة (بيتٍ)", "tanwīn kasr: '-in' at the end — baytin, 'a house'", "tanwīn kasr : « -in » à la fin — baytin, « une maison »", "tanwīn kasr: «-in» al final — baytin, «una casa»", "Tanwīn Kasr: „-in“ am Ende — baytin, „ein Haus“", "tanwīn kasr: «-in» alla fine — baytin, «una casa»")),
        W("نُورٌ", "nūrun", "💡", L("مدّ وتنوين معًا (نور)", "long vowel + tanwīn — nūrun, 'a light'", "voyelle longue + tanwīn — nūrun, « une lumière »", "vocal larga + tanwīn — nūrun, «una luz»", "langer Vokal + Tanwīn — nūrun, „ein Licht“", "vocale lunga + tanwīn — nūrun, «una luce»")),
    ],
    "sentences": [
        W("بابٌ كَبيرٌ", "bābun kabīrun", "🚪", L("باب كبير", "a big door", "une grande porte", "una puerta grande", "eine große Tür", "una porta grande")),
        W("بَيْتٌ جَميلٌ", "baytun jamīlun", "🏡", L("بيت جميل", "a beautiful house", "une belle maison", "una casa bonita", "ein schönes Haus", "una bella casa")),
        W("كِتابٌ مُفيدٌ", "kitābun mufīdun", "📚", L("كتاب نافع", "a useful book", "un livre utile", "un libro útil", "ein nützliches Buch", "un libro utile")),
    ],
}
