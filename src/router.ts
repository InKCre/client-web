import { createRouter, createWebHistory } from "vue-router";
import start from "@/views/start/start.vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "InKCre",
			component: start,
		},
	],
});

export default router;
