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

canvas {
  background: white;
}
</style>
