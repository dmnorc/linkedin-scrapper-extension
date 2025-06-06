import { waitForElements, actionWrapper, sleep } from "./helpers";
import { jobSelectors } from "./constants";
import {
  getFilters,
  isHighlighted,
  isIncluded,
  isLanguageIncludes,
} from "./filters";

let container: HTMLElement;

new MutationObserver(async (mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) {
        continue;
      }
      if (node.classList && node.classList.contains(jobSelectors.header)) {
        console.log("[jobScrapper] initializing");
        const filters = await getFilters();
        if (filters.include.length) {
          container = node.nextSibling!.nextSibling! as HTMLElement;
          createButtons();
          return mutations;
        }
      }
    }
  }
  return mutations;
}).observe(document, {
  subtree: true,
  childList: true,
});

// functions

interface JobData {
  jobId: string;
  title: string;
  place: string;
  url: string;
  isPromoted: boolean;
  description?: string;
  link: HTMLElement;
  dismiss: HTMLElement;
}

function createButtons() {
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "scrapper-buttons";
  buttonContainer.appendChild(
    createButton("Filter jobs", "Filtering...", filterJobs),
  );
  buttonContainer.appendChild(
    createButton("Remove skipped jobs", "Removing...", removeSkippedJobs),
  );
  buttonContainer.appendChild(
    createButton("Copy jobs", "Copying...", copyJobs),
  );
  container.appendChild(buttonContainer);
}

function createButton(
  text: string,
  onActionText: string,
  action: () => Promise<void> | void,
) {
  const button = document.createElement("button");
  button.innerText = text;
  button.onclick = actionWrapper(button, onActionText, action);
  return button;
}

async function filterJobs() {
  await removeSkippedJobs();
  await sleep(500);

  const data = [];
  let index = 0;
  while (index < 25) {
    const jobData = await processJob(index);
    if (jobData) data.push(jobData);
    index++;
  }
  console.log("[jobScrapper] data:", data);
  await goToNext();
}

async function processJob(index: number): Promise<JobData | null> {
  const jobs = getJobs();
  const job = jobs[index];
  if (!job) {
    console.log("[jobScrapper] no job found");
    return null;
  }

  // We have to scroll and wait because the job list is lazy loaded
  job.scrollIntoView();
  await sleep(300);

  if (isJobSkipped(job)) {
    return null;
  }

  const data = getJobCommonProperties(job);

  if (!(await isIncluded(data.title))) {
    await dismissJob(data, "not matched");
    return null;
  }

  const description = await getJobDescription(job, data);

  if (!(await isLanguageIncludes(description))) {
    await dismissJob(data, "language is not in allowed set");
    return null;
  }

  if ((await isHighlighted(description)) || (await isHighlighted(data.title))) {
    console.log("[jobScrapper] highlighted:", data.title);
    job.style.backgroundColor = "#f6cb40";
  }

  return {
    ...data,
    description,
  };
}

function isJobSkipped(job: Element) {
  return (
    job.querySelector<HTMLElement>(jobSelectors.place)?.innerText ===
    "We won’t show you this job again."
  );
}

function getJobs(isOnlyActive = false) {
  const jobs = Array.from(
    container.querySelectorAll<HTMLElement>(jobSelectors.job),
  );
  if (!isOnlyActive) {
    return jobs;
  }
  return jobs.filter((job) => !isJobSkipped(job));
}

function getJobCommonProperties(job: Element): JobData {
  const jobId = job.getAttribute("data-job-id")!;
  const link = job.querySelector<HTMLElement>(jobSelectors.link)!;
  const title = link.querySelector<HTMLElement>("strong")!.innerText;
  return {
    jobId,
    title,
    link,
    dismiss: job.querySelector<HTMLElement>(jobSelectors.dismiss)!,
    place: job.querySelector<HTMLElement>(jobSelectors.place)!.innerText,
    url: `https://www.linkedin.com/jobs/view/${jobId}/`,
    isPromoted: !!Array.from(job.querySelectorAll("li")).find(
      (e) => e.innerText === "Promoted",
    ),
  };
}

async function dismissJob(data: JobData, reason: string, wait = 300) {
  console.log(`[jobScrapper] skip: ${reason}:`, data.title);
  data.dismiss.click();
  await sleep(wait);
  return;
}

async function getJobDescription(
  job: Element,
  { link, jobId }: Pick<JobData, "link" | "jobId">,
) {
  if (!job.classList.contains(jobSelectors.current)) {
    link.click();
    await sleep(1000);
  }

  console.log("[jobScrapper] getting description:", jobId);

  await waitForElements(
    `${jobSelectors.descriptionContainer}[href^="/jobs/view/${jobId}"]`,
  );

  return document.querySelector<HTMLElement>(jobSelectors.description)!
    .innerText;
}

async function copyJobs() {
  const jobs = getJobs(true);
  const data: JobData[] = [];
  for (const job of jobs) {
    const jobData = getJobCommonProperties(job);
    await dismissJob(jobData, "copied");
    data.push(jobData);
  }

  const toCopy = data.map(({ title, url }) => `${title}: ${url}`).join("\n");
  await navigator.clipboard.writeText(toCopy);
  console.log("[jobScrapper] copied:", toCopy);

  document
    .querySelector<HTMLElement>(".scrapper-buttons > button:first-child")
    ?.click();
}

async function removeSkippedJobs() {
  const jobs = getJobs();
  const skippedJobs = jobs.filter(isJobSkipped);
  for (const job of skippedJobs) {
    job.remove();
  }
  if (skippedJobs.length) {
    await sleep(300);
    await removeSkippedJobs();
  }
}

async function goToNext() {
  await sleep(300);
  await removeSkippedJobs();
  if (!getJobs(true).length) {
    console.log("[jobScrapper] all jobs are skipped");
    const currentPageButton = document.querySelector<HTMLElement>(
      jobSelectors.currentPageButton,
    );
    if (currentPageButton) {
      const currentPage = parseInt(currentPageButton.innerText);
      const filters = await getFilters();
      console.log("[jobScrapper] currentPage:", currentPage);
      const nextPageButton =
        currentPageButton.parentElement?.nextElementSibling?.querySelector(
          "button",
        );
      if (nextPageButton && currentPage < filters.maxPages) {
        nextPageButton.click();
        await sleep(1000);
        await filterJobs();
      }
    }
  }
}
