const fs = require("fs");
const path = require("path");

const excludedDirs = ['1-我的标签@'];

const docsPath = path.resolve(__dirname, "../articles");

const sidebarConfig = generateSidebarConfig(docsPath, "/articles");

function generateSidebarConfig(docsPath, link,sidebarConfig = {}) {
    const files = fs.readdirSync(docsPath);
    if (link.endsWith("@")) {
        sidebarConfig[link] = generateSidebarDatas(docsPath, link);
        return;
    }
    files.sort(function (a, b) {
        return sortByNumber(a, b, "-");
    });

    files.forEach((filename) => {
        const filepath = path.join(docsPath, filename);
        const stat = fs.statSync(filepath);
        // 如果是文件
        if (stat.isDirectory()) {
            generateSidebarConfig(filepath, `${link}/${filename}`,sidebarConfig);
        }
    });
    return sidebarConfig;
}

function generateSidebarDatas(docsPath, link) {
    const datas = [];
    const files = fs.readdirSync(docsPath);

    files.sort(function (a, b) {
        return sortByNumber(a, b, "-");
    });

    files.forEach((filename) => {
        const data = {
            text: "",
            collapsible: true,
            collapsed: false,
            items: []
        };

        data.text = filename.split("-")[1];
        const filepath = path.join(docsPath, filename);
        const stat = fs.statSync(filepath);
        // 如果是文件
        if (stat.isDirectory()) {
            data.items = generateSidebarItems(filepath, `${link}/${filename}`);
        }
        datas.push(data);
    });
    return datas;
}

function generateSidebarItems(docsPath, link) {
    const item = [];
    const files = fs.readdirSync(docsPath);

    files.sort(function (a, b) {
        return sortByNumber(a, b, "-");
    });

    files.forEach((filename) => {
        const filepath = path.join(docsPath, filename);
        const extname = path.extname(filepath);
        const basename = path.basename(filepath, extname);
        const stat = fs.statSync(filepath);
        // 如果是文件
        if (!stat.isDirectory() && extname === ".md") {
            item.push({
                text: basename.split("-")[1],
                link: `${link}/${basename}`
            });
        }
    });
    return item;
}

function sortByNumber(obj1, obj2, separator) {
    var s1 = obj1.split(separator);
    var s2 = obj2.split(separator);
    return s1[0] - s2[0];
}

export default sidebarConfig;