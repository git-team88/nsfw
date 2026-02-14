import { defineStore } from 'pinia'

export const useLoginStore = defineStore('login', {
  state: () => ({
    isShowLogin: false
  }),
  actions: {
    showLogin() {
      this.isShowLogin = true;
    },
    closeLogin() {
      this.isShowLogin = false;
    }
  }
})