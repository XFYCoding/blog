import navConfigs from "./AutoNav"
import sidebarConfig from "./AutoSidebar"

module.exports = {
    title: "XfyCoding博客",
    description: '一枚努力学习的程序员',
    base: '/blog/',
    lastUpdated: true,
    head: [
        // add jquert and fancybox
        ['script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.slim.min.js' }],
        ['script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.2/jquery.fancybox.min.js' }],
        ['link', { rel: 'stylesheet', type: 'text/css', href: 'https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.2/jquery.fancybox.min.css' }]
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
    }
}



