<script setup lang="ts">
import { toast } from 'vue-sonner'

const { t } = useI18n()
const domain = ref('')
const domains = ref<string[]>([])
const tenants = ref<Array<{ username: string, tenantId: string, isAdmin: boolean }>>([])
const selectedTenantId = ref('admin')
const loading = ref(false)

async function fetchTenants() {
  const data = await useAPI<{ users: Array<{ username: string, tenantId: string, isAdmin: boolean }> }>('/api/auth/users')
  tenants.value = data.users
  if (!tenants.value.some(item => item.tenantId === selectedTenantId.value)) {
    selectedTenantId.value = tenants.value[0]?.tenantId || 'admin'
  }
}

async function fetchDomains() {
  loading.value = true
  try {
    const data = await useAPI<{ domains: string[] }>('/api/domain/list', {
      query: {
        tenantId: selectedTenantId.value,
        _ts: Date.now(),
      },
    })
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
    body: {
      domain: value,
      tenantId: selectedTenantId.value,
    },
  })
  domain.value = ''
  if (!domains.value.includes(value))
    domains.value = [...domains.value, value].sort((a, b) => a.localeCompare(b))
  toast.success(t('domains.add_success'))
}

async function removeDomain(value: string) {
  await useAPI('/api/domain/delete', {
    method: 'POST',
    body: {
      domain: value,
      tenantId: selectedTenantId.value,
    },
  })
  domains.value = domains.value.filter(item => item !== value)
  toast.success(t('domains.delete_success'))
}

watch(selectedTenantId, fetchDomains)

onMounted(async () => {
  await fetchTenants()
  await fetchDomains()
})
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
          <FieldLabel for="tenant">
            Tenant
          </FieldLabel>
          <Select v-model="selectedTenantId">
            <SelectTrigger id="tenant">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="tenant in tenants"
                :key="tenant.tenantId"
                :value="tenant.tenantId"
              >
                {{ tenant.username }} ({{ tenant.tenantId }})
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

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
