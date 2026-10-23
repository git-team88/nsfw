// 全站只用一个事件总线：src/utils/eventBus.ts。
// 以前这里是一个独立的 mitt 实例，UserSidebar 用它、Header 和各页面用另一个，
// 同一个 userLoggedOut 事件两边互相收不到。这里改成转发同一个实例，旧的 import 写法也能继续用。
import { eventBus } from '@/utils/eventBus';

export default eventBus;
