import { fromEvent, EMPTY } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, mergeMap, tap, catchError, filter } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax'; // для работы с асинхронными запросами

const url = 'https://api.github.com/search/users?q=';  // github api

const search = document.getElementById('search');
const result = document.getElementById('result');

const stream$ = fromEvent(search, 'input')
    .pipe(
        map(e => e.target.value),
        debounceTime(1000), // устанавливаем паузу. Т.е. после того как мы перестали набор в инпуте, через 1 сек отображается набранная информация
            // это необходимо в таких случаях как запрос к серверу.
        distinctUntilChanged(), // для того чтобы не отправлять запрос если значение после ввода в инпуте не изменилось.
        tap(() => result.innerHTML = ''), // очищаем шаблон от данных предыдущего запроса
        filter(v => v.trim()), // Обработка пустого инпута. Если к нам возвращается что-то отличное от пустой строки, то мы делаем запрос. Пустую строку filter не пропустит.
        switchMap(v => ajax.getJSON(url + v).pipe( // (switchMap) - позволяет переключиться на другой стрим. (v => ajax.getJSON(url + v) - каждому запросу к серверу соответствует каждый ответ от сервера
            catchError(err => EMPTY) // позволяет ловить ошибки. EMPTY - константа rxjs (обычный стрим который ничего не делает кроме простого завершения)
        )),
            // switchMap(v => ajax.getJSON(url + v)) - переключаемся на другой стрим который обрабатывает (ajax)-запрос. К нему так же можно применять операторы
        map(response => response.items), // преобразуем данные чтобы получать только массив со всеми пользователями из поля (items). Приходит массив с данными.
        mergeMap(items => items)  // запускает наш console.log(value) для каждого item-а
    )

stream$.subscribe(user => {
    console.log(user);
    const html = `
        <div class="card">
            <div class="card-image">
                <img src="${user.avatar_url}"/>
                <span class="card-title">${user.login}</span>
            </div>
            <div class="card-action">
                <a href="${user.html_url}" target="_blank">Открыть GitHub</a>
            </div>
        </div>
    `
    result.insertAdjacentHTML("beforeend", html);
});

