<script setup lang="ts">
import { onMounted } from "vue";
import { useShelterStore } from "../stores/ShelterStore";
import { formatRisk } from "../utils/formatters";
import StatusBadge from "../components/common/StatusBadge.vue";
import CapacityMeter from "../components/common/CapacityMeter.vue";
import EmptyState from "../components/common/EmptyState.vue";

const store = useShelterStore();
onMounted(store.load);
</script>

<template>
  <section class="page-body">
    <EmptyState v-if="store.rows.length === 0" />
    <div v-else class="card-grid">
      <div v-for="shelter in store.rows" :key="shelter.id" class="panel">
        <div class="panel-head">
          <h2>{{ shelter.name }}</h2>
          <StatusBadge :value="shelter.open_status" />
        </div>
        <p class="muted">{{ shelter.district }} · 联系人 {{ shelter.contact_person }} · 风险 {{ formatRisk(shelter.risk_level) }}</p>
        <CapacityMeter :used="shelter.current_population" :capacity="shelter.capacity" label="安置容量" />
      </div>
    </div>
  </section>
</template>
