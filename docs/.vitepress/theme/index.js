import Theme from "vitepress/theme";
import "./styles/index.css";
import "element-plus/dist/index.css";
import elementplus from "element-plus";
import Layout from './Layout.vue';
import ArticlesMetadata from './components/ArticlesMetadata.vue';
import WorldCloud from "./components/WorldCloud.vue";

export default {
  ...Theme,
  // Layout() {
  //   useCopyCode();
  //   return h(Theme.Layout, null, {
  //     "doc-top": () => h(ToolBar),
  //     "doc-bottom": () => h(BackTop),
  //   });
  // },
  Layout: Layout,
  enhanceApp: async ({ app, router, siteData }) => {
    app.use(elementplus);
    app.component('ArticlesMetadata',ArticlesMetadata);
    app.component('WorldCloud',WorldCloud);
  },
};

