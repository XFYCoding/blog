<template>
  <div class="timeline-wrap">
    <!-- 时间轴头部 -->
    <div class="timeline-header">
      <el-tag
        v-if="$year"
        class="content"
        closable
        @close="goToLink('/blog/articles/7-关于/1-文章索引@/1-文章库/2-时间轴')"
      >
        {{ $year }}年 (共 {{ $articleData.length }} 篇)
      </el-tag>
      <el-tag v-else class="content">
        共 {{ articleData.length }} 篇，未完待续······
      </el-tag>
    </div>

    <!-- 时间轴主体 -->
    <div class="timeline-item" v-for="(item, year) in archiveData">
      <div class="year">
        <img
          class="chinese-zodiac"
          @click="
            goToLink(
              '/blog/articles/7-关于/1-文章索引@/1-文章库/2-时间轴',
              'year',
              year.replace('年', '')
            )
          "
          :src="
            '/img/svg/animals/' +
            getChineseZodiac(year.replace('年', '')) +
            '.svg'
          "
          :title="getChineseZodiacAlias(year.replace('年', ''))"
          alt="生肖"
        />
        <span>{{ year }}</span>
      </div>
      <div class="timeline-item-content">
        <div v-for="(articles, month) in item">
          <span class="month">
            {{ month }}
          </span>
          <div class="articles">
            <span v-for="article in articles" class="article">
              <svg
                role="img"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke="currentColor"
                class="arco-icon arco-icon-bug"
                stroke-width="4"
                stroke-linecap="butt"
                stroke-linejoin="miter"
                style="color: #f53f3f"
              >
                <path
                  d="M24 42c-6.075 0-11-4.925-11-11V18h22v13c0 6.075-4.925 11-11 11Zm0 0V23m11 4h8M5 27h8M7 14a4 4 0 0 0 4 4h26a4 4 0 0 0 4-4m0 28v-.5a6.5 6.5 0 0 0-6.5-6.5M7 42v-.5a6.5 6.5 0 0 1 6.5-6.5M17 14a7 7 0 1 1 14 0"
                ></path>
              </svg>
              <a :href="'/blog' + article.path" class="title" target="_blank">{{
                article.title
              }}</a>
              <br />
              <ArticlesMetadata :article="article" />
            </span>
          </div>
        </div>
      </div>
      <div id="main"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getQueryParam, goToLink } from "../utils";
import { useData } from "vitepress";

const { theme } = useData();

let articleData = theme.value.articleDatas;

let $articleData;
let archiveData;
let $year;

/**
 * 初始化时间轴
 */
function initTimeline() {
  $articleData = [];
  archiveData = {};

  $year = getQueryParam("year");

  if ($year && $year.trim() != "") {
    for (let i = 0; i < articleData.length; i++) {
      let article = articleData[i];
      if (
        article.startDate &&
        new Date(article.startDate).getFullYear() == $year
      ) {
        $articleData.push(article);
      }
    }
  } else {
    $articleData.push(...articleData);
  }

  // 文章数据归档处理
  // 1.对文章数据进行降序排序
  $articleData.sort((a, b) => b.startDate.localeCompare(a.startDate));
  // 2.按年、月进行归档
  for (let i = 0; i < $articleData.length; i++) {
    const article = $articleData[i];
    let year = new Date(article.startDate).getFullYear() + "年";
    let month = new Date(article.startDate).getMonth() + 1 + "月";

    if (!archiveData[year]) {
      archiveData[year] = {};
    }
    if (!archiveData[year][month]) {
      archiveData[year][month] = [];
    }
    archiveData[year][month].push(article);
  }
}

initTimeline();

// console.log(articleData);

/**
 * 获取生肖图标
 *
 * @param year 年份
 */
function getChineseZodiac(year) {
  const arr = [
    "monkey",
    "rooster",
    "dog",
    "pig",
    "rat",
    "ox",
    "tiger",
    "rabbit",
    "dragon",
    "snake",
    "horse",
    "goat",
  ];
  return arr[year % 12];
}

/**
 * 获取生肖名称
 *
 * @param year 年份
 */
function getChineseZodiacAlias(year) {
  const arr = [
    "猴年",
    "鸡年",
    "狗年",
    "猪年",
    "鼠年",
    "牛年",
    "虎年",
    "兔年",
    "龙年",
    "蛇年",
    "马年",
    "羊年",
  ];
  return arr[year % 12];
}
</script>

<style scoped>
.timeline-wrap {
  margin-top: 18px;
  word-break: break-all;
}

.timeline-wrap .timeline-header {
  padding-bottom: 20px;
}

.timeline-wrap .timeline-header .icon {
  fill: var(--vp-c-text-2);
  height: 18px;
  width: 18px;
}

.timeline-wrap .timeline-header .content {
  position: relative;
  left: -17px;
  font-size: 16px;
}

.timeline-wrap .timeline-item {
  padding: 0 0 0 20px;
  border-left: 1px solid #5d9df0;
  line-height: 1;
  position: relative;
}

.timeline-wrap .timeline-item:not(:last-child) {
  padding-bottom: 20px;
}

.timeline-wrap .timeline-item .year {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 0.6em;
}

.timeline-wrap .timeline-item .year .chinese-zodiac {
  display: inline-block;
  width: 20px;
  height: 20px;
  position: absolute;
  left: -10.5px;
  top: -1px;
  background: #fff;
  border: 1px solid #84b9e5;
  border-radius: 50%;
  cursor: pointer;
}

.timeline-wrap .timeline-item .timeline-item-time {
  margin-bottom: 12px;
  width: 200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-wrap .timeline-item .month {
  padding: 8px 0 8px 0;
  display: block;
  color: var(--vp-c-text-1);
  font-size: 16px;
  font-weight: bold;
  position: relative;
}

.timeline-wrap .timeline-item .timeline-item-content {
  font-size: 14px;
}

.timeline-wrap .timeline-item .articles {
  line-height: 1;
  padding-top: 7px;
}

.timeline-wrap .timeline-item .articles .article {
  display: block;
  position: relative;
  margin-bottom: 20px;
  line-height: 1.5;
}

.timeline-wrap .timeline-item .articles svg {
  position: absolute;
  left: -28.5px;
  top: 2px;
  background: #fff;
  border: 1px solid #84b9e5;
  border-radius: 50%;
  width: 15px;
  height: 15px;
}

.timeline-wrap .timeline-item .articles .article span {
  color: var(--vp-c-text-2);
}

.vp-doc a {
  font-weight: 400;
  color: var(--vp-c-text-1);
}
.vp-doc a:hover {
  color: var(--vp-c-brand);
}
</style>