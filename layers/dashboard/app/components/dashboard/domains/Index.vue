<script setup lang="ts">
import { toast } from 'vue-sonner'

const { t } = useI18n()
const domain = ref('')
const domains = ref<string[]>([])
const loading = ref(false)

async function fetchDomains() {
  loading.value = true
  try {
    const data = await useAPI<{ domains: string[] }>('/api/domain/list')
    domains.value = data.domains
  }
  finally {
    loading.value = false
  }
}

async function addDomain() {
  const value = domain.value.trim()
  if (!value)
    return
  await useAPI('/api/domain/create', {
    method: 'POST',
    body: { domain: value },
  })
  domain.value = ''
  toast.success(t('domains.add_success'))
  await fetchDomains()
}

async function removeDomain(value: string) {
  await useAPI('/api/domain/delete', {
    method: 'POST',
    body: { domain: value },
  })
  toast.success(t('domains.delete_success'))
  await fetchDomains()
}

onMounted(fetchDomains)
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ $t('domains.title') }}</CardTitle>
      <CardDescription>{{ $t('domains.description') }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel for="domain">
            {{ $t('domains.input_label') }}
          </FieldLabel>
          <div class="flex gap-2">
            <Input
              id="domain"
              v-model="domain"
              type="text"
              :placeholder="$t('domains.input_placeholder')"
            />
            <Button @click="addDomain">
              {{ $t('domains.add_button') }}
            </Button>
          </div>
        </Field>
      </FieldGroup>

      <div v-if="loading" class="text-sm text-muted-foreground">
        {{ $t('dashboard.loading') }}
      </div>
      <div v-else-if="!domains.length" class="text-sm text-muted-foreground">
        {{ $t('domains.empty') }}
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="item in domains"
          :key="item"
          class="flex items-center justify-between rounded-md border px-3 py-2"
        >
          <span class="text-sm">{{ item }}</span>
          <Button variant="outline" size="sm" @click="removeDomain(item)">
            {{ $t('domains.delete_button') }}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
