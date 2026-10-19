// Generic overlay + dialog shell. Clicking the backdrop calls `onCloseHandler`.
function renderModal(onCloseHandler, contentHtml) {
  return `
    <div onclick="${onCloseHandler}" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div onclick="event.stopPropagation()" class="w-full max-w-xs rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        ${contentHtml}
      </div>
    </div>
  `;
}
