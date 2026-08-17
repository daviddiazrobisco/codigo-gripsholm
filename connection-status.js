(() => {
  "use strict";
  const where = document.querySelector(".where");
  if (!where) return;

  const status = document.createElement("small");
  status.id = "connection-status";
  status.className = "connection-status";
  status.setAttribute("role", "status");
  where.append(status);

  const update = () => {
    const online = navigator.onLine;
    status.dataset.state = online ? "online" : "offline";
    status.textContent = online ? "Con conexión" : "Sin conexión · versión guardada";
  };

  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
})();
