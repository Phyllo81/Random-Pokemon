const typeColors = {
    fire:'#ff6b6b', water:'#4dabf7', grass:'#51cf66',
    electric:'#ffd43b', ice:'#74c0fc', fighting:'#e8590c',
    poison:'#9c36b5', ground:'#e0a800', flying:'#748ffc',
    psychic:'#f06595', bug:'#94d82d', rock:'#868e96',
    ghost:'#5f3dc4', dragon:'#7048e8', dark:'#343a40',
    steel:'#adb5bd', fairy:'#faa2c1', normal:'#ced4da'
};

const gameDexes = {
    red_blue: { base:["kanto"], dlc:[], regions:[] },
    lets_go: { base:["kanto"], dlc:[], regions:[] },
    gold_silver: { base:["original-johto"], dlc:[], regions:[] },
    ruby_sapphire: { base:["hoenn"], dlc:[], regions:[] },
    diamond_pearl: { base:["sinnoh"], dlc:[], regions:[] },
    black_white: { base:["unova"], dlc:[], regions:[] },
    x_y: { base:["kalos-central","kalos-coastal","kalos-mountain"], dlc:[], regions:["kalos"] },
    sun_moon: { base:["alola"], dlc:[], regions:["alola"] },
    sword_shield: { base:["galar"], dlc:["isle-of-armor","crown-tundra"], regions:["galar"] },
    legends_arceus: { base:["hisui"], dlc:[], regions:["hisui"] },
    scarlet_violet: { base:["paldea"], dlc:["kitakami","blueberry"], regions:["paldea","hisui"] }
};


let currentDexIds = [];

async function loadGameDex(game, includeDLC) {
    const dexes = [...gameDexes[game].base];

    if(includeDLC) dexes.push(...gameDexes[game].dlc);

    const ids = new Set();

    for(const dex of dexes) {
        const res = await fetch(`https://pokeapi.co/api/v2/pokedex/${dex}`);
        const data = await res.json();

        data.pokemon_entries.forEach(e =>
            ids.add(Number(e.pokemon_species.url.split('/').at(-2)))
        );
    }

    return [...ids];
}

let currentGameConfig = null;

async function refreshDex() {
    const game = document.getElementById("gameSelect").value;
    const dlc = document.getElementById("dlcToggle").checked;

    currentGameConfig = gameDexes[game];
    currentDexIds = await loadGameDex(game, dlc);
}

async function getRandomPokemonForm(species, allowedRegions) {
    const validForms = [];

    for(const v of species.varieties) {
        const name = v.pokemon.name;

        if(!name.includes('-')) {
            validForms.push(v.pokemon.url);
            continue;
        }

        if(
            allowedRegions.some(region => name.includes(region))
        ) {
            validForms.push(v.pokemon.url);
        }
    }

    return validForms[Math.floor(Math.random() * validForms.length)];
}

async function getRandomPokemon() {
    await refreshDex();

    const container = document.getElementById('pokemonContainer');

    container.innerHTML = '';

    const usedIds = new Set();

    while(usedIds.size < 3) {
        usedIds.add(
            currentDexIds[Math.floor(Math.random() * currentDexIds.length)]
        );
    }

    for(const id of usedIds) {
        const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
        const species = await speciesRes.json();

        const formUrl = await getRandomPokemonForm(
            species,
            currentGameConfig.regions
        );

        const res = await fetch(formUrl);
        const data = await res.json();

        let nameFR = species.names.find(n => n.language.name === 'fr')?.name || data.name;

        if(data.name.includes('-')) {
            nameFR += ` (${data.name.split('-').slice(1).join(' ')})`;
        }

        const type = data.types[0].type.name;
        const color = typeColors[type] || '#fff';

        const isShiny = Math.random() < 0.01;

        const card = document.createElement('div');
        card.className = 'card';
        card.style.setProperty('--type-color', color);

        if(isShiny) card.classList.add('shiny');

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-face card-front">Clique pour révéler</div>
                <div class="card-face card-back">
                    ${isShiny ? '<div class="shiny-star"></div>' : ''}
                    <img src="${
                        isShiny
                            ? data.sprites.other['official-artwork'].front_shiny
                            : data.sprites.other['official-artwork'].front_default
                    }">
                    <p><a href="https://www.pokepedia.fr/${nameFR}" target="_blank">${nameFR}</a></p>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            if(!card.classList.contains('revealed')) {
                card.classList.add('revealed');

                document.getElementById('flipSound').play();

                if(isShiny) document.getElementById('shinySound').play();
            }
        });

        card.querySelector('a').addEventListener('click', e => e.stopPropagation());
        
        container.appendChild(card);
    }
}
