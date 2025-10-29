import {cloneTemplate} from "../lib/utils.js";

/**
 * Инициализирует таблицу и вызывает коллбэк при любых изменениях и нажатиях на кнопки
 *
 * @param {Object} settings
 * @param {(action: HTMLButtonElement | undefined) => void} onAction
 * @returns {{container: Node, elements: *, render: render}}
 */
export function initTable(settings, onAction) {
    const {tableTemplate, rowTemplate, before, after} = settings;
    const root = cloneTemplate(tableTemplate);

    // before — добавляем перед таблицей (используем prepend, поэтому перебираем в обратном порядке)
    if (Array.isArray(before) && before.length > 0) {
        [...before].reverse().forEach(subName => {
            root[subName] = cloneTemplate(subName);
            // prepend: вставляем перед содержимым контейнера формы
            root.container.prepend(root[subName].container);
        });
    }

    // after — добавляем после таблицы
    if (Array.isArray(after) && after.length > 0) {
        after.forEach(subName => {
            root[subName] = cloneTemplate(subName);
            root.container.append(root[subName].container);
        });
    }

    root.container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type === 'text') {
            e.preventDefault();
            onAction();
        }
    });
    root.container.addEventListener('change', () => {
        onAction();
    });

    root.container.addEventListener('reset', () => {
        setTimeout(onAction); // дождаться, пока инпуты очистятся
    });

    root.container.addEventListener('submit', (e) => {
        e.preventDefault();
        onAction(e.submitter);
    });

    const render = (data) => {
        const nextRows = data.map(item => {
            const row = cloneTemplate(rowTemplate);

            Object.keys(item).forEach(key => {
                if (row.elements[key]) {
                    const el = row.elements[key];
                    // Поддержка как текстовых контейнеров, так и полей форм
                    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
                        el.value = item[key];
                    } else {
                        el.textContent = String(item[key]);
                    }
                }
            });

            return row.container;
        });
        root.elements.rows.replaceChildren(...nextRows);
    }

    return {...root, render};
}