<template>
  <Layout>
    <template #doc-top>
      <ToolBar />
    </template>
    <template #doc-bottom>
      <BackTop />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import DefaultTheme from "vitepress/theme";
import ToolBar from "./components/ToolBar.vue";
import BackTop from "./components/BackTop.vue";
import { useCopyCode } from "./composables/copyCode";
const { Layout } = DefaultTheme;
useCopyCode();
</script>

<style scoped></style>