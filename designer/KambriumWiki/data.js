// Kambrium Wiki Data
const KambriumWikiData = {
  overview: {
    title: "Das Kambrium",
    subtitle: "Das goldene Zeitalter der ersten komplexen Lebensformen",
    period: "Vor 541 bis 485,4 Millionen Jahren",
    duration: "ca. 55,6 Millionen Jahre",
    era: "Paläozoikum (Erdaltertum)",
    eon: "Phanerozoikum (Äon der belebten Natur)",
    introduction: "Das Kambrium ist das erste und damit älteste Zeitalter des Erdaltertums Paläozoikum. Es ist auch die erste Periode des Phanerozoikums. Das Kambrium begann vor 541 Millionen Jahren mit der Kambrischen Radiation (auch bekannt als Kambrische Explosion) und endete vor 485,4 Millionen Jahren mit dem Cambro-Ordovizischen Massenaussterben.",
    markers: {
      start: {
        event: "Beginn des Kambriums",
        marker: "Erstes Auftreten des Spurenfossils Trichtophycus pedum (eine Fraßspur im Sediment, die auf einen wirbellosen Sedimentfresser hinweist).",
        age: "541 Mio. Jahre"
      },
      end: {
        event: "Ende des Kambriums",
        marker: "Erstes Auftreten des Conodonten Iapetognathus fluctivagus (ein wurmartiges Wirbeltier ohne Rückgrat, dessen Kieferapparat als Fossil erhalten bleibt).",
        age: "485,4 Mio. Jahre"
      }
    },
    keyEvents: [
      { name: "Cadomische Orogenese", description: "Gebirgsbildungsphase, die durch vulkanische Aktivitäten an den Küsten Baltikas und Gondwanas gekennzeichnet war. Vulkanismus stieß enorme Mengen CO2 aus, was zur globalen Erwärmung beitrug." },
      { name: "Kambrische Explosion", description: "Rapideste Artbildung in der Erdgeschichte. Nahezu alle heutigen Tierstämme entstanden in einem erdgeschichtlich kurzen Zeitraum von wenigen Millionen Jahren im warmen Flachwasser." },
      { name: "Agronomische Revolution", description: "Die Eroberung des Bodens (Endobenthos). Erstmals gruben Organismen Wohnhöhlen und Gänge bis zu 20 cm tief in das Sediment, was das Terraforming durch Lebewesen einleitete." },
      { name: "End-botomisches Massenaussterben", description: "Ein frühes Aussterbeereignis vor ca. 517 Mio. Jahren mit einer geschätzten Extinktionsrate von mindestens 50% aller Arten." },
      { name: "Dresbachisches Massenaussterben", description: "Ein weiteres Aussterbeereignis vor ca. 502 Mio. Jahren mit einer geschätzten Extinktionsrate von unter 40% aller Arten." },
      { name: "Kambro-Ordovizisches Massenaussterben", description: "Das schwerste der drei Aussterbeereignisse vor ca. 485,4 Mio. Jahren, bei dem ca. 63% aller Arten verschwanden." }
    ],
    leitfossilien: [
      { name: "Paradoxides pinus", type: "Trilobit (Gliederfüßer)", description: "Ein weit verbreiteter dreiteiliger Bodenbewohner, der zur genauen zeitlichen Einordnung von Gesteinsschichten dient." },
      { name: "Billingsella corrugata", type: "Brachiopode (Armfüßer)", description: "Ein früher Armfüßer, der äußerlich einer Muschel ähnelt, aber einen eigenständigen Stamm bildet." }
    ],
    namensherkunft: {
      title: "Namensherkunft",
      text: "Der Begriff Kambrium wurde ursprünglich von Adam Sedgwick geprägt, einem Naturwissenschaftler des frühen 19. Jahrhunderts, der damit Gesteinsschichten im Norden von Wales bezeichnete. Das Wort leitet sich vom ursprünglichen lateinischen Namen der Region, Cambria, ab."
    },
    subdivisions: {
      title: "Unterteilung des Kambriums",
      text: "Das Kambrium wird in vier Serien und zehn Stufen unterteilt. Es beginnt mit dem Terreneuvium, setzt sich mit der noch unbenannten 2. Serie fort, geht dann ins Miaolingium über und endet mit dem Furongium.",
      series: [
        { name: "Terreneuvium", stages: ["Fortunium", "2. Stufe"] },
        { name: "2. Serie (unbenannt)", stages: ["3. Stufe", "4. Stufe"] },
        { name: "Miaolingium", stages: ["Wuliuum", "Drumium", "Guzhangium"] },
        { name: "Furongium", stages: ["Paibium", "Jiangshanium", "10. Stufe"] }
      ]
    },
    klima: {
      title: "Klima und Atmosphäre",
      text: "Während des Kambriums fand eine sanfte Klimaerwärmung statt, vermutlich bedingt durch den Vulkanismus der cadomischen Orogenese. Die Vulkane stießen große Mengen CO2 aus, was als Treibhausgas in der Atmosphäre zur Erwärmung beitrug. Dadurch stieg der Meeresspiegel vor allem im Unterkambrium stark an und überflutete die Kontinentalschelfe. Von diesen Meerestransgressionen profitierte die damals rein marine Fauna, die eine rapide Radiation erlebte.",
      stats: [
        { label: "CO2-Gehalt", value: "ca. 4200 bis 4800 ppm", sub: "Etwa das 12-Fache des heutigen Wertes" },
        { label: "Sauerstoffgehalt", value: "unter 13%", sub: "Trotz Anstiegs durch Phytoplankton niedrig" },
        { label: "Welttemperatur", value: "Durchschnittlich 21°C", sub: "Heißer als heute (~14°C), da alle Landmassen am Äquator lagen" }
      ]
    }
  },

  massExtinctions: {
    title: "Massenaussterben im Kambrium",
    intro: "Das Kambrium war trotz seiner biologischen Vielfalt von Krisen geprägt. Insgesamt drei große Aussterbewellen vernichteten einen großen Teil des marinen Lebens. Während die Ursachen der ersten beiden Ereignisse im Dunkeln liegen, existieren für das verheerende Kambro-Ordovizische Massenaussterben drei wissenschaftliche Hypothesen.",
    events: [
      {
        name: "End-botomisches Massenaussterben",
        age: "Vor ca. 517 Millionen Jahren",
        rate: "Mindestens 50% aller Arten",
        description: "Über dieses Ereignis ist sehr wenig bekannt. Das Ausmaß basiert auf Schätzungen und Hochrechnungen aus einzelnen Taxa. Die genauen physikalischen Ursachen sind unklar."
      },
      {
        name: "Dresbachisches Massenaussterben",
        age: "Vor ca. 502 Millionen Jahren",
        rate: "Unter 40% aller Arten",
        description: "Auch dieses Ereignis ist wissenschaftlich noch wenig erforscht. Die Faktenlage reicht nicht aus, um definitive Aussagen über die Ursachen zu treffen."
      },
      {
        name: "Kambro-Ordovizisches Massenaussterben (Cm-O-Krise)",
        age: "Vor ca. 485,4 Millionen Jahren",
        rate: "Ca. 63% aller Arten",
        description: "Das verheerendste Ereignis des Kambriums. Es markiert das Ende der Epoche. Zur Erklärung existieren drei führende Hypothesen, die sich auch ergänzen könnten:",
        hypotheses: [
          {
            title: "Rapide globale Abkühlung & Meeresspiegelabfall",
            detail: "Eine schnelle Abkühlung zur Grenze des Ordoviziums könnte planktonische Mikroorganismen und Wasserpflanzen abgetötet haben, die das Fundament der Nahrungskette bildeten. Trophische Kaskaden (Verhungern höherer Stufen) und der Rückgang des Meeresraums führten zur weitreichenden Extinktion."
          },
          {
            title: "Entstehung anoxischer Zonen im Meer",
            detail: "Sauerstoffarme Meeresbereiche entstanden durch hohe Kohlensäure- oder Schwefelwasserstoffkonzentrationen. Da alle Kontinente in den Tropen lagen, führten starke Regenfälle zu erhöhter Erosion und Verwitterung, wodurch den Ozeanen Sauerstoff entzogen wurde. Dies machte weite Areale für Wassertiere unbewohnbar."
          },
          {
            title: "Magmatismus der Kalkarindji-Großprovinz",
            detail: "Das Aussterben korreliert zeitlich mit gewaltigen vulkanischen Eruptionen im heutigen Westaustralien (damals Nordgondwana). Diese stießen riesige Mengen Feinstaub und Giftstoffe aus. Der resultierende vulkanische Winter hungerte photosynthetisch aktive Organismen aus. Der anschließende saure Regen führte in Ozeanen zu anoxischen Verhältnissen."
          }
        ]
      }
    ]
  },

  flora: {
    title: "Flora des Kambriums",
    intro: "Während des Kambriums war das Leben ausschließlich im Wasser konzentriert. Eine Landflora existierte noch nicht. Die pflanzliche Welt bestand vor allem aus einzelligen photosynthetischen Organismen (Phytoplankton) und frühen mehrzelligen Meeresalgen und Wasserpflanzen. Sie bildeten die Grundlage für den atmosphärischen Sauerstoffanstieg und die marine Nahrungskette.",
    species: [
      {
        name: "Phytoplankton",
        scientific: "Mikrophytoplankton / Acritarchen",
        category: "Einzellige Algen & Cyanobakterien",
        description: "Mikroskopisch kleine, im Wasser schwebende photosynthetisch aktive Organismen. Sie waren die wichtigsten Primärproduzenten des Kambriums. Durch ihre intensive Photosynthese stieg der Sauerstoffgehalt der Erdatmosphäre leicht an (blieb jedoch unter 13%). Sie bildeten das Fundament der gesamten marinen Nahrungskette. Ihr Massensterben am Ende des Kambriums löste eine verheerende trophische Kaskade aus.",
        lifestyle: "Planktonisch (schwebend)",
        status: "Existiert in veränderten Formen weiter",
        keywords: ["Sauerstoff", "Photosynthese", "Nahrungskette", "Mikroskopisch", "Plankton"]
      },
      {
        name: "Wasserpflanzen & Makroalgen",
        scientific: "Chlorophyta / Rhodophyta / Phaeophyceae",
        category: "Mehrzellige Algen",
        description: "Frühe mehrzellige Meerespflanzen und Algen (Grün-, Rot- und Braunalgen), die vor allem die neu entstandenen warmen Flachwasserzonen der Kontinentalschelfe besiedelten. Sie dienten vielen Weidetieren als Nahrung und schufen geschützte Lebensräume. Sie waren von der Abkühlung und dem Meeresspiegelrückgang am Ende des Kambriums stark betroffen.",
        lifestyle: "Benthisch (am Meeresboden haftend/wachsend)",
        status: "Vorfahren moderner Algen",
        keywords: ["Mehrzeller", "Algen", "Grünalgen", "Flachwasser", "Makrophyten"]
      },
      {
        name: "Stromatolithen-Bildner",
        scientific: "Cyanobakterien-Kolonien",
        category: "Bakterielle Primärproduzenten",
        description: "Obwohl es sich um Bakterien handelt, spielten sie die ökologische Rolle von Pflanzen. Sie bildeten durch das Einfangen von Sedimentpartikeln charakteristische, geschichtete Kalkstrukturen. Während sie im Präkambrium die Ozeane dominierten, wurden sie im Kambrium durch das Aufkommen aktiver Weidetiere (wie frühe Schnecken und Würmer) stark zurückgedrängt und in extreme Nischen gezwungen.",
        lifestyle: "Benthisch (sessil)",
        status: "Heute nur noch in extremen Lebensräumen (z.B. Shark Bay)",
        keywords: ["Stromatolith", "Cyanobakterien", "Kalkmatten", "Uralt", "Sessil"]
      }
    ]
  },

  fauna: {
    title: "Fauna des Kambriums",
    intro: "Mit der Kambrischen Explosion traten plötzlich die Vorfahren fast aller modernen Tierstämme auf den Plan. Gekennzeichnet durch das Aufkommen von Hartteilen (Chitinpanzer, Kalkschalen) und die Entstehung von aktiven Jägern, erlebte die Tierwelt eine beispiellose Radiation. Hier sind die wichtigsten Arten aufgelistet, die in den damaligen Meeren herrschten.",
    categories: {
      arthropoda: "Gliederfüßer (Arthropoda)",
      lobopodia: "Lobopoden & Häutungstiere",
      chordata: "Chordatiere & Verwandte",
      invertebrata: "Weitere wirbellose Stämme",
      incertae: "Die Rätselhaften (Incertae sedis)"
    },
    species: [
      {
        name: "Paradoxides pinus",
        scientific: "Paradoxides pinus",
        category: "arthropoda",
        subCategory: "Trilobita",
        description: "Ein dreiteilig gegliederter Bodenbewohner mit einer festen Kopfplatte und einer Vielzahl kleiner Beine. Trilobiten waren im Kambrium extrem divers und zahlreich, da ihr Panzer maximalen Schutz bot. Paradoxides pinus dient heute als wichtiges Leitfossil zur Datierung von Gesteinsschichten des mittleren Kambriums.",
        lifestyle: "Epibenthisch (Bodenbewohner)",
        status: "Ausgestorben (Leitfossil)",
        isLeitfossil: true,
        keywords: ["Trilobit", "Leitfossil", "Panzer", "Bodenbewohner", "Dreilapper"]
      },
      {
        name: "Marella",
        scientific: "Marrella splendens",
        category: "arthropoda",
        subCategory: "Marrellomorpha",
        description: "Ein kleiner, filigraner Gliederfüßer aus dem Burgess-Schiefer. Marella gehört zum entfernteren Verwandtschaftskreis der Trilobiten, verbrachte sein Leben jedoch im Gegensatz zu diesen als Teil des Nektons und schwamm aktiv im freien Wasser.",
        lifestyle: "Nektonisch (aktiv schwimmend)",
        status: "Ausgestorben",
        keywords: ["Burgess Shale", "Schwimmer", "Filigran", "Arthropode"]
      },
      {
        name: "Yohoia",
        scientific: "Yohoia tenuis",
        category: "arthropoda",
        subCategory: "Megacheira",
        description: "Ein winziger, bis zu 2 cm langer Gliederfüßer. Yohoia war ein flinker Räuber und zeichnete sich durch zwei lange, bewegliche, in mehrere Klauen mündende Fangarme an seinem Kopf aus (sogenannte 'große Anhänge'). Diese Greifstrukturen entwickelten sich im Laufe der Evolution bei verschiedenen Arthropoden konvergent.",
        lifestyle: "Nektonisch/Epibenthisch",
        status: "Ausgestorben",
        keywords: ["Räuber", "Fangarme", "Klauen", "Burgess Shale", "Winzig"]
      },
      {
        name: "Canandaspis",
        scientific: "Canadaspis perfecta",
        category: "arthropoda",
        subCategory: "Crustomorpha (Krebstier-Verwandte)",
        description: "Ein Gliederfüßer aus dem Fossilbericht des Kambriums, der als einer der frühesten Belege für echte Krustentiere (Krebse) gilt. Der Name verleitet leicht zu Fehlinterpretationen: Aufgrund der Endung hielt man das Fossil ursprünglich fälschlicherweise für einen prähistorischen Fisch.",
        lifestyle: "Epibenthisch",
        status: "Ausgestorben",
        keywords: ["Krustentier", "Burgess Shale", "Krebs", "Missverständnis"]
      },
      {
        name: "Anomalocaris",
        scientific: "Anomalocaris canadensis",
        category: "lobopodia",
        subCategory: "Anomalocarididae",
        description: "Der unangefochtene Spitzenprädatoren der kambrischen Meere. Er erreichte Längen von wenigen Zentimetern bis zu einem vollen Meter. Anomalocaris besaß einen flachen Körper mit seitlichen Schwimmflossen, große Stielaugen und ein kreisförmiges, mit Zähnen besetztes Maul an der Unterseite. Seine markantesten Merkmale waren zwei kräftige, gegliederte und bedornte Fangfortsätze am Kopf, mit denen er Beutetiere (wie Trilobiten) packen und zerkleinern konnte.",
        lifestyle: "Nektonisch (Spitzenräuber)",
        status: "Ausgestorben",
        keywords: ["Riese", "Räuber", "Stielaugen", "Fangfortsatz", "König", "Spitzenprädatoren"]
      },
      {
        name: "Opabinia",
        scientific: "Opabinia regalis",
        category: "lobopodia",
        subCategory: "Anomalocarididae (Verwandte)",
        description: "Ein kleinerer Verwandter der Anomalocariden mit einem skurrilen Aussehen. Opabinia besaß fünf gestielte Augen auf dem Kopf und ein Maul, das sich am Ende eines langen, flexiblen Rüssels befand. Mit diesem Rüssel konnte sie Nahrung vom Meeresboden aufgreifen und zum Maul führen.",
        lifestyle: "Nektonisch/Epibenthisch (Räuber)",
        status: "Ausgestorben",
        keywords: ["Rüssel", "Fünf Augen", "Kurios", "Kompakt", "Burgess Shale"]
      },
      {
        name: "Hallucigenia",
        scientific: "Hallucigenia sparsa",
        category: "lobopodia",
        subCategory: "Onychophora (Stummelfüßer)",
        description: "Ein legendär aussehendes, wurmartiges Tier aus der Familie der Stummelfüßer. Es besitzt eine Doppelreihe langer, spitzer Stacheln auf dem Rücken und eine Doppelreihe langer, dünner Beine auf der Bauchseite. Seine bizarre Form verwirrte Forscher jahrzehntelang so sehr, dass es anfangs auf dem Kopf stehend und rückwärts rekonstruiert wurde.",
        lifestyle: "Epibenthisch (Bodenkriecher)",
        status: "Ausgestorben (Stammgruppe)",
        keywords: ["Stacheln", "Bizar", "Wurm", "Stummelfüßer", "Kultfossil"]
      },
      {
        name: "Microdictyon",
        scientific: "Microdictyon sinicum",
        category: "lobopodia",
        subCategory: "Onychophora (Stummelfüßer)",
        description: "Ein wurmartiger Lobopode mit stummelartigen Beinchen. An den Gelenkstellen der Beine befanden sich netzartige, mineralisierte Kalkplättchen, die wahrscheinlich dem Schutz dienten oder als Sinnesorgane fungierten. Gilt als enger Verwandter oder Vorfahre der Onychophoriden.",
        lifestyle: "Epibenthisch",
        status: "Ausgestorben",
        keywords: ["Netzplatten", "Panzerplatten", "Wurm mit Beinen", "Maotianshan-Schiefer"]
      },
      {
        name: "Aysheaia",
        scientific: "Aysheaia pedunculata",
        category: "lobopodia",
        subCategory: "Onychophora (Stummelfüßer)",
        description: "Ein weiterer prominenter Vertreter der Lobopoden aus dem Burgess-Schiefer. Es glich einer lebenden Raupe mit stacheligen Vorderbeinen nahe dem Kopf. Vermutlich lebte Aysheaia in enger Gemeinschaft mit Schwämmen (wie Archaeocyathiden), von denen es sich ernährte oder die es als Zufluchtsort nutzte.",
        lifestyle: "Epibenthisch (Sponge-dweller)",
        status: "Ausgestorben",
        keywords: ["Raupenartig", "Schwamm-Parasit", "Stummelfüße", "Burgess Shale"]
      },
      {
        name: "Haikouella",
        scientific: "Haikouella lanceolata",
        category: "chordata",
        subCategory: "Frühe Chordatiere",
        description: "Ein Meilenstein der Evolution: Eines der ältesten bekannten Wirbeltierverwandten. Ein kleines, spindelförmiges Tier mit weichem Körper und winzigen Augen. Seine wichtigste Innovation war ein Notochord (ein elastischer knorpelartiger Stab), der den Nervenstrang umgab. Er bot Stabilität für Muskelansätze, was eine schnelle Flucht vor Jägern ermöglichte.",
        lifestyle: "Nektonisch (Flinker Schwimmer)",
        status: "Ausgestorben (Urahn der Wirbeltiere)",
        keywords: ["Chordat", "Wirbeltier-Urahn", "Notochord", "Knorpel", "Evolution", "Haikou"]
      },
      {
        name: "Iapetognathus fluctivagus",
        scientific: "Iapetognathus fluctivagus",
        category: "chordata",
        subCategory: "Conodonta",
        description: "Ein wurmartiges Tier, dessen Erstauftreten das offizielle Ende des Kambriums und den Beginn des Ordoviziums markiert. Conodonten besaßen keine Wirbelsäule, gelten aber als nahe Verwandte der Wirbeltiere. Da der Körper weich war, versteinerten nur die mikroskopischen, aus Apatit bestehenden Zähne ihres komplexen Kieferapparates.",
        lifestyle: "Nektonisch/Planktonisch",
        status: "Ausgestorben (Leitfossil)",
        isLeitfossil: true,
        keywords: ["Conodont", "Zähne", "Leitfossil", "Grenzmarker", "Wirbeltierverwandt"]
      },
      {
        name: "Graptolithen",
        scientific: "Graptolithina",
        category: "chordata",
        subCategory: "Hemichordata",
        description: "Kollaborative, filtrierende Organismen, die in organischen, verzweigten Skeletten zusammenlebten. Neue Generationen wuchsen direkt auf den Skeletten der Mütter heran. In Gesteinen ähneln ihre Fossilien Keilschriftsymbolen ('Schriftsteine'). Sie lebten entweder am Meeresboden verankert (sessil) oder an Treibgut hängend (pseudoplanktonisch).",
        lifestyle: "Sessil / Pseudoplanktonisch",
        status: "Ausgestorben",
        keywords: ["Schriftstein", "Kolonie", "Filtrierer", "Hemichordat", "Schwebend"]
      },
      {
        name: "Archaeocyathiden",
        scientific: "Archaeocyatha",
        category: "invertebrata",
        subCategory: "Porifera (Schwämme)",
        description: "Die dominierenden Riffbildner des Kambriums. Diese trichterförmigen Organismen besaßen ein kalkiges Skelett aus zwei konzentrischen Wänden, die durch radiale Platten (Septen) verbunden waren. Sie bauten ausgedehnte Riffsysteme im tropischen Flachwasser. Am Ende des Kambriums starben sie vollständig aus und hinterließen eine Lücke im marinen Riffbau.",
        lifestyle: "Benthisch (Sessil / Riffbildend)",
        status: "Ausgestorben",
        keywords: ["Schwamm", "Riffbauer", "Kalktrichter", "Sessil", "Ausgestorben"]
      },
      {
        name: "Trichtophycus pedum",
        scientific: "Treptichnus pedum (Trichtophycus pedum)",
        category: "invertebrata",
        subCategory: "Spurenfossil (Incertae sedis)",
        description: "Ein historisch wichtiges Fossil: Seine charakteristischen, baumartig verzweigten Grab- und Fraßspuren im Sediment definieren den offiziellen Beginn des Kambriums (vor 541 Mio. Jahren). Ein Körperfossil wurde nie gefunden, aber die Spur beweist die Existenz eines wirbellosen Sedimentfressers, der sich aktiv durch den Boden grub.",
        lifestyle: "Endobenthisch (Grabend)",
        status: "Ausgestorben (Nur Spuren bekannt)",
        isLeitfossil: true,
        keywords: ["Spurenfossil", "Grenzmarker", "Beginn", "Agronomische Revolution", "Grabspur"]
      },
      {
        name: "Billingsella corrugata",
        scientific: "Billingsella corrugata",
        category: "invertebrata",
        subCategory: "Brachiopoda (Armfüßer)",
        description: "Ein früher Brachiopode, der als wichtiges Leitfossil der Epoche dient. Brachiopoden besitzen zwei kalkige Klappen, ähnlich wie Muscheln, sind jedoch anatomisch völlig anders aufgebaut und filtern Nahrung mit einem speziellen Armapparat (Lophophor). Sie gehören zu den Lophotrochozoen.",
        lifestyle: "Benthisch (Sessil)",
        status: "Ausgestorben (Gattung)",
        isLeitfossil: true,
        keywords: ["Brachiopode", "Schill", "Muschelähnlich", "Armfüßer", "Sessil"]
      },
      {
        name: "Echmatocrinus",
        scientific: "Echmatocrinus brachiatus",
        category: "incertae",
        subCategory: "Incertae sedis",
        description: "Ein bizarres, sessil lebendes, trichterförmiges Tier aus dem Burgess-Schiefer. Es verankerte sich am Boden und filterte Plankton sowie Detritus aus der Strömung. Es weist Merkmale auf, die sowohl zu Stachelhäutern (wie Seelilien) als auch zu Nesseltieren passen. Seine genaue systematische Stellung bleibt rätselhaft.",
        lifestyle: "Benthisch (Sessil / Filtrierer)",
        status: "Ausgestorben (Rätsel)",
        keywords: ["Incertae sedis", "Mischwesen", "Seelilien-ähnlich", "Trichter", "Burgess Shale"]
      },
      {
        name: "Odontogriphus",
        scientific: "Odontogriphus omalus",
        category: "incertae",
        subCategory: "Lophotrochozoa",
        description: "Ein extrem flacher, blattförmiger Wurm. Trotz seines segmentierten Aussehens, das an Gliederfüßer erinnert, ist er eindeutig ein Lophotrochozoe (verwandt mit Würmern und Weichtieren). Seine genaue Position ist jedoch ungeklärt. Markant war sein U-förmiger Kieferapparat an der Unterseite, der mit feinen, nadelförmigen Zähnchen besetzt war.",
        lifestyle: "Epibenthisch (Bodenkriecher)",
        status: "Ausgestorben",
        keywords: ["Flachwurm", "Zahnring", "Kiefer", "Lophotrochozoe", "Burgess Shale"]
      },
      {
        name: "Nectocaris",
        scientific: "Nectocaris pteryx",
        category: "incertae",
        subCategory: "Incertae sedis (Wirbeltier/Arthropoden-Mischung)",
        description: "Ein echtes evolutionäres Rätsel. Im Kopfbereich gleicht es einem Arthropoden, inklusive eines harten Außenskelettschädels und hochentwickelten Facettenaugen. Sein flacher, stromlinienförmiger Hinterleib besitzt jedoch eine ausgeprägte Rücken- und Bauchflosse, was stark an ein Chordaten- oder Wirbeltiermerkmal erinnert.",
        lifestyle: "Nektonisch (Flinker Schwimmer)",
        status: "Ausgestorben",
        keywords: ["Chimäre", "Facettenaugen", "Flossen", "Mischwesen", "Burgess Shale"]
      }
    ]
  },

  geography: {
    title: "Geographie & Plattentektonik im Kambrium",
    intro: "Die Geographie des Kambriums unterschied sich radikal von der heutigen Erde. Fast alle Landmassen waren in einer Reihe kleinerer Kontinente und Terrane um den Äquator konzentriert. Im Laufe des Kambriums begann eine rege Drift der Kontinentalplatten, die das globale Klima erwärmte und neue marine Lebensräume schuf.",
    mapUrl: "images/cambrian_map.png",
    continents: [
      {
        name: "Gondwana",
        description: "Der mit Abstand größte Kontinent der damaligen Zeit. Er wanderte während des Kambriums vom Äquator (östlicher Rand der Karte) langsam in Richtung Südpol. Obwohl er den Namen mit dem späteren jurassischen Südkontinent teilt, war dieser kambrische Kontinent deutlich größer.",
        features: ["Äquator bis Südpol", "Größte Landmasse", "Urahn von Afrika, Südamerika, Australien"]
      },
      {
        name: "Laurentia",
        description: "Der zweitgrößte Kontinent des Kambriums. Er lag auf Höhe des Äquators in der damaligen westlichen Hemisphäre. Laurentia war der tektonische Vorläufer des heutigen Nordamerikas und Teilen Nordeuropas.",
        features: ["Äquatorlage", "Westliche Hemisphäre", "Vorgänger Nordamerikas"]
      },
      {
        name: "Baltika",
        description: "Ein kleinerer Kontinent, der heute große Teile Europas und Asiens ausmacht. Zu Beginn des Kambriums lag Baltika dem Südpol am nächsten, wurde jedoch in den folgenden Jahrmillionen stetig nordwärts geschoben, während Gondwana sich über den Pol legte.",
        features: ["Anfangs Südpolnähe", "Driftete nach Norden", "Vorgänger Nord/Osteuropas"]
      },
      {
        name: "Sibiria",
        description: "Der viertgrößte Kontinent der kambrischen Welt. Er lag direkt auf dem Äquator und erstreckte sich weit auf die Südhalbkugel hinab. Tektonisch entspricht er großen Teilen des heutigen Nordasiens (Sibirien).",
        features: ["Äquatorlage", "Erstreckte sich nach Süden", "Vorgänger Sibiriens"]
      },
      {
        name: "Yangtse & Sino-Korea",
        description: "Zwei kleine kontinentale Terrane im Norden. Sie lösten sich im späten Proterozoikum von Gondwana ab, als dieses südwärts driftete. Sie verbanden sich im Ordovizium und Silur zum Kleinkontinent China und verschmolzen in der Trias mit Pangäa.",
        features: ["Nordhemisphäre", "Vom Gondwana-Rand gelöst", "Vorgänger Chinas"]
      }
    ],
    oceans: [
      {
        name: "Pazifik (Panthalassa)",
        description: "Der älteste noch heute existierende Ozean der Erde. Er lag zwischen der Westküste Laurentias und dem Ostrand Gondwanas auf der Tag-und-Nacht-Grenze."
      },
      {
        name: "Iapetus-Ozean",
        description: "Dieser Ozean lag zwischen Laurentia und Baltika. Durch die Nordwärtsbewegung Laurentias verengte er sich im Laufe der Epochen zunehmend."
      },
      {
        name: "Tornquist-Ozean",
        description: "Ein Ozean zwischen Baltika und Gondwana, der durch aktives Seafloor-Spreading in seiner Mitte kontinuierlich breiter wurde. Die Ozeanplatten subduzierten an den Rändern, was das Cadomische Orogen (Vulkangebirge) entstehen ließ."
      },
      {
        name: "Lomonossov-Ozean",
        description: "Trennter den kleinen Kontinent Baltika von der sibirischen Landmasse (Sibiria)."
      },
      {
        name: "Franklin-Ozean",
        description: "Erstreckte sich zwischen den äquatorialen Kontinenten Laurentia und Sibiria."
      }
    ],
    sedimente: {
      title: "Sedimente des Kambriums",
      text: "Die Sedimente des Kambriums umfassten ursprünglich vor allem Kalkstein, Phyllite, Arkosen, Quarzsandstein und Tonstein. Da sie jedoch im Lauf der Jahrmillionen und durch mehrere Orogenesen häufig einer starken Metamorphose ausgesetzt waren, besteht das Kambrium heute größtenteils aus verschiedenen Schiefervarianten. Die fossilreichsten Schiefer sind Alaunschiefer, in denen sogenannte Orsten (Kalkknollen, die sich um Organismen gebildet haben) eingelagert sind. Deren Inhalt ist oft außergewöhnlich gut konserviert."
    },
    vorkommen: {
      title: "Vorkommen & Fundorte",
      deutschland: "In Deutschland ist das Kambrium kaum aufgeschlossen. In allen unverfalteten Bereichen Mitteleuropas liegt es unter kilometerdicken jüngeren Sedimentschichten. Die einzigen Spuren des stark metamorph überprägten kambrischen Sediments finden sich in Kollisions- und Hebungszonen aus der variszischen und alpidischen Orogenese, z. B. im Spessart, Schwarzwald, Fichtelgebirge, Bayerischen Wald, Oberpfälzer Wald, im Erzgebirge und der Lausitz.",
      global: "Global herausragend wichtige Fundstellen für Fossilien des Kambriums sind der Burgess Shale im kanadischen British Columbia sowie der Maotianshan-Schiefer in der Yunnan-Provinz in China."
    }
  },

  biomes: {
    title: "Biome & Marine Lebensräume",
    intro: "Da das Festland im Kambrium eine leblose, verwitternde Wüste war, spielten sich alle ökologischen Entwicklungen im Meer ab. Durch den Anstieg des Meeresspiegels wurden flache Kontinentalschelfe überflutet und boten ideale Bedingungen für die Bildung neuer Biome.",
    agronomischeRevolution: {
      title: "Die Agronomische Revolution",
      description: "Vor dem Kambrium (im Ediacarium) lebten Organismen flach auf dem Meeresboden (epibenthisch) oder saßen fest (sessil). Mit dem Kambrium entwickelte sich eine 'trophische Eskalation' – eine komplexe Nahrungskette mit aktiven Jägern und Beutetieren. Um Schutz zu suchen, begannen Würmer, Weichtiere und Gliederfüßer erstmals, aktive Gänge und Wohnhöhlen tief in das Sediment (bis zu 20 cm) zu graben. Dies markiert den Beginn des ersten Terraforming durch lebende Organismen auf der Erde."
    },
    list: [
      {
        name: "Flachwasser-Schelfmeere",
        description: "Warme, lichtdurchflutete Meereszonen über gefluteten Kontinentalplatten. Durch erhöhte CO2-Treibhausgase und Vulkanismus stieg der Meeresspiegel massiv an. Diese Meere boten unzählige neue ökologische Nischen und waren die 'Geburtswiege' der Kambrischen Explosion.",
        conditions: "Lichtreich, warm, sauerstoffreich",
        residents: ["Phytoplankton", "Wasserpflanzen", "frühe Muscheln", "Brachiopoden"]
      },
      {
        name: "Epibenthos (Auf dem Meeresboden)",
        description: "Der Lebensraum direkt auf der Oberfläche des Meeresbodens. Hier lebte die Mehrzahl der kambrischen Organismen, die sich kriechend, laufend oder gleitend fortbewegten und sich von Detritus, Algen oder anderen Tieren ernährten.",
        conditions: "Sand- oder Schlammböden, reich an organischen Ablagerungen",
        residents: ["Die meisten Trilobiten", "Hallucigenia", "Aysheaia", "Schnecken", "Seegurken"]
      },
      {
        name: "Endobenthos (Im Meeresboden)",
        description: "Der Lebensraum innerhalb der obersten Sedimentschichten. Durch die Agronomische Revolution erobert, bauten Würmer und andere Wirbellose hier Röhrensysteme zum Schutz und zur Nahrungssuche, wodurch das Sediment durchlüftet wurde.",
        conditions: "Sauerstoffärmer mit zunehmender Tiefe, sedimentreich",
        residents: ["Trichtophycus pedum (Spurenerzeuger)", "Grabende Würmer", "Sedimentfresser"]
      },
      {
        name: "Nekton (Freies Wasser - Schwimmer)",
        description: "Der Lebensraum im freien Wasser, bevölkert von Tieren, die aktiv gegen die Strömung anschwimmen können. Hier bildete sich eine Hierarchie von schnellen Jägern und flinken Schwimmern heraus.",
        conditions: "Offenes Wasser, dreidimensionale Bewegung",
        residents: ["Anomalocaris", "Marella", "Yohoia", "Haikouella (Wirbeltier-Urahn)", "Nectocaris"]
      },
      {
        name: "Archaeocyathiden-Riffe",
        description: "Die ersten echten organischen Riffstrukturen des Phanerozoikums. Erschaffen von Archaeocyathiden (kalkbildenden Schwämmen) im flachen Wasser. Sie bildeten dichte, komplexe dreidimensionale Strukturen, die zahlreichen Kleintieren Schutz und Nahrung boten.",
        conditions: "Tropisch, flach, kalksättigend",
        residents: ["Archaeocyathiden", "Kleine Muscheln", "Brachiopoden", "Trilobiten-Brut"]
      }
    ]
  }
};
