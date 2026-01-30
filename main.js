const generations = {
    1: [1, 151],
    2: [152, 251],
    3: [252, 386],
    4: [387, 493],
    5: [494, 649],
    6: [650, 721],
    7: [722, 809],
    8: [810, 905],
    9: [906, 1025]
};

const typeColors = {
    fire: '#ff6b6b', water: '#4dabf7', grass: '#51cf66',
    electric: '#ffd43b', ice: '#74c0fc', fighting: '#e8590c',
    poison: '#9c36b5', ground: '#e0a800', flying: '#748ffc',
    psychic: '#f06595', bug: '#94d82d', rock: '#868e96',
    ghost: '#5f3dc4', dragon: '#7048e8', dark: '#343a40',
    steel: '#adb5bd', fairy: '#faa2c1', normal: '#ced4da'
};

async function getRandomPokemon() {
    const container = document.getElementById('pokemonContainer');

    container.innerHTML = '';

    const checkedGens = Array.from(document.querySelectorAll('input[type=checkbox]:checked'))
        .map(cb => parseInt(cb.value));

    if(checkedGens.length === 0) {
        alert('Sélectionne au moins une génération !');
        return;
    }

    const usedIds = new Set();

    while(usedIds.size < 3) {
        const gen = checkedGens[Math.floor(Math.random() * checkedGens.length)];
        const [min, max] = generations[gen];
        const id = Math.floor(Math.random() * (max - min + 1)) + min;

        usedIds.add(id);
    }

    let index = 0;

    for(const id of usedIds) {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await res.json();

        const speciesRes = await fetch(data.species.url);
        const speciesData = await speciesRes.json();
        const nameFR = speciesData.names.find(n => n.language.name === 'fr')?.name || data.name;

        const mainType = data.types[0].type.name;
        const color = typeColors[mainType] || '#ff3e3e';

        const SHINY_RATE = 0.01;
        const isShiny = Math.random() < SHINY_RATE;

        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${index * 0.4}s`;
        card.style.setProperty('--type-color', color);

        if(isShiny) card.classList.add('shiny');

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-face card-front">Clique pour révéler</div>
                <div class="card-face card-back">
                    ${isShiny ? '<div class="shiny-star"></div>' : ''}
                    <img src="${isShiny && data.sprites.other['official-artwork'].front_shiny ? data.sprites.other['official-artwork'].front_shiny : data.sprites.other['official-artwork'].front_default || data.sprites.front_default}" alt="${nameFR}">
                    <p><a href="https://www.pokepedia.fr/${nameFR}" target="_blank">${nameFR}</a></p>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            card.classList.add('revealed');

            document.getElementById('flipSound').play();

            if(isShiny) document.getElementById('shinySound').play();
        });

        card.querySelector('a').addEventListener('click', (e) => e.stopPropagation());

        container.appendChild(card);

        index++;
    }
}