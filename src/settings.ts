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
};

async function onSave() {
  const include = document.querySelector("#include") as HTMLInputElement;
  const exclude = document.querySelector("#exclude") as HTMLInputElement;
  const highlight = document.querySelector("#highlight") as HTMLInputElement;
  await saveFilters({
    include: include ? include.value.split("\n") : [],
    exclude: exclude ? exclude.value.split("\n") : [],
    highlight: highlight ? highlight.value.split("\n") : [],
  });
}
