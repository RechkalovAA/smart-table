import {createComparison, defaultRules} from "../lib/compare.js";

// @todo: #4.3 — настроить компаратор
const compare = createComparison(defaultRules);

export function initFiltering(elements, indexes) {
    // @todo: #4.1 — заполнить выпадающие списки опциями
    Object.keys(indexes)
        .forEach((elementName) => {
            elements[elementName].append(
                ...Object.values(indexes[elementName])
                    .map(name => {
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = name;
                        return option;
                    })
            )
        })

    return (data, state, action) => {
        // @todo: #4.2 — обработать очистку поля
        if (action && action.name === 'clear') {
            const field = action.dataset.field;
            const wrapper = action.closest('.filter-wrapper');
            const input = wrapper ? wrapper.querySelector(`[name="${field}"]`) : null;
            if (input) input.value = '';
            if (state && Object.prototype.hasOwnProperty.call(state, field)) {
                state[field] = '';
            }
        }

        // Подготовим диапазон total как [from, to] и приведём к числам
        const totalFrom = state.totalFrom === '' || state.totalFrom === undefined ? '' : Number(state.totalFrom);
        const totalTo = state.totalTo === '' || state.totalTo === undefined ? '' : Number(state.totalTo);
        const target = {
            ...state,
            total: [totalFrom, totalTo]
        };

        // @todo: #4.5 — отфильтровать данные используя компаратор
        return data.filter(row => compare(row, target));
    }
}