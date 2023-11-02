<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <nav class="container-fluid">
    <ul>
      <li><img src="./assets/icon.png" style="height: 30px"/></li>
      <li>Anvil Web</li>
    </ul>
    <ul>
      <li><RouterLink to="/">Tests</RouterLink></li>
      <li><RouterLink to="/controller">Controller</RouterLink></li>
    </ul>
  </nav>
  <!-- <header class="container-fluid">
    Test
  </header> -->
  <main class="container">
    <RouterView></RouterView>
  </main>
  <footer class="container-fluid">
    <a href="https://github.com/tls-attacker/tls-anvil/">TLS-Anvil</a>
  </footer>
</template>

<style scoped>
nav {
  background-color: rgb(226, 232, 243);
  margin-bottom: 20px;
}
footer {
  margin-top: 20px;
  font-size: small;
}
</style>
