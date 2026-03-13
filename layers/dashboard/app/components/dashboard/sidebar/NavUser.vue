<script setup lang="ts">
import { ChevronsUpDown, LogOut } from 'lucide-vue-next'
import { useSidebar } from '@/components/ui/sidebar'

interface User {
  name: string
  email: string
  avatar: string
}

const { isMobile } = useSidebar()
const { removeToken } = useAuthToken()
const authUser = ref<{ username: string, tenantId: string } | null>(null)
const dashboardAuthUser = useState<{ isAdmin: boolean } | null>('dashboard-auth-user', () => null)

const hostname = computed<string>(() => {
  if (import.meta.client) {
    return window.location.hostname
  }
  return 'localhost'
})

const user = computed<User>(() => ({
  name: authUser.value?.username || 'User',
  email: `${authUser.value?.tenantId || 'tenant'}@${hostname.value}`,
  avatar: '/sink.png',
}))

async function logOut() {
  try {
    await useAPI('/api/auth/logout', { method: 'POST' })
  }
  catch {}
  dashboardAuthUser.value = null
  removeToken()
  navigateTo('/dashboard/login')
}

onMounted(async () => {
  try {
    const data = await useAPI<{ username: string, tenantId: string }>('/api/auth/me')
    authUser.value = data
  }
  catch {
    removeToken()
  }
})
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="
              data-[state=open]:bg-sidebar-accent
              data-[state=open]:text-sidebar-accent-foreground
            "
          >
            <Avatar class="h-8 w-8 rounded-full">
              <AvatarImage :src="user.avatar" :alt="user.name" />
              <AvatarFallback class="rounded-full">
                R
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ user.name }}</span>
              <span class="truncate text-xs">{{ user.email }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-full">
                <AvatarImage :src="user.avatar" :alt="user.name" />
                <AvatarFallback class="rounded-full">
                  R
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ user.name }}</span>
                <span class="truncate text-xs">{{ user.email }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <DropdownMenuItem
                class="cursor-pointer"
                @select.prevent
              >
                <LogOut class="mr-2 h-4 w-4" />
                {{ $t('logout.action') }}
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent
              class="
                max-h-[95svh] max-w-[95svw] grid-rows-[auto_minmax(0,1fr)_auto]
                md:max-w-lg
              "
            >
              <AlertDialogHeader>
                <AlertDialogTitle>{{ $t('logout.title') }}</AlertDialogTitle>
                <AlertDialogDescription>
                  {{ $t('logout.confirm') }}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{{ $t('common.cancel') }}</AlertDialogCancel>
                <AlertDialogAction @click="logOut">
                  {{ $t('logout.action') }}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
