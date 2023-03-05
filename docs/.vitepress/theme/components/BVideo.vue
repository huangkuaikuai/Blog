<template>
  <iframe
    :src="src"
    loading="lazy"
    scrolling="no"
    border="0"
    frameBorder="no"
    framespacing="0"
    allowFullScreen="true"
    style="width:100%, height: 500px"
    class="videoFrame"
  ></iframe>
</template>
<script>
export default {
  name: "视频播放器",
  props: ['videoSrc'],
  data() {
    return {
      src: this.videoSrc
    }
  }
}
</script>
<style>
.videoFrame {
  width: 100%;
  height: 500px;
  margin-top: 2vh;
}
.videoFrame + * {
  margin-top: 2em;
}
@media (max-width: 570px) {
  .videoFrame {
    height: 300px;
  }
}
@media (max-width: 400px) {
  .videoFrame {
    height: 220px;
  }
}
</style>