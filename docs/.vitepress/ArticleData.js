const fs = require("fs");
const path = require("path");
import parseFrontmatter from 'gray-matter';

const excludedFiles = ['1-测试.md'];


const docsPath = path.resolve(__dirname, "../articles");

const articleFiles = getAllArticleFiles(docsPath);


function getAllArticleFiles(docsPath, files = []) {
  const dirs = fs.readdirSync(docsPath);

  dirs.forEach((dirsName) => {
    const filepath = path.join(docsPath, dirsName);
    const stat = fs.statSync(filepath);
    // 如果是文件
    if (stat.isDirectory()) {
      getAllArticleFiles(filepath, files);
    } else {
      const extname = path.extname(filepath);
      const filename = path.basename(filepath, extname);
      const fullFileName = filename + extname;

      if (!stat.isDirectory() && extname === ".md" && !excludedFiles.includes(fullFileName)) {
        files.push(filepath);
      }
    }
  });
  return files;
}

const articleDatas = articleFiles.map(articleFile => {
  const articleContent = fs.readFileSync(articleFile, 'utf-8');
  const { data } = parseFrontmatter(articleContent);
  return {
    ...data,
    path: articleFile.substring(articleFile.lastIndexOf('\\docs\\') + 6).replace(/\.md$/, ''),
  }
})

export default articleDatas;
