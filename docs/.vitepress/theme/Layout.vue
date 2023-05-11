<template>
  <Layout>
    <template #doc-top>
      <ToolBar />
    </template>
    <template
      #doc-after
      v-if="
        (theme.commentConfig?.showComment ?? true) &&
        (frontmatter?.showComment ?? true)
      "
    >
      <Comment />
    </template>
    <template #doc-bottom>
      <BackTop />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import DefaultTheme from "vitepress/theme";
import { useData } from "vitepress";
import ToolBar from "./components/ToolBar.vue";
import BackTop from "./components/BackTop.vue";
import Comment from "./components/Comment.vue";
import { useCopyCode } from "./composables/copyCode";

const { Layout } = DefaultTheme;
const { page, theme, frontmatter } = useData();
useCopyCode();
</script>

<style scoped></style>