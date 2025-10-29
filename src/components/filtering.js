export function initFiltering(elements) {
    const updateIndexes = (elements, indexes) => {
        Object.keys(indexes).forEach((elementName) => {
            const selectElement = elements[elementName];
            if (selectElement && selectElement.tagName === 'SELECT') {
                // Очищаем селект, оставляя первую опцию (пустую)
                while (selectElement.children.length > 1) {
                    selectElement.removeChild(selectElement.lastChild);
                }
                // Добавляем новые опции
                const options = Object.values(indexes[elementName])
                    .sort() // Сортируем имена для удобства
                    .map(name => {
                        const el = document.createElement('option');
                        el.textContent = name;
                        el.value = name;
                        return el;
                    });
                selectElement.append(...options);
            }
        })
    }

    const applyFiltering = (query, state, action) => {
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

        // @todo: #4.5 — отфильтровать данные, используя компаратор
        const filter = {};
        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                if (['INPUT', 'SELECT'].includes(elements[key].tagName) && elements[key].value) { // ищем поля ввода в фильтре с непустыми данными
                    filter[`filter[${elements[key].name}]`] = elements[key].value; // чтобы сформировать в query вложенный объект фильтра
                }
            }
        })

        return Object.keys(filter).length ? Object.assign({}, query, filter) : query; // если в фильтре что-то добавилось, применим к запросу
    }

    return {
        updateIndexes,
        applyFiltering
    }
}