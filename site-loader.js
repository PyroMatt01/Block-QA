(() => {
    const loader = document.querySelector(".site-loader");
    if (!loader) return;

    const startedAt = performance.now();
    let hideScheduled = false;
    const hideLoader = () => {
        if (hideScheduled) return;
        hideScheduled = true;
        const minimumDisplayTime = 700;
        const delay = Math.max(0, minimumDisplayTime - (performance.now() - startedAt));
        window.setTimeout(() => {
            loader.classList.add("is-hidden");
            window.setTimeout(() => loader.remove(), 600);
        }, delay);
    };

    if (document.readyState === "complete") hideLoader();
    else window.addEventListener("load", hideLoader, { once: true });

    window.setTimeout(hideLoader, 5000);
})();
