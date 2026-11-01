import { staff, kvdb } from '../staff_kvdb'


staff.init().then(() => {
    ;(globalThis).staff = staff
    ;(globalThis).ngin = kvdb
})
