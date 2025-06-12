<!-- src/routes/+page.svelte -->
<script lang="ts">
  let escorts = [
    { id: 1,  name: 'Lucía',     age: 26, photoUrl: '/images/lucia.jpg',     only_virtual: false, location: 'Palermo' },
    { id: 2,  name: 'Mariana',   age: 31, photoUrl: '/images/mariana.jpg',   only_virtual: true,  location: 'Belgrano' },
    { id: 3,  name: 'Sofía',     age: 28, photoUrl: '/images/sofia.jpg',     only_virtual: false, location: 'Recoleta' },
    { id: 4,  name: 'Carla',     age: 24, photoUrl: '/images/carla.jpg',     only_virtual: true,  location: 'San Telmo' },
    { id: 5,  name: 'Valentina', age: 29, photoUrl: '/images/valentina.jpg', only_virtual: false, location: 'Puerto Madero' },
    { id: 6,  name: 'Natalia',   age: 27, photoUrl: '/images/natalia.jpg',   only_virtual: true,  location: 'Villa Crespo' },
    { id: 7,  name: 'Camila',    age: 25, photoUrl: '/images/camila.jpg',    only_virtual: false, location: 'Caballito' },
    { id: 8,  name: 'Fernanda',  age: 30, photoUrl: '/images/fernanda.jpg',  only_virtual: true,  location: 'Almagro' },
    { id: 9,  name: 'Julieta',   age: 32, photoUrl: '/images/julieta.jpg',   only_virtual: false, location: 'Chacarita' },
    { id: 10, name: 'Antonella', age: 23, photoUrl: '/images/antonella.jpg', only_virtual: false, location: 'Villa Urquiza' },
    { id: 11, name: 'Gabriela',  age: 34, photoUrl: '/images/gabriela.jpg',  only_virtual: true,  location: 'Flores' },
    { id: 12, name: 'Isabela',   age: 28, photoUrl: '/images/isabela.jpg',   only_virtual: false, location: 'Nueva Pompeya' }
  ];
</script>

<main class="bg-black min-h-screen py-8 px-4">
  <div class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 place-items-center">
    {#each escorts as escort}
      <div class="relative bg-black rounded-lg overflow-hidden shadow-lg flex flex-col items-center">
        {#if escort.only_virtual}
          <span
                  class="absolute top-3 left-1/2 transform -translate-x-1/2 inline-block px-2 py-1 text-xs font-semibold bg-white text-black rounded"
          >
            Solo virtual
          </span>
        {/if}

        <img
                src={escort.photoUrl}
                alt={`Foto de ${escort.name}`}
                class="w-full h-64 object-cover"
        />

        <div class="p-6 text-white text-center">
          <h2 class="text-xl font-semibold">
            {escort.name}, {escort.age}
          </h2>
          <p class="text-sm opacity-80">
            {escort.location}
          </p>
        </div>
      </div>
    {/each}
  </div>
</main>
