<script setup lang="ts">
import { computed, ref, type Component } from "vue";
import { routes } from "./router/routes";
import { currentUser, ROLE_OPTIONS, setCurrentUser } from "./utils/currentUser";
import DashboardPage from "./pages/DashboardPage.vue";
import WarehousesPage from "./pages/WarehousesPage.vue";
import SheltersPage from "./pages/SheltersPage.vue";
import DispatchPage from "./pages/DispatchPage.vue";
import EventsPage from "./pages/EventsPage.vue";

const pages: Record<string, Component> = {
  "/dashboard": DashboardPage,
  "/warehouses": WarehousesPage,
  "/shelters": SheltersPage,
  "/dispatch": DispatchPage,
  "/events": EventsPage
};

const active = ref<string>("/warehouses");
const current = computed(() => routes.find((route) => route.route === active.value) ?? routes[0]);
const currentPage = computed(() => pages[active.value] ?? DashboardPage);

const selectedRole = ref(currentUser.id);
function switchRole() {
  const option = ROLE_OPTIONS.find((item) => item.id === selectedRole.value);
  if (option) setCurrentUser(option.id, option.name, option.role);
}
</script>

<template>
  <div class="shell">
    <aside>
      <div class="brand">城市防灾应急物资调度系统</div>
      <nav>
        <button
          v-for="route in routes"
          :key="route.route"
          :class="{ active: active === route.route }"
          @click="active = route.route"
        >{{ route.name }}</button>
      </nav>
      <div class="role-box">
        <span class="muted">当前角色</span>
        <select v-model="selectedRole" @change="switchRole">
          <option v-for="option in ROLE_OPTIONS" :key="option.id" :value="option.id">
            {{ option.name }}
          </option>
        </select>
      </div>
    </aside>
    <main class="page">
      <section class="page-head">
        <div>
          <p class="eyebrow">rescue-stock</p>
          <h1>{{ current?.name }}</h1>
        </div>
        <span class="badge">{{ currentUser.name }}</span>
      </section>
      <component :is="currentPage" :key="active" />
    </main>
  </div>
</template>
