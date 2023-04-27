import navConfigs from "./AutoNav"
import sidebarConfig from "./AutoSidebar"

module.exports = {
    title: "XfyCoding博客",
    description: '一枚努力学习的程序员',
    base: '/blog/',
    lastUpdated: true,
    themeConfig: {
        logo: '/img/home/Xfycoding.jpg',
        siteTitle: 'XfyCoding博客',
        // 配置顶部的文字(不配置则是英文)
        outlineTitle: '文章目录',
        // 表示显示h2-h6的标题
        outline: 'deep',
        lastUpdatedText: 'Updated Date',
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



