/** Shows an OS notification. `onClick` runs when the user clicks it. */
export default function sendNotification(title, body, onClick = () => {}) {
  new window.Notification(title, { body }).onclick = onClick;
}
