<template>
  <div class="meta-wrapper">
    <div class="meta-item original">
      <el-tag
        class="ml-2"
        v-if="original"
        type="success"
        effect="dark"
        title="原创文章"
        round
        >原创文章</el-tag
      >
      <el-tag
        class="ml-2"
        v-else
        effect="dark"
        title="转载文章"
        type="warning"
        round
        >转载文章</el-tag
      >
    </div>
    <div class="meta-item">
      <span class="meta-icon author">
        <svg
          role="img"
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>原创作者</title>
          <path
            d="M858.5 763.6c-18.9-44.8-46.1-85-80.6-119.5-34.5-34.5-74.7-61.6-119.5-80.6-0.4-0.2-0.8-0.3-1.2-0.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-0.4 0.2-0.8 0.3-1.2 0.5-44.8 18.9-85 46-119.5 80.6-34.5 34.5-61.6 74.7-80.6 119.5C146.9 807.5 137 854 136 901.8c-0.1 4.5 3.5 8.2 8 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c0.1 4.4 3.6 7.8 8 7.8h60c4.5 0 8.1-3.7 8-8.2-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"
          ></path>
        </svg>
      </span>
      <span class="meta-content">
        <a v-if="original" :href="authorLink" title="进入作者主页">{{
          author
        }}</a>
        <span v-else :title="author">{{ author }}</span>
      </span>
    </div>

    <div class="meta-item" v-if="startDate != ''">
      <span class="meta-icon date">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="icon calendar-icon"
          viewBox="0 0 1024 1024"
          fill="currentColor"
          aria-label="calendar icon"
        >
          <title v-if="original">发布时间</title>
          <title v-else>转载时间</title>
          <path
            d="M716.4 110.137c0-18.753-14.72-33.473-33.472-33.473-18.753 0-33.473 14.72-33.473 33.473v33.473h66.993v-33.473zm-334.87 0c0-18.753-14.72-33.473-33.473-33.473s-33.52 14.72-33.52 33.473v33.473h66.993v-33.473zm468.81 33.52H716.4v100.465c0 18.753-14.72 33.473-33.472 33.473a33.145 33.145 0 01-33.473-33.473V143.657H381.53v100.465c0 18.753-14.72 33.473-33.473 33.473a33.145 33.145 0 01-33.473-33.473V143.657H180.6A134.314 134.314 0 0046.66 277.595v535.756A134.314 134.314 0 00180.6 947.289h669.74a134.36 134.36 0 00133.94-133.938V277.595a134.314 134.314 0 00-133.94-133.938zm33.473 267.877H147.126a33.145 33.145 0 01-33.473-33.473c0-18.752 14.72-33.473 33.473-33.473h736.687c18.752 0 33.472 14.72 33.472 33.473a33.145 33.145 0 01-33.472 33.473z"
          ></path>
        </svg>
      </span>
      <span class="meta-content">
        <span :title="startDate">{{ startDate }}</span>
      </span>
    </div>

    <div class="meta-item" v-if="readTime != ''">
      <span class="meta-icon author">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="icon timer-icon"
          viewBox="0 0 1024 1024"
          fill="currentColor"
          aria-label="timer icon"
        >
          <title>阅读时间</title>
          <path
            d="M799.387 122.15c4.402-2.978 7.38-7.897 7.38-13.463v-1.165c0-8.933-7.38-16.312-16.312-16.312H256.33c-8.933 0-16.311 7.38-16.311 16.312v1.165c0 5.825 2.977 10.874 7.637 13.592 4.143 194.44 97.22 354.963 220.201 392.763-122.204 37.542-214.893 196.511-220.2 389.397-4.661 5.049-7.638 11.651-7.638 19.03v5.825h566.49v-5.825c0-7.379-2.849-13.981-7.509-18.9-5.049-193.016-97.867-351.985-220.2-389.527 123.24-37.67 216.446-198.453 220.588-392.892zM531.16 450.445v352.632c117.674 1.553 211.787 40.778 211.787 88.676H304.097c0-48.286 95.149-87.382 213.728-88.676V450.445c-93.077-3.107-167.901-81.297-167.901-177.093 0-8.803 6.99-15.793 15.793-15.793 8.803 0 15.794 6.99 15.794 15.793 0 80.261 63.69 145.635 142.01 145.635s142.011-65.374 142.011-145.635c0-8.803 6.99-15.793 15.794-15.793s15.793 6.99 15.793 15.793c0 95.019-73.789 172.82-165.96 177.093z"
          ></path>
        </svg>
      </span>
      <span class="meta-content">
        <span :title="readTime">{{ readTime }}</span>
      </span>
    </div>

    <div class="meta-item tag" v-if="readTime != []">
      <span class="meta-icon tag">
        <svg
          role="img"
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>标签列表</title>
          <path
            d="M483.2 790.3L861.4 412c1.7-1.7 2.5-4 2.3-6.3l-25.5-301.4c-0.7-7.8-6.8-13.9-14.6-14.6L522.2 64.3c-2.3-0.2-4.7 0.6-6.3 2.3L137.7 444.8a8.03 8.03 0 0 0 0 11.3l334.2 334.2c3.1 3.2 8.2 3.2 11.3 0z m62.6-651.7l224.6 19 19 224.6L477.5 694 233.9 450.5l311.9-311.9z m60.16 186.23a48 48 0 1 0 67.88-67.89 48 48 0 1 0-67.88 67.89zM889.7 539.8l-39.6-39.5a8.03 8.03 0 0 0-11.3 0l-362 361.3-237.6-237a8.03 8.03 0 0 0-11.3 0l-39.6 39.5a8.03 8.03 0 0 0 0 11.3l243.2 242.8 39.6 39.5c3.1 3.1 8.2 3.1 11.3 0l407.3-406.6c3.1-3.1 3.1-8.2 0-11.3z"
          ></path>
        </svg>
      </span>
      <span class="meta-content">
        <span
          v-for="(tag, index) in tags"
          :key="index"
          style="margin-right: 3px"
        >
          <el-tag
            class="ml-2"
            @click="goToLink('/blog/', null, null)"
            effect="dark"
            :title="tag"
            >{{ tag }}</el-tag
          >
        </span>
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, toRefs, onMounted } from "vue";
import { useData } from "vitepress";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import relativeTime from "dayjs/plugin/relativeTime";
import { goToLink } from "../utils.js";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

// 定义文章属性
const props = defineProps({
  article: Object,
});

// 初始化文章元数据信息
const { theme, page, frontmatter } = useData();
console.log(props);
console.log(theme);

const data = reactive({
  original: props.article?.original ?? true,
  author: props.article?.author ?? theme.value.articleMetadataConfig.author,
  authorLink:
    props.article?.authorLink ?? theme.value.articleMetadataConfig.authorLink,
  startDate: props.article?.startDate ?? "",
  readTime: props.article?.readTime ?? "",
  tags: props.article?.tags ?? [],
});
const { original, author, authorLink, startDate, readTime, tags } =
  toRefs(data);
</script>

<style scoped>
.meta-wrapper {
  margin-top: 20px;
}

.meta-item {
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
  max-width: 240px;
  color: var(--vp-c-text-2);
  cursor: default;
  font-size: 14px;
}
.meta-item:not(.tag) {
  margin-right: 1rem;
}
.meta-item.original {
  margin-right: 0.5rem;
  margin-top: -0.5px;
}
.meta-icon,
meta-content {
  display: inline-block;
  margin-right: 0.375rem;
  vertical-align: middle;
}
.meta-icon {
  position: relative;
  bottom: 1.5px;
}
.meta-icon.author {
  bottom: 1.3px;
}
.meta-icon.date {
  bottom: 1.3px;
}
.meta-icon svg {
  fill: var(--vp-c-text-2);
  height: 16px;
  width: 16px;
}
.meta-content a {
  font-weight: 400;
  color: var(--vp-c-text-2);
}
.meta-content a:hover {
  color: var(--vp-c-brand);
}
</style>