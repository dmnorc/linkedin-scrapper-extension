export function waitForElements(
    selector: string,
    { timeout = 10000, container = document.body } = {},
): Promise<NodeListOf<HTMLElement>> {
    return Promise.race([
        new Promise((resolve) => {
            if (container.querySelectorAll(selector)[0]) {
                return resolve(container.querySelectorAll(selector));
            }

            const observer = new MutationObserver((mutations) => {
                if (container.querySelectorAll(selector)[0]) {
                    observer.disconnect();
                    resolve(container.querySelectorAll(selector));
                }
            });

            observer.observe(container, {
                childList: true,
                subtree: true,
            });
        }),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Element not found')), timeout),
        ),
    ]) as Promise<NodeListOf<HTMLElement>>;
}

export function actionWrapper(
    button: HTMLElement,
    text: string,
    action: () => Promise<void>,
) {
    return async () => {
        const innerText = button.innerText;
        button.innerText = text;
        button.setAttribute('disabled', 'disabled');
        await action();
        button.removeAttribute('disabled');
        button.innerText = innerText;
    };
}

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
