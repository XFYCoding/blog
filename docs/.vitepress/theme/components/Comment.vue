<template>
  <div class="gitalk-container">
    <div id="gitalk-container"></div>
  </div>
</template>
<script>
import md5 from "md5"
import Gitalk from "gitalk"
import "gitalk/dist/gitalk.css"
export default {
  name: "git-talk",
  data() {
    return {}
  },
  mounted() {
    const commentConfig = {
      clientID: "2253aa8e8a7f5145d59c",
      clientSecret: "1bf108cfa63e82a5bdd03c9b7fbc711628a9e1e3",
      repo: "blog",
      owner: "xfycoding",
      admin: ["xfycoding"],
      id: md5(location.pathname),
      distractionFreeMode: false,
    }
    const gitalk = new Gitalk(commentConfig)
    gitalk.render("gitalk-container")
  },
}
</script>
<style>
.gt-container .gt-header-textarea {
    margin-top: 10px;
  color: #000;
}
</style>

