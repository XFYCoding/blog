<template>
  <div id="toolcontainer">
    <div id="tool">
      <ClientOnly>
        <el-popover placement="left-end">
          <p style="text-align: center">微信扫一扫</p>
          <img
            src="../../public/img/home/qrcode.png"
            style="width: 300px; margin-top: 10px"
          />
          <template #reference>
            <div>
              <img src="../../public/img/icon/wx.png" class="toolcontext" />
              <span class="tooltext">微信</span>
            </div>
          </template>
        </el-popover>
      </ClientOnly>
    </div>
    <div id="tool">
      <ClientOnly>
        <el-popover placement="left-end">
          <p style="text-align: center">微信赞赏码</p>
          <img
            src="../../public/img/home/moneycode.png"
            style="width: 300px; margin-top: 10px"
          />
          <template #reference>
            <div>
              <img
                src="../../public/img/icon/red-heart.png"
                class="toolcontext"
              />
              <span class="tooltext">赞赏</span>
            </div>
          </template>
        </el-popover>
      </ClientOnly>
    </div>
  </div>
</template>
   
<script>
import { ElMessage } from "element-plus";
export default {
  created() {
    this.$nextTick(() => {
      // // 禁用右键
      // document.oncontextmenu = new Function("event.returnValue=false");
      // // 禁用选择
      // document.onselectstart = new Function("event.returnValue=false");
      if (typeof window !== "undefined") {
        // 3.禁止键盘F12键
        document.addEventListener("keydown", function (e) {
          if (e.key == "F12") {
            e.preventDefault(); // 如果按下键F12,阻止事件
          }
        });

        document.oncopy = function (e) {
          e.preventDefault();
          ElMessage({
            message: "管理员已开启禁止复制功能，如有疑问，请联系管理员",
            type: "warning",
          });
        };
      }
    });
  },
};
</script>
   
<style>
#toolcontainer {
  position: fixed;
  text-align: center;
  right: 10px;
  z-index: 99;
}
#tool {
  position: relative;
  width: 60px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  box-shadow: 0 1px 4px rgb(0 0 0 / 10%);
  padding-top: 8px;
}

#tool .toolcontext {
  width: 30px;
  height: 30px;
  cursor: pointer;
}

#tool .tooltext {
  color: grey;
  font-size: 11px;
}

@media (max-width: 960px) {
  #toolcontainer {
    display: none;
  }
}
</style>
