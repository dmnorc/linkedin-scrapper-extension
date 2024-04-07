import { detect } from 'tinyld/light';
import { waitForElements, actionWrapper, sleep } from './helpers';
import { jobSelectors } from './constants';

(async () => {
    await waitForElements(jobSelectors.container);
    createButtons();
})().catch((e) => console.error(`[jobScrapper] ${e.message}`));

// functions

function createButtons() {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'scrapper-buttons';
    buttonContainer.appendChild(
        createButton('Filter jobs', 'Filtering...', filterJobs),
    );
    buttonContainer.appendChild(
        createButton('Remove skipped jobs', 'Removing...', removeSkippedJobs),
    );
    buttonContainer.appendChild(
        createButton('Copy jobs', 'Copying...', copyJobs),
    );
    document.body.appendChild(buttonContainer);
}

async function filterJobs() {
    const [container] = await waitForElements(jobSelectors.container);

    container.scrollTo(0, 0);

    const data = [];
    let index = 0;
    while (index < 25) {
        const jobData = await processJob(index);
        if (jobData) data.push(jobData);
        index++;
    }
    console.log('[jobScrapper]', data);
}

async function processJob(index: number) {
    const jobs = document.querySelectorAll(jobSelectors.job);
    const job = jobs[index];
    if (!job) {
        console.log('[jobScrapper] no job found');
        return;
    }
    job.scrollIntoView();

    const jobId = job.getAttribute('data-job-id');

    if (isJobSkipped(job)) {
        await sleep(100);
        return;
    }

    const place =
        (job.querySelector(jobSelectors.place) as HTMLElement)?.innerText ?? '';

    const dismissBtn = job.querySelector(jobSelectors.dismiss) as HTMLElement;

    // open details
    const link = job.querySelector(jobSelectors.link) as HTMLElement;
    const title = link.getAttribute('aria-label') ?? '';
    if (await excludeJob(title)) {
        console.log(`[jobScrapper] skip: not frontend:`, title);
        dismissBtn?.click();
        await sleep(300);
        return;
    }

    if (!job.attributes.getNamedItem('aria-current')) {
        link.click();
        await sleep(1000);
    }

    await waitForElements(
        `${jobSelectors.descriptionContainer}[aria-label="${title}"]`,
    );

    const description = document.querySelector(
        jobSelectors.description,
    ) as HTMLElement;

    if (detect(description.innerText) !== 'en') {
        console.log('[jobScrapper] skip: not english:', title);
        dismissBtn?.click();
        await sleep(300);
        return;
    }

    const isPromoted = !!Array.from(job.querySelectorAll('li')).find(
        (e) => e.innerText === 'Promoted',
    );

    return {
        title,
        jobId,
        place,
        description: description.innerText,
        isPromoted,
        link: `https://www.linkedin.com/jobs/view/${jobId}/`,
    };
}

async function excludeJob(titleStr: string) {
    if (!titleStr) return true;
    const { filters } = await chrome.storage.sync.get('filters');
    for (const includeStr of filters.include) {
        if (new RegExp(includeStr, 'ig').test(titleStr)) return false;
    }
    for (const excludeStr of filters.exclude) {
        if (new RegExp(excludeStr, 'ig').test(titleStr)) return true;
    }
    return false;
}

function isJobSkipped(job: Element) {
    return (
        (job.querySelector('.artdeco-entity-lockup__caption') as HTMLElement)
            ?.innerText === 'We won’t show you this job again.'
    );
}

async function copyJobs() {
    await waitForElements('.jobs-search-results-list');
    const jobs = document.querySelectorAll(`.job-card-container`);
    const data = [];
    for (const job of jobs) {
        if (!isJobSkipped(job)) {
            const jobId = job.getAttribute('data-job-id');
            const link = job.querySelector(
                'a.job-card-container__link',
            ) as HTMLElement;
            const title = link.getAttribute('aria-label') ?? '';
            data.push({
                title,
                link: `https://www.linkedin.com/jobs/view/${jobId}/`,
                dismiss: job.querySelector('.artdeco-button') as HTMLElement,
            });
        }
    }
    const toCopy = data
        .map(({ title, link }) => `${title}: ${link}`)
        .join('\n');

    console.log('[jobScrapper]', toCopy);
    await navigator.clipboard.writeText(toCopy);

    for (const { dismiss } of data) {
        dismiss?.click();
        await sleep(300);
    }
}

function removeSkippedJobs() {
    const jobs = document.querySelectorAll(`.job-card-container`);
    for (const job of jobs) {
        if (isJobSkipped(job)) {
            job.remove();
        }
    }
}

function createButton(text: string, onActionText: string, action: () => void) {
    const button = document.createElement('button');
    button.innerText = text;
    // @ts-ignore
    button.onclick = actionWrapper(button, onActionText, action);
    return button;
}
