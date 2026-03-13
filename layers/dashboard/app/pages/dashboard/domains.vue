<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
})

const canAccess = ref(false)

onMounted(async () => {
  try {
    const data = await useAPI<{ isAdmin: boolean }>('/api/auth/me')
    if (!data.isAdmin) {
      await navigateTo('/dashboard')
      return
    }
    canAccess.value = true
  }
  catch {
    await navigateTo('/dashboard/login')
  }
})
</script>

<template>
  <main v-if="canAccess" class="space-y-6">
    <DashboardDomains />
  </main>
</template>
