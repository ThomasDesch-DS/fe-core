<script lang="ts">
    // Kink Test — Mobile-first, conversational. Adults only. SSC/RACK.
    // Full single-file page for SvelteKit + Tailwind.
    // Posts results to /users/bdsm-test when finished.

    const LS_KEY = 'kinkTestV4';

    // ---------------------------
    // Roles
    // ---------------------------
    type RoleId =
        | 'switch' | 'experimentalist' | 'brat' | 'slave' | 'pet'
        | 'rope_bunny' | 'non_monogamist' | 'voyeur' | 'master_mistress'
        | 'dominant' | 'primal_prey' | 'primal_hunter' | 'submissive'
        | 'owner' | 'rigger' | 'masochist' | 'degradee' | 'exhibitionist'
        | 'degrader' | 'brat_tamer' | 'sadist' | 'vanilla';

    const ROLES: Record<RoleId, { label: string; info: string }> = {
        switch: { label: 'Switch', info: 'Comfortable leading or following; swaps roles by mood and chemistry.' },
        experimentalist: { label: 'Experimentalist', info: 'Curious, novelty-seeking; tries new dynamics safely.' },
        brat: { label: 'Brat', info: 'Playfully defiant sub; enjoys push–pull and being “handled”.' },
        slave: { label: 'Slave', info: '24/7 power exchange with negotiated limits and trust.' },
        pet: { label: 'Pet', info: 'Pet/owner dynamics; can be sexual or purely relational.' },
        rope_bunny: { label: 'Rope bunny', info: 'Likes being tied/restrained for sensation, headspace, or art.' },
        non_monogamist: { label: 'Non-monogamist', info: 'Open to ENM/poly; flexible beyond strict monogamy.' },
        voyeur: { label: 'Voyeur', info: 'Aroused by watching consensual intimacy.' },
        master_mistress: { label: 'Master/Mistress', info: 'Holistic authority with responsibility, structure, training.' },
        dominant: { label: 'Dominant', info: 'Leads scenes/decisions; enjoys control (not necessarily pain).' },
        primal_prey: { label: 'Primal (Prey)', info: 'Likes chase/struggle and being overpowered (consensually).' },
        primal_hunter: { label: 'Primal (Hunter)', info: 'Enjoys pursuit and raw, instinctive play.' },
        submissive: { label: 'Submissive', info: 'Likes being led; gives up control in scene or relationship.' },
        owner: { label: 'Owner', info: 'Caretaker/owner in pet dynamics; structure + responsibility.' },
        rigger: { label: 'Rigger', info: 'Enjoys tying/bondage with skill and safety.' },
        masochist: { label: 'Masochist', info: 'Aroused by certain kinds of pain (risk-aware, consent).' },
        degradee: { label: 'Degradee', info: 'Aroused by humiliation/degradation within consent.' },
        exhibitionist: { label: 'Exhibitionist', info: 'Likes being seen (legal, consensual contexts).' },
        degrader: { label: 'Degrader', info: 'Enjoys degrading a partner consensually; aftercare matters.' },
        brat_tamer: { label: 'Brat tamer', info: 'Dominant who enjoys playful resistance and “lessons”.' },
        sadist: { label: 'Sadist', info: 'Enjoys inflicting pain safely and reading reactions.' },
        vanilla: { label: 'Vanilla', info: 'Prefers conventional intimacy/romance—valid!' },
    };

    // ---------------------------
    // Items (filtered: no “childlike/ageplay”)
    // ---------------------------
    const RAW_ITEMS = [
        "I like to be dominated, especially in the bedroom.",
        "I like receiving pain during sex/BDSM and seeing the results of it afterwards.",
        "I prefer making the sexual decisions for my partner, as this gives me more control.",
        "I don't mind a little playful resistance from my partner(s), in the end I'll win anyway.",
        "I like forcing my partner into submission, much more than them submitting spontaneously.",
        "Feeling physically overpowered is one of the most liberating sexual feelings.",
        "I would like to have sex with multiple people at the same time.",
        "I enjoy it when people watch me being naked or having sex.",
        "Ideally I could command my partner, and they'd obey like a puppet no matter what I tell them to do.",
        "I don't like making sexual decisions, I prefer my partner to make them for me.",
        "I love making my partners do really disgusting things, purely for my own pleasure.",
        "I am willing to try anything once, even if I don't think I will like it.",
        "Physically restricting my partner during sex/BDSM is arousing.",
        "I like sending nude or sexual pictures/videos of myself to others.",
        "I like to be totally helpless and at my partner's disposal, physically unable to resist what they do.",
        "Receiving care, being spoiled, etc. are some of the main things I'm looking for in a relationship.",
        "I have a thing for large age differences in sexual encounters or relationships.",
        "When it comes to sexual acts, my partner's discomfort is pretty much irrelevant if it gives me more pleasure.",
        "I enjoy playing or acting like a pet animal.",
        "Giving care, spoiling my partner, etc. is one of the main things I'm looking for in a relationship.",
        "Being treated with little or no respect during sex/BDSM arouses me.",
        "There is no reason why sex would have to happen in private spaces, isolated from the outside world.",
        "I'll often put up a fight in bed, but that doesn't mean I want to win that fight at all.",
        "I find the romantic aspect in a relationship much more important than the sexual or kinky aspects.",
        "I currently have a Master/Mistress in my life.",
        "I would like to serve in a formal setting with explicit slave training, prescribed physical positions and rituals, etc.",
        "My ultimate goal in life is to please my partner(s), and there's hardly anything I wouldn't do to reach that goal.",
        "I have a need to constantly try new things, a sexual routine would never make me happy.",
        "Assuming I was single, I would like to join an existing couple's or polygroup's relationship for sexual and/or emotional purposes.",
        "Being physically restricted during sex/BDSM is arousing.",
        "I enjoy feeling like a prey hunted by a predator.",
        "I don't have any sort of specific fetish or non-standard sexual turn-on.",
        "Being part of a group of slaves that serves one Master/Mistress sounds like a life that would really suit me.",
        "I would like to be completely tied up during sex/BDSM.",
        "I enjoy being kept as a pet: in a cage, eating out of a bowl, being petted/caressed, etc.",
        "I love seeing the fear in my partner's eyes when they know I'm going to inflict pain on them.",
        "I like to be sexually degraded and humiliated by my partner(s) sometimes.",
        "I would like to be nothing but a 24/7 sex slave.",
        "Treating my partner with little or no respect during sex/BDSM arouses me.",
        "I like being forced into submission, much more than submitting spontaneously.",
        "I would like it when my partner is completely tied up during sex/BDSM.",
        "I have plenty of sexual fantasies that I would like to try out, more than most of my kinky peers.",
        "I could be sexually submissive now, and be sexually dominant another time.",
        "I am willing to pay for porn if it really suits my sexual interests.",
        "I'm totally cool with my partner(s) having sex with other people.",
        "In an ideal relationship, my partner would see me as a mere object for service or sex.",
        "Making my partner suffer for my pleasure is one of the best things in life.",
        "Living with a group of slaves owned by me and serving me would be my ultimate life goal.",
        "It's no big deal when things I try turn out bad for me; risk is part of discovery.",
        "I am currently in a long term relationship.",
        "I have sexual fantasies which would at the very least be unethical to execute.",
        "I would like to provide my partner(s) with explicit slave training.",
        "In questionnaires like these, I tend to pick extreme answers.",
        "I enjoy keeping my partner as a pet: cage, bowl, petting/caressing, etc.",
        "If I could not fulfil all of my partner's desires, I'd encourage them to see other people.",
        "My partner having multiple partners while I stay mono (except 3-ways) is fine.",
        "I often behave in animalistic ways during sex (growling, howling, etc.).",
        "In an ideal relationship, I should have no hard limits and my life should belong to my partner.",
        "I'll go a long way to make my appearance match my partner's desires.",
        "If some desires aren’t met, I would see other people.",
        "I enjoy feeling like a predator hunting its prey.",
        "I like it when my partner takes on a nurturing and guiding (adult) role in the relationship.",
        "I enjoy watching other people being naked or having sex.",
        "I'd like my partner(s) to submit to me 24/7 and I’ll take the responsibility that comes with it.",
        "I like my partner(s) to be completely in charge in the bedroom, ordering me around.",
        "If I could make money selling porn clips of myself, I would.",
        "Being in fear of what my partner is going to do to me (within consent) is arousing.",
        "I feel the need to serve my partner and treat them with the highest respect, addressing them as a superior.",
        "Talking back to one’s dominant in a teasingly disobeying way should be part of the sub’s fun.",
        "When it comes to sexual acts, my own discomfort is irrelevant if it gives my partner more pleasure.",
        "I don't need physical pleasure from sex: if my partner is enjoying it, that's all I need.",
        "I enjoy verbally degrading my partner or calling them humiliating names during sex/BDSM.",
        "Sometimes, watching people have sex is more fun than participating.",
        "I enjoy it when my partner plays or acts like a pet animal.",
        "I like to be completely in charge in the bedroom, and order my partner(s) around.",
        "The idea of being tortured sexually is appealing.",
        "Having to do really disgusting things for my partner's pleasure sounds arousing.",
        "I would be willing to leave everything to live the BDSM life of my dreams.",
        "I like inflicting pain during sex/BDSM and seeing the results afterwards.",
        "I could not be always dominant or always submissive; I need both.",
        "I like to dominate my partner(s), especially in the bedroom.",
        "I like to sexually degrade and/or humiliate my partner(s) sometimes.",
        "I will naturally take on a nurturing and guiding (adult) role in a relationship.",
        "The idea of torturing someone sexually is appealing.",
        "If my partner would really enjoy using me as a urinal, I would let them.",
        "I'd like to submit to my partner 24/7 and see serving them as my life purpose.",
        "I want my partner to serve me and address me as a superior.",
        "I enjoy being verbally degraded or called humiliating names during sex/BDSM."
    ];

    const FORBIDDEN = /childlike|coloring book|playground/i;
    const ITEMS = RAW_ITEMS.filter((q) => !FORBIDDEN.test(q)).map((q, i) => ({ id: i + 1, text: q }));

    // ---------------------------
    // UI: scales & language
    // ---------------------------
    const SCALE = [
        { v: 1, en: 'Absolutely disagree', es: 'Totalmente en desacuerdo' },
        { v: 2, en: 'Disagree', es: 'En desacuerdo' },
        { v: 3, en: 'Slightly disagree', es: 'Algo en desacuerdo' },
        { v: 4, en: 'Neutral / no opinion', es: 'Neutral / sin opinión' },
        { v: 5, en: 'Slightly agree', es: 'Algo de acuerdo' },
        { v: 6, en: 'Agree', es: 'De acuerdo' },
        { v: 7, en: 'Absolutely agree', es: 'Totalmente de acuerdo' },
    ];

    type Lang = 'en' | 'es';
    type Gender = 'neutral' | 'masc' | 'fem';

    // On first load we show INTRO to ask for language & gender. Then we persist.
    const saved = load();

    let lang: Lang = saved.lang ?? 'es';
    let gender: Gender = saved.gender ?? null;
    let stage: 'intro' | 'quiz' | 'results' = saved.stage ?? 'intro';

    let answers: number[] = saved.answers ?? Array.from({ length: ITEMS.length }, () => 0);
    let idx: number = Math.min(saved.idx ?? 0, ITEMS.length - 1);
    let copied = false;
    let posting = false;
    let postOk: boolean | null = null;

    function load() {
        try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}'); } catch { return {}; }
    }
    function save() {
        localStorage.setItem(LS_KEY, JSON.stringify({ answers, idx, stage, lang, gender }));
    }

    // ---------------------------
    // “Mongo-style” language doc with gendered ES overrides
    // ---------------------------
    type LangOverride = {
        key: string;
        match: RegExp;
        es: { neutral: string; masc: string; fem: string };
    };
    const LANGDOC_ES_AR: {
        _id: string;
        locale: 'es-AR';
        version: number;
        genders: Gender[];
        overrides: LangOverride[];
    } = {
        _id: 'lang_es-AR_bdsmtest_v4',
        locale: 'es-AR',
        version: 4,
        genders: ['neutral', 'masc', 'fem'],
        overrides: [
            {
                key: 'overpowered',
                match: /Feeling physically overpowered/i,
                es: {
                    neutral: 'Sentirte físicamente sobrepasado es de las sensaciones más liberadoras.',
                    masc:    'Sentirte físicamente sobrepasado es de las sensaciones más liberadoras.',
                    fem:     'Sentirte físicamente sobrepasada es de las sensaciones más liberadoras.',
                }
            },
            {
                key: 'helpless',
                match: /totally helpless.*physically unable to resist/i,
                es: {
                    neutral: 'Te gusta estar totalmente indefensx y a merced de tu pareja, sin poder resistirte.',
                    masc:    'Te gusta estar totalmente indefenso y a merced de tu pareja, sin poder resistirte.',
                    fem:     'Te gusta estar totalmente indefensa y a merced de tu pareja, sin poder resistirte.',
                }
            },
            {
                key: 'tied_up_self',
                match: /be completely tied up/i,
                es: {
                    neutral: 'Te gustaría quedar completamente atadx durante el sexo/BDSM.',
                    masc:    'Te gustaría quedar completamente atado durante el sexo/BDSM.',
                    fem:     'Te gustaría quedar completamente atada durante el sexo/BDSM.',
                }
            },
            {
                key: 'watched_naked',
                match: /people watch me being naked|watch me being naked/i,
                es: {
                    neutral: 'Te gusta cuando te miran desnudx o teniendo sexo.',
                    masc:    'Te gusta cuando te miran desnudo o teniendo sexo.',
                    fem:     'Te gusta cuando te miran desnuda o teniendo sexo.',
                }
            },
            {
                key: 'degraded_by_partner',
                match: /sexually degraded and humiliated by my partner/i,
                es: {
                    neutral: 'A veces te calienta sentirte degradadx y humilladx por tu pareja.',
                    masc:    'A veces te calienta sentirte degradado y humillado por tu pareja.',
                    fem:     'A veces te calienta sentirte degradada y humillada por tu pareja.',
                }
            },
            {
                key: 'kept_as_pet_self',
                match: /enjoy being kept as a pet/i,
                es: {
                    neutral: 'Disfrutás ser mantenidx como mascota: jaula, comedero, mimos, etc.',
                    masc:    'Disfrutás ser mantenido como mascota: jaula, comedero, mimos, etc.',
                    fem:     'Disfrutás ser mantenida como mascota: jaula, comedero, mimos, etc.',
                }
            },
            {
                key: 'fear_of_partner',
                match: /Being in fear of what my partner is going to do to me/i,
                es: {
                    neutral: 'Estar asustadx por lo que tu pareja pueda hacerte (dentro del consenso) te excita.',
                    masc:    'Estar asustado por lo que tu pareja pueda hacerte (dentro del consenso) te excita.',
                    fem:     'Estar asustada por lo que tu pareja pueda hacerte (dentro del consenso) te excita.',
                }
            },
            {
                key: 'verbally_degraded_self',
                match: /being verbally degraded or called humiliating names/i,
                es: {
                    neutral: 'Te gusta cuando te degradan verbalmente o te llaman con apodos humillantes: te sentís degradadx.',
                    masc:    'Te gusta cuando te degradan verbalmente o te llaman con apodos humillantes: te sentís degradado.',
                    fem:     'Te gusta cuando te degradan verbalmente o te llaman con apodos humillantes: te sentís degradada.',
                }
            },
            {
                key: 'urinal',
                match: /using me as a urinal/i,
                es: {
                    neutral: 'Si a tu pareja le gustara usarte como urinarix, lo permitirías.',
                    masc:    'Si a tu pareja le gustara usarte como urinario, lo permitirías.',
                    fem:     'Si a tu pareja le gustara usarte como urinaria, lo permitirías.',
                }
            },
            {
                key: 'nude_sending',
                match: /sending nude or sexual pictures\/videos/i,
                es: {
                    neutral: 'Te gusta mandar fotos o videos íntimos tuyos (nudes).',
                    masc:    'Te gusta mandar fotos o videos íntimos tuyos (nudes).',
                    fem:     'Te gusta mandar fotos o videos íntimos tuyos (nudes).',
                }
            },
        ]
    };

    // ---------------------------
    // EN → second-person (display)
    // ---------------------------
    function toYou(s: string) {
        return s
            .replace(/^I am\b/i, 'You are')
            .replace(/^I\'m\b/i, 'You\'re')
            .replace(/^I would\b/i, 'You would')
            .replace(/^I\'d\b/i, 'You\'d')
            .replace(/^I will\b/i, 'You will')
            .replace(/^I\'ll\b/i, 'You\'ll')
            .replace(/^I have\b/i, 'You have')
            .replace(/^I\'ve\b/i, 'You\'ve')
            .replace(/^I\b/i, 'You')
            .replace(/ my /g, ' your ')
            .replace(/ me\b/g, ' you');
    }

    // ES translator with gendered overrides
    function tryGenderOverride(en: string, g: Gender): string | null {
        for (const o of LANGDOC_ES_AR.overrides) {
            if (o.match.test(en)) {
                return o.es[(g ?? 'neutral') as keyof typeof o.es] ?? o.es.neutral;
            }
        }
        return null;
    }
    function toEsGeneric(en: string): string {
        let s = en.trim();
        s = s
            .replace(/^I am\b/i, 'Sos')
            .replace(/^I\'m\b/i, 'Sos')
            .replace(/^I would\b/i, 'Te gustaría')
            .replace(/^I\'d\b/i, 'Te gustaría')
            .replace(/^I will\b/i, 'Vas a')
            .replace(/^I\'ll\b/i, 'Vas a')
            .replace(/^I have\b/i, 'Tenés')
            .replace(/^I\'ve\b/i, 'Tenés')
            .replace(/^I\b/i, 'Vos')
            .replace(/ my /g, ' tu ')
            .replace(/ me\b/g, ' mí');
        if (s.startsWith('Vos ')) s = s.replace(/^Vos /, '');
        if (!/[.!?]$/.test(s)) s += '.';
        return s;
    }
    function displayText(en: string): string {
        if (lang === 'en') return toYou(en);
        const over = tryGenderOverride(en, gender!);
        if (over) return over;
        return toEsGeneric(en);
    }

    // ---------------------------
    // Answering flow
    // ---------------------------
    function setAnswer(v: number) {
        const next = [...answers];
        next[idx] = v;
        answers = next;
        if (idx < ITEMS.length - 1) idx = idx + 1;
        save();
    }
    function prev() { if (idx > 0) { idx = idx - 1; save(); } }
    function skip() { if (idx < ITEMS.length - 1) { idx = idx + 1; save(); } }
    function progressPct() { return Math.round((answers.filter(a => a !== 0).length / ITEMS.length) * 100); }
    function unansweredCount() { return answers.filter(a => a === 0).length; }
    function canViewResults() { return unansweredCount() === 0; }
    function jumpToFirstUnanswered() { const j = answers.findIndex(a => a === 0); if (j >= 0) idx = j; }
    function goResults() {
        if (!canViewResults()) return;
        stage = 'results';
        save();
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
    }
    function resetAll() {
        answers = Array.from({ length: ITEMS.length }, () => 0);
        idx = 0; stage = (gender ? 'quiz' : 'intro'); postOk = null; save();
    }

    // ---------------------------
    // Scoring
    // ---------------------------
    type WeightMap = Partial<Record<RoleId, number>>;
    const RULES: { re: RegExp; add: WeightMap }[] = [
        { re: /dominated|in charge.*ordering me|submit.*24\/7|life purpose/i, add: { submissive: 2, slave: 1 } },
        { re: /receiving pain|tortured\b|fear.*going to do to me/i, add: { masochist: 2, submissive: 1 } },
        { re: /make.*sexual decisions|completely in charge|order my partner|serve me.*superior/i, add: { dominant: 2 } },
        { re: /playful resistance|talking back/i, add: { brat_tamer: 1, dominant: 1, brat: 1 } },
        { re: /forcing.*submission|treating.*no respect.*arouses me/i, add: { degrader: 1, dominant: 1, sadist: 1 } },
        { re: /physically overpowered|forced into submission/i, add: { primal_prey: 1, submissive: 1 } },
        { re: /multiple people|poly(group|)|see other people|partners while I.*monog/i, add: { non_monogamist: 2 } },
        { re: /watch(ing)?.*(naked|have sex)|Sometimes, watching/i, add: { voyeur: 2 } },
        { re: /people watch me|selling porn clips|sending nude/i, add: { exhibitionist: 2 } },
        { re: /command.*obey.*puppet|provide.*slave training|submit.*24\/7.*responsibility/i, add: { master_mistress: 2, dominant: 1 } },
        { re: /don'?t like making sexual decisions/i, add: { submissive: 2 } },
        { re: /disgusting things/i, add: { degrader: 2, degradee: 1 } },
        { re: /willing to try anything|constantly try new things|risk.*part of discovery/i, add: { experimentalist: 2 } },
        { re: /physically restrict.*partner|tied up.*partner|provide.*slave training/i, add: { rigger: 2, dominant: 1 } },
        { re: /be (completely )?tied up|physically restricted|totally helpless/i, add: { rope_bunny: 2, submissive: 1 } },
        { re: /kept as a pet|playing.*pet animal|partner plays.*pet|cage.*bowl/i, add: { pet: 2, owner: 1 } },
        { re: /Giving care.*spoiling|nurturing and guiding \(adult\)/i, add: { owner: 1, dominant: 1 } },
        { re: /treated with little or no respect.*arouses me|sexually degraded.*by my partner/i, add: { degradee: 2 } },
        { re: /no reason.*private spaces/i, add: { exhibitionist: 1, voyeur: 1 } },
        { re: /put up a fight.*don'?t.*want to win/i, add: { brat: 2, primal_prey: 1 } },
        { re: /romantic aspect.*more important/i, add: { vanilla: 1 } },
        { re: /Master\/Mistress in my life|serve in a formal setting.*slave training|ultimate goal.*please my partner/i, add: { slave: 2 } },
        { re: /group of slaves.*suit me|living with a group of slaves owned by me/i, add: { slave: 2, master_mistress: 1 } },
        { re: /fear.*inflict pain|make.*suffer/i, add: { sadist: 2 } },
        { re: /could be sexually submissive.*dominant another time|could not be always dominant or always submissive/i, add: { switch: 3 } },
        { re: /mere object/i, add: { slave: 1, degradee: 1 } },
        { re: /animalistic.*growling|prey hunted by a predator/i, add: { primal_prey: 2 } },
        { re: /predator hunting/i, add: { primal_hunter: 2 } },
        { re: /serve my partner.*addressing them as a superior|no hard limits.*life should belong/i, add: { slave: 2 } },
        { re: /verbally degrading my partner|sexually degrade.*my partner/i, add: { degrader: 2 } },
        { re: /verbally degraded|called humiliating names/i, add: { degradee: 2 } },
        { re: /dominate my partner/i, add: { dominant: 2 } },
        { re: /don'?t have.*specific fetish/i, add: { vanilla: 1 } },
    ];

    function score(): { role: RoleId; pct: number }[] {
        const totals: Record<RoleId, number> = Object.fromEntries(Object.keys(ROLES).map(k => [k as RoleId, 0]));
        const maxes: Record<RoleId, number> = Object.fromEntries(Object.keys(ROLES).map(k => [k as RoleId, 0]));

        for (let i = 0; i < ITEMS.length; i++) {
            const a = answers[i];
            if (!a) continue;
            const norm = a - 4; // -3..+3
            const text = ITEMS[i].text;
            for (const r of RULES) {
                if (r.re.test(text)) {
                    for (const [role, w] of Object.entries(r.add)) {
                        totals[role as RoleId] += (w as number) * norm;
                        maxes[role as RoleId] += Math.abs(w as number) * 3;
                    }
                }
            }
        }
        return (Object.keys(ROLES) as RoleId[]).map(role => {
            const max = Math.max(1, maxes[role]);
            const raw = totals[role];
            const pct = Math.round(((raw + max) / (2 * max)) * 100); // 50 = neutral
            return { role, pct };
        }).sort((a, b) => b.pct - a.pct);
    }

    async function copyResults() {
        const res = score();
        const lines = res.map(r => `${r.pct}%\t${ROLES[r.role].label}\tMore info`).join('\n');
        await navigator.clipboard.writeText(`${lines}\n\nCopy your results to your profile.`);
        copied = true; setTimeout(() => copied = false, 1400);
    }

    // ---------------------------
    // Submit to backend
    // ---------------------------
    async function submitResults() {
        if (!canViewResults() || posting) return;
        posting = true; postOk = null;
        try {
            const payload = {
                lang,
                gender,
                langdoc_version: LANGDOC_ES_AR.version,
                answers,
                roles: score(),
                total_items: ITEMS.length,
                completed_at: new Date().toISOString(),
            };
            const resp = await fetch('/users/bdsm-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            postOk = resp.ok;
        } catch (_) {
            postOk = false;
        } finally {
            posting = false;
        }
    }

    // start screen handlers
    function pickLang(l: Lang) { lang = l; save(); }
    function pickGender(g: Gender) { gender = g; save(); }
    function startQuiz() { if (gender) { stage = 'quiz'; save(); } }
</script>

<svelte:head>
    <title>Kink Test — Mobile</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
</svelte:head>

<div class="mx-auto max-w-[720px] min-h-[100svh] flex flex-col px-3 sm:px-4 pb-20">

    <!-- INTRO: ask gender (and language) up front -->
    {#if stage === 'intro'}
        <main class="flex-1 flex flex-col justify-center">
            <h1 class="text-[22px] font-semibold">Kink Test</h1>
            <p class="mt-1 text-[12px] text-neutral-400">Conversational. Thumb-first. Adults only. SSC/RACK.</p>

            <div class="mt-4">
                <div class="text-[12px] text-neutral-400">Language / Idioma</div>
                <div class="mt-2 grid grid-cols-2 gap-2">
                    <button class="py-2 border border-neutral-700 rounded-lg text-sm hover:bg-neutral-900"
                            on:click={() => pickLang('es')}>ES (AR)</button>
                    <button class="py-2 border border-neutral-700 rounded-lg text-sm hover:bg-neutral-900"
                            on:click={() => pickLang('en')}>EN</button>
                </div>
            </div>

            <div class="mt-5">
                <div class="text-[12px] text-neutral-400">{lang==='es'?'Género para el lenguaje':'Gender for wording'}</div>
                <div class="mt-2 grid grid-cols-3 gap-2">
                    <button class="py-2 border border-neutral-700 rounded-lg text-sm hover:bg-neutral-900"
                            on:click={() => pickGender('neutral')}>{lang==='es'?'Neutro':'Neutral'}</button>
                    <button class="py-2 border border-neutral-700 rounded-lg text-sm hover:bg-neutral-900"
                            on:click={() => pickGender('masc')}>{lang==='es'?'Masc':'Masc'}</button>
                    <button class="py-2 border border-neutral-700 rounded-lg text-sm hover:bg-neutral-900"
                            on:click={() => pickGender('fem')}>{lang==='es'?'Fem':'Fem'}</button>
                </div>
                {#if !gender}
                    <div class="mt-2 text-[11px] text-red-400">{lang==='es'?'Elegí un género para continuar.':'Pick a gender to continue.'}</div>
                {/if}
            </div>

            <div class="mt-6">
                <button class="w-full py-3 px-4 rounded-lg text-sm font-semibold bg-white text-black disabled:opacity-40"
                        on:click={startQuiz}
                        disabled={!gender}>
                    {lang==='es'?'Empezar':'Start'}
                </button>
            </div>

            <div class="mt-4 text-[11px] text-neutral-500 leading-relaxed">
                {lang==='es'
                    ? 'Nota: Esto sólo ajusta el lenguaje (atado/atada, etc.). Podés cambiarlo luego reiniciando.'
                    : 'Note: This only affects phrasing (e.g., gendered adjectives). You can reset later.'}
            </div>
        </main>
    {/if}

    <!-- HEADER (compact) -->
    {#if stage !== 'intro'}
        <header class="pt-3 pb-2 sticky top-0 bg-black/70 backdrop-blur z-10 border-b border-neutral-900">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <h1 class="text-[18px] font-semibold tracking-tight">Kink Test</h1>
                    <p class="text-[11px] text-neutral-400">
                        {lang==='es'?'Conversacional. Móvil. Sólo adultos. SSC/RACK.':'Conversational. Mobile. Adults only. SSC/RACK.'}
                    </p>
                </div>
                <button class="text-[11px] underline text-neutral-400" on:click={() => { stage='intro'; save(); }}>
                    {lang==='es'?'Cambiar idioma/género':'Change language/gender'}
                </button>
            </div>
            <div class="mt-2 h-[6px] w-full rounded bg-neutral-800 overflow-hidden">
                <div class="h-full bg-white" style={`width:${progressPct()}%`}></div>
            </div>
            <div class="mt-1 text-[11px] text-neutral-400">
                {progressPct()}% · {ITEMS.length - unansweredCount()}/{ITEMS.length} {lang === 'es' ? 'respondidas' : 'answered'}
            </div>
        </header>
    {/if}

    {#if stage === 'quiz'}
        <!-- QUIZ -->
        <main class="flex-1">
            <div class="mt-4 text-[12px] text-neutral-400">Q{idx + 1} / {ITEMS.length}</div>
            <div class="mt-2 text-[17px] leading-snug">{displayText(ITEMS[idx].text)}</div>

            <!-- BIG CHIPS (tight spacing for mobile) -->
            <div class="mt-3 grid grid-cols-1 gap-1.5">
                {#each SCALE as s}
                    <button
                            class="w-full py-2.5 px-3 border border-neutral-700 rounded-lg text-[13px] hover:bg-neutral-900 active:scale-[.99] transition"
                            on:click={() => setAnswer(s.v)}
                    >
                        {lang === 'es' ? s.es : s.en}
                    </button>
                {/each}
            </div>

            <!-- QUICK NAV -->
            <div class="mt-3 flex items-center gap-2 text-[12px]">
                <button class="underline text-neutral-400 disabled:opacity-40" on:click={prev} disabled={idx===0}>{lang==='es'?'Atrás':'Back'}</button>
                <span class="text-neutral-600">·</span>
                <button class="underline text-neutral-400 disabled:opacity-40" on:click={skip} disabled={idx===ITEMS.length-1}>{lang==='es'?'Saltar':'Skip'}</button>
                <span class="text-neutral-600">·</span>
                <button class="underline text-neutral-400" on:click={jumpToFirstUnanswered}>{lang==='es'?'Ir a la primera sin responder':'Jump to first unanswered'}</button>
            </div>

            <!-- CTA -->
            <div class="mt-4">
                <button
                        class="w-full py-3 px-4 rounded-lg text-sm font-semibold bg-white text-black disabled:opacity-40"
                        disabled={!canViewResults()}
                        on:click={goResults}
                >
                    {lang==='es'?'Ver mis resultados':'See my results'}
                </button>
                {#if !canViewResults()}
                    <div class="mt-2 text-[11px] text-neutral-500">
                        {lang==='es'?'Tenés que responder todas las preguntas.':'You need to answer every question.'}
                    </div>
                {/if}
            </div>
        </main>

    {:else if stage === 'results'}
        <!-- RESULTS -->
        <main class="flex-1">
            <h2 class="mt-4 text-[16px] font-semibold">{lang==='es'?'Tu perfil':'Your profile'}</h2>
            <p class="text-[12px] text-neutral-400">
                {lang==='es'
                    ? 'Mayor % = mayor afinidad. Adultos, consensuado, negociado.'
                    : 'Higher % = stronger match. Adults, consensual, negotiated.'}
            </p>

            {#each score() as r}
                <details class="mt-2 border border-neutral-800 rounded-lg">
                    <summary class="flex items-center justify-between px-3 py-2 cursor-pointer">
                        <div class="flex items-center gap-3">
                            <div class="w-10 text-right tabular-nums">{r.pct}%</div>
                            <div class="font-medium">{ROLES[r.role].label}</div>
                        </div>
                        <div class="text-[11px] text-neutral-500">{lang==='es'?'Más info':'More info'}</div>
                    </summary>
                    <div class="px-3 pb-2 text-[13px] text-neutral-300">{ROLES[r.role].info}</div>
                </details>
            {/each}

            <div class="mt-4 grid grid-cols-1 gap-2">
                <button class="w-full py-3 px-4 rounded-lg text-sm font-semibold bg-white text-black" on:click={copyResults}>
                    {copied ? (lang==='es'?'¡Copiado!':'Copied!') : (lang==='es'?'Copiar resultados':'Copy results')}
                </button>
                <button class="w-full py-3 px-4 rounded-lg text-sm border border-neutral-700" on:click={() => { stage='quiz'; idx=0; save(); }}>
                    {lang==='es'?'Revisar respuestas':'Review answers'}
                </button>
            </div>

            <div class="mt-3 grid grid-cols-1 gap-2">
                <button
                        class="w-full py-3 px-4 rounded-lg text-sm font-semibold border border-neutral-700 hover:bg-neutral-900 disabled:opacity-40"
                        on:click={submitResults}
                        disabled={posting}
                >
                    {posting
                        ? (lang==='es'?'Enviando…':'Submitting…')
                        : (lang==='es'?'Enviar resultados':'Submit results')}
                </button>
                {#if postOk === true}
                    <div class="text-[11px] text-emerald-400">{lang==='es'?'Guardado ✔':'Saved ✔'}</div>
                {:else if postOk === false}
                    <div class="text-[11px] text-red-400">{lang==='es'?'Error al guardar':'Failed to save'}</div>
                {/if}
                <button class="w-full py-3 px-4 rounded-lg text-sm border border-neutral-700" on:click={resetAll}>
                    {lang==='es'?'Empezar de nuevo':'Start over'}
                </button>
            </div>

            <div class="mt-4 text-[11px] text-neutral-500 leading-relaxed">
                {lang==='es'
                    ? 'Seguridad: Solo adultos. Negociá límites, palabras de seguridad y aftercare. Juego público solo donde sea legal y consensuado.'
                    : 'Safety: Adults only. Negotiate limits, safewords, aftercare. Public play only where legal & consensual.'}
            </div>
        </main>
    {/if}

    <!-- FOOTER TIP -->
    {#if stage !== 'intro'}
        <footer class="fixed bottom-0 left-0 right-0 px-3 sm:px-4 py-2 bg-black/85 backdrop-blur border-t border-neutral-900">
            <div class="text-[11px] text-neutral-500">
                {lang==='es'
                    ? 'Tip: Flechas ← → y Enter para avanzar. ¿Duda? Elegí “Neutral”.'
                    : 'Tip: Use ← → keys and Enter. Unsure? Pick “Neutral”.'}
            </div>
        </footer>
    {/if}
</div>

<style>
    :global(html, body) { background: #000; color: #fff; }
    details > summary { list-style: none; }
    details > summary::-webkit-details-marker { display: none; }
    :global(*) { -webkit-tap-highlight-color: transparent; }
</style>
