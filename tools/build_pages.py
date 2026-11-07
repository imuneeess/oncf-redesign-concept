import sys, json, pathlib
out = pathlib.Path(sys.argv[1])

# ---------------- dictionary: key -> (en, fr, ar) ----------------
S = {
 # meta / chrome
 'meta.concept': ('redesign concept', 'concept de refonte', 'تصور لإعادة التصميم'),
 'ribbon': ('<b>Unofficial redesign concept</b> by Imuneeess · not affiliated with or endorsed by ONCF · simulated data',
            '<b>Concept de refonte non officiel</b> par Imuneeess · non affilié à l\'ONCF · données simulées',
            '<b>تصور غير رسمي لإعادة التصميم</b> من إعداد Imuneeess · غير تابع للمكتب الوطني للسكك الحديدية · بيانات محاكاة'),
 'nav.home': ('Home', 'Accueil', 'الرئيسية'),
 'nav.live': ('Live', 'En direct', 'مباشر'),
 'nav.boraq': ('Al Boraq', 'Al Boraq', 'البراق'),
 'nav.times': ('Timetable', 'Horaires', 'المواعيد'),
 'nav.book': ('Book', 'Réserver', 'احجز'),
 'nav.contact': ('Contact', 'Contact', 'اتصل بنا'),
 'cta.book': ('Book a ticket', 'Réserver', 'احجز تذكرة'),
 'live.badge': ('LIVE', 'EN DIRECT', 'مباشر'),
 'ticker.next': ('next', 'prochain', 'التالي'),
 'ticker.quiet': ('No trains running right now. First departures from 05:30.', 'Aucun train en circulation. Premiers départs dès 05:30.', 'لا توجد قطارات في السير حالياً. أولى الرحلات ابتداءً من 05:30.'),
 'live.runningType': ('{n} running now', '{n} en circulation', '{n} في السير الآن'),
 # train types & statuses
 'type.boraq': ('Al Boraq', 'Al Boraq', 'البراق'),
 'type.atlas': ('Al Atlas', 'Al Atlas', 'الأطلس'),
 'type.tnr': ('TNR', 'TNR', 'TNR'),
 'type.night': ('Night', 'Nuit', 'ليلي'),
 'st.scheduled': ('Scheduled', 'Prévu', 'مبرمج'),
 'st.boarding': ('Boarding', 'Embarquement', 'الصعود'),
 'st.departed': ('Departed', 'Parti', 'غادر'),
 'st.enroute': ('En route', 'En route', 'في الطريق'),
 'st.arriving': ('Arriving', 'À l\'approche', 'يقترب'),
 'st.arrived': ('Arrived', 'Arrivé', 'وصل'),
 'st.ontime': ('On time', 'À l\'heure', 'في الموعد'),
 'st.late': ('Delayed', 'Retardé', 'متأخر'),
 'st.in': ('In {m} min', 'Dans {m} min', 'بعد {m} د'),
 # home hero
 'home.next': ('Next departure', 'Prochain départ', 'الرحلة القادمة'),
 'home.cities': ('CASA VOYAGEURS|TANGER VILLE|RABAT AGDAL|KENITRA|MARRAKECH', 'CASA VOYAGEURS|TANGER VILLE|RABAT AGDAL|KÉNITRA|MARRAKECH', 'الدار البيضاء|طنجة|الرباط|القنيطرة|مراكش'),
 'home.h1': ('Morocco, at <span class="accent">high speed.</span>', 'Le Maroc, à <span class="accent">grande vitesse.</span>', 'المغرب <span class="accent">بسرعة فائقة.</span>'),
 'home.lead': ('Tangier to Casablanca in a little over two hours. Book in seconds, follow every train live, and travel the way the country moves now.',
               'Tanger–Casablanca en un peu plus de deux heures. Réservez en quelques secondes, suivez chaque train en direct et voyagez au rythme du pays.',
               'من طنجة إلى الدار البيضاء في ما يزيد قليلاً عن ساعتين. احجز في ثوانٍ، تابع كل قطار مباشرة، وسافر بإيقاع المغرب اليوم.'),
 'q.from': ('From', 'Départ', 'الانطلاق'),
 'q.to': ('To', 'Arrivée', 'الوصول'),
 'q.search': ('Search trains', 'Rechercher', 'ابحث عن قطار'),
 'home.running': ('trains running now', 'trains en circulation', 'قطار في السير الآن'),
 # home live section
 'live.tag': ('Live network', 'Réseau en direct', 'الشبكة مباشرة'),
 'live.h2': ('Every train, <span class="accent">right now.</span>', 'Chaque train, <span class="accent">en ce moment.</span>', 'كل القطارات، <span class="accent">الآن.</span>'),
 'live.p': ('A simulated live view of the network: trains move along their lines according to the timetable, with delays and speeds updating as they go.',
            'Une vue en direct simulée du réseau : les trains avancent sur leurs lignes selon l\'horaire, avec retards et vitesses mis à jour en continu.',
            'عرض مباشر محاكى للشبكة: تتحرك القطارات على خطوطها حسب جدول المواعيد، مع تحديث التأخيرات والسرعات باستمرار.'),
 'kpi.running': ('trains running', 'trains en circulation', 'قطار في السير'),
 'kpi.pct': ('on time', 'à l\'heure', 'في الموعد'),
 'kpi.late': ('delayed', 'en retard', 'متأخر'),
 'kpi.pax': ('passengers today', 'voyageurs aujourd\'hui', 'مسافر اليوم'),
 'live.casa': ('Next from Casa Voyageurs', 'Prochains départs · Casa Voyageurs', 'الرحلات القادمة · الدار البيضاء المسافرين'),
 'live.open': ('Open the live map', 'Ouvrir la carte en direct', 'افتح الخريطة المباشرة'),
 'live.sim': ('Simulated time', 'Heure simulée', 'الوقت المحاكى'),
 'live.legend': ('<i class="lg boraq"></i>Al Boraq <i class="lg atlas"></i>Al Atlas <i class="lg tnr"></i>TNR <i class="lg night"></i>Night <i class="lg late"></i>Delayed',
                 '<i class="lg boraq"></i>Al Boraq <i class="lg atlas"></i>Al Atlas <i class="lg tnr"></i>TNR <i class="lg night"></i>Nuit <i class="lg late"></i>Retard',
                 '<i class="lg boraq"></i>البراق <i class="lg atlas"></i>الأطلس <i class="lg tnr"></i>TNR <i class="lg night"></i>ليلي <i class="lg late"></i>متأخر'),
 # ride
 'ride.tag': ('Tangier → Casablanca', 'Tanger → Casablanca', 'طنجة ← الدار البيضاء'),
 'ride.h2': ('Scroll the <span class="accent">ride.</span>', 'Faites défiler <span class="accent">le trajet.</span>', 'مرّر <span class="accent">الرحلة.</span>'),
 'ride.p': ('Keep scrolling to travel the high-speed line. Time, speed and the next stop update as you go.',
            'Continuez à défiler pour parcourir la ligne à grande vitesse. Temps, vitesse et prochain arrêt se mettent à jour.',
            'واصل التمرير لتقطع خط السرعة الفائقة. يتحدث الوقت والسرعة والمحطة التالية أثناء التقدم.'),
 'ride.time': ('Elapsed', 'Temps écoulé', 'الوقت المنقضي'),
 'ride.speed': ('Speed · km/h', 'Vitesse · km/h', 'السرعة · كم/س'),
 'ride.next': ('Next stop', 'Prochain arrêt', 'المحطة التالية'),
 'ride.hs': ('High-speed section', 'Section grande vitesse', 'مقطع السرعة الفائقة'),
 'ride.cl': ('Conventional line', 'Ligne classique', 'الخط العادي'),
 'sample.dur': ('Approximate sample durations and speed profile. Verify against the official timetable.', 'Durées et profil de vitesse indicatifs. À vérifier sur les horaires officiels.', 'مدد وسرعات تقريبية للعرض فقط. يرجى التحقق من المواعيد الرسمية.'),
 # trains
 'trains.tag': ('Our trains', 'Nos trains', 'قطاراتنا'),
 'trains.h2': ('A train for <span class="accent">every journey.</span>', 'Un train pour <span class="accent">chaque voyage.</span>', 'قطار <span class="accent">لكل رحلة.</span>'),
 'tr.boraq': ('High-speed service between Tangier, Kenitra, Rabat and Casablanca, up to 320 km/h.', 'Service à grande vitesse entre Tanger, Kénitra, Rabat et Casablanca, jusqu\'à 320 km/h.', 'خدمة فائقة السرعة بين طنجة والقنيطرة والرباط والدار البيضاء، حتى 320 كم/س.'),
 'tr.atlas': ('Intercity trains linking Marrakech, Fes, Meknes and Oujda.', 'Trains intercités reliant Marrakech, Fès, Meknès et Oujda.', 'قطارات بين المدن تربط مراكش وفاس ومكناس ووجدة.'),
 'tr.tnr': ('Fast shuttles every 30 minutes along the Atlantic corridor.', 'Navettes rapides toutes les 30 minutes sur l\'axe atlantique.', 'قطارات مكوكية سريعة كل 30 دقيقة على المحور الأطلسي.'),
 'tr.night': ('Overnight couchettes between Marrakech and Tangier.', 'Couchettes de nuit entre Marrakech et Tanger.', 'عربات نوم ليلية بين مراكش وطنجة.'),
 # stats
 'stat.speed': ('km/h top speed', 'km/h en pointe', 'كم/س السرعة القصوى'),
 'stat.time': ('Tangier → Casa', 'Tanger → Casa', 'طنجة ← البيضاء'),
 'stat.stations': ('stations on the map', 'gares sur la carte', 'محطة على الخريطة'),
 'stat.online': ('online booking', 'réservation en ligne', 'حجز عبر الإنترنت'),
 # board cta
 'cta.tag': ('Live departures', 'Départs en direct', 'المغادرة مباشرة'),
 'cta.h2': ('Check the board <span class="accent">before you leave.</span>', 'Consultez le tableau <span class="accent">avant de partir.</span>', 'تفقد اللوحة <span class="accent">قبل أن تغادر.</span>'),
 'cta.p': ('Departures and arrivals for every station, with countdowns, platforms and delays, flipping like the board in the station hall.',
           'Départs et arrivées de chaque gare, avec comptes à rebours, voies et retards, qui défilent comme le tableau du hall.',
           'المغادرة والوصول لكل محطة، مع العد التنازلي والأرصفة والتأخيرات، تتقلب مثل لوحة قاعة المحطة.'),
 'cta.btn': ('See the timetable', 'Voir les horaires', 'عرض المواعيد'),
 # live page
 'livep.title': ('Live tracker', 'Suivi en direct', 'التتبع المباشر'),
 'livep.h1': ('Live <span class="accent">tracker.</span>', 'Suivi <span class="accent">en direct.</span>', 'التتبع <span class="accent">المباشر.</span>'),
 'livep.p': ('Click any train on the map or in the list to see where it is, its speed, delay and every stop.', 'Cliquez sur un train sur la carte ou dans la liste pour voir sa position, sa vitesse, son retard et ses arrêts.', 'انقر على أي قطار في الخريطة أو القائمة لمعرفة موقعه وسرعته وتأخره وكل محطاته.'),
 'livep.timelapse': ('Time-lapse', 'Accéléré', 'عرض مُسرَّع'),
 'livep.realtime': ('Real time', 'Temps réel', 'الوقت الحقيقي'),
 'livep.all': ('All', 'Tous', 'الكل'),
 'livep.onnet': ('trains on the network', 'trains sur le réseau', 'قطار على الشبكة'),
 'livep.pick': ('Select a train on the map to see its details.', 'Sélectionnez un train sur la carte pour voir ses détails.', 'اختر قطاراً على الخريطة لرؤية تفاصيله.'),
 'livep.none': ('No trains running at this time.', 'Aucun train en circulation à cette heure.', 'لا توجد قطارات في السير في هذا الوقت.'),
 'livep.status': ('Status', 'Statut', 'الحالة'),
 'livep.speed': ('Speed', 'Vitesse', 'السرعة'),
 'livep.next': ('Next stop', 'Prochain arrêt', 'المحطة التالية'),
 'livep.arrival': ('Arrival', 'Arrivée', 'الوصول'),
 'livep.delay': ('Delay', 'Retard', 'التأخير'),
 'livep.platform': ('Platform', 'Voie', 'الرصيف'),
 'livep.note': ('Simulated from a sample timetable on Casablanca time. Not real-time ONCF data.', 'Simulation à partir d\'un horaire fictif, heure de Casablanca. Pas de données ONCF en temps réel.', 'محاكاة انطلاقاً من جدول تجريبي بتوقيت الدار البيضاء. ليست بيانات حقيقية من المكتب.'),
 # boraq page
 'bq.title': ('Al Boraq', 'Al Boraq', 'البراق'),
 'bq.tag': ('High speed', 'Grande vitesse', 'السرعة الفائقة'),
 'bq.h1': ('Meet <span class="accent">Al Boraq.</span>', 'Découvrez <span class="accent">Al Boraq.</span>', 'تعرّف على <span class="accent">البراق.</span>'),
 'bq.hint': ('Drag to rotate · stylized model, not the real trainset', 'Faites glisser pour tourner · modèle stylisé, pas la vraie rame', 'اسحب للتدوير · نموذج مبسط وليس القطار الحقيقي'),
 'bq.s1': ('km/h top speed', 'km/h en pointe', 'كم/س السرعة القصوى'),
 'bq.s2': ('min Tangier → Casa', 'min Tanger → Casa', 'دقيقة طنجة ← البيضاء'),
 'bq.s3': ('seats per train', 'places par rame', 'مقعد في كل قطار'),
 'bq.s4': ('stations', 'gares', 'محطات'),
 'bq.sample': ('Sample figures for the concept. Replace with official ONCF data.', 'Chiffres indicatifs pour le concept. À remplacer par les données officielles.', 'أرقام تجريبية للتصور. تُستبدل بالبيانات الرسمية.'),
 'bq.live.tag': ('On the line now', 'Sur la ligne maintenant', 'على الخط الآن'),
 'bq.live.h2': ('Every Al Boraq, <span class="accent">live.</span>', 'Chaque Al Boraq, <span class="accent">en direct.</span>', 'كل قطارات البراق، <span class="accent">مباشرة.</span>'),
 'bq.cls.tag': ('On board', 'À bord', 'على متن القطار'),
 'bq.cls.h2': ('Choose your <span class="accent">class.</span>', 'Choisissez votre <span class="accent">classe.</span>', 'اختر <span class="accent">درجتك.</span>'),
 'bq.c2': ('2nd class', '2e classe', 'الدرجة الثانية'),
 'bq.c2t': ('Comfort', 'Confort', 'الراحة'),
 'bq.c2p': ('Everything you need for a smooth, fast trip.', 'Tout pour un trajet rapide et confortable.', 'كل ما تحتاجه لرحلة سريعة ومريحة.'),
 'bq.c2l': ('<li>Reclining seats with power outlets</li><li>Onboard Wi-Fi</li><li>Bar-buffet car</li>', '<li>Sièges inclinables avec prises</li><li>Wi-Fi à bord</li><li>Voiture bar-buffet</li>', '<li>مقاعد قابلة للإمالة مع مقابس كهربائية</li><li>شبكة واي فاي على متن القطار</li><li>عربة مقهى</li>'),
 'bq.c1': ('1st class', '1re classe', 'الدرجة الأولى'),
 'bq.c1t': ('Première', 'Première', 'الممتازة'),
 'bq.c1p': ('More space, more calm, a quieter car.', 'Plus d\'espace, plus de calme.', 'مساحة أكبر وهدوء أكثر.'),
 'bq.c1l': ('<li>Wider 2+1 seating</li><li>At-seat service</li><li>Priority boarding</li>', '<li>Sièges 2+1 plus larges</li><li>Service à la place</li><li>Embarquement prioritaire</li>', '<li>مقاعد أوسع بتوزيع 2+1</li><li>خدمة في المقعد</li><li>أولوية الصعود</li>'),
 # timetable
 'tt.title': ('Timetable', 'Horaires', 'المواعيد'),
 'tt.tag': ('Departures & arrivals', 'Départs & arrivées', 'المغادرة والوصول'),
 'tt.h1': ('Every train, <span class="accent">on the board.</span>', 'Chaque train, <span class="accent">au tableau.</span>', 'كل القطارات، <span class="accent">على اللوحة.</span>'),
 'tt.p': ('Pick a station: the board updates live with countdowns, boarding, departures and delays.', 'Choisissez une gare : le tableau se met à jour en direct avec comptes à rebours, embarquements, départs et retards.', 'اختر محطة: تتحدث اللوحة مباشرة بالعد التنازلي والصعود والمغادرة والتأخيرات.'),
 'tt.station': ('Station', 'Gare', 'المحطة'),
 'tt.dep': ('Departures', 'Départs', 'المغادرة'),
 'tt.arr': ('Arrivals', 'Arrivées', 'الوصول'),
 'board.dep': ('DEPARTURES', 'DÉPARTS', 'المغادرة'),
 'board.arr': ('ARRIVALS', 'ARRIVÉES', 'الوصول'),
 'board.count': ('{n} trains in the next hours', '{n} trains dans les prochaines heures', '{n} قطار في الساعات القادمة'),
 'b.time': ('Time', 'Heure', 'الساعة'),
 'b.train': ('Train', 'Train', 'القطار'),
 'b.dest': ('Destination', 'Destination', 'الوجهة'),
 'b.origin': ('From', 'Provenance', 'القادم من'),
 'b.via': ('Via', 'Via', 'عبر'),
 'b.no': ('No.', 'N°', 'رقم'),
 'b.pf': ('Pl.', 'Voie', 'رصيف'),
 'b.status': ('Status', 'Statut', 'الحالة'),
 'b.sample': ('Simulated live timetable for the concept. Not official ONCF data.', 'Horaire en direct simulé pour le concept. Pas de données officielles ONCF.', 'جدول مباشر محاكى للتصور. ليست بيانات رسمية.'),
 'al.tag': ('Service info', 'Info trafic', 'معلومات حركة السير'),
 'al.1t': ('Works between Settat and Benguerir', 'Travaux entre Settat et Benguerir', 'أشغال بين سطات وابن جرير'),
 'al.1p': ('Sample alert: some Al Atlas trains run up to 10 minutes late on this section.', 'Alerte fictive : certains trains Al Atlas circulent avec jusqu\'à 10 min de retard sur ce tronçon.', 'تنبيه تجريبي: بعض قطارات الأطلس تتأخر حتى 10 دقائق في هذا المقطع.'),
 'al.2t': ('Extra Al Boraq on Friday evenings', 'Al Boraq supplémentaires le vendredi soir', 'رحلات براق إضافية مساء الجمعة'),
 'al.2p': ('Sample alert: additional departures from Casa Voyageurs at 18:30 and 19:30.', 'Alerte fictive : départs supplémentaires de Casa Voyageurs à 18:30 et 19:30.', 'تنبيه تجريبي: رحلات إضافية من الدار البيضاء المسافرين على 18:30 و19:30.'),
 'al.3t': ('All other lines: normal service', 'Autres lignes : trafic normal', 'باقي الخطوط: حركة عادية'),
 'al.3p': ('No disruption reported on the rest of the network.', 'Aucune perturbation signalée sur le reste du réseau.', 'لا توجد اضطرابات على باقي الشبكة.'),
 # booking
 'bk.title': ('Book', 'Réserver', 'الحجز'),
 'bk.tag': ('Tickets', 'Billetterie', 'التذاكر'),
 'bk.h1': ('Your ticket, <span class="accent">printed.</span>', 'Votre billet, <span class="accent">imprimé.</span>', 'تذكرتك، <span class="accent">مطبوعة.</span>'),
 'bk.date': ('Date', 'Date', 'التاريخ'),
 'bk.pax': ('Passengers', 'Voyageurs', 'المسافرون'),
 'bk.card': ('Discount card', 'Carte de réduction', 'بطاقة التخفيض'),
 'bk.none.card': ('None', 'Aucune', 'بدون'),
 'bk.jeune': ('Youth card', 'Carte Jeune', 'بطاقة الشباب'),
 'bk.senior': ('Senior card', 'Carte Senior', 'بطاقة المسنين'),
 'bk.fid': ('Loyalty card', 'Carte Fidélité', 'بطاقة الوفاء'),
 'bk.class': ('Class', 'Classe', 'الدرجة'),
 'bk.c2': ('2nd class', '2e classe', 'الدرجة الثانية'),
 'bk.c1': ('1st class', '1re classe', 'الدرجة الأولى'),
 'bk.next': ('Next trains', 'Prochains trains', 'القطارات القادمة'),
 'bk.print': ('Print the ticket', 'Imprimer le billet', 'اطبع التذكرة'),
 'bk.demo': ('Demo only: no payment, no real booking. Fares and discount cards are illustrative.', 'Démo uniquement : aucun paiement ni réservation réelle. Tarifs et cartes indicatifs.', 'عرض توضيحي فقط: لا دفع ولا حجز حقيقي. الأسعار والبطاقات تقريبية.'),
 'bk.fare': ('Estimated fare', 'Tarif estimé', 'السعر التقديري'),
 'bk.press': ('Pick a train, then print', 'Choisissez un train puis imprimez', 'اختر قطاراً ثم اطبع'),
 'bk.printing': ('Printing…', 'Impression…', 'جارٍ الطباعة…'),
 'bk.ready': ('Ready ✓ (concept ticket)', 'Prêt ✓ (billet fictif)', 'جاهزة ✓ (تذكرة تجريبية)'),
 'bk.same': ('Choose two different stations.', 'Choisissez deux gares différentes.', 'اختر محطتين مختلفتين.'),
 'bk.none': ('No direct train found on this sample network. Try Tanger → Casa or Casa → Marrakech.', 'Aucun train direct sur ce réseau fictif. Essayez Tanger → Casa ou Casa → Marrakech.', 'لا يوجد قطار مباشر في هذه الشبكة التجريبية. جرّب طنجة ← البيضاء أو البيضاء ← مراكش.'),
 # contact
 'ct.title': ('Contact', 'Contact', 'اتصل بنا'),
 'ct.tag': ('Assistance', 'Assistance', 'المساعدة'),
 'ct.hello': ('HELLO|BONJOUR|MARHBA|AZUL', 'BONJOUR|MARHBA|AZUL|HELLO', 'مرحبا|أهلاً|أزول|سلام'),
 'ct.h1': ('How can we help?', 'Comment pouvons-nous aider ?', 'كيف يمكننا مساعدتك؟'),
 'ct.p': ('Questions about a booking, a refund or lost property? Write to us and we\'ll get back to you.', 'Une question sur une réservation, un remboursement ou un objet perdu ? Écrivez-nous.', 'سؤال حول حجز أو استرداد أو أغراض مفقودة؟ راسلنا وسنرد عليك.'),
 'ct.q1': ('Can I change my ticket?', 'Puis-je modifier mon billet ?', 'هل يمكنني تعديل تذكرتي؟'),
 'ct.a1': ('Sample answer: changes are possible until departure, depending on the fare.', 'Réponse fictive : modification possible jusqu\'au départ selon le tarif.', 'إجابة تجريبية: يمكن التعديل حتى موعد المغادرة حسب نوع التذكرة.'),
 'ct.q2': ('Are there discount cards?', 'Existe-t-il des cartes de réduction ?', 'هل توجد بطاقات تخفيض؟'),
 'ct.a2': ('Sample answer: youth, senior and loyalty cards offer reduced fares.', 'Réponse fictive : cartes Jeune, Senior et Fidélité à tarifs réduits.', 'إجابة تجريبية: بطاقات الشباب والمسنين والوفاء توفر أسعاراً مخفضة.'),
 'ct.name': ('Name', 'Nom', 'الاسم'),
 'ct.mail': ('Email', 'Email', 'البريد الإلكتروني'),
 'ct.topic': ('Topic', 'Sujet', 'الموضوع'),
 'ct.t1': ('Booking', 'Réservation', 'الحجز'),
 'ct.t2': ('Refund', 'Remboursement', 'الاسترداد'),
 'ct.t3': ('Lost property', 'Objets trouvés', 'الأغراض المفقودة'),
 'ct.t4': ('Other', 'Autre', 'أخرى'),
 'ct.msg': ('Message', 'Message', 'الرسالة'),
 'ct.send': ('Send', 'Envoyer', 'إرسال'),
 'ct.demo': ('Demo form: nothing is sent anywhere.', 'Formulaire de démo : rien n\'est envoyé.', 'نموذج تجريبي: لا يتم إرسال أي شيء.'),
 'ct.toast': ('Thank you! (Demo: your message stayed in your browser.)', 'Merci ! (Démo : votre message est resté dans votre navigateur.)', 'شكراً لك! (تجريبي: بقيت رسالتك في متصفحك.)'),
 # footer
 'ft.about': ('A concept for a faster, more cinematic ONCF website: high-speed travel, live trains and flip boards.', 'Un concept pour un site ONCF plus rapide et cinématographique : grande vitesse, trains en direct et tableaux à volets.', 'تصور لموقع أسرع وأكثر حيوية للمكتب: سفر فائق السرعة وقطارات مباشرة ولوحات متقلبة.'),
 'ft.travel': ('Travel', 'Voyager', 'السفر'),
 'ft.services': ('Services', 'Services', 'الخدمات'),
 'ft.cards': ('Discount cards', 'Cartes de réduction', 'بطاقات التخفيض'),
 'ft.help': ('Assistance', 'Assistance', 'المساعدة'),
 'ft.lost': ('Lost property', 'Objets trouvés', 'الأغراض المفقودة'),
 'ft.concept': ('Concept', 'Concept', 'التصور'),
 'ft.source': ('Source on GitHub', 'Code sur GitHub', 'الشيفرة على GitHub'),
 'ft.l': ('Unofficial redesign concept by Imuneeess, created as a proposal for ONCF.', 'Concept de refonte non officiel par Imuneeess, proposé à l\'ONCF.', 'تصور غير رسمي لإعادة التصميم من إعداد Imuneeess، مقترح على المكتب الوطني للسكك الحديدية.'),
 'ft.r': ('Not affiliated with or endorsed by ONCF. Timetables, fares, live positions and figures are simulated.', 'Non affilié à l\'ONCF. Horaires, tarifs, positions en direct et chiffres simulés.', 'غير تابع للمكتب. المواعيد والأسعار والمواقع المباشرة والأرقام محاكاة.'),
 'home.title': ('Home', 'Accueil', 'الرئيسية'),
}

def T(key, tag='span', attrs=''):
    return f'<{tag} data-i18n="{key}"{(" " + attrs) if attrs else ""}>{S[key][0]}</{tag}>'

dict_js = 'export const DICT = ' + json.dumps({k: {'en': v[0], 'fr': v[1], 'ar': v[2]} for k, v in S.items()}, ensure_ascii=False, indent=1) + ';\n'
(out / 'js' / 'i18n-data.js').write_text(dict_js)

def head(title_key, desc):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{S[title_key][0]} · ONCF (redesign concept)</title>
  <meta name="i18n-title" content="{title_key}" />
  <meta name="description" content="{desc}" />
  <meta name="robots" content="noindex, nofollow" />
  <meta name="theme-color" content="#07080b" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%23ff7a1a'/%3E%3Cpath d='M-10 45 110 15M-10 70 110 40' stroke='%23111' stroke-width='9'/%3E%3C/svg%3E" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/style.css" />
  <script type="importmap">
    {{ "imports": {{
      "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
    }} }}
  </script>
  <script>try{{var l=localStorage.getItem('oncf-lang');if(l==='ar'){{document.documentElement.lang='ar';document.documentElement.dir='rtl'}}else if(l)document.documentElement.lang=l}}catch(e){{}}</script>
</head>
<body>
  <div class="curtain" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
  <div class="progress" aria-hidden="true"></div>
  {T('ribbon', 'div', 'class="ribbon"')}

  <nav class="nav" aria-label="Main">
    <a href="index.html" class="logo"><i class="logo-mark"></i>ONCF</a>
    <ul class="nav-links">
      <li>{T('nav.home', 'a', 'href="index.html"')}</li>
      <li><a href="live.html" class="nav-live"><i class="pulse"></i><span data-i18n="nav.live">Live</span></a></li>
      <li>{T('nav.boraq', 'a', 'href="al-boraq.html"')}</li>
      <li>{T('nav.times', 'a', 'href="horaires.html"')}</li>
      <li>{T('nav.book', 'a', 'href="reserver.html"')}</li>
      <li>{T('nav.contact', 'a', 'href="contact.html"')}</li>
    </ul>
    <div class="nav-cta">
      <div class="lang" role="group" aria-label="Language"><button data-lang="en">EN</button><button data-lang="fr">FR</button><button data-lang="ar">ع</button></div>
      <a href="reserver.html" class="btn btn-primary"><span data-i18n="cta.book">Book a ticket</span> <span class="arrow">→</span></a>
      <button class="burger" aria-label="Menu"><span></span></button>
    </div>
  </nav>
"""

def foot(scene):
    return f"""
  <footer>
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="index.html" class="logo"><i class="logo-mark"></i>ONCF</a>
          {T('ft.about', 'p', 'style="margin-top:16px;max-width:360px"')}
        </div>
        <div>{T('ft.travel', 'h4')}<ul><li>{T('nav.book', 'a', 'href="reserver.html"')}</li><li>{T('nav.times', 'a', 'href="horaires.html"')}</li><li>{T('nav.live', 'a', 'href="live.html"')}</li><li>{T('nav.boraq', 'a', 'href="al-boraq.html"')}</li></ul></div>
        <div>{T('ft.services', 'h4')}<ul><li>{T('ft.cards', 'a', 'href="reserver.html"')}</li><li>{T('ft.help', 'a', 'href="contact.html"')}</li><li>{T('ft.lost', 'a', 'href="contact.html"')}</li></ul></div>
        <div>{T('ft.concept', 'h4')}<ul><li>{T('ft.source', 'a', 'href="https://github.com/imuneeess/oncf-redesign-concept"')}</li></ul></div>
      </div>
      <div class="footer-bottom">{T('ft.l')}{T('ft.r')}</div>
    </div>
  </footer>

  <script type="module" src="js/i18n.js"></script>
  <script src="js/main.js" defer></script>
  <script type="module" src="js/flap.js"></script>
  <script type="module" src="js/live-ui.js"></script>
  <script type="module" src="js/scenes/{scene}.js"></script>
</body>
</html>
"""

ST = ['TNG', 'KEN', 'RBA', 'RBV', 'CAV', 'MAR', 'FES', 'MEK', 'OUJ', 'ELJ']
NAMES = {'TNG': 'Tanger Ville', 'KEN': 'Kenitra', 'RBA': 'Rabat Agdal', 'RBV': 'Rabat Ville', 'CAV': 'Casa Voyageurs', 'MAR': 'Marrakech', 'FES': 'Fes', 'MEK': 'Meknes', 'OUJ': 'Oujda', 'ELJ': 'El Jadida'}
def opts(sel):
    return ''.join(f'<option value="{c}" data-station="{c}"{" selected" if c == sel else ""}>{NAMES[c]}</option>' for c in ST)

P = {}
P['index'] = ('home.title', 'High-speed rail across Morocco. Unofficial ONCF redesign concept.', 'home', f"""
  <header class="hero">
    <canvas id="hero-canvas" class="webgl" aria-hidden="true"></canvas>
    <div class="hero-shade"></div>
    <div class="hero-flash" aria-hidden="true"></div>
    <div class="container">
      <div class="hero-content">
        <span class="tag"><span data-i18n="home.next">Next departure</span> → <span class="flap flap-sm accent-text" data-flap-cycle-key="home.cities"></span></span>
        {T('home.h1', 'h1', 'class="split"')}
        {T('home.lead', 'p', 'class="lead reveal" style="--d:.6s"')}
        <form id="quick" class="quick reveal" style="--d:.8s">
          <select name="from" data-i18n-aria="q.from">{opts('TNG')}</select>
          <select name="to" data-i18n-aria="q.to">{opts('CAV')}</select>
          <button class="btn btn-primary" type="submit"><span data-i18n="q.search">Search trains</span> <span class="arrow">→</span></button>
        </form>
        <div class="hero-live reveal" style="--d:1s"><i class="pulse"></i><b data-kpi="running">0</b> {T('home.running')} · <b data-kpi="pct">0</b> {T('kpi.pct')}</div>
      </div>
    </div>
    <div class="speedo" aria-hidden="true"><b><span id="speed">0</span></b><small>KM/H</small></div>
  </header>

  <section class="live-sec">
    <div class="container">
      <div class="section-head reveal">
        <span class="tag"><i class="pulse"></i> <span data-i18n="live.tag">Live network</span></span>
        {T('live.h2', 'h2')}
        {T('live.p', 'p')}
      </div>
      <div class="live-grid">
        <div class="map-card reveal">
          <canvas id="net-canvas" aria-label="Live network map"></canvas>
          <div class="map-bar">
            <span class="sim"><small data-i18n="live.sim">Simulated time</small><b id="sim-clock">--:--</b></span>
            <div class="speeds"><button data-speed="1">×1</button><button data-speed="20">×20</button><button data-speed="60" class="active">×60</button><button data-speed="180">×180</button></div>
          </div>
          {T('live.legend', 'div', 'class="legend"')}
        </div>
        <div class="live-side">
          <div class="kpis">
            <div class="kpi reveal"><b data-kpi="running">0</b>{T('kpi.running', 'small')}</div>
            <div class="kpi reveal" style="--d:.08s"><b data-kpi="pct" class="ok">0%</b>{T('kpi.pct', 'small')}</div>
            <div class="kpi reveal" style="--d:.16s"><b data-kpi="late" class="late">0</b>{T('kpi.late', 'small')}</div>
            <div class="kpi reveal" style="--d:.24s"><b data-kpi="pax">0</b>{T('kpi.pax', 'small')}</div>
          </div>
          <div class="card mini reveal" style="--d:.2s">
            <div class="mini-head">{T('live.casa', 'span', 'class="tag" style="margin:0"')}<span class="flap flap-sm" data-clock></span></div>
            <div id="mini-board">
              <div class="mrow"><span></span><span></span><span></span></div>
              <div class="mrow"><span></span><span></span><span></span></div>
              <div class="mrow"><span></span><span></span><span></span></div>
              <div class="mrow"><span></span><span></span><span></span></div>
              <div class="mrow"><span></span><span></span><span></span></div>
            </div>
          </div>
          <a href="live.html" class="btn btn-ghost reveal"><span data-i18n="live.open">Open the live map</span> <span class="arrow">→</span></a>
        </div>
      </div>
    </div>
  </section>

  <section class="ride" aria-label="Scroll ride">
    <div class="ride-sticky">
      <div class="ride-lines" aria-hidden="true"></div>
      <div class="container">
        <div class="section-head" style="margin-bottom:40px">
          <span class="tag" data-i18n="ride.tag">Tangier → Casablanca</span>
          {T('ride.h2', 'h2')}
          {T('ride.p', 'p')}
        </div>
        <div class="ride-hud">
          <div><small data-i18n="ride.time">Elapsed</small><b id="ride-time">0:00</b></div>
          <div><small data-i18n="ride.speed">Speed · km/h</small><b id="ride-speed" class="accent">0</b></div>
          <div><small data-i18n="ride.next">Next stop</small><b id="ride-next">—</b></div>
        </div>
        <div class="ride-track">
          <div class="ride-hs" style="width:56%"><small data-i18n="ride.hs">High-speed section</small></div>
          <div class="ride-cl" style="width:44%"><small data-i18n="ride.cl">Conventional line</small></div>
          <div class="ride-stop" style="--x:0%"><i></i><span data-station="TNG">Tanger Ville</span></div>
          <div class="ride-stop" style="--x:56%"><i></i><span data-station="KEN">Kenitra</span></div>
          <div class="ride-stop" style="--x:69%"><i></i><span data-station="RBA">Rabat Agdal</span></div>
          <div class="ride-stop" style="--x:100%"><i></i><span data-station="CAV">Casa Voyageurs</span></div>
          <div class="ride-train"><span></span></div>
        </div>
        <canvas id="ride-graph" aria-hidden="true"></canvas>
        {T('sample.dur', 'p', 'class="sample"')}
      </div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="section-head reveal">{T('trains.tag', 'span', 'class="tag"')}{T('trains.h2', 'h2')}</div>
      <div class="grid grid-4">
        <article class="card train-card reveal"><span class="num-label">01</span><h3 data-i18n="type.boraq">Al Boraq</h3>{T('tr.boraq', 'p')}<span class="live-count" data-live-type="boraq"></span></article>
        <article class="card train-card reveal" style="--d:.1s"><span class="num-label">02</span><h3 data-i18n="type.atlas">Al Atlas</h3>{T('tr.atlas', 'p')}<span class="live-count" data-live-type="atlas"></span></article>
        <article class="card train-card reveal" style="--d:.2s"><span class="num-label">03</span><h3 data-i18n="type.tnr">TNR</h3>{T('tr.tnr', 'p')}<span class="live-count" data-live-type="tnr"></span></article>
        <article class="card train-card reveal" style="--d:.3s"><span class="num-label">04</span><h3 data-i18n="type.night">Night</h3>{T('tr.night', 'p')}<span class="live-count" data-live-type="night"></span></article>
      </div>
    </div>
  </section>

  <div class="board-strip">
    <div class="container grid grid-4">
      <div class="stat reveal"><span class="flap flap-lg accent-text" data-flap="320"></span>{T('stat.speed', 'small')}</div>
      <div class="stat reveal" style="--d:.1s"><span class="flap flap-lg" data-flap="2H10"></span>{T('stat.time', 'small')}</div>
      <div class="stat reveal" style="--d:.2s"><span class="flap flap-lg" data-flap="15"></span>{T('stat.stations', 'small')}</div>
      <div class="stat reveal" style="--d:.3s"><span class="flap flap-lg" data-flap="24/7"></span>{T('stat.online', 'small')}</div>
    </div>
  </div>

  <section>
    <div class="container">
      <div class="cta reveal">
        <div>
          {T('cta.tag', 'span', 'class="tag"')}
          {T('cta.h2', 'h2')}
          {T('cta.p', 'p', 'class="lead"')}
          <div class="hero-actions"><a href="horaires.html" class="btn btn-primary"><span data-i18n="cta.btn">See the timetable</span> <span class="arrow">→</span></a></div>
        </div>
        <div class="cta-board">
          <span class="flap flap-lg accent-text" data-flap-key="board.dep"></span>
          <span class="flap flap-lg" data-flap="06:00 TANGER"></span>
          <span class="flap flap-lg" data-flap="07:00 CASA  "></span>
          <span class="flap flap-lg" data-flap="08:00 FES   "></span>
        </div>
      </div>
    </div>
  </section>
""")

P['live'] = ('livep.title', 'Live train tracker. Unofficial ONCF redesign concept.', 'livepage', f"""
  <main class="container live-page">
    <div class="live-top">
      <div>
        <span class="tag"><i class="pulse"></i> <span data-i18n="live.badge">LIVE</span></span>
        {T('livep.h1', 'h1', 'class="split" style="font-size:clamp(2.4rem,5vw,4.2rem);margin:6px 0 10px"')}
        {T('livep.p', 'p', 'class="lead"')}
      </div>
      <div class="live-ctrl card">
        <span class="sim"><small id="mode-label" data-i18n="livep.timelapse">Time-lapse</small><b id="sim-clock">--:--</b></span>
        <div class="speeds"><button data-speed="1">×1</button><button data-speed="10">×10</button><button data-speed="30" class="active">×30</button><button data-speed="120">×120</button></div>
      </div>
    </div>
    <div class="live-layout">
      <div class="map-card big">
        <canvas id="net-canvas" aria-label="Live network map"></canvas>
        {T('live.legend', 'div', 'class="legend"')}
        <div class="map-kpis"><span><b data-kpi="running">0</b> <small data-i18n="kpi.running">trains running</small></span><span><b data-kpi="pct" class="ok">0%</b> <small data-i18n="kpi.pct">on time</small></span><span><b data-kpi="late" class="late">0</b> <small data-i18n="kpi.late">delayed</small></span></div>
      </div>
      <aside class="live-panel">
        <div class="card">
          <div class="filters"><button class="active" data-filter="all" data-i18n="livep.all">All</button><button data-filter="boraq" data-i18n="type.boraq">Al Boraq</button><button data-filter="atlas" data-i18n="type.atlas">Al Atlas</button><button data-filter="tnr" data-i18n="type.tnr">TNR</button><button data-filter="night" data-i18n="type.night">Night</button></div>
          <div id="train-detail" class="detail"></div>
        </div>
        <div class="card list-card">
          <div class="list-head"><b id="list-count">0</b> <span data-i18n="livep.onnet">trains on the network</span></div>
          <div id="train-list" class="train-list"></div>
        </div>
      </aside>
    </div>
    {T('livep.note', 'p', 'class="sample"')}
  </main>
""")

P['al-boraq'] = ('bq.title', 'Explore the high-speed train in 3D. Unofficial ONCF redesign concept.', 'boraq', f"""
  <main style="padding-top:140px">
    <div class="container">
      {T('bq.tag', 'span', 'class="tag"')}
      {T('bq.h1', 'h1', 'class="split" style="font-size:clamp(2.8rem,6.5vw,5.6rem);margin-bottom:0"')}
    </div>
    <div class="showroom reveal">
      <canvas id="show-canvas" aria-label="3D high-speed train. Drag to rotate."></canvas>
      {T('bq.hint', 'span', 'class="stage-hint"')}
    </div>
  </main>

  <div class="board-strip">
    <div class="container grid grid-4">
      <div class="spec reveal"><b data-to="320">0</b>{T('bq.s1')}</div>
      <div class="spec reveal" style="--d:.1s"><b data-to="130">0</b>{T('bq.s2')}</div>
      <div class="spec reveal" style="--d:.2s"><b data-to="533">0</b>{T('bq.s3')}</div>
      <div class="spec reveal" style="--d:.3s"><b data-to="4">0</b>{T('bq.s4')}</div>
    </div>
    <div class="container">{T('bq.sample', 'p', 'class="sample"')}</div>
  </div>

  <section>
    <div class="container">
      <div class="section-head reveal"><span class="tag"><i class="pulse"></i> <span data-i18n="bq.live.tag">On the line now</span></span>{T('bq.live.h2', 'h2')}</div>
      <div id="boraq-live" class="grid grid-2"></div>
    </div>
  </section>

  <section class="classes">
    <div class="container">
      <div class="section-head reveal">{T('bq.cls.tag', 'span', 'class="tag"')}{T('bq.cls.h2', 'h2')}</div>
      <div class="grid grid-2">
        <article class="card reveal">{T('bq.c2', 'span', 'class="num-label"')}{T('bq.c2t', 'h3')}{T('bq.c2p', 'p')}{T('bq.c2l', 'ul')}</article>
        <article class="card reveal" style="--d:.1s;border-color:rgba(255,122,26,.4)">{T('bq.c1', 'span', 'class="num-label"')}{T('bq.c1t', 'h3')}{T('bq.c1p', 'p')}{T('bq.c1l', 'ul')}</article>
      </div>
      <div class="hero-actions"><a href="reserver.html" class="btn btn-primary"><span data-i18n="cta.book">Book a ticket</span> <span class="arrow">→</span></a></div>
    </div>
  </section>
""")

ALL_ST = ['TNG','KEN','RBV','RBA','MOH','CAV','ELJ','SET','BEN','MAR','SKA','MEK','FES','TAZ','OUJ']
P['horaires'] = ('tt.title', 'Live departure and arrival boards. Unofficial ONCF redesign concept.', 'horaires', f"""
  <header class="hero page-hero">
    <canvas id="hero-canvas" class="webgl" aria-hidden="true"></canvas>
    <div class="hero-shade"></div>
    <div class="container">
      <div class="hero-content">
        {T('tt.tag', 'span', 'class="tag"')}
        {T('tt.h1', 'h1', 'class="split"')}
        {T('tt.p', 'p', 'class="lead reveal" style="--d:.6s"')}
      </div>
    </div>
  </header>

  <section style="padding-top:20px">
    <div class="container">
      <div class="board-controls reveal">
        <label class="field" style="margin:0;min-width:240px"><span data-i18n="tt.station" class="lbl">Station</span><select id="station"></select></label>
        <div class="seg seg-inline"><button type="button" class="active" data-mode="dep" data-i18n="tt.dep">Departures</button><button type="button" data-mode="arr" data-i18n="tt.arr">Arrivals</button></div>
      </div>
      <div class="board reveal" id="board">
        <div class="board-head">
          <div><span id="board-title" class="flap flap-lg accent-text"></span> <span id="count" class="count"></span></div>
          <span class="flap flap-lg" data-clock aria-label="Time"></span>
        </div>
        <table>
          <thead><tr>{T('b.time', 'th')}{T('b.train', 'th')}<th id="col-other">Destination</th>{T('b.via', 'th')}{T('b.no', 'th')}{T('b.pf', 'th')}{T('b.status', 'th')}</tr></thead>
          <tbody></tbody>
        </table>
      </div>
      {T('b.sample', 'p', 'class="sample"')}

      <div class="section-head reveal" style="margin:80px 0 30px">{T('al.tag', 'span', 'class="tag"')}</div>
      <div class="grid grid-3 alerts">
        <article class="card alert warn reveal"><span class="alert-ico">!</span>{T('al.1t', 'h3')}{T('al.1p', 'p')}</article>
        <article class="card alert info reveal" style="--d:.1s"><span class="alert-ico">+</span>{T('al.2t', 'h3')}{T('al.2p', 'p')}</article>
        <article class="card alert ok reveal" style="--d:.2s"><span class="alert-ico">✓</span>{T('al.3t', 'h3')}{T('al.3p', 'p')}</article>
      </div>
    </div>
  </section>
""")

P['reserver'] = ('bk.title', 'Book a train ticket and watch it print in 3D. Unofficial ONCF concept.', 'reserver', f"""
  <main class="container" style="padding:150px 0 40px">
    {T('bk.tag', 'span', 'class="tag"')}
    {T('bk.h1', 'h1', 'class="split" style="font-size:clamp(2.6rem,6vw,5rem)"')}
    <div class="booking">
      <form id="booking" class="card reveal">
        <div class="field"><label for="b-from" data-i18n="q.from">From</label><select id="b-from"></select></div>
        <button type="button" class="swap-btn" id="swap" aria-label="Swap">⇅</button>
        <div class="field"><label for="b-to" data-i18n="q.to">To</label><select id="b-to"></select></div>
        <div class="row3">
          <div class="field"><label for="b-date" data-i18n="bk.date">Date</label><input id="b-date" type="date" /></div>
          <div class="field"><label for="b-pax" data-i18n="bk.pax">Passengers</label><select id="b-pax"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
          <div class="field"><label for="b-card" data-i18n="bk.card">Discount card</label><select id="b-card"><option value="none" data-i18n="bk.none.card">None</option><option value="jeune" data-i18n="bk.jeune">Youth card</option><option value="senior" data-i18n="bk.senior">Senior card</option><option value="fidelite" data-i18n="bk.fid">Loyalty card</option></select></div>
        </div>
        <div class="field"><label data-i18n="bk.class">Class</label><div class="seg"><button type="button" data-cls="2" class="active" data-i18n="bk.c2">2nd class</button><button type="button" data-cls="1" data-i18n="bk.c1">1st class</button></div></div>
        <div class="field"><label data-i18n="bk.next">Next trains</label><div id="results" class="results"></div></div>
        <button class="btn btn-primary" type="submit" style="width:100%;justify-content:center;margin-top:6px"><span data-i18n="bk.print">Print the ticket</span> <span class="arrow">→</span></button>
        {T('bk.demo', 'p', 'class="note"')}
      </form>
      <div class="ticket-stage reveal" style="--d:.15s">
        <canvas id="ticket-canvas" aria-label="3D ticket printing"></canvas>
        <div class="ticket-sum">
          <div>{T('bk.fare', 'small')}<b id="q-price">—</b><small id="q-meta"></small></div>
          <small id="print-status" data-i18n="bk.press">Pick a train, then print</small>
        </div>
      </div>
    </div>
  </main>
""")

P['contact'] = ('ct.title', 'Contact and assistance. Unofficial ONCF redesign concept.', 'contact', f"""
  <canvas id="bg-canvas" class="webgl" aria-hidden="true" style="position:fixed;inset:0;width:100%;height:100%;z-index:0;opacity:.55"></canvas>
  <main class="container contact-wrap">
    <div>
      {T('ct.tag', 'span', 'class="tag"')}
      <h1 style="font-size:clamp(2.4rem,5vw,4.2rem)"><span class="flap flap-xl accent-text" data-flap-cycle-key="ct.hello"></span><br /><span data-i18n="ct.h1">How can we help?</span></h1>
      {T('ct.p', 'p', 'class="lead"')}
      <div class="grid" style="margin-top:28px">
        <div class="card"><span class="num-label">FAQ</span>{T('ct.q1', 'h3')}{T('ct.a1', 'p')}</div>
        <div class="card"><span class="num-label">FAQ</span>{T('ct.q2', 'h3')}{T('ct.a2', 'p')}</div>
      </div>
    </div>
    <form id="contact-form" class="form reveal" style="--d:.2s">
      <div class="row2">
        <div class="field"><label for="c-name" data-i18n="ct.name">Name</label><input id="c-name" required /></div>
        <div class="field"><label for="c-mail" data-i18n="ct.mail">Email</label><input id="c-mail" type="email" required /></div>
      </div>
      <div class="field"><label for="c-topic" data-i18n="ct.topic">Topic</label><select id="c-topic"><option data-i18n="ct.t1">Booking</option><option data-i18n="ct.t2">Refund</option><option data-i18n="ct.t3">Lost property</option><option data-i18n="ct.t4">Other</option></select></div>
      <div class="field"><label for="c-msg" data-i18n="ct.msg">Message</label><textarea id="c-msg" required></textarea></div>
      <button class="btn btn-primary" type="submit" style="width:100%;justify-content:center"><span data-i18n="ct.send">Send</span> <span class="arrow">→</span></button>
      {T('ct.demo', 'p', 'class="note"')}
    </form>
  </main>
  {T('ct.toast', 'div', 'class="toast" role="status"')}
""")

for name, (tkey, desc, scene, body) in P.items():
    (out / f'{name}.html').write_text(head(tkey, desc) + body + foot(scene))
    print('wrote', name)
print('keys', len(S))
