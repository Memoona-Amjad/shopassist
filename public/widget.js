// ShopAssist embeddable widget.
// Usage: <script src="https://YOUR-SITE/widget.js" async></script>
// Adds a floating chat button that opens the ShopAssist chat in an iframe.
(function () {
  if (window.__shopAssistLoaded) return;
  window.__shopAssistLoaded = true;

  var origin = new URL(document.currentScript.src).origin;
  var open = false;
  var frame = null;

  var button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Open chat");
  button.textContent = "💬 Chat with us";
  button.style.cssText =
    "position:fixed;right:20px;bottom:20px;z-index:2147483646;border:0;border-radius:999px;" +
    "padding:14px 20px;background:#1f4d3a;color:#fff;font:600 14px system-ui,sans-serif;" +
    "box-shadow:0 10px 25px rgba(0,0,0,.2);cursor:pointer";

  button.addEventListener("click", function () {
    open = !open;
    if (!frame) {
      frame = document.createElement("iframe");
      frame.src = origin + "/embed";
      frame.title = "ShopAssist chat";
      var small = window.innerWidth < 640;
      frame.style.cssText =
        "position:fixed;z-index:2147483647;border:0;background:#fff;box-shadow:0 20px 50px rgba(0,0,0,.25);" +
        (small
          ? "inset:0 0 76px 0;width:100%;height:calc(100% - 76px);"
          : "right:20px;bottom:84px;width:400px;height:620px;max-height:calc(100vh - 110px);border-radius:16px;");
      document.body.appendChild(frame);
    }
    frame.style.display = open ? "block" : "none";
    button.textContent = open ? "✕ Close" : "💬 Chat with us";
  });

  document.body.appendChild(button);
})();
