import mdItCustomAttrs from 'markdown-it-custom-attrs'
import navConfigs from "./AutoNav"
import sidebarConfig from "./AutoSidebar"

module.exports = {
    title: "XfyCoding博客",
    description: '一枚努力学习的程序员',
    base: '/blog/',
    lastUpdated: true,
    head: [
        ["link", { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/@fancyapps/ui/dist/fancybox.css" }],
        ["script", { src: "https://cdn.jsdelivr.net/npm/@fancyapps/ui@4.0/dist/fancybox.umd.js" }]
    ],
    cleanUrls: true,
    themeConfig: {
        logo: '/img/home/Xfycoding.jpg',
        siteTitle: 'XfyCoding博客',
        darkModeSwitchLabel: '切换日光/暗黑模式',
        // 配置顶部的文字(不配置则是英文)
        sidebarMenuLabel: '侧边栏目录',
        returnToTopLabel: '回到顶部',
        outlineTitle: '文章目录',
        // 表示显示h2-h6的标题
        outline: 'deep',
        lastUpdatedText: '更新时间',
        nav: navConfigs,
        sidebar: sidebarConfig,
        socialLinks: [
            { icon: "github", link: "https://github.com/Xfycoding" }
        ],
        footer: {
            copyright: 'Copyright ©2023-present XfyCoding 版权所有'
        },
        docFooter: {
            prev: '上一篇',
            next: '下一篇'
        },
        // 自定义扩展: 文章元数据配置
        articleMetadataConfig: {
            author: 'xfycoding', // 文章全局默认作者名称
            authorLink: '/', // 点击作者名时默认跳转的链接
        },
    },
    markdown: {
        lineNumbers: true,
        config: (md) => {
            // use more markdown-it plugins!
            md.use(mdItCustomAttrs, 'image', {
                'data-fancybox': "gallery"
            })
            md.renderer.rules.heading_close = (tokens, idx, options, env, slf) => {
                let htmlResult = slf.renderToken(tokens, idx, options);
                if (tokens[idx].tag === 'h1') htmlResult += `\n<ClientOnly><ArticlesMetadata :article="$frontmatter" /></ClientOnly>`;
                return htmlResult;
            }
        }
    }
}



