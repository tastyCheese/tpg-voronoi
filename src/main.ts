import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core';

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

/* import specific icons */
import { faCopy, faPencil, faTimes, faSave } from '@fortawesome/free-solid-svg-icons';

/* add icons to the library */
library.add(faCopy);
library.add(faPencil);
library.add(faTimes);
library.add(faSave);


const app = createApp(App);

app.use(router);

app.component('font-awesome-icon', FontAwesomeIcon);

app.mount('#app');
