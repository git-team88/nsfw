import { createApp, type App, h, ref } from 'vue'
import ToastComponent from '@/components/Toast.vue'
import LimitToastComponent from '@/components/LimitToast.vue'

const TOAST_CONTAINER_ID = 'toast-container'
const LIMIT_TOAST_CONTAINER_ID = 'limit-toast-container'
let toastInstance: ReturnType<typeof mountToast> | null = null
let limitToastInstance: ReturnType<typeof mountLimitToast> | null = null

interface ToastMountResult {
  componentRef: InstanceType<typeof ToastComponent> | null
  container: HTMLElement
}

interface LimitToastMountResult {
  componentRef: InstanceType<typeof LimitToastComponent> | null
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

const mountLimitToast = (): LimitToastMountResult => {
  const container = document.createElement('div')
  container.id = LIMIT_TOAST_CONTAINER_ID
  document.body.appendChild(container)

  const componentRef = ref<InstanceType<typeof LimitToastComponent>>()

  const app = createApp({
    render: () => h(LimitToastComponent, {
      ref: (el) => componentRef.value = el as InstanceType<typeof LimitToastComponent>
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

export const limitToast = (msg: string) => {
  if (limitToastInstance) {
    limitToastInstance.container.remove()
    limitToastInstance.componentRef?.show?.('')
    limitToastInstance = null
  }

  limitToastInstance = mountLimitToast()

  if (limitToastInstance?.componentRef?.show) {
    limitToastInstance.componentRef.show(msg)
  } else {
    console.error('LimitToast method not available', limitToastInstance?.componentRef)
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
