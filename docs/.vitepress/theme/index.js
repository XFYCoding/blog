import Theme from "vitepress/theme";
import "./styles/index.css";
import "element-plus/dist/index.css";
import elementplus from "element-plus";
import { h } from "vue";
import ToolBar from "../components/ToolBar.vue";
import BackTop from "../components/BackTop.vue";

export default {
  ...Theme,
  Layout() {
    return h(Theme.Layout, null, {
      "doc-top": () => h(ToolBar),
      "doc-bottom": () => h(BackTop)
    });
  },
  enhanceApp: async ({ app, router, siteData }) => {
    app.use(elementplus);
  },
};
