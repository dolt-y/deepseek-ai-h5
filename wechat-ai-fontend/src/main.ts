import { createApp } from 'vue'
import './style.scss'
import App from './App.vue'
import directivesFunc from './utils/directives';
import 'element-plus/dist/index.css';

const app = createApp(App)
directivesFunc(app);
app.mount('#app')
