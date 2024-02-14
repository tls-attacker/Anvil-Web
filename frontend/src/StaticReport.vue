<template>
  <nav class="container-fluid">
    <ul>
      <li><img src="./assets/icon.png" style="height: 30px"/></li>
      <li>Anvil Report</li>
    </ul>
  </nav>
  <!-- <header class="container-fluid">
    Test
  </header> -->
  <main class="container">
    <ReportView :given-report="report"/>
  </main>
  <footer class="container-fluid">
    <a href="https://github.com/tls-attacker/tls-anvil/">TLS-Anvil</a>
  </footer>
</template>

<script setup lang="ts">
import ReportView from './views/ReportView.vue';
import report from "./assets/static_report.json";
</script>

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
