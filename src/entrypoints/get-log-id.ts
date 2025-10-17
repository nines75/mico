import { defineUnlistedScript } from "#imports";

export default defineUnlistedScript(() => {
    const id = `${browser.runtime.getManifest().name}-log-id`;
    const element = document.getElementById(id);

    return element?.textContent;
});
