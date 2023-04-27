const fs = require("fs");
const path = require("path");


function generateItem(itemPath) {
    const items = [];
    const files = fs.readdirSync(itemPath);

    files.sort(function (a, b) {
        return sortByNumber(a, b, "-");
    });

    files.forEach((filename) => {
        //拼接路径
        const filepath = path.join(itemPath, filename);
        var finnalFileName = filename.split("-");
        //状态
        const stat = fs.statSync(filepath);
        // 如果是文件夹，则递归生成子级 sidebar 配置
        if (stat.isDirectory() && filename.endsWith("~")) {
            var link = findLink(filepath);
            items.push({
                text: finnalFileName[1].slice(0, -1),
                link: link
            });
        }
    });

    return items;
}

function findLink(linkPath) {
    if (linkPath === "" || linkPath === undefined) {
        return "";
    }

    const files = fs.readdirSync(linkPath);

    files.sort(function (a, b) {
        return sortByNumber(a, b, "-");
    });

    var fileName = files[0];

    if (fileName === "" || fileName === undefined) {
        return "";
    }


    //拼接路径
    const filepath = path.join(linkPath, fileName);
    const extname = path.extname(filepath);


    if (extname === ".md") {
        return filepath.split('docs')[1].replace('.md', '').replace(/\\/g, '/');
    }

    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
        return findLink(filepath);
    }

    return "";
}

function sortByNumber(obj1, obj2, separator) {
    var s1 = obj1.split(separator);
    var s2 = obj2.split(separator);
    return s1[0] - s2[0];
}

export default function generateNavConfig() {
    const navConfig = [];
    //获取articles路径
    const docsPath = path.resolve(__dirname, "../articles");
    //获取当前目录的文件
    const files = fs.readdirSync(docsPath);
    //排序
    files.sort(function (a, b) {
        return sortByNumber(a, b, "-");
    });

    files.forEach((filename) => {
        //拼接路径
        const filepath = path.join(docsPath, filename);
        var finnalFileName = filename.split("-");
        //状态
        const stat = fs.statSync(filepath);
        // 如果是文件夹，则递归生成子级 sidebar 配置
        if (stat.isDirectory()) {
            var items = generateItem(filepath);
            var temp = {};
            temp.text = finnalFileName[1];

            if (items.length == 0 && filename.endsWith("~")) {
                var link = findLink(filepath);
                temp.text = finnalFileName[1].slice(0, -1);
                temp.link = link;
            } else {
                temp.items = items;
            }
            navConfig.push(temp);
        }
    });
    return navConfig;
}