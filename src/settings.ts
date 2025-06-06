import { actionWrapper } from "./helpers";
import { getFilters, saveFilters } from "./filters";

window.onload = async () => {
  const save = document.querySelector("#save") as HTMLButtonElement;
  save.onclick = actionWrapper(save, "Saving...", onSave);
  const include = document.querySelector("#include") as HTMLInputElement;
  const filters = await getFilters();
  include.value = filters.include?.join("\n") ?? "";
  const exclude = document.querySelector("#exclude") as HTMLInputElement;
  exclude.value = filters.exclude?.join("\n") ?? "";
  const highlight = document.querySelector("#highlight") as HTMLInputElement;
  highlight.value = filters.highlight?.join("\n") ?? "";
  const languages = document.querySelector("#languages") as HTMLInputElement;
  languages.value = filters.languages?.join(",") ?? "";
  const maxPage = document.querySelector("#pages") as HTMLInputElement;
  maxPage.value = String(filters.maxPages ?? 10);
};

async function onSave() {
  const include = document.querySelector("#include") as HTMLInputElement;
  const exclude = document.querySelector("#exclude") as HTMLInputElement;
  const highlight = document.querySelector("#highlight") as HTMLInputElement;
  const languages = document.querySelector("#languages") as HTMLInputElement;
  const maxPages = document.querySelector("#pages") as HTMLInputElement;
  await saveFilters({
    include: include ? include.value.split("\n") : [],
    exclude: exclude ? exclude.value.split("\n") : [],
    highlight: highlight ? highlight.value.split("\n") : [],
    languages: languages ? languages.value.split(",") : [],
    maxPages: parseInt(maxPages.value),
  });
}
