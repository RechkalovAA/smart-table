import {makeIndex} from "./lib/utils.js";

const BASE_URL = 'https://webinars.webdev.education-services.ru/sp7-api';

export function initData() {
    // переменные для кеширования данных
    let sellers;
    let customers;
    let lastResult;
    let lastQuery;

    // функция для приведения строк в тот вид, который нужен нашей таблице
    const mapRecords = (data) => data.map(item => ({
        id: item.receipt_id,
        date: item.date,
        seller: sellers[item.seller_id],
        customer: customers[item.customer_id],
        total: item.total_amount
    }));

    // функция получения индексов
    const getIndexes = async () => {
        if (!sellers || !customers) { // если индексы ещё не установлены, то делаем запросы
            const [sellersResponse, customersResponse] = await Promise.all([ // запрашиваем и деструктурируем данные
                fetch(`${BASE_URL}/sellers`), // запрашиваем продавцов
                fetch(`${BASE_URL}/customers`), // запрашиваем покупателей
            ]);
            
            const [sellersJson, customersJson] = await Promise.all([
                sellersResponse.json(),
                customersResponse.json()
            ]);
            
            // Проверяем, является ли ответ уже индексом (объект, где значения - строки)
            const firstSellerKey = Object.keys(sellersJson)[0];
            const firstCustomerKey = Object.keys(customersJson)[0];
            const isAlreadyIndex = firstSellerKey && firstCustomerKey && 
                                   typeof sellersJson[firstSellerKey] === 'string' && 
                                   typeof customersJson[firstCustomerKey] === 'string';
            
            if (isAlreadyIndex) {
                // Сервер уже вернул индекс, используем напрямую
                sellers = sellersJson;
                customers = customersJson;
            } else if (Array.isArray(sellersJson) && Array.isArray(customersJson)) {
                // Это массивы объектов, преобразуем в индексы
                sellers = makeIndex(sellersJson, 'id', v => `${v.first_name} ${v.last_name}`);
                customers = makeIndex(customersJson, 'id', v => `${v.first_name} ${v.last_name}`);
            } else {
                // Пытаемся извлечь массивы из объекта
                const sellersData = sellersJson?.data || sellersJson?.items || 
                                   (typeof sellersJson === 'object' && sellersJson !== null ? Object.values(sellersJson).find(Array.isArray) : null);
                const customersData = customersJson?.data || customersJson?.items || 
                                     (typeof customersJson === 'object' && customersJson !== null ? Object.values(customersJson).find(Array.isArray) : null);
                
                if (Array.isArray(sellersData) && Array.isArray(customersData)) {
                    sellers = makeIndex(sellersData, 'id', v => `${v.first_name} ${v.last_name}`);
                    customers = makeIndex(customersData, 'id', v => `${v.first_name} ${v.last_name}`);
                } else {
                    console.error('Не удалось извлечь массивы из ответа сервера. Структура ответа:', { 
                        sellersJson, 
                        customersJson,
                        sellersData,
                        customersData
                    });
                    throw new Error('Неверный формат данных от сервера: ожидались массивы');
                }
            }
        }

        return { sellers, customers };
    }

    // функция получения записей о продажах с сервера
    const getRecords = async (query, isUpdated = false) => {
        // Убеждаемся, что индексы загружены перед использованием
        if (!sellers || !customers) {
            await getIndexes();
        }

        const qs = new URLSearchParams(query); // преобразуем объект параметров в SearchParams объект, представляющий query часть url
        const nextQuery = qs.toString(); // и приводим к строковому виду

        if (lastQuery === nextQuery && !isUpdated) { // isUpdated параметр нужен, чтобы иметь возможность делать запрос без кеша
            return lastResult; // если параметры запроса не поменялись, то отдаём сохранённые ранее данные
        }

        // если прошлый квери не был ранее установлен или поменялись параметры, то запрашиваем данные с сервера
        const response = await fetch(`${BASE_URL}/records?${nextQuery}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
        }
        
        const records = await response.json();

        if (!records || typeof records !== 'object' || !Array.isArray(records.items)) {
            console.error('Неверный формат данных от сервера:', records);
            throw new Error('Неверный формат данных от сервера');
        }

        lastQuery = nextQuery; // сохраняем для следующих запросов
        lastResult = {
            total: records.total,
            items: mapRecords(records.items)
        };

        return lastResult;
    };

    return {
        getIndexes,
        getRecords
    };
}