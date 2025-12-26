// src/utils/sweetAlert.ts
import Swal from 'sweetalert2';

// กำหนดค่าเริ่มต้น (Config)
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

// สร้างฟังก์ชัน export ออกไปใช้
type IconType = 'success' | 'error' | 'warning' | 'info' | 'question';

export const showToast = (icon: IconType, title: string) => {
  Toast.fire({
    icon: icon,
    title: title,
  });
};