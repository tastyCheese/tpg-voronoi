<script setup lang="ts">
import { RouterView } from 'vue-router';
// @ts-expect-error no types declaration for this package
import KoFiButton from '@linusborg/vue-ko-fi-button';
</script>

<template>
<!--  <header>-->

<!--    <div class="wrapper">-->
<!--      <nav>-->
<!--        <RouterLink to="/">Home</RouterLink>-->
<!--      </nav>-->
<!--    </div>-->
<!--  </header>-->

  <RouterView />
  <footer class="footer">
    <div class="content has-text-centered">
      <KoFiButton
        username="scottytremaine"
        color="#29abe0"
        title="Buy me a drink"
      />
      <p>TPG Voronoi is an open source project managed by <a href="https://github.com/npfedwards">scottytremaine (Nathan Edwards)</a> with contributions from <a href="https://github.com/tastyCheese">tastyCheese (Gleb Pavliuk)</a></p>
      <p><small><a href="https://www.flaticon.com/free-icons/camera" title="camera icons">Camera icons created by Freepik - Flaticon</a></small></p>
    </div>
  </footer>
</template>

<style lang="scss">
@use '../node_modules/bulma/bulma.scss';

.thumbnail {
  max-width: 120px;
  max-height: 120px;
  display: inline-block;
}

.main-container {
  overflow: hidden;
  max-width: 100vw;
  max-height: 90vh;
  display:flex;
  justify-content: center;
  align-items: center;
}
</style>
