<script setup lang="ts">
import { toast } from 'vue-sonner'
import { z } from 'zod'

const { t } = useI18n()
const { setToken, removeToken } = useAuthToken()

const mode = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const error = ref('')

const LoginSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(8),
})

async function handleSubmit() {
  error.value = ''
  const result = LoginSchema.safeParse({ username: username.value, password: password.value })

  if (!result.success) {
    error.value = t('login.invalid_form')
    return
  }

  try {
    const data = await useAPI<{ token: string }>(
      mode.value === 'login' ? '/api/auth/login' : '/api/auth/register',
      {
        method: 'POST',
        body: {
          username: username.value,
          password: password.value,
        },
      },
    )
    setToken(data.token)
    await useAPI('/api/auth/me')
    navigateTo('/dashboard')
  }
  catch (e) {
    removeToken()
    console.error(e)
    toast.error(t('login.failed'), {
      description: e instanceof Error ? e.message : String(e),
    })
  }
}
</script>

<template>
  <Card class="w-full max-w-sm">
    <CardHeader>
      <CardTitle class="text-2xl">
        {{ mode === 'login' ? $t('login.title') : $t('login.register_title') }}
      </CardTitle>
      <CardDescription>
        {{ mode === 'login' ? $t('login.description') : $t('login.register_description') }}
      </CardDescription>
    </CardHeader>
    <CardContent class="grid gap-4">
      <div class="grid grid-cols-2 gap-2">
        <Button :variant="mode === 'login' ? 'default' : 'outline'" @click="mode = 'login'">
          {{ $t('login.submit') }}
        </Button>
        <Button :variant="mode === 'register' ? 'default' : 'outline'" @click="mode = 'register'">
          {{ $t('login.register_submit') }}
        </Button>
      </div>
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <FieldGroup>
          <Field :data-invalid="!!error">
            <FieldLabel for="username">
              {{ $t('login.username_label') }}
            </FieldLabel>
            <Input
              id="username"
              v-model="username"
              type="text"
              name="username"
              autocomplete="username"
              placeholder="username"
              :aria-invalid="!!error"
            />
          </Field>
          <Field :data-invalid="!!error">
            <FieldLabel for="password">
              {{ $t('login.password_label') }}
            </FieldLabel>
            <Input
              id="password"
              v-model="password"
              type="password"
              name="password"
              autocomplete="current-password"
              placeholder="********"
              :aria-invalid="!!error"
            />
            <FieldError v-if="error" :errors="[error]" />
          </Field>
        </FieldGroup>

        <Button class="w-full" type="submit">
          {{ mode === 'login' ? $t('login.submit') : $t('login.register_submit') }}
        </Button>
      </form>
    </CardContent>
  </Card>
</template>
