<template>
  <div id="toolcontainer">
    <div id="tool">
      <el-popover placement="left-end" trigger="click">
        <p style="text-align: center">微信扫一扫</p>
        <img
          src="../../public/img/home/qrcode.png"
          style="width: 300px; margin-top: 10px"
        />
        <template #reference>
          <div>
            <label class="toolcontext wx"></label>
            <span class="tooltext">微信</span>
          </div>
        </template>
      </el-popover>
    </div>
    <div id="tool">
      <el-popover placement="left-end" trigger="click">
        <p style="text-align: center">微信赞赏码</p>
        <img
          src="../../public/img/home/moneycode.png"
          style="width: 300px; margin-top: 10px"
        />
        <template #reference>
          <div>
            <label class="toolcontext zs"></label>
            <span class="tooltext">支持我</span>
          </div>
        </template>
      </el-popover>
    </div>
  </div>
</template>
   
<script>
</script>
   
<style>
#toolcontainer {
  position: fixed;
  width: 44px;
  text-align: center;
  right: 1%;
  z-index: 999;
}
#tool {
  position: relative;
  width: 44px;
  margin-top: 3px;
  border-bottom: 1px solid var(--vp-c-brand);
}

#tool .toolcontext {
  width: 44px;
  height: 44px;
  display: flex;
  border-radius: 50%;
  cursor: pointer;
  background-position: center center;
  background-repeat: no-repeat;
  background-size: 45px 45px;
  -webkit-animation: wobble 250ms infinite;
  animation: wobble 250ms infinite;
  align-items: center;
  justify-content: center;
}

#tool .wx {
  background-image: url("../../public/icon/wx.png");
}

#tool .zs {
  background-image: url("../../public/icon/red-heart.png");
}

#tool .tooltext {
  color: grey;
  margin-top: 3px;
  font-size: 11px;
}

@media (max-width: 960px) {
  #toolcontainer {
    display: none;
  }
}
</style>
