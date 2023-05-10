import mdItCustomAttrs from "markdown-it-custom-attrs";
import navConfigs from "./AutoNav";
import sidebarConfig from "./AutoSidebar";
import articleDatas from "./ArticleData";

module.exports = {
  title: "XfyCoding博客",
  description: "一枚努力学习的程序员",
  base: "/blog/",
  lastUpdated: true,
  head: [
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/@fancyapps/ui/dist/fancybox.css",
      },
    ],
    [
      "script",
      {
        src: "https://cdn.jsdelivr.net/npm/@fancyapps/ui@4.0/dist/fancybox.umd.js",
      },
    ],
  ],
  cleanUrls: true,
  themeConfig: {
    logo: "/img/home/Xfycoding.jpg",
    siteTitle: "XfyCoding博客",
    darkModeSwitchLabel: "切换日光/暗黑模式",
    // 配置顶部的文字(不配置则是英文)
    sidebarMenuLabel: "侧边栏目录",
    returnToTopLabel: "回到顶部",
    outlineTitle: "文章目录",
    // 表示显示h2-h6的标题
    outline: "deep",
    lastUpdatedText: "更新时间",
    nav: navConfigs,
    sidebar: sidebarConfig,
    socialLinks: [{ icon: "github", link: "https://github.com/Xfycoding" }],
    footer: {
      copyright: "Copyright ©2023-present XfyCoding 版权所有",
    },
    docFooter: {
      prev: "上一篇",
      next: "下一篇",
    },
    //algolia搜索
    search: {
        provider: "algolia",
        options: {
          appId: "VSH7Y698A0",
          apiKey: "b4419120f46dabfc02163b4fab75491e",
          indexName: "xfycodingblog",
          locales: {
            zh: {
              placeholder: "搜索文档",
              translations: {
                button: {
                  buttonText: "搜索文档",
                  buttonAriaLabel: "搜索文档",
                },
                modal: {
                  searchBox: {
                    resetButtonTitle: "清除查询条件",
                    resetButtonAriaLabel: "清除查询条件",
                    cancelButtonText: "取消",
                    cancelButtonAriaLabel: "取消",
                  },
                  startScreen: {
                    recentSearchesTitle: "搜索历史",
                    noRecentSearchesText: "没有搜索历史",
                    saveRecentSearchButtonTitle: "保存至搜索历史",
                    removeRecentSearchButtonTitle: "从搜索历史中移除",
                    favoriteSearchesTitle: "收藏",
                    removeFavoriteSearchButtonTitle: "从收藏中移除",
                  },
                  errorScreen: {
                    titleText: "无法获取结果",
                    helpText: "你可能需要检查你的网络连接",
                  },
                  footer: {
                    selectText: "选择",
                    navigateText: "切换",
                    closeText: "关闭",
                    searchByText: "搜索提供者",
                  },
                  noResultsScreen: {
                    noResultsText: "无法找到相关结果",
                    suggestedQueryText: "你可以尝试查询",
                    reportMissingResultsText: "你认为该查询应该有结果？",
                    reportMissingResultsLinkText: "点击反馈",
                  },
                },
              },
            },
          },
        },
      },
    // 自定义扩展区
    //文章元数据配置
    articleMetadataConfig: {
      author: "xfycoding", // 文章全局默认作者名称
      authorLink: "/", // 点击作者名时默认跳转的链接
    },
    //文章数据
    articleDatas: articleDatas,
  },
  markdown: {
    lineNumbers: true,
    config: (md) => {
      // use more markdown-it plugins!
      md.use(mdItCustomAttrs, "image", {
        "data-fancybox": "gallery",
      });
      md.renderer.rules.heading_close = (tokens, idx, options, env, slf) => {
        let htmlResult = slf.renderToken(tokens, idx, options);
        if (tokens[idx].tag === "h1")
          htmlResult += `\n<ClientOnly><ArticlesMetadata :article="$frontmatter" /></ClientOnly>`;
        return htmlResult;
      };
    },
  }
};
