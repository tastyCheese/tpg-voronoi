<script setup lang="ts">
import { RouterView } from 'vue-router';
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
