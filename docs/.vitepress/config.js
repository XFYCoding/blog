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
        }
    },
    markdown: {
        config: (md) => {
            // use more markdown-it plugins!
            md.use(mdItCustomAttrs, 'image', {
                'data-fancybox': "gallery"
            })
        }
    }
}



