const socket = io();

const messageForm = document.querySelector("#message-form");
const messageFormInput = document.querySelector("input");
const messageFormButton = document.querySelector("button");
const shareLocationButton = document.querySelector("#share-location");
const messages = document.querySelector("#messages");

const messageTemp = document.querySelector("#message-temp").innerHTML;
const locationTemp = document.querySelector("#location-temp").innerHTML;
const sidebarTemp = document.querySelector("#sidebar-temp").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  const newMessage = messages.lastElementChild;

  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = messages.offsetHeight;

  const containerHeight = messages.scrollHeight;

  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemp, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (msg) => {
  console.log(msg);
  const html = Mustache.render(locationTemp, {
    username: msg.username,
    url: msg.url,
    createdAt: moment(msg.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemp, { room, users });
  document.querySelector("#sidebar").innerHTML = html;
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.msg;
  socket.emit("sendMessage", message.value, (error) => {
    messageFormButton.removeAttribute("disabled");
    messageFormInput.value = "";
    messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log("Message deliverd!");
  });
});

shareLocationButton.addEventListener("click", (e) => {
  if (!navigator.geolocation) {
    return alert("geolocation is not supported by your browser");
  }

  shareLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "shareLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        shareLocationButton.removeAttribute("disabled");

        console.log("Location shared!");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
