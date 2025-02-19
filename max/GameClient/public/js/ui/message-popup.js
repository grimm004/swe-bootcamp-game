/**
 * Displays an animated message popup.
 * @param {string} message - The message to display.
 * @param {string} [type="info"] - The type of message ("info", "success", "warning", or "error").
 * @param {number} [timeout=2000] - How long (in ms) before the message fades out.
 */
export const showMessage = (message, type = "info", timeout = 2000) => {
    // Ensure the container exists
    let container = document.getElementById("messageContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "messageContainer";
        container.className = "message-container";
        document.body.appendChild(container);
    }

    // Create the message element and assign appropriate classes
    let msgElem = document.createElement("div");
    msgElem.className = "message-popup " + type;
    msgElem.textContent = message;
    container.appendChild(msgElem);

    // Force reflow (so that the transition occurs later)
    msgElem.offsetWidth;

    // After the timeout, fade out and slide the message
    setTimeout(() => {
        msgElem.style.opacity = "0";
        msgElem.style.transform = "translateX(100%)";
        // When the transition is done, remove the element
        msgElem.addEventListener("transitionend", () => {
            msgElem.remove();
        });
    }, timeout);
}