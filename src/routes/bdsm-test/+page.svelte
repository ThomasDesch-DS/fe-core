<script lang="ts">
    import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
    import { escortAuthStore } from '$lib/escort/store/escortAuthStore';
    import { Gender as DSUserGender } from '$lib/escort/types/gender';
    import { get } from 'svelte/store';
    import { onMount, onDestroy, tick } from 'svelte';
    import type * as HtmlToImageNS from 'html-to-image';
    import posthog from 'posthog-js';

    // Test Kink — Conversacional, móvil, SSC/RACK. Guarda resultados en /users/bdsm-test
    const LS_KEY = 'kinkTestV5';

    // ---------------------------
    // Roles (gendered labels + infos)
    // ---------------------------
    type RoleId =
        | 'switch' | 'experimentalist' | 'brat' | 'slave' | 'pet'
        | 'rope_bunny' | 'non_monogamist' | 'voyeur' | 'master_mistress'
        | 'dominant' | 'primal_prey' | 'primal_hunter' | 'submissive'
        | 'owner' | 'rigger' | 'masochist' | 'degradee' | 'exhibitionist'
        | 'degrader' | 'brat_tamer' | 'sadist' | 'vanilla';

    type UiGender = 'neutral' | 'masc' | 'fem';

    const ROLES_G: Record<RoleId, {
        label: { neutral: string; masc: string; fem: string };
        info:  { neutral: string; masc: string; fem: string };
    }> = {
        switch: {
            label: { neutral: 'Switch', masc: 'Switch', fem: 'Switch' },
            info: {
                neutral: 'Cómodx liderando o siguiendo; cambiás de rol según el mood y la química.',
                masc:    'Cómodo liderando o siguiendo; cambiás de rol según el mood y la química.',
                fem:     'Cómoda liderando o siguiendo; cambiás de rol según el mood y la química.'
            }
        },
        experimentalist: {
            label: { neutral: 'Experimental', masc: 'Experimental', fem: 'Experimental' },
            info: {
                neutral: 'Curiosx y con hambre de novedad; probás dinámicas nuevas con cuidado y consentimiento.',
                masc:    'Curioso y con hambre de novedad; probás dinámicas nuevas con cuidado y consentimiento.',
                fem:     'Curiosa y con hambre de novedad; probás dinámicas nuevas con cuidado y consentimiento.'
            }
        },
        brat: {
            label: { neutral: 'Brat', masc: 'Brat', fem: 'Brat' },
            info: {
                neutral: 'Sub desafiante y juguetónx; disfrutás el tira-y-afloje y que te “pongan en tu lugar”.',
                masc:    'Sub desafiante y juguetón; disfrutás el tira-y-afloje y que te “pongan en tu lugar”.',
                fem:     'Sub desafiante y juguetona; disfrutás el tira-y-afloje y que te “pongan en tu lugar”.'
            }
        },
        slave: {
            label: { neutral: 'Slave', masc: 'Slave', fem: 'Slave' },
            info: {
                neutral: 'Intercambio de poder 24/7 con límites negociados y mucha confianza.',
                masc:    'Intercambio de poder 24/7 con límites negociados y mucha confianza.',
                fem:     'Intercambio de poder 24/7 con límites negociados y mucha confianza.'
            }
        },
        pet: {
            label: { neutral: 'Pet', masc: 'Pet', fem: 'Pet' },
            info: {
                neutral: 'Dinámica pet/owner; puede ser sexual o solo relacional.',
                masc:    'Dinámica pet/owner; puede ser sexual o solo relacional.',
                fem:     'Dinámica pet/owner; puede ser sexual o solo relacional.'
            }
        },
        rope_bunny: {
            label: { neutral: 'Rope bunny', masc: 'Rope bunny', fem: 'Rope bunny' },
            info: {
                neutral: 'Te gusta quedar atadx por sensación, headspace o estética.',
                masc:    'Te gusta quedar atado por sensación, headspace o estética.',
                fem:     'Te gusta quedar atada por sensación, headspace o estética.'
            }
        },
        non_monogamist: {
            label: { neutral: 'No monogamx', masc: 'No monógamo', fem: 'No monógama' },
            info: {
                neutral: 'Abiertx a ENM/poliamor; flexible más allá de la monogamia estricta.',
                masc:    'Abierto a ENM/poliamor; flexible más allá de la monogamia estricta.',
                fem:     'Abierta a ENM/poliamor; flexible más allá de la monogamia estricta.'
            }
        },
        voyeur: {
            label: { neutral: 'Voyeur', masc: 'Voyeur', fem: 'Voyeur' },
            info: {
                neutral: 'Te excita mirar intimidad consensuada.',
                masc:    'Te excita mirar intimidad consensuada.',
                fem:     'Te excita mirar intimidad consensuada.'
            }
        },
        master_mistress: {
            label: { neutral: 'Master/Mistress', masc: 'Master', fem: 'Mistress' },
            info: {
                neutral: 'Autoridad integral con responsabilidad, estructura y entrenamiento.',
                masc:    'Autoridad integral con responsabilidad, estructura y entrenamiento.',
                fem:     'Autoridad integral con responsabilidad, estructura y entrenamiento.'
            }
        },
        dominant: {
            label: { neutral: 'Dominante', masc: 'Dominante', fem: 'Dominante' },
            info: {
                neutral: 'Liderás escenas/decisiones; disfrutás del control (no necesariamente del dolor).',
                masc:    'Liderás escenas/decisiones; disfrutás del control (no necesariamente del dolor).',
                fem:     'Liderás escenas/decisiones; disfrutás del control (no necesariamente del dolor).'
            }
        },
        primal_prey: {
            label: { neutral: 'Primal (Prey)', masc: 'Primal (Prey)', fem: 'Primal (Prey)' },
            info: {
                neutral: 'Te gusta la persecución/lucha y ser sobrepasadx.',
                masc:    'Te gusta la persecución/lucha y ser sobrepasado.',
                fem:     'Te gusta la persecución/lucha y ser sobrepasada.'
            }
        },
        primal_hunter: {
            label: { neutral: 'Primal (Hunter)', masc: 'Primal (Hunter)', fem: 'Primal (Hunter)' },
            info: {
                neutral: 'Disfrutás la caza y el juego instintivo.',
                masc:    'Disfrutás la caza y el juego instintivo.',
                fem:     'Disfrutás la caza y el juego instintivo.'
            }
        },
        submissive: {
            label: { neutral: 'Sumisx', masc: 'Sumiso', fem: 'Sumisa' },
            info: {
                neutral: 'Te gusta ser guiadx; cedés control en escena o relación.',
                masc:    'Te gusta ser guiado; cedés control en escena o relación.',
                fem:     'Te gusta ser guiada; cedés control en escena o relación.'
            }
        },
        owner: {
            label: { neutral: 'Owner', masc: 'Owner', fem: 'Owner' },
            info: {
                neutral: 'Cuidadorx en dinámicas pet; estructura + responsabilidad.',
                masc:    'Cuidador en dinámicas pet; estructura + responsabilidad.',
                fem:     'Cuidadora en dinámicas pet; estructura + responsabilidad.'
            }
        },
        rigger: {
            label: { neutral: 'Rigger', masc: 'Rigger', fem: 'Rigger' },
            info: {
                neutral: 'Disfrutás atar/bondage con técnica y seguridad.',
                masc:    'Disfrutás atar/bondage con técnica y seguridad.',
                fem:     'Disfrutás atar/bondage con técnica y seguridad.'
            }
        },
        masochist: {
            label: { neutral: 'Masocx', masc: 'Masoca', fem: 'Masoca' },
            info: {
                neutral: 'Te excitan ciertos tipos de dolor (consciencia de riesgo y consentimiento).',
                masc:    'Te excitan ciertos tipos de dolor (consciencia de riesgo y consentimiento).',
                fem:     'Te excitan ciertos tipos de dolor (consciencia de riesgo y consentimiento).'
            }
        },
        degradee: {
            label: { neutral: 'Degradee', masc: 'Degradee', fem: 'Degradee' },
            info: {
                neutral: 'Te excita la humillación/degradación dentro del consentimiento.',
                masc:    'Te excita la humillación/degradación dentro del consentimiento.',
                fem:     'Te excita la humillación/degradación dentro del consentimiento.'
            }
        },
        exhibitionist: {
            label: { neutral: 'Exhibicionista', masc: 'Exhibicionista', fem: 'Exhibicionista' },
            info: {
                neutral: 'Te gusta ser vistx.',
                masc:    'Te gusta ser visto.',
                fem:     'Te gusta ser vista.'
            }
        },
        degrader: {
            label: { neutral: 'Degrader', masc: 'Degrader', fem: 'Degrader' },
            info: {
                neutral: 'Disfrutás degradar consensuadamente; el aftercare es clave.',
                masc:    'Disfrutás degradar consensuadamente; el aftercare es clave.',
                fem:     'Disfrutás degradar consensuadamente; el aftercare es clave.'
            }
        },
        brat_tamer: {
            label: { neutral: 'Brat tamer', masc: 'Brat tamer', fem: 'Brat tamer' },
            info: {
                neutral: 'Dom que disfruta la resistencia traviesa y “dar lecciones”.',
                masc:    'Dom que disfruta la resistencia traviesa y “dar lecciones”.',
                fem:     'Dom que disfruta la resistencia traviesa y “dar lecciones”.'
            }
        },
        sadist: {
            label: { neutral: 'Sádicx', masc: 'Sádico', fem: 'Sádica' },
            info: {
                neutral: 'Te gusta provocar dolor de forma segura y leer reacciones.',
                masc:    'Te gusta provocar dolor de forma segura y leer reacciones.',
                fem:     'Te gusta provocar dolor de forma segura y leer reacciones.'
            }
        },
        vanilla: {
            label: { neutral: 'Vanilla', masc: 'Vanilla', fem: 'Vanilla' },
            info: {
                neutral: 'Preferís intimidad/romance convencional — válido.',
                masc:    'Preferís intimidad/romance convencional — válido.',
                fem:     'Preferís intimidad/romance convencional — válido.'
            }
        }
    };

    // ---------------------------
    // Ítems en es-AR con variantes por género
    // ---------------------------
    type Item = { id: number; text: { neutral: string; masc: string; fem: string } };

    const ITEMS: Item[] = [
        { id: 1, text: {
                neutral: 'Te gusta que te dominen, sobre todo en la cama.',
                masc:    'Te gusta que te dominen, sobre todo en la cama.',
                fem:     'Te gusta que te dominen, sobre todo en la cama.'
            }},
        { id: 2, text: {
                neutral: 'Te gusta recibir dolor en sexo/BDSM y ver las marcas después.',
                masc:    'Te gusta recibir dolor en sexo/BDSM y ver las marcas después.',
                fem:     'Te gusta recibir dolor en sexo/BDSM y ver las marcas después.'
            }},
        { id: 3, text: {
                neutral: 'Preferís tomar las decisiones sexuales por tu pareja: te da más control.',
                masc:    'Preferís tomar las decisiones sexuales por tu pareja: te da más control.',
                fem:     'Preferís tomar las decisiones sexuales por tu pareja: te da más control.'
            }},
        { id: 4, text: {
                neutral: 'No te molesta una resistencia juguetona; igual sentís que al final vas a ganar.',
                masc:    'No te molesta una resistencia juguetona; igual sentís que al final vas a ganar.',
                fem:     'No te molesta una resistencia juguetona; igual sentís que al final vas a ganar.'
            }},
        { id: 5, text: {
                neutral: 'Te gusta forzar la sumisión de tu pareja, más que una sumisión espontánea.',
                masc:    'Te gusta forzar la sumisión de tu pareja, más que una sumisión espontánea.',
                fem:     'Te gusta forzar la sumisión de tu pareja, más que una sumisión espontánea.'
            }},
        { id: 6, text: {
                neutral: 'Sentirte físicamente sobrepasadx es de las sensaciones más liberadoras.',
                masc:    'Sentirte físicamente sobrepasado es de las sensaciones más liberadoras.',
                fem:     'Sentirte físicamente sobrepasada es de las sensaciones más liberadoras.'
            }},
        { id: 7, text: {
                neutral: 'Te gustaría tener sexo con varias personas a la vez.',
                masc:    'Te gustaría tener sexo con varias personas a la vez.',
                fem:     'Te gustaría tener sexo con varias personas a la vez.'
            }},
        { id: 8, text: {
                neutral: 'Te gusta cuando te miran desnude o teniendo sexo.',
                masc:    'Te gusta cuando te miran desnudo o teniendo sexo.',
                fem:     'Te gusta cuando te miran desnuda o teniendo sexo.'
            }},
        { id: 9, text: {
                neutral: 'Idealmente, te gustaría dar órdenes y que tu pareja obedezca como títere, haga lo que le digas.',
                masc:    'Idealmente, te gustaría dar órdenes y que tu pareja obedezca como títere, haga lo que le digas.',
                fem:     'Idealmente, te gustaría dar órdenes y que tu pareja obedezca como títere, haga lo que le digas.'
            }},
        { id: 10, text: {
                neutral: 'No te gusta tomar decisiones sexuales; preferís que tu pareja las tome por vos.',
                masc:    'No te gusta tomar decisiones sexuales; preferís que tu pareja las tome por vos.',
                fem:     'No te gusta tomar decisiones sexuales; preferís que tu pareja las tome por vos.'
            }},
        { id: 11, text: {
                neutral: 'Te encanta hacer que tus parejas hagan cosas bien asquerosas, solo por tu placer.',
                masc:    'Te encanta hacer que tus parejas hagan cosas bien asquerosas, solo por tu placer.',
                fem:     'Te encanta hacer que tus parejas hagan cosas bien asquerosas, solo por tu placer.'
            }},
        { id: 12, text: {
                neutral: 'Estás dispuestx a probar cualquier cosa una vez, aunque creas que no te va a gustar.',
                masc:    'Estás dispuesto a probar cualquier cosa una vez, aunque creas que no te va a gustar.',
                fem:     'Estás dispuesta a probar cualquier cosa una vez, aunque creas que no te va a gustar.'
            }},
        { id: 13, text: {
                neutral: 'Restringir físicamente a tu pareja durante sexo/BDSM te excita.',
                masc:    'Restringir físicamente a tu pareja durante sexo/BDSM te excita.',
                fem:     'Restringir físicamente a tu pareja durante sexo/BDSM te excita.'
            }},
        { id: 14, text: {
                neutral: 'Te gusta mandar nudes o videos íntimos tuyos.',
                masc:    'Te gusta mandar nudes o videos íntimos tuyos.',
                fem:     'Te gusta mandar nudes o videos íntimos tuyos.'
            }},
        { id: 15, text: {
                neutral: 'Te gusta estar totalmente indefensx y a merced de tu pareja, sin poder resistirte.',
                masc:    'Te gusta estar totalmente indefenso y a merced de tu pareja, sin poder resistirte.',
                fem:     'Te gusta estar totalmente indefensa y a merced de tu pareja, sin poder resistirte.'
            }},
        { id: 16, text: {
                neutral: 'Recibir cuidado, que te mimen, etc., es de lo principal que buscás en una relación.',
                masc:    'Recibir cuidado, que te mimen, etc., es de lo principal que buscás en una relación.',
                fem:     'Recibir cuidado, que te mimen, etc., es de lo principal que buscás en una relación.'
            }},
        { id: 17, text: {
                neutral: 'Te atraen las grandes diferencias de edad en encuentros sexuales o relaciones.',
                masc:    'Te atraen las grandes diferencias de edad en encuentros sexuales o relaciones.',
                fem:     'Te atraen las grandes diferencias de edad en encuentros sexuales o relaciones.'
            }},
        { id: 18, text: {
                neutral: 'En actos sexuales, si a vos te da más placer, la incomodidad de tu pareja te resulta casi irrelevante.',
                masc:    'En actos sexuales, si a vos te da más placer, la incomodidad de tu pareja te resulta casi irrelevante.',
                fem:     'En actos sexuales, si a vos te da más placer, la incomodidad de tu pareja te resulta casi irrelevante.'
            }},
        { id: 19, text: {
                neutral: 'Disfrutás jugar o actuar como una mascota.',
                masc:    'Disfrutás jugar o actuar como una mascota.',
                fem:     'Disfrutás jugar o actuar como una mascota.'
            }},
        { id: 20, text: {
                neutral: 'Dar cuidado, mimar a tu pareja, etc., es de lo principal que buscás en una relación.',
                masc:    'Dar cuidado, mimar a tu pareja, etc., es de lo principal que buscás en una relación.',
                fem:     'Dar cuidado, mimar a tu pareja, etc., es de lo principal que buscás en una relación.'
            }},
        { id: 21, text: {
                neutral: 'Que te traten con poco o nada de respeto durante sexo/BDSM te excita.',
                masc:    'Que te traten con poco o nada de respeto durante sexo/BDSM te excita.',
                fem:     'Que te traten con poco o nada de respeto durante sexo/BDSM te excita.'
            }},
        { id: 22, text: {
                neutral: 'No ves razón para que el sexo tenga que ser solo en espacios privados, aislados del mundo.',
                masc:    'No ves razón para que el sexo tenga que ser solo en espacios privados, aislados del mundo.',
                fem:     'No ves razón para que el sexo tenga que ser solo en espacios privados, aislados del mundo.'
            }},
        { id: 23, text: {
                neutral: 'En la cama a veces das pelea, pero eso no significa que quieras ganarla.',
                masc:    'En la cama a veces das pelea, pero eso no significa que quieras ganarla.',
                fem:     'En la cama a veces das pelea, pero eso no significa que quieras ganarla.'
            }},
        { id: 24, text: {
                neutral: 'El costado romántico en una relación te importa mucho más que lo sexual o lo kinky.',
                masc:    'El costado romántico en una relación te importa mucho más que lo sexual o lo kinky.',
                fem:     'El costado romántico en una relación te importa mucho más que lo sexual o lo kinky.'
            }},
        { id: 25, text: {
                neutral: 'Actualmente tenés un Amo/Ama en tu vida.',
                masc:    'Actualmente tenés un Amo/Ama en tu vida.',
                fem:     'Actualmente tenés un Amo/Ama en tu vida.'
            }},
        { id: 26, text: {
                neutral: 'Te gustaría servir en un marco formal con entrenamiento explícito de esclavx, posiciones y rituales pautados, etc.',
                masc:    'Te gustaría servir en un marco formal con entrenamiento explícito de esclavo, posiciones y rituales pautados, etc.',
                fem:     'Te gustaría servir en un marco formal con entrenamiento explícito de esclava, posiciones y rituales pautados, etc.'
            }},
        { id: 27, text: {
                neutral: 'Tu objetivo máximo en la vida es complacer a tu(s) pareja(s), y harías casi cualquier cosa para lograrlo.',
                masc:    'Tu objetivo máximo en la vida es complacer a tu(s) pareja(s), y harías casi cualquier cosa para lograrlo.',
                fem:     'Tu objetivo máximo en la vida es complacer a tu(s) pareja(s), y harías casi cualquier cosa para lograrlo.'
            }},
        { id: 28, text: {
                neutral: 'Necesitás probar cosas nuevas todo el tiempo; una rutina sexual no te haría feliz.',
                masc:    'Necesitás probar cosas nuevas todo el tiempo; una rutina sexual no te haría feliz.',
                fem:     'Necesitás probar cosas nuevas todo el tiempo; una rutina sexual no te haría feliz.'
            }},
        { id: 29, text: {
                neutral: 'Si estuvieras solterx, te gustaría sumarte a la relación de una pareja o grupo poli por motivos sexuales y/o afectivos.',
                masc:    'Si estuvieras soltero, te gustaría sumarte a la relación de una pareja o grupo poli por motivos sexuales y/o afectivos.',
                fem:     'Si estuvieras soltera, te gustaría sumarte a la relación de una pareja o grupo poli por motivos sexuales y/o afectivos.'
            }},
        { id: 30, text: {
                neutral: 'Estar físicamente restringidx durante sexo/BDSM te excita.',
                masc:    'Estar físicamente restringido durante sexo/BDSM te excita.',
                fem:     'Estar físicamente restringida durante sexo/BDSM te excita.'
            }},
        { id: 31, text: {
                neutral: 'Disfrutás sentirte como una presa cazada por un depredador.',
                masc:    'Disfrutás sentirte como una presa cazada por un depredador.',
                fem:     'Disfrutás sentirte como una presa cazada por un depredador.'
            }},
        { id: 32, text: {
                neutral: 'No tenés ningún fetiche específico ni gustos sexuales “no estándar”.',
                masc:    'No tenés ningún fetiche específico ni gustos sexuales “no estándar”.',
                fem:     'No tenés ningún fetiche específico ni gustos sexuales “no estándar”.'
            }},
        { id: 33, text: {
                neutral: 'Ser parte de un grupo de esclavxs que sirve a un Amo/Ama te suena a una vida que te re va.',
                masc:    'Ser parte de un grupo de esclavos que sirve a un Amo/Ama te suena a una vida que te re va.',
                fem:     'Ser parte de un grupo de esclavas que sirve a un Amo/Ama te suena a una vida que te re va.'
            }},
        { id: 34, text: {
                neutral: 'Te gustaría quedar completamente atadx durante sexo/BDSM.',
                masc:    'Te gustaría quedar completamente atado durante sexo/BDSM.',
                fem:     'Te gustaría quedar completamente atada durante sexo/BDSM.'
            }},
        { id: 35, text: {
                neutral: 'Te gusta que te mantengan como mascota: en jaula, comiendo de un bowl, recibiendo mimos, etc.',
                masc:    'Te gusta que te mantengan como mascota: en jaula, comiendo de un bowl, recibiendo mimos, etc.',
                fem:     'Te gusta que te mantengan como mascota: en jaula, comiendo de un bowl, recibiendo mimos, etc.'
            }},
        { id: 36, text: {
                neutral: 'Te encanta ver el miedo en los ojos de tu pareja cuando sabe que le vas a infligir dolor.',
                masc:    'Te encanta ver el miedo en los ojos de tu pareja cuando sabe que le vas a infligir dolor.',
                fem:     'Te encanta ver el miedo en los ojos de tu pareja cuando sabe que le vas a infligir dolor.'
            }},
        { id: 37, text: {
                neutral: 'A veces te calienta que tu(s) pareja(s) te degraden y humillen sexualmente.',
                masc:    'A veces te calienta que tu(s) pareja(s) te degraden y humillen sexualmente.',
                fem:     'A veces te calienta que tu(s) pareja(s) te degraden y humillen sexualmente.'
            }},
        { id: 38, text: {
                neutral: 'Te gustaría no ser nada más que unx esclavx sexual 24/7.',
                masc:    'Te gustaría no ser nada más que un esclavo sexual 24/7.',
                fem:     'Te gustaría no ser nada más que una esclava sexual 24/7.'
            }},
        { id: 39, text: {
                neutral: 'Tratar a tu pareja con poco o nada de respeto durante sexo/BDSM te excita.',
                masc:    'Tratar a tu pareja con poco o nada de respeto durante sexo/BDSM te excita.',
                fem:     'Tratar a tu pareja con poco o nada de respeto durante sexo/BDSM te excita.'
            }},
        { id: 40, text: {
                neutral: 'Te gusta que te fuercen a someterte, más que someterte espontáneamente.',
                masc:    'Te gusta que te fuercen a someterte, más que someterte espontáneamente.',
                fem:     'Te gusta que te fuercen a someterte, más que someterte espontáneamente.'
            }},
        { id: 41, text: {
                neutral: 'Te gustaría que tu pareja quede completamente atadx durante sexo/BDSM.',
                masc:    'Te gustaría que tu pareja quede completamente atada durante sexo/BDSM.',
                fem:     'Te gustaría que tu pareja quede completamente atada durante sexo/BDSM.'
            }},
        { id: 42, text: {
                neutral: 'Tenés un montón de fantasías sexuales que te gustaría probar, más que la mayoría de tus pares kinkys.',
                masc:    'Tenés un montón de fantasías sexuales que te gustaría probar, más que la mayoría de tus pares kinkys.',
                fem:     'Tenés un montón de fantasías sexuales que te gustaría probar, más que la mayoría de tus pares kinkys.'
            }},
        { id: 43, text: {
                neutral: 'Podés ser sexualmente sumisx ahora y dominante en otro momento.',
                masc:    'Podés ser sexualmente sumiso ahora y dominante en otro momento.',
                fem:     'Podés ser sexualmente sumisa ahora y dominante en otro momento.'
            }},
        { id: 44, text: {
                neutral: 'Estás dispuestx a pagar porno si calza perfecto con tus intereses sexuales.',
                masc:    'Estás dispuesto a pagar porno si calza perfecto con tus intereses sexuales.',
                fem:     'Estás dispuesta a pagar porno si calza perfecto con tus intereses sexuales.'
            }},
        { id: 45, text: {
                neutral: 'Estás totalmente bien con que tu(s) pareja(s) tenga(n) sexo con otras personas.',
                masc:    'Estás totalmente bien con que tu(s) pareja(s) tenga(n) sexo con otras personas.',
                fem:     'Estás totalmente bien con que tu(s) pareja(s) tenga(n) sexo con otras personas.'
            }},
        { id: 46, text: {
                neutral: 'En una relación ideal, tu pareja te vería como un mero objeto de servicio o sexo.',
                masc:    'En una relación ideal, tu pareja te vería como un mero objeto de servicio o sexo.',
                fem:     'En una relación ideal, tu pareja te vería como un mero objeto de servicio o sexo.'
            }},
        { id: 47, text: {
                neutral: 'Hacer sufrir a tu pareja por tu placer es de las mejores cosas de la vida.',
                masc:    'Hacer sufrir a tu pareja por tu placer es de las mejores cosas de la vida.',
                fem:     'Hacer sufrir a tu pareja por tu placer es de las mejores cosas de la vida.'
            }},
        { id: 48, text: {
                neutral: 'Vivir con un grupo de esclavxs de tu propiedad que te sirvan sería tu objetivo definitivo.',
                masc:    'Vivir con un grupo de esclavos de tu propiedad que te sirvan sería tu objetivo definitivo.',
                fem:     'Vivir con un grupo de esclavas de tu propiedad que te sirvan sería tu objetivo definitivo.'
            }},
        { id: 49, text: {
                neutral: 'Si algo que probás te sale mal, no es grave; el riesgo es parte del descubrimiento.',
                masc:    'Si algo que probás te sale mal, no es grave; el riesgo es parte del descubrimiento.',
                fem:     'Si algo que probás te sale mal, no es grave; el riesgo es parte del descubrimiento.'
            }},
        { id: 50, text: {
                neutral: 'Actualmente estás en una relación a largo plazo.',
                masc:    'Actualmente estás en una relación a largo plazo.',
                fem:     'Actualmente estás en una relación a largo plazo.'
            }},
        { id: 51, text: {
                neutral: 'Tenés fantasías sexuales que, como mínimo, sería poco ético ejecutar.',
                masc:    'Tenés fantasías sexuales que, como mínimo, sería poco ético ejecutar.',
                fem:     'Tenés fantasías sexuales que, como mínimo, sería poco ético ejecutar.'
            }},
        { id: 52, text: {
                neutral: 'Te gustaría darle a tu(s) pareja(s) un entrenamiento explícito de esclavx.',
                masc:    'Te gustaría darle a tu(s) pareja(s) un entrenamiento explícito de esclavo.',
                fem:     'Te gustaría darle a tu(s) pareja(s) un entrenamiento explícito de esclava.'
            }},
        { id: 53, text: {
                neutral: 'En cuestionarios como este, solés elegir respuestas extremas.',
                masc:    'En cuestionarios como este, solés elegir respuestas extremas.',
                fem:     'En cuestionarios como este, solés elegir respuestas extremas.'
            }},
        { id: 54, text: {
                neutral: 'Disfrutás mantener a tu pareja como mascota: jaula, comedero, mimos, etc.',
                masc:    'Disfrutás mantener a tu pareja como mascota: jaula, comedero, mimos, etc.',
                fem:     'Disfrutás mantener a tu pareja como mascota: jaula, comedero, mimos, etc.'
            }},
        { id: 55, text: {
                neutral: 'Si no podés cumplir todos los deseos de tu pareja, la animarías a ver a otras personas.',
                masc:    'Si no podés cumplir todos los deseos de tu pareja, la animarías a ver a otras personas.',
                fem:     'Si no podés cumplir todos los deseos de tu pareja, la animarías a ver a otras personas.'
            }},
        { id: 56, text: {
                neutral: 'Que tu pareja tenga múltiples parejas mientras vos sigas mono (salvo tríos) te parece bien.',
                masc:    'Que tu pareja tenga múltiples parejas mientras vos sigas mono (salvo tríos) te parece bien.',
                fem:     'Que tu pareja tenga múltiples parejas mientras vos sigas mono (salvo tríos) te parece bien.'
            }},
        { id: 57, text: {
                neutral: 'Seguido te comportás de forma animal en el sexo (gruñir, aullar, etc.).',
                masc:    'Seguido te comportás de forma animal en el sexo (gruñir, aullar, etc.).',
                fem:     'Seguido te comportás de forma animal en el sexo (gruñir, aullar, etc.).'
            }},
        { id: 58, text: {
                neutral: 'En una relación ideal no tendrías límites firmes y tu vida pertenecería a tu pareja.',
                masc:    'En una relación ideal no tendrías límites firmes y tu vida pertenecería a tu pareja.',
                fem:     'En una relación ideal no tendrías límites firmes y tu vida pertenecería a tu pareja.'
            }},
        { id: 59, text: {
                neutral: 'Harías mucho para que tu apariencia coincida con los deseos de tu pareja.',
                masc:    'Harías mucho para que tu apariencia coincida con los deseos de tu pareja.',
                fem:     'Harías mucho para que tu apariencia coincida con los deseos de tu pareja.'
            }},
        { id: 60, text: {
                neutral: 'Si algunos deseos no se cumplen, verías a otras personas.',
                masc:    'Si algunos deseos no se cumplen, verías a otras personas.',
                fem:     'Si algunos deseos no se cumplen, verías a otras personas.'
            }},
        { id: 61, text: {
                neutral: 'Disfrutás sentirte como un depredador cazando a su presa.',
                masc:    'Disfrutás sentirte como un depredador cazando a su presa.',
                fem:     'Disfrutás sentirte como una depredadora cazando a su presa.'
            }},
        { id: 62, text: {
                neutral: 'Te gusta cuando tu pareja toma un rol de cuidado y guía (adulto) en la relación.',
                masc:    'Te gusta cuando tu pareja toma un rol de cuidado y guía (adulto) en la relación.',
                fem:     'Te gusta cuando tu pareja toma un rol de cuidado y guía (adulta) en la relación.'
            }},
        { id: 63, text: {
                neutral: 'Disfrutás ver a otras personas desnudas o teniendo sexo.',
                masc:    'Disfrutás ver a otras personas desnudas o teniendo sexo.',
                fem:     'Disfrutás ver a otras personas desnudas o teniendo sexo.'
            }},
        { id: 64, text: {
                neutral: 'Te gustaría que tu(s) pareja(s) se sometan a vos 24/7 y asumir la responsabilidad que eso conlleva.',
                masc:    'Te gustaría que tu(s) pareja(s) se sometan a vos 24/7 y asumir la responsabilidad que eso conlleva.',
                fem:     'Te gustaría que tu(s) pareja(s) se sometan a vos 24/7 y asumir la responsabilidad que eso conlleva.'
            }},
        { id: 65, text: {
                neutral: 'Te gusta que tu(s) pareja(s) estén completamente a cargo en la cama, dándote órdenes.',
                masc:    'Te gusta que tu(s) pareja(s) estén completamente a cargo en la cama, dándote órdenes.',
                fem:     'Te gusta que tu(s) pareja(s) estén completamente a cargo en la cama, dándote órdenes.'
            }},
        { id: 66, text: {
                neutral: 'Si pudieras ganar plata vendiendo clips porno tuyos, lo harías.',
                masc:    'Si pudieras ganar plata vendiendo clips porno tuyos, lo harías.',
                fem:     'Si pudieras ganar plata vendiendo clips porno tuyos, lo harías.'
            }},
        { id: 67, text: {
                neutral: 'Sentir miedo de lo que tu pareja te va a hacer (dentro del consenso) te excita.',
                masc:    'Sentir miedo de lo que tu pareja te va a hacer (dentro del consenso) te excita.',
                fem:     'Sentir miedo de lo que tu pareja te va a hacer (dentro del consenso) te excita.'
            }},
        { id: 68, text: {
                neutral: 'Sentís la necesidad de servir a tu pareja y tratarla con el máximo respeto, dirigiéndote a ella como superior.',
                masc:    'Sentís la necesidad de servir a tu pareja y tratarla con el máximo respeto, dirigiéndote a ella como superior.',
                fem:     'Sentís la necesidad de servir a tu pareja y tratarla con el máximo respeto, dirigiéndote a ella como superior.'
            }},
        { id: 69, text: {
                neutral: 'Responderle al dominante en tono travieso/desobediente debería ser parte de la diversión del/la sub.',
                masc:    'Responderle al dominante en tono travieso/desobediente debería ser parte de la diversión del/la sub.',
                fem:     'Responderle al dominante en tono travieso/desobediente debería ser parte de la diversión de la sub.'
            }},
        { id: 70, text: {
                neutral: 'En actos sexuales, tu propia incomodidad es irrelevante si le da más placer a tu pareja.',
                masc:    'En actos sexuales, tu propia incomodidad es irrelevante si le da más placer a tu pareja.',
                fem:     'En actos sexuales, tu propia incomodidad es irrelevante si le da más placer a tu pareja.'
            }},
        { id: 71, text: {
                neutral: 'No necesitás placer físico del sexo: si tu pareja la está pasando bien, con eso te alcanza.',
                masc:    'No necesitás placer físico del sexo: si tu pareja la está pasando bien, con eso te alcanza.',
                fem:     'No necesitás placer físico del sexo: si tu pareja la está pasando bien, con eso te alcanza.'
            }},
        { id: 72, text: {
                neutral: 'Disfrutás degradar verbalmente a tu pareja o ponerle apodos humillantes durante sexo/BDSM.',
                masc:    'Disfrutás degradar verbalmente a tu pareja o ponerle apodos humillantes durante sexo/BDSM.',
                fem:     'Disfrutás degradar verbalmente a tu pareja o ponerle apodos humillantes durante sexo/BDSM.'
            }},
        { id: 73, text: {
                neutral: 'A veces, mirar a la gente tener sexo es más divertido que participar.',
                masc:    'A veces, mirar a la gente tener sexo es más divertido que participar.',
                fem:     'A veces, mirar a la gente tener sexo es más divertido que participar.'
            }},
        { id: 74, text: {
                neutral: 'Te gusta cuando tu pareja juega o actúa como una mascota.',
                masc:    'Te gusta cuando tu pareja juega o actúa como una mascota.',
                fem:     'Te gusta cuando tu pareja juega o actúa como una mascota.'
            }},
        { id: 75, text: {
                neutral: 'Te gusta estar completamente a cargo en la cama y darle órdenes a tu(s) pareja(s).',
                masc:    'Te gusta estar completamente a cargo en la cama y darle órdenes a tu(s) pareja(s).',
                fem:     'Te gusta estar completamente a cargo en la cama y darle órdenes a tu(s) pareja(s).'
            }},
        { id: 76, text: {
                neutral: 'La idea de ser torturadx sexualmente te resulta atractiva.',
                masc:    'La idea de ser torturado sexualmente te resulta atractiva.',
                fem:     'La idea de ser torturada sexualmente te resulta atractiva.'
            }},
        { id: 77, text: {
                neutral: 'Tener que hacer cosas muy asquerosas por el placer de tu pareja te excita.',
                masc:    'Tener que hacer cosas muy asquerosas por el placer de tu pareja te excita.',
                fem:     'Tener que hacer cosas muy asquerosas por el placer de tu pareja te excita.'
            }},
        { id: 78, text: {
                neutral: 'Estarías dispuestx a dejar todo para vivir la vida BDSM de tus sueños.',
                masc:    'Estarías dispuesto a dejar todo para vivir la vida BDSM de tus sueños.',
                fem:     'Estarías dispuesta a dejar todo para vivir la vida BDSM de tus sueños.'
            }},
        { id: 79, text: {
                neutral: 'Te gusta infligir dolor en sexo/BDSM y ver los resultados después.',
                masc:    'Te gusta infligir dolor en sexo/BDSM y ver los resultados después.',
                fem:     'Te gusta infligir dolor en sexo/BDSM y ver los resultados después.'
            }},
        { id: 80, text: {
                neutral: 'No podrías ser siempre dominante o siempre sumisx; necesitás ambas.',
                masc:    'No podrías ser siempre dominante o siempre sumiso; necesitás ambas.',
                fem:     'No podrías ser siempre dominante o siempre sumisa; necesitás ambas.'
            }},
        { id: 81, text: {
                neutral: 'Te gusta dominar a tu(s) pareja(s), sobre todo en la cama.',
                masc:    'Te gusta dominar a tu(s) pareja(s), sobre todo en la cama.',
                fem:     'Te gusta dominar a tu(s) pareja(s), sobre todo en la cama.'
            }},
        { id: 82, text: {
                neutral: 'A veces te gusta degradar y/o humillar sexualmente a tu(s) pareja(s).',
                masc:    'A veces te gusta degradar y/o humillar sexualmente a tu(s) pareja(s).',
                fem:     'A veces te gusta degradar y/o humillar sexualmente a tu(s) pareja(s).'
            }},
        { id: 83, text: {
                neutral: 'De forma natural, asumís un rol de cuidado y guía (adulto) en la relación.',
                masc:    'De forma natural, asumís un rol de cuidado y guía (adulto) en la relación.',
                fem:     'De forma natural, asumís un rol de cuidado y guía (adulta) en la relación.'
            }},
        { id: 84, text: {
                neutral: 'La idea de torturar sexualmente a alguien te resulta atractiva.',
                masc:    'La idea de torturar sexualmente a alguien te resulta atractiva.',
                fem:     'La idea de torturar sexualmente a alguien te resulta atractiva.'
            }},
        { id: 85, text: {
                neutral: 'Si a tu pareja realmente le gustara usarte como urinario, lo permitirías.',
                masc:    'Si a tu pareja realmente le gustara usarte como urinario, lo permitirías.',
                fem:     'Si a tu pareja realmente le gustara usarte como urinaria, lo permitirías.'
            }},
        { id: 86, text: {
                neutral: 'Te gustaría someterte a tu pareja 24/7 y ver el servicio como tu propósito de vida.',
                masc:    'Te gustaría someterte a tu pareja 24/7 y ver el servicio como tu propósito de vida.',
                fem:     'Te gustaría someterte a tu pareja 24/7 y ver el servicio como tu propósito de vida.'
            }},
        { id: 87, text: {
                neutral: 'Querés que tu pareja te sirva y te trate como superior.',
                masc:    'Querés que tu pareja te sirva y te trate como superior.',
                fem:     'Querés que tu pareja te sirva y te trate como superior.'
            }},
        { id: 88, text: {
                neutral: 'Disfrutás que te degraden verbalmente o que te llamen con apodos humillantes durante sexo/BDSM.',
                masc:    'Disfrutás que te degraden verbalmente o que te llamen con apodos humillantes durante sexo/BDSM.',
                fem:     'Disfrutás que te degraden verbalmente o que te llamen con apodos humillantes durante sexo/BDSM.'
            }},
    ];

    // ---------------------------
    // UI: escalas
    // ---------------------------
    const SCALE = [
        { v: 1, es: 'Totalmente en desacuerdo' },
        { v: 2, es: 'En desacuerdo' },
        { v: 3, es: 'Algo en desacuerdo' },
        { v: 4, es: 'Neutral / sin opinión' },
        { v: 5, es: 'Algo de acuerdo' },
        { v: 6, es: 'De acuerdo' },
        { v: 7, es: 'Totalmente de acuerdo' },
    ];

    // gender from auth store (no intro)
    function mapGender(dsGender?: DSUserGender | null): UiGender {
        switch (dsGender) {
            case DSUserGender.MALE:
            case DSUserGender.TRANSGENDER_MALE:
                return 'masc';
            case DSUserGender.FEMALE:
            case DSUserGender.TRANSGENDER_FEMALE:
                return 'fem';
            default:
                return 'neutral';
        }
    }

    // ---------------------------
    // Persistencia de respuestas (+ género)
    // ---------------------------
    function load() {
        try { return JSON.parse(typeof window !== 'undefined' ? (localStorage.getItem(LS_KEY) ?? '{}') : '{}'); } catch { return {}; }
    }
    function save() {
        if (typeof window === 'undefined') return;
        localStorage.setItem(LS_KEY, JSON.stringify({ answers, idx, gender, stage, submitted }));
    }

    const saved = load();

    // --- Estado de respuestas ---
    let answers: number[] = saved.answers ?? Array.from({ length: ITEMS.length }, () => 0);
    let idx: number = Math.min(saved.idx ?? 0, ITEMS.length - 1);
    let copied = false;
    let posting = false; // seguimos usándolo internamente
    let postOk: boolean | null = null; // pero no se muestra
    let stage: 'quiz' | 'results' = saved.stage ?? 'quiz';
    let submitted: boolean = saved.submitted ?? false;

    // auth after answers exists
    const dSauth = get(dSuserAuthStore);
    const escortAuth = get(escortAuthStore);

    // gender logic...
    let gender: UiGender;

    const escortGender = escortAuth?.user?.profile?.gender;
    const dSUserGender = dSauth?.user?.gender;

    if (escortGender != null) {
        gender = mapGender(escortGender);
    } else if (dSUserGender != null) {
        gender = mapGender(dSUserGender);
    } else {
        gender = saved.gender as UiGender ?? undefined;
    }

    // ask only if truly unknown before we default
    let genderAsked: boolean = !escortAuth?.user && !dSauth?.user && (gender === undefined);

    function handleAuthChange() {
        const escortUser = get(escortAuthStore)?.user;
        if (escortUser?.profile?.gender != null) {
            gender = mapGender(escortUser.profile.gender);
            genderAsked = false;
            save();
            return;
        }

        const dSUser = get(dSuserAuthStore)?.user;
        if (dSUser?.gender != null) {
            gender = mapGender(dSUser.gender);
            genderAsked = false;
            save();
            return;
        }

        // No user logged in, check saved gender
        if (!saved.gender) {
            genderAsked = true;
        }
    }

    dSuserAuthStore.subscribe(handleAuthChange);
    escortAuthStore.subscribe(handleAuthChange);

    // Si no hay género y no hay nada guardado → preguntar
    if (gender === undefined) {
        genderAsked = true; // mostramos el picker
        // no seteamos default ni guardamos todavía
    } else {
        // ensure defined type
        gender = gender ?? 'neutral';
    }

    // ---------------------------
    // Render por género
    // ---------------------------
    function displayText(item: Item): string {
        return item.text[gender];
    }

    // Reactive progress + remaining + milestones
    let lastProgress = 0;
    let lastMilestone = 0;
    let showMilestoneToast = false;
    let milestoneMsg = '';

    $: answeredCount = answers.filter(a => a !== 0).length;
    $: progress = Math.round((answeredCount / ITEMS.length) * 100);
    $: remaining = ITEMS.length - answeredCount;

    // Milestones to nudge: 10, 25, 50, 75, 90
    const MILES = [10, 25, 50, 75, 90];
    $: {
      const crossed = MILES.find(m => lastMilestone < m && progress >= m);
      if (crossed && stage === 'quiz') {
        lastMilestone = crossed;
        milestoneMsg = crossed === 90
          ? 'Último push, quedan poquitas '
          : crossed === 75
            ? '¡75%! ya casi, no aflojes '
            : crossed === 50
              ? 'Mitad del camino, crack '
              : crossed === 25
                ? '25% done — ritmo activado '
                : 'Ya arrancaste, seguí así ';
        showMilestoneToast = true;
        setTimeout(() => showMilestoneToast = false, 1500);
      }
      lastProgress = progress;
    }

    // Quick-finish: fill remaining with Neutral (4) and push to results
    function quickFinishNeutral() {
      if (stage !== 'quiz') return;
      const next = [...answers];
      for (let i = 0; i < next.length; i++) if (next[i] === 0) next[i] = 4;
      answers = next;
      idx = ITEMS.length - 1;
      save();
      stage = 'results';
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
      showFinishFx = true;
      setTimeout(() => showFinishFx = false, 1800);
      autoSubmitIfNeeded();
    }

    // Inactivity nudge (soft)
    let nudgeTimer: number | null = null;
    function bumpNudgeTimer() {
      if (nudgeTimer) clearTimeout(nudgeTimer);
      // 22s without answering? whisper a nudge
      nudgeTimer = setTimeout(() => {
        if (stage === 'quiz' && remaining > 0) {
          posthog.capture('bdsm_test_nudge_shown', { remaining, progress });
          nudgeVisible = true;
          setTimeout(() => nudgeVisible = false, 2500);
        }
      }, 22000) as unknown as number;
    }
    let nudgeVisible = false;

    function onUserAction() { bumpNudgeTimer(); }

    // ---------------------------
    // Mensajes motivacionales (arg)
    // ---------------------------
    function encouragement(p: number): string {
        if (p === 0) return 'Arrancamos tranqui. Elegí una opción y vamoʼs.';
        if (p < 10) return 'Bien ahí, ya prendió el motor 🔥';
        if (p < 25) return 'Vamos que falta bocha pero venís bien 💪';
        if (p < 40) return 'Ya tomaste ritmo, no aflojes 😉';
        if (p < 55) return 'Mitad de cancha: estamos cada vez más cerca 🏁';
        if (p < 70) return 'Se siente la remontada… muy bien 👀';
        if (p < 85) return 'Último sprint, quedás de 10 🙌';
        if (p < 100) return 'Casi casi… dos toques más y sale 🎯';
        return 'Listo, la rompiste. Mirá tu perfil 😎';
    }

    // ---------------------------
    // Flow de respuestas
    // ---------------------------
    function setAnswer(v: number) {
        if (stage !== 'quiz') return;
        onUserAction();
        const next = [...answers];
        next[idx] = v;
        answers = next;

        if (unansweredCount() === 0) {
            posthog.capture('bdsm_test_finished');
            stage = 'results';
            save();
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
            showFinishFx = true;
            setTimeout(() => showFinishFx = false, 1800);
            autoSubmitIfNeeded();
            return;
        }

        if (idx < ITEMS.length - 1) idx = idx + 1;
        save();
    }
    function prev() {
        if (stage === 'quiz' && idx > 0) { idx = idx - 1; save(); }
        onUserAction();
    }
    function skip() {
        if (stage === 'quiz' && idx < ITEMS.length - 1) { idx = idx + 1; save(); }
        onUserAction();
    }
    function unansweredCount() { return answers.filter(a => a === 0).length; }
    function canViewResults() { return unansweredCount() === 0; }
    function jumpToFirstUnanswered() { if (stage !== 'quiz') return; const j = answers.findIndex(a => a === 0); if (j >= 0) { idx = j; save(); } }

    function resetAll() {
        answers = Array.from({ length: ITEMS.length }, () => 0);
        idx = 0; stage = 'quiz'; postOk = null; posting = false; submitted = false; save();
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
    }

    let testInitiated = false;
    function trackTestInitiated() {
        if (testInitiated || genderAsked) return;
        posthog.capture('bdsm_test_initiated', { gender: gender });
        testInitiated = true;
    }

    // Selección de género
    function setGender(g: UiGender) {
        gender = g;
        genderAsked = false;
        save();
        trackTestInitiated();
    }

    // ---------------------------
    // Scoring
    // ---------------------------
    type WeightMap = Partial<Record<RoleId, number>>;
    const RULES: { re: RegExp; add: WeightMap }[] = [
        { re: /dominen|completamente a cargo|someterte 24\/7|propósito de vida/i, add: { submissive: 2, slave: 1 } },
        { re: /recibir dolor|torturad[oa]x?|miedo de lo que tu pareja te va a hacer/i, add: { masochist: 2, submissive: 1 } },
        { re: /tomar las decisiones sexuales|estar completamente a cargo|dar(les)? órdenes|me sirva.*superior/i, add: { dominant: 2 } },
        { re: /resistencia juguetona|responderle al dominante.*travieso|dar pelea.*cama/i, add: { brat_tamer: 1, dominant: 1, brat: 1 } },
        { re: /forzar la sumisión|tratar.*poco o nada de respeto.*excita/i, add: { degrader: 1, dominant: 1, sadist: 1 } },
        { re: /sobrepasad[oa]x?|forzar.*a someterte/i, add: { primal_prey: 1, submissive: 1 } },
        { re: /varias personas a la vez|grupo poli|otras personas|múltiples parejas.*mono/i, add: { non_monogamist: 2 } },
        { re: /ver a otras personas desnudas|mirar a la gente tener sexo/i, add: { voyeur: 2 } },
        { re: /te miran desnud[oa]x?|vender clips porno|mandar nudes/i, add: { exhibitionist: 2 } },
        { re: /órdenes.*obedezca.*títere|entrenamiento explícito de esclav[oa]x?|se sometan a vos 24\/7.*responsabilidad/i, add: { master_mistress: 2, dominant: 1 } },
        { re: /no te gusta tomar decisiones sexuales/i, add: { submissive: 2 } },
        { re: /cosas.*asqueros[ao]s/i, add: { degrader: 2, degradee: 1 } },
        { re: /probar cualquier cosa|probar cosas nuevas|riesgo.*parte del descubrimiento/i, add: { experimentalist: 2 } },
        { re: /res(tringir|tringido).*pareja|atad[oa]x?.*pareja|entrenamiento explícito de esclav[oa]/i, add: { rigger: 2, dominant: 1 } },
        { re: /quedar completamente atad[oa]x?|restringid[oa]x? físicamente|totalmente indefens[oa]x?/i, add: { rope_bunny: 2, submissive: 1 } },
        { re: /mascota|jaula|bowl|comedero/i, add: { pet: 2, owner: 1 } },
        { re: /dar cuidado.*mimar|rol de cuidado y guía/i, add: { owner: 1, dominant: 1 } },
        { re: /poco o nada de respeto.*te excita|degraden.*humillen sexualmente/i, add: { degradee: 2 } },
        { re: /sexo.*solo.*espacios privados/i, add: { exhibitionist: 1, voyeur: 1 } },
        { re: /dar pelea.*no significa que quieras ganarla/i, add: { brat: 2, primal_prey: 1 } },
        { re: /romántico.*más que lo sexual/i, add: { vanilla: 1 } },
        { re: /Amo\/Ama en tu vida|marco formal.*entrenamiento explícito de esclav[oa]x?|objetivo.*complacer.*pareja/i, add: { slave: 2 } },
        { re: /grupo de esclav[oa]s.*(te re va|objetivo definitivo)/i, add: { slave: 2, master_mistress: 1 } },
        { re: /miedo.*infligir dolor|hacer sufrir.*placer/i, add: { sadist: 2 } },
        { re: /sumisx.*ahora.*dominante.*otro momento|no podrías ser siempre (dominante|sumisx)/i, add: { switch: 3 } },
        { re: /mero objeto/i, add: { slave: 1, degradee: 1 } },
        { re: /forma animal.*sexo|presa cazada por un depredador/i, add: { primal_prey: 2 } },
        { re: /depredador cazando/i, add: { primal_hunter: 2 } },
        { re: /servir a tu pareja.*superior|no tendrías límites firmes.*vida pertenecería/i, add: { slave: 2 } },
        { re: /degradar verbalmente a tu pareja|degradar y\/o humillar sexualmente/i, add: { degrader: 2 } },
        { re: /que te degraden verbalmente|apodos humillantes/i, add: { degradee: 2 } },
        { re: /dominar a tu\(s\) pareja\(s\)/i, add: { dominant: 2 } },
        { re: /no tenés ningún fetiche específico/i, add: { vanilla: 1 } }
    ];

    function score(): { role: RoleId; pct: number }[] {
        const totals: Record<RoleId, number> = Object.fromEntries(Object.keys(ROLES_G).map(k => [k as RoleId, 0])) as Record<RoleId, number>;
        const maxes: Record<RoleId, number> = Object.fromEntries(Object.keys(ROLES_G).map(k => [k as RoleId, 0])) as Record<RoleId, number>;

        for (let i = 0; i < ITEMS.length; i++) {
            const a = answers[i];
            if (!a) continue;
            const norm = a - 4; // -3..+3
            const textNeutral = ITEMS[i].text.neutral;
            for (const r of RULES) {
                if (r.re.test(textNeutral)) {
                    for (const [role, w] of Object.entries(r.add)) {
                        totals[role as RoleId] += (w as number) * norm;
                        maxes[role as RoleId] += Math.abs(w as number) * 3;
                    }
                }
            }
        }
        return (Object.keys(ROLES_G) as RoleId[]).map(role => {
            const max = Math.max(1, maxes[role]);
            const raw = totals[role];
            const pct = Math.round(((raw + max) / (2 * max)) * 100); // 50 = neutral
            return { role, pct };
        }).sort((a, b) => b.pct - a.pct);
    }

    async function copyResults() {
        const res = score();
        const lines = res.map(r => `${r.pct}%\t${ROLES_G[r.role].label[gender]} \tMás info`).join('\n');
        await navigator.clipboard.writeText(`${lines}\n\nCopiá tus resultados a tu perfil.`);
        copied = true; setTimeout(() => copied = false, 1400);
    }

    // ---------------------------
    // Submit al backend (auto + retry)
    // ---------------------------
    async function submitResultsOnce(): Promise<boolean> {
        posting = true; postOk = null;
        try {
            const payload = {
                lang: 'es-AR',
                gender,
                langdoc_version: 5,
                answers,
                questions: ITEMS.map((item, i) => ({
                    id: item.id,
                    text: item.text[gender],
                    answer: answers[i] ?? 0
                })),
                roles: score(),
                total_items: ITEMS.length,
                completed_at: new Date().toISOString(),
            };
            const resp = await fetch(`${import.meta.env.VITE_API_URL}/bdsm-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            const ok = resp.ok;
            postOk = ok;
            if (ok) { submitted = true; save(); }
            return ok;
        } catch (_) {
            postOk = false;
            return false;
        } finally {
            posting = false;
        }
    }

    async function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

    async function autoSubmitIfNeeded() {
        if (submitted || !canViewResults() || posting) return;
        const delays = [0, 1500, 3000];
        for (let i = 0; i < delays.length; i++) {
            if (delays[i]) await sleep(delays[i]);
            const ok = await submitResultsOnce();
            if (ok) return;
        }
        // si falla, se reintenta en background silencioso
    }

    // --- Atajos de teclado en QUIZ ---
    function handleKey(e: KeyboardEvent) {
        if (stage !== 'quiz') return;
        if (/^[1-7]$/.test(e.key)) { setAnswer(parseInt(e.key, 10)); return; }
        if (e.key === 'Enter') { setAnswer(4); return; }
        if (e.key === 'ArrowRight') { skip(); return; }
        if (e.key === 'ArrowLeft') { prev(); return; }
    }

    // FX final
    let showFinishFx = false;

    onMount(() => {
        window.addEventListener('keydown', handleKey);
        if (stage === 'results' && !submitted) autoSubmitIfNeeded();
        trackTestInitiated();
        bumpNudgeTimer();
    });
    onDestroy(() => {
        window.removeEventListener('keydown', handleKey);
        if (stage === 'quiz' && answers.some(a => a !== 0)) {
            posthog.capture('bdsm_test_abandoned', {
                questions_answered: answers.filter(a => a !== 0).length,
                progress_percentage: progress
            });
        }
    });

    // === EXPORT IMAGE ===
    let htmlToImage: typeof HtmlToImageNS | null = null;
    onMount(async () => {
        htmlToImage = await import('html-to-image');
    });

    // ⬇️ binds to the card we will export
    let exportNode: HTMLElement | null = null;

    function topRoles(limit = 6) {
        return score().slice(0, limit);
    }

    // Safari/Android-friendly: build the blob once and reuse
    async function exportResultsBlob(): Promise<Blob | null> {
      if (!htmlToImage) return null;

      await tick(); // flush DOM
      await new Promise((r) => setTimeout(r, 50)); // fonts/paint

      if (!exportNode) {
        console.error('exportNode is missing. Did you bind it?');
        return null;
      }
      try {
        const blob = await htmlToImage.toBlob(exportNode, {
          pixelRatio: 2,
          backgroundColor: '#000000',
          cacheBust: true
        });
        if (!blob) throw new Error('toBlob returned null');
        return blob;
      } catch (err) {
        console.error(err);
        alert('No pude exportar la imagen. Probá otra vez o intentá en Chrome/Edge.');
        return null;
      }
    }

    function canWebShareFiles(file: File) {
      // Web Share Level 2 support check
      // iOS Safari 16+/Chrome Android ✅, desktop usually ❌
      // @ts-ignore - canShare may not exist in TS lib
      return typeof navigator !== 'undefined'
        && 'share' in navigator
        && 'canShare' in navigator
        // @ts-ignore
        && navigator.canShare?.({ files: [file] });
    }

    function downloadBlob(blob: Blob, filename: string) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a); // iOS quirk
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    // NEW: Share on mobile if possible, else download (desktop)
    async function shareOrDownloadResultsImage() {
      const blob = await exportResultsBlob();
      if (!blob) return;

      const filename = 'bdsm-test-resultados.jpg';

      try {
        // Try share-first
        const file = new File([blob], filename, { type: 'image/jpeg' });
        if (canWebShareFiles(file)) {
          // @ts-ignore
          await navigator.share({
            title: 'Mis resultados del Test BDSM',
            text: 'Estos son mis resultados del Test BDSM de Daisy’s Secrets ',
            files: [file]
          });
          return; // done
        }
      } catch (err) {
        // If user cancels share, just stop silently
        console.warn('Share aborted or failed, falling back to download…', err);
      }

      // Fallback: download
      downloadBlob(blob, filename);
    }
</script>

<svelte:head>
    <title>Test BDSM en Español 2025 | Descubrí tu perfil kinky</title>
    <meta name="description" content="Tomá el test BDSM gratis en español (2025). Descubrí si sos dominante, sumisx, switch, experimentalista y más. .">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://daisyssecrets.com/bdsm-test" />
    <meta property="og:title" content="Test BDSM en Español 2025 | Descubrí tu perfil kinky" />
    <meta property="og:description" content="Descubrí tus roles BDSM: dominante, sumisx, switch, rope bunny, exhibicionista y más. Gratis, en español, con enfoque SSC/RACK." />
    <meta property="og:image" content="https://daisyssecrets.com/og-bdsm-test.jpg" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://daisyssecrets.com/bdsm-test" />
    <meta name="twitter:title" content="Test BDSM en Español 2025 | Descubrí tu perfil kinky" />
    <meta name="twitter:description" content="Descubrí tus roles BDSM: dominante, sumisx, switch, rope bunny, exhibicionista y más. Gratis, en español, con enfoque SSC/RACK." />
    <meta name="twitter:image" content="https://daisyssecrets.com/og-bdsm-test.jpg" />

    <!-- Structured Data JSON-LD -->
    <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "Quiz",
            "name": "Test BDSM en Español",
            "description": "Descubrí tu perfil kinky con este test BDSM gratis en español. Basado en roles como dominante, sumisx, switch, experimentalista, voyeur, etc.",
            "educationalUse": "selfAssessment",
            "genre": "quiz",
            "inLanguage": "es-AR",
            "url": "https://daisyssecrets.com/bdsm-test",
            "publisher": {
            "@type": "Organization",
                "name": "Daisy’s Secrets",
                "url": "https://daisyssecrets.com"
        }
        }
    </script>
</svelte:head>

<div class="mx-auto max-w-[720px] min-h-[100svh] flex flex-col px-3 sm:px-4 pb-20">
    <!-- Milestone Toast -->
    {#if showMilestoneToast}
      <div class="fixed top-14 left-1/2 -translate-x-1/2 z-20 text-[12px] px-3 py-1.5 rounded-lg bg-white text-black shadow">
        {milestoneMsg}
      </div>
    {/if}

    <!-- Inactivity Nudge -->
    {#if nudgeVisible}
      <div class="fixed bottom-14 left-1/2 -translate-x-1/2 z-20 text-[12px] px-3 py-2 rounded-lg border border-neutral-700 bg-black/85 backdrop-blur">
        Falta {remaining} — dale que ya estás
      </div>
    {/if}

    <!-- HEADER (compact) -->
    <header class="pt-3 pb-2 sticky top-0 bg-black/70 backdrop-blur z-10 border-b border-neutral-900">
        <div class="flex items-center justify-between gap-3">
            <div>
                <h1 class="text-[18px] font-semibold tracking-tight">Test BDSM</h1>
            </div>
            <div class="text-[11px] text-neutral-500">
                Lenguaje:
                {#if genderAsked}
                    elegir
                {:else}
                    {gender === 'masc' ? 'masculino' : gender === 'fem' ? 'femenino' : 'neutro'}
                {/if}
            </div>
        </div>

        <!-- PROGRESS BAR -->
        <div class="mt-2 h-[6px] w-full rounded bg-neutral-800 overflow-hidden" aria-label="Progreso">
          <div class="h-full bg-white transition-all duration-300 ease-out" style="width: {progress}%"></div>
        </div>
        <div class="mt-1 text-[11px] text-neutral-400">
          {progress}% completado · {answeredCount}/{ITEMS.length}
        </div>

        <!-- Encouragement -->
        <div class="mt-1 text-[11px] text-neutral-400 italic">
            {encouragement(progress)}
        </div>
    </header>

    {#if genderAsked}
        <!-- GENDER PICKER -->
        <main class="flex-1 flex flex-col items-center justify-center text-center py-10">
            <h2 class="text-[16px] font-semibold">Elegí cómo querés ver el lenguaje</h2>
            <p class="mt-1 text-[12px] text-neutral-400">Podés cambiarlo después. Si iniciás sesión, usamos tu perfil.</p>
            <div class="mt-4 grid grid-cols-3 gap-2 w-full max-w-xs">
                <button class="py-3 rounded-lg bg-white text-black" on:click={() => setGender('masc')}>
                    Masculino
                </button>
                <button class="py-3 rounded-lg bg-white text-black" on:click={() => setGender('fem')}>
                    Femenino
                </button>
                <button class="py-3 rounded-lg bg-white text-black" on:click={() => setGender('neutral')}>
                    Neutro
                </button>
            </div>
        </main>

    {:else if stage === 'quiz'}
        <!-- QUIZ -->
        <main class="flex-1">
            <div class="mt-4 text-[12px] text-neutral-400">Q{idx + 1}</div>
            <div class="mt-2 text-[17px] leading-snug">{displayText(ITEMS[idx])}</div>

            <!-- BIG CHIPS -->
            <div class="mt-3 grid grid-cols-1 gap-1.5">
                {#each SCALE as s}
                    <button
                            class="w-full py-2.5 px-3 border border-neutral-700 rounded-lg text-[13px] hover:bg-neutral-900 active:scale-[.99] transition"
                            on:click={() => setAnswer(s.v)}
                    >
                        {s.es}
                    </button>
                {/each}
            </div>

            <!-- QUICK NAV -->
            <div class="mt-3 flex items-center gap-2 text-[12px]">
              <button class="underline text-neutral-400 disabled:opacity-40" on:click={prev} disabled={idx===0}>Atrás</button>
              <span class="text-neutral-600">·</span>
              <button class="underline text-neutral-400" on:click={jumpToFirstUnanswered}>Ir a la primera sin responder</button>
            </div>

            <!-- Gentle nudge actions -->
            <div class="mt-4 grid grid-cols-1 gap-2">
              <button class="w-full py-2.5 px-3 border border-neutral-700 rounded-lg text-[13px] hover:bg-neutral-900 active:scale-[.99] transition"
                      on:click={quickFinishNeutral}>
                Terminar rápido con “Neutral” en las que faltan
              </button>
            </div>
        </main>

    {:else if stage === 'results'}
        <!-- FX de finalización -->
        {#if showFinishFx}
            <div class="finish-fx pointer-events-none fixed inset-0 flex items-center justify-center">
                <div class="fx-card">
                    <svg viewBox="0 0 24 24" class="fx-check">
                        <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <div class="fx-txt">¡Completado!</div>
                </div>
                {#each Array(14) as _, i}
                    <span class="confetti" style="--i:{i}"></span>
                {/each}
            </div>
        {/if}

        <!-- RESULTS -->
        <main class="flex-1">
            <!-- ⬇️ THIS is the area we capture in the JPG -->
            <div class="export-card rounded-lg border border-neutral-800 p-4"
                 bind:this={exportNode}>
                <h2 class="mt-1 text-[16px] font-semibold">Tu perfil</h2>
                <p class="text-[16px] text-pink-400 font-bold drop-shadow-[0_0_6px_#ec4899]">
                    Daisy's Secrets | daisys.app
                </p>


                {#each score() as r}
                    <details class="mt-2 border border-neutral-800 rounded-lg">
                        <summary class="flex items-center justify-between px-3 py-2 cursor-pointer">
                            <div class="flex items-center gap-3">
                                <div class="w-10 text-right tabular-nums">{r.pct}%</div>
                                <div class="font-medium">{ROLES_G[r.role].label[gender]}</div>
                            </div>
                            <div class="text-[11px] text-neutral-500">Más info</div>
                        </summary>
                        <div class="px-3 pb-2 text-[13px] text-neutral-300">{ROLES_G[r.role].info[gender]}</div>
                    </details>
                {/each}
            </div>

            <section class="mt-6">
                <h3 class="text-[13px] text-neutral-400 mb-2">Exportar/Compartir</h3>
                <div class="mt-3 grid grid-cols-1 gap-2">
                    <button
                        class="w-full py-3 px-4 rounded-lg text-sm font-semibold bg-white text-black"
                        on:click={shareOrDownloadResultsImage}
                    >
                        Compartir en móvil / Descargar en desktop
                    </button>
                </div>
            </section>

            <!-- Sin mensajes de guardado -->
            <div class="mt-4 grid grid-cols-1 gap-2">
                <button class="w-full py-3 px-4 rounded-lg text-sm font-semibold bg-neutral-500 text-black" on:click={copyResults}>
                    {copied ? '¡Copiado!' : 'Copiar resultados'}
                </button>
                <button class="w-full py-3 px-4 rounded-lg text-sm border border-neutral-700" on:click={resetAll}>
                    Empezar de nuevo
                </button>
            </div>

            <div class="mt-4 text-[11px] text-neutral-500 leading-relaxed">
                Seguridad: Solo adultos. Negociá límites, palabras de seguridad y aftercare.
            </div>
        </main>
    {/if}

    <!-- FOOTER TIP -->
    <footer class="fixed bottom-0 left-0 right-0 px-3 sm:px-4 py-2 bg-black/85 backdrop-blur border-t border-neutral-900">
        <div class="text-[11px] text-neutral-500">
            Tip: Flechas ← →, números 1–7 y Enter (Neutral) para avanzar. ¿Duda? Elegí “Neutral”.
        </div>
    </footer>
</div>

<style>
    :global(html, body) { background: #000; color: #fff; }
    details > summary { list-style: none; }
    details > summary::-webkit-details-marker { display: none; }
    :global(*) { -webkit-tap-highlight-color: transparent; }

    /* FX final */
    .finish-fx { z-index: 40; }
    .fx-card {
        display:flex; flex-direction:column; align-items:center; gap:.4rem;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.15);
        padding: 1rem 1.2rem; border-radius: 16px; color:#fff;
        backdrop-filter: blur(8px);
        animation: popin 300ms ease-out;
        box-shadow: 0 10px 40px rgba(0,0,0,.5);
    }
    .fx-check { width: 40px; height: 40px; color:#fff; }
    .fx-check path {
        stroke-dasharray: 30;
        stroke-dashoffset: 30;
        animation: draw 600ms ease forwards 100ms;
    }
    .fx-txt { font-weight: 600; letter-spacing:.2px }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    @keyframes popin {
        0% { transform: scale(.92); opacity: 0 }
        100% { transform: scale(1); opacity: 1 }
    }

    .confetti{
        position: fixed;
        top: 10%;
        width: 6px; height: 10px;
        background: hsl(calc(var(--i)*25), 80%, 60%);
        left: calc(50% + (var(--i) - 7) * 14px);
        transform: translateX(-50%);
        border-radius: 2px;
        opacity: 0;
        animation: drop 900ms ease-out forwards;
        animation-delay: calc(var(--i) * 20ms);
    }
    @keyframes drop{
        0% { transform: translate(-50%, -40px) rotate(0deg); opacity: 0; }
        20% { opacity: 1; }
        100% { transform: translate(-50%, 120px) rotate(360deg); opacity: 0; }
    }

    /* Export card keeps crisp lines on capture */
    .export-card {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
</style>