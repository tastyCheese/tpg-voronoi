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
  max-width: 100%;
  max-height: 90%;
  display:flex;
  justify-content: center;
  align-items: center;
}
</style>
