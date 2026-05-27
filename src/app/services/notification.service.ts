import { Injectable } from '@angular/core';

declare var bootstrap: any; // Bootstrap 5 JS API

@Injectable({ providedIn: 'root' })
export class NotificationService {
  showNotification(message: string, type: 'success' | 'error' | 'warning') {
    if (!message) return;

    // Choose background classes based on type
    const bgClass =
      type === 'success'
        ? 'bg-success text-white'
        : type === 'error'
        ? 'bg-danger text-white'
        : 'bg-warning text-dark';

    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center ${bgClass} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    // Toast content with close button
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    // Append to container
    const container = document.getElementById('toastContainer');
    container?.appendChild(toastEl);

    // Initialize and show toast
    const toast = new bootstrap.Toast(toastEl, {
      autohide: type === 'error' ? false : true, // error stays until user closes
      delay: type === 'error' ? 0 : 3000, // success/warning auto-hide
    });

    toast.show();

    // Remove from DOM after hidden
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  }
}
