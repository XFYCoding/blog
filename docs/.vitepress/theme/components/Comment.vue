<template>
  <div class="gitalk-container">
    <div id="gitalk-container"></div>
  </div>
</template>
<script>
import md5 from "md5";
import Gitalk from "gitalk";
import "gitalk/dist/gitalk.css";
export default {
  name: "git-talk",
  data() {
    return {};
  },
  mounted() {
    const commentConfig = {
      proxy: 'https://vercel.prohibitorum.top/github_access_token',
      clientID: "2253aa8e8a7f5145d59c",
      clientSecret: "22b7d4536da5132aa76287039e224f2dfc7580c0",
      repo: "blog-comments",
      owner: "xfycoding",
      admin: ["xfycoding"],
      id: md5(location.pathname),
      distractionFreeMode: false,
    };
    const gitalk = new Gitalk(commentConfig);
    gitalk.render("gitalk-container");
  },
};
</script>
<style>
.gitalk-container{
    margin-top: 30px;
}
.gt-container .gt-header-textarea {
  color: #000;
}
</style>

