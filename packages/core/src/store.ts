import { createPinia } from "pinia";

// Shared Pinia instance used across @inkcre/core consumers
const store = createPinia();

export { store };
export default store;
