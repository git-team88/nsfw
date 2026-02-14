import { createApp, type App, h, ref } from 'vue'
import ToastComponent from '@/components/Toast.vue'

const TOAST_CONTAINER_ID = 'toast-container'
let toastInstance: ReturnType<typeof mountToast> | null = null

interface ToastMountResult {
  componentRef: InstanceType<typeof ToastComponent> | null
  container: HTMLElement
}

const mountToast = (): ToastMountResult => {
  const container = document.createElement('div')
  container.id = TOAST_CONTAINER_ID
  document.body.appendChild(container)

  const componentRef = ref<InstanceType<typeof ToastComponent>>()

  const app = createApp({
    render: () => h(ToastComponent, {
      ref: (el) => componentRef.value = el as InstanceType<typeof ToastComponent>
    })
  })

  app.mount(container)

  return {
    componentRef: componentRef.value ?? null,
    container
  }
}

export const toast = (msg: string) => {
  if (toastInstance) {
    toastInstance.container.remove()
    toastInstance.componentRef?.show?.('')
    toastInstance = null
  }

  toastInstance = mountToast()

  if (toastInstance?.componentRef?.show) {
    toastInstance.componentRef.show(msg)
  } else {
    console.error('Toast method not available', toastInstance?.componentRef)
  }
}

export default {
  install(app: App) {
    app.config.globalProperties.$toast = toast
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $toast: typeof toast
  }
}