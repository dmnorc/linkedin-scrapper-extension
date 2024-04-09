import { actionWrapper } from './helpers';
import {getFilters, saveFilters} from "./filters";

window.onload = async () => {
    const save = document.querySelector('#save') as HTMLButtonElement;
    save.onclick = actionWrapper(save, 'Saving...', onSave);
    const include = document.querySelector('#include') as HTMLInputElement;
    const filters = await getFilters();
    include.value = filters.include?.join('\n') ?? '';
    const exclude = document.querySelector('#exclude') as HTMLInputElement;
    exclude.value = filters.exclude?.join('\n') ?? '';
};

async function onSave() {
    const include = document.querySelector('#include') as HTMLInputElement;
    const exclude = document.querySelector('#exclude') as HTMLInputElement;
    await saveFilters({
        include: include.value.split('\n'),
        exclude: exclude.value.split('\n'),
    });
}
