# -*- coding: utf-8 -*-
"""قصص وتحديات للوحدات الثماني الموجودة سابقًا."""

L = lambda ar, en, fr, es, de, it: {"ar": ar, "en": en, "fr": fr, "es": es, "de": de, "it": it}


def S(who, ar, tr, en, fr, es, de, it):
    return {"who": who, "ar": ar, "tr": tr, "m": {"en": en, "fr": fr, "es": es, "de": de, "it": it}}


EXTRA = {
    "greet": {
        "story": {
            "lines": [
                S("yusuf", "السَّلامُ عَلَيْكُمْ يا جَدّي!", "as-salāmu ʿalaykum yā jaddī!", "Peace be upon you, Grandpa!", "Que la paix soit sur toi, papi !", "¡La paz sea contigo, abuelo!", "Friede sei mit dir, Opa!", "La pace sia con te, nonno!"),
                S("grandpa", "وَعَلَيْكُمُ السَّلامُ يا يوسُفُ.", "wa ʿalaykumu s-salām yā yūsuf.", "And peace be upon you, Yusuf.", "Et que la paix soit sur toi, Youssouf.", "Y contigo sea la paz, Yusuf.", "Und Friede sei mit dir, Yusuf.", "E con te sia la pace, Yusuf."),
                S("yusuf", "مِنْ فَضْلِكَ، ساعِدْني في الدَّرْسِ.", "min faḍlik, sāʿidnī fī d-dars.", "Please help me with my lesson.", "S'il te plaît, aide-moi pour ma leçon.", "Por favor, ayúdame con la lección.", "Bitte hilf mir bei meiner Lektion.", "Per favore, aiutami con la lezione."),
                S("yusuf", "شُكْرًا يا جَدّي!", "shukran yā jaddī!", "Thank you, Grandpa!", "Merci, papi !", "¡Gracias, abuelo!", "Danke, Opa!", "Grazie, nonno!"),
            ],
            "q": L("بماذا بدأ يوسف كلامه؟", "How did Yusuf start talking?", "Comment Youssouf a-t-il commencé à parler ?", "¿Cómo empezó a hablar Yusuf?", "Womit hat Yusuf das Gespräch begonnen?", "Come ha iniziato a parlare Yusuf?"),
            "options": [
                L("بالسلام", "With the greeting of peace", "Par le salut de paix", "Con el saludo de paz", "Mit dem Friedensgruß", "Con il saluto di pace"),
                L("بالصراخ", "By shouting", "En criant", "Gritando", "Mit Schreien", "Urlando"),
                L("بالبكاء", "By crying", "En pleurant", "Llorando", "Mit Weinen", "Piangendo"),
            ],
        },
        "challenge": L("قل اليوم «السَّلامُ عَلَيْكُمْ» لكل فرد من عائلتك عندما تراه أوّل مرّة.",
                       "Today, say “as-salāmu ʿalaykum” to everyone in your family the first time you see them.",
                       "Aujourd'hui, dis « as-salāmu ʿalaykum » à chaque membre de ta famille la première fois que tu le vois.",
                       "Hoy di «as-salāmu ʿalaykum» a cada persona de tu familia la primera vez que la veas.",
                       "Sag heute jedem in deiner Familie „as-salāmu ʿalaykum“, wenn du ihn zum ersten Mal siehst.",
                       "Oggi di' «as-salāmu ʿalaykum» a ogni persona della tua famiglia la prima volta che la vedi."),
    },
    "prayer": {
        "story": {
            "lines": [
                S("maryam", "أَسْمَعُ الأَذانَ يا أَبي!", "asmaʿu l-adhāna yā abī!", "I can hear the call to prayer, Dad!", "J'entends l'appel à la prière, papa !", "¡Oigo la llamada a la oración, papá!", "Ich höre den Gebetsruf, Papa!", "Sento la chiamata alla preghiera, papà!"),
                S("baba", "هَيّا نَتَوَضَّأُ.", "hayyā natawaḍḍaʾ.", "Come on, let's do wudu.", "Allez, faisons nos ablutions.", "Vamos a hacer la ablución.", "Komm, wir machen die Gebetswaschung.", "Dai, facciamo l'abluzione."),
                S("maryam", "أَيْنَ السَّجّادَةُ؟", "ayna s-sajjāda?", "Where is the prayer rug?", "Où est le tapis de prière ?", "¿Dónde está la alfombra de oración?", "Wo ist der Gebetsteppich?", "Dov'è il tappeto da preghiera?"),
                S("baba", "هُنا، نَحْوَ القِبْلَةِ.", "hunā, naḥwa l-qibla.", "Here, facing the qibla.", "Ici, vers la qibla.", "Aquí, hacia la qibla.", "Hier, in Richtung Qibla.", "Qui, verso la qibla."),
            ],
            "q": L("ماذا فعلا قبل الصلاة؟", "What did they do before praying?", "Qu'ont-ils fait avant la prière ?", "¿Qué hicieron antes de rezar?", "Was haben sie vor dem Gebet gemacht?", "Che cosa hanno fatto prima di pregare?"),
            "options": [
                L("توضّآ", "They did wudu", "Ils ont fait leurs ablutions", "Hicieron la ablución", "Sie machten die Gebetswaschung", "Hanno fatto l'abluzione"),
                L("أكلا", "They ate", "Ils ont mangé", "Comieron", "Sie aßen", "Hanno mangiato"),
                L("ناما", "They slept", "Ils ont dormi", "Durmieron", "Sie schliefen", "Hanno dormito"),
            ],
        },
        "challenge": L("عندما تسمع الأذان أو يحين وقت الصلاة اليوم، اترك ما بيدك وتوضّأ مع أحد والديك.",
                       "When it's prayer time today, stop what you're doing and do wudu with a parent.",
                       "Quand vient l'heure de la prière aujourd'hui, arrête ce que tu fais et fais tes ablutions avec un parent.",
                       "Cuando hoy llegue la hora de la oración, deja lo que haces y haz la ablución con tu padre o madre.",
                       "Wenn heute Gebetszeit ist, hör auf mit dem, was du tust, und mach mit deinen Eltern die Waschung.",
                       "Quando oggi arriva l'ora della preghiera, lascia ciò che fai e fai l'abluzione con un genitore."),
    },
    "zakat": {
        "story": {
            "lines": [
                S("maryam", "هذا مالٌ مِنْ حَصّالَتي.", "hādhā mālun min ḥaṣṣālatī.", "This is money from my piggy bank.", "C'est de l'argent de ma tirelire.", "Este es dinero de mi hucha.", "Das ist Geld aus meiner Spardose.", "Questi sono soldi del mio salvadanaio."),
                S("maryam", "أُعْطيهِ لِلْفَقيرِ صَدَقَةً.", "uʿṭīhi li-l-faqīri ṣadaqa.", "I'm giving it to a poor person as charity.", "Je le donne au pauvre en aumône.", "Se lo doy al pobre como caridad.", "Ich gebe es einem Armen als Almosen.", "Lo do al povero come elemosina."),
                S("mama", "ما شاءَ اللهُ! اللهُ يُحِبُّ الكَرَمَ.", "mā shāʾa llāh! allāhu yuḥibbu l-karam.", "Mā shāʾ Allāh! Allah loves generosity.", "Mā shāʾ Allāh ! Allah aime la générosité.", "¡Mā shāʾ Allāh! Allah ama la generosidad.", "Mā schāʾ Allāh! Allah liebt Großzügigkeit.", "Mā shāʾ Allāh! Allah ama la generosità."),
                S("maryam", "وَأُعْطيهِ ابْتِسامَةً أَيْضًا!", "wa uʿṭīhi btisāmatan ayḍan!", "And I'll give him a smile too!", "Et je lui donne aussi un sourire !", "¡Y también le doy una sonrisa!", "Und ich schenke ihm auch ein Lächeln!", "E gli do anche un sorriso!"),
            ],
            "q": L("من أين جاء مال مريم؟", "Where did Maryam's money come from?", "D'où vient l'argent de Maryam ?", "¿De dónde salió el dinero de Maryam?", "Woher kam Maryams Geld?", "Da dove venivano i soldi di Maryam?"),
            "options": [
                L("من حصّالتها", "From her piggy bank", "De sa tirelire", "De su hucha", "Aus ihrer Spardose", "Dal suo salvadanaio"),
                L("من الطريق", "From the street", "De la rue", "De la calle", "Von der Straße", "Dalla strada"),
                L("من صديقتها", "From her friend", "De son amie", "De su amiga", "Von ihrer Freundin", "Dalla sua amica"),
            ],
        },
        "challenge": L("اختر مع أحد والديك شيئًا تتصدّق به اليوم: قطعة نقدية، لعبة لم تعد تستعملها، أو طعامًا.",
                       "With a parent, choose something to give in charity today: a coin, a toy you no longer use, or some food.",
                       "Choisis avec un parent quelque chose à donner en aumône aujourd'hui : une pièce, un jouet que tu n'utilises plus ou de la nourriture.",
                       "Elige con tu padre o madre algo para dar en caridad hoy: una moneda, un juguete que ya no usas o comida.",
                       "Such mit deinen Eltern heute etwas als Spende aus: eine Münze, ein Spielzeug, das du nicht mehr brauchst, oder Essen.",
                       "Scegli con un genitore qualcosa da donare oggi: una moneta, un gioco che non usi più o del cibo."),
    },
    "parents": {
        "story": {
            "lines": [
                S("mama", "يا يوسُفُ، مِنْ فَضْلِكَ رَتِّبِ المائِدَةَ.", "yā yūsuf, min faḍlika rattibi l-māʾida.", "Yusuf, please set the table.", "Youssouf, s'il te plaît, mets la table.", "Yusuf, por favor, pon la mesa.", "Yusuf, bitte deck den Tisch.", "Yusuf, per favore, apparecchia la tavola."),
                S("yusuf", "حاضِرٌ يا أُمّي!", "ḥāḍirun yā ummī!", "Right away, Mum!", "Tout de suite, maman !", "¡Enseguida, mamá!", "Sofort, Mama!", "Subito, mamma!"),
                S("mama", "بارَكَ اللهُ فيكَ يا بُنَيَّ.", "bāraka llāhu fīka yā bunayya.", "May Allah bless you, my son.", "Qu'Allah te bénisse, mon fils.", "Que Allah te bendiga, hijo mío.", "Allah segne dich, mein Sohn.", "Che Allah ti benedica, figlio mio."),
                S("yusuf", "رَبِّ ارْحَمْهُما كَما رَبَّياني صَغيرًا.", "rabbi rḥamhumā kamā rabbayānī ṣaghīran.", "My Lord, have mercy on them as they raised me when I was small.", "Seigneur, fais-leur miséricorde comme ils m'ont élevé tout petit.", "Señor mío, ten misericordia de ellos como me criaron de pequeño.", "Mein Herr, erbarme dich ihrer, wie sie mich als Kind aufgezogen haben.", "Signore, abbi misericordia di loro come mi hanno cresciuto da piccolo."),
            ],
            "q": L("بماذا أجاب يوسف أمّه؟", "How did Yusuf answer his mum?", "Qu'a répondu Youssouf à sa mère ?", "¿Qué le respondió Yusuf a su madre?", "Was antwortete Yusuf seiner Mutter?", "Che cosa ha risposto Yusuf alla mamma?"),
            "options": [
                L("حاضر يا أمّي!", "Right away, Mum!", "Tout de suite, maman !", "¡Enseguida, mamá!", "Sofort, Mama!", "Subito, mamma!"),
                L("لا أريد", "I don't want to", "Je ne veux pas", "No quiero", "Ich will nicht", "Non voglio"),
                L("بعد قليل", "In a while", "Tout à l'heure", "Luego", "Später", "Fra un po'"),
            ],
        },
        "challenge": L("عندما يطلب منك أحد والديك شيئًا اليوم، قل: «حاضِر» وافعله فورًا، ثم ادعُ لهما.",
                       "When a parent asks you for something today, say “ḥāḍir” (right away), do it at once, then make duʿāʾ for them.",
                       "Quand un parent te demande quelque chose aujourd'hui, dis « ḥāḍir » (tout de suite), fais-le aussitôt, puis invoque Allah pour eux.",
                       "Cuando hoy tu padre o tu madre te pida algo, di «ḥāḍir» (enseguida), hazlo al momento y luego pide a Allah por ellos.",
                       "Wenn deine Eltern dich heute um etwas bitten, sag „ḥāḍir“ (sofort), tu es gleich und sprich danach ein Bittgebet für sie.",
                       "Quando oggi un genitore ti chiede qualcosa, di' «ḥāḍir» (subito), fallo subito, poi prega Allah per loro."),
    },
    "neighbor": {
        "story": {
            "lines": [
                S("mama", "طَبَخْتُ كَعْكًا، خُذْ صَحْنًا لِجارِنا.", "ṭabakhtu kaʿkan, khudh ṣaḥnan li-jārinā.", "I baked cake; take a plate to our neighbour.", "J'ai fait des gâteaux ; apporte une assiette à notre voisin.", "He hecho pasteles; lleva un plato al vecino.", "Ich habe Kuchen gebacken; bring einen Teller zum Nachbarn.", "Ho fatto dei dolci; porta un piatto al vicino."),
                S("yusuf", "السَّلامُ عَلَيْكُمْ يا جارَنا، هذِهِ هَدِيَّةٌ.", "as-salāmu ʿalaykum yā jāranā, hādhihi hadiyya.", "Peace be upon you, neighbour, this is a gift.", "Que la paix soit sur vous, voisin, c'est un cadeau.", "La paz sea con usted, vecino, esto es un regalo.", "Friede sei mit Ihnen, Nachbar, das ist ein Geschenk.", "La pace sia con lei, vicino, questo è un regalo."),
                S("neighbor", "وَعَلَيْكُمُ السَّلامُ! شُكْرًا يا يوسُفُ.", "wa ʿalaykumu s-salām! shukran yā yūsuf.", "And peace be upon you! Thank you, Yusuf.", "Et que la paix soit sur toi ! Merci, Youssouf.", "¡Y contigo sea la paz! Gracias, Yusuf.", "Und Friede sei mit dir! Danke, Yusuf.", "E con te sia la pace! Grazie, Yusuf."),
                S("neighbor", "أَنْتُمْ جيرانٌ طَيِّبونَ.", "antum jīrānun ṭayyibūn.", "You are good neighbours.", "Vous êtes de bons voisins.", "Sois buenos vecinos.", "Ihr seid gute Nachbarn.", "Siete dei buoni vicini."),
            ],
            "q": L("ماذا أخذ يوسف إلى الجار؟", "What did Yusuf take to the neighbour?", "Qu'a apporté Youssouf au voisin ?", "¿Qué le llevó Yusuf al vecino?", "Was hat Yusuf dem Nachbarn gebracht?", "Che cosa ha portato Yusuf al vicino?"),
            "options": [
                L("صحنًا من الكعك", "A plate of cake", "Une assiette de gâteaux", "Un plato de pasteles", "Einen Teller Kuchen", "Un piatto di dolci"),
                L("كرة", "A ball", "Un ballon", "Una pelota", "Einen Ball", "Un pallone"),
                L("رسالة", "A letter", "Une lettre", "Una carta", "Einen Brief", "Una lettera"),
            ],
        },
        "challenge": L("حيِّ جارك اليوم بابتسامة، أو اصنع له بطاقة صغيرة مع أحد والديك.",
                       "Greet your neighbour with a smile today, or make a little card for them with a parent.",
                       "Salue ton voisin avec un sourire aujourd'hui, ou fabrique-lui une petite carte avec un parent.",
                       "Saluda hoy a tu vecino con una sonrisa o hazle una tarjetita con tu padre o madre.",
                       "Grüß heute deinen Nachbarn mit einem Lächeln oder bastle mit deinen Eltern eine kleine Karte für ihn.",
                       "Saluta oggi il tuo vicino con un sorriso, o preparagli un bigliettino con un genitore."),
    },
    "clean": {
        "story": {
            "lines": [
                S("mama", "يا مَرْيَمُ، اِغْسِلي يَدَيْكِ قَبْلَ الأَكْلِ.", "yā maryam, ighsilī yadayki qabla l-akl.", "Maryam, wash your hands before eating.", "Maryam, lave-toi les mains avant de manger.", "Maryam, lávate las manos antes de comer.", "Maryam, wasch dir vor dem Essen die Hände.", "Maryam, lavati le mani prima di mangiare."),
                S("maryam", "أَغْسِلُهُما بِالماءِ وَالصّابونِ.", "aghsiluhumā bi-l-māʾi wa ṣ-ṣābūn.", "I wash them with water and soap.", "Je les lave avec de l'eau et du savon.", "Me las lavo con agua y jabón.", "Ich wasche sie mit Wasser und Seife.", "Le lavo con acqua e sapone."),
                S("maryam", "انْظُري، يَدايَ نَظيفَتانِ!", "unẓurī, yadāya naẓīfatān!", "Look, my hands are clean!", "Regarde, mes mains sont propres !", "¡Mira, tengo las manos limpias!", "Schau, meine Hände sind sauber!", "Guarda, le mie mani sono pulite!"),
                S("mama", "أَحْسَنْتِ! النَّظافَةُ مِنَ الإيمانِ.", "aḥsanti! an-naẓāfatu mina l-īmān.", "Well done! Cleanliness is part of faith.", "Bravo ! La propreté fait partie de la foi.", "¡Muy bien! La limpieza es parte de la fe.", "Gut gemacht! Sauberkeit gehört zum Glauben.", "Brava! La pulizia fa parte della fede."),
            ],
            "q": L("بماذا غسلت مريم يديها؟", "What did Maryam wash her hands with?", "Avec quoi Maryam s'est-elle lavé les mains ?", "¿Con qué se lavó Maryam las manos?", "Womit hat Maryam ihre Hände gewaschen?", "Con che cosa si è lavata le mani Maryam?"),
            "options": [
                L("بالماء والصابون", "Water and soap", "De l'eau et du savon", "Agua y jabón", "Wasser und Seife", "Acqua e sapone"),
                L("بالحليب", "Milk", "Du lait", "Leche", "Milch", "Latte"),
                L("لم تغسلهما", "She didn't wash them", "Elle ne les a pas lavées", "No se las lavó", "Sie hat sie nicht gewaschen", "Non le ha lavate"),
            ],
        },
        "challenge": L("اغسل يديك بالماء والصابون قبل كل وجبة اليوم، ونظّف أسنانك قبل النوم.",
                       "Wash your hands with soap before every meal today, and brush your teeth before bed.",
                       "Lave-toi les mains au savon avant chaque repas aujourd'hui, et brosse-toi les dents avant de dormir.",
                       "Lávate las manos con jabón antes de cada comida hoy y cepíllate los dientes antes de dormir.",
                       "Wasch dir heute vor jeder Mahlzeit die Hände mit Seife und putz vor dem Schlafen die Zähne.",
                       "Lavati le mani con il sapone prima di ogni pasto oggi, e lavati i denti prima di dormire."),
    },
    "order": {
        "story": {
            "lines": [
                S("baba", "يا يوسُفُ، غُرْفَتُكَ غَيْرُ مُرَتَّبَةٍ.", "yā yūsuf, ghurfatuka ghayru murattaba.", "Yusuf, your room isn't tidy.", "Youssouf, ta chambre n'est pas rangée.", "Yusuf, tu habitación no está ordenada.", "Yusuf, dein Zimmer ist nicht aufgeräumt.", "Yusuf, la tua camera non è in ordine."),
                S("yusuf", "سَأُرَتِّبُها الآنَ يا أَبي.", "sa-urattibuhā l-āna yā abī.", "I'll tidy it now, Dad.", "Je vais la ranger maintenant, papa.", "La ordenaré ahora, papá.", "Ich räume es jetzt auf, Papa.", "La metto in ordine adesso, papà."),
                S("yusuf", "الكُتُبُ في مَكانِها، وَالقُمامَةُ في السَّلَّةِ.", "al-kutubu fī makānihā, wa l-qumāmatu fī s-salla.", "The books are in their place and the rubbish is in the bin.", "Les livres sont à leur place et les déchets dans la poubelle.", "Los libros están en su sitio y la basura en la papelera.", "Die Bücher sind an ihrem Platz und der Müll im Eimer.", "I libri sono al loro posto e la spazzatura nel cestino."),
                S("baba", "ما أَجْمَلَ غُرْفَتَكَ الآنَ!", "mā ajmala ghurfataka l-ān!", "How lovely your room is now!", "Comme ta chambre est belle maintenant !", "¡Qué bonita está ahora tu habitación!", "Wie schön dein Zimmer jetzt ist!", "Com'è bella ora la tua camera!"),
            ],
            "q": L("أين وضع يوسف القمامة؟", "Where did Yusuf put the rubbish?", "Où Youssouf a-t-il mis les déchets ?", "¿Dónde puso Yusuf la basura?", "Wohin hat Yusuf den Müll getan?", "Dove ha messo la spazzatura Yusuf?"),
            "options": [
                L("في السلّة", "In the bin", "Dans la poubelle", "En la papelera", "In den Eimer", "Nel cestino"),
                L("تحت السرير", "Under the bed", "Sous le lit", "Debajo de la cama", "Unters Bett", "Sotto il letto"),
                L("في الطريق", "In the street", "Dans la rue", "En la calle", "Auf die Straße", "Per strada"),
            ],
        },
        "challenge": L("رتّب غرفتك اليوم وحدك، وضع كل شيء في مكانه.",
                       "Tidy your room by yourself today and put everything in its place.",
                       "Range ta chambre tout seul aujourd'hui et mets chaque chose à sa place.",
                       "Ordena hoy tu habitación tú solo y pon cada cosa en su sitio.",
                       "Räum heute allein dein Zimmer auf und leg alles an seinen Platz.",
                       "Metti in ordine la tua camera da solo oggi e metti ogni cosa al suo posto."),
    },
    "respect": {
        "story": {
            "lines": [
                S("teacher", "صَباحُ الخَيْرِ يا أَوْلادُ.", "ṣabāḥu l-khayri yā awlād.", "Good morning, children.", "Bonjour, les enfants.", "Buenos días, niños.", "Guten Morgen, Kinder.", "Buongiorno, bambini."),
                S("maryam", "صَباحُ النّورِ يا مُعَلِّمَتي.", "ṣabāḥu n-nūri yā muʿallimatī.", "Good morning, teacher.", "Bonjour, maîtresse.", "Buenos días, maestra.", "Guten Morgen, Frau Lehrerin.", "Buongiorno, maestra."),
                S("teacher", "مَنْ يُساعِدُ زَميلَهُ الصَّغيرَ؟", "man yusāʿidu zamīlahu ṣ-ṣaghīr?", "Who will help their younger classmate?", "Qui va aider son petit camarade ?", "¿Quién ayuda a su compañero pequeño?", "Wer hilft dem jüngeren Mitschüler?", "Chi aiuta il compagno più piccolo?"),
                S("maryam", "أَنا! أَحْتَرِمُ الكَبيرَ وَأَرْحَمُ الصَّغيرَ.", "anā! aḥtarimu l-kabīra wa arḥamu ṣ-ṣaghīr.", "Me! I respect the old and am kind to the young.", "Moi ! Je respecte les grands et je suis tendre avec les petits.", "¡Yo! Respeto a los mayores y soy tierna con los pequeños.", "Ich! Ich achte die Großen und bin lieb zu den Kleinen.", "Io! Rispetto i grandi e sono tenera con i piccoli."),
            ],
            "q": L("من أرادت مريم أن تساعد؟", "Who did Maryam want to help?", "Qui Maryam voulait-elle aider ?", "¿A quién quería ayudar Maryam?", "Wem wollte Maryam helfen?", "Chi voleva aiutare Maryam?"),
            "options": [
                L("زميلها الصغير", "A younger classmate", "Un petit camarade", "A un compañero pequeño", "Einem jüngeren Mitschüler", "Un compagno più piccolo"),
                L("المدير", "The headteacher", "Le directeur", "Al director", "Dem Schulleiter", "Il preside"),
                L("لا أحد", "Nobody", "Personne", "A nadie", "Niemandem", "Nessuno"),
            ],
        },
        "challenge": L("ساعد اليوم طفلًا أصغر منك، وقل «شُكْرًا» لمعلّمك أو لشخص كبير.",
                       "Help a younger child today and say “shukran” to your teacher or an older person.",
                       "Aide un enfant plus petit aujourd'hui et dis « shukran » à ton enseignant ou à une personne âgée.",
                       "Ayuda hoy a un niño más pequeño y di «shukran» a tu maestro o a una persona mayor.",
                       "Hilf heute einem jüngeren Kind und sag „shukran“ zu deinem Lehrer oder einem älteren Menschen.",
                       "Aiuta oggi un bambino più piccolo e di' «shukran» al tuo insegnante o a una persona anziana."),
    },
}
