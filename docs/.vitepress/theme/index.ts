import Theme from 'vitepress/theme'
import './style/var.css'
import BVideo from './components/BVideo.vue';
export default {
  ...Theme,
  enhanceApp({app}) {
    app.component('BVideo', BVideo)
  }
}