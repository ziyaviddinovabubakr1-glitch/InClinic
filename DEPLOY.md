# InClinic — выкладка в интернет (бесплатно)

Проект уже подготовлен к деплою. Тебе осталось только залить код на GitHub и нажать кнопки на Render.

---

## Что уже сделано в проекте

- `render.yaml` — автоматическая настройка сайта + базы на Render
- `npm run build:deploy` — сборка для сервера (база, демо-данные, Next.js)
- `npm start` — запуск на порту, который даёт хостинг
- `.env` убран из Git (секреты не утекут)
- `.env.example` — список всех переменных

---

## ШАГ 1 — Залить проект на GitHub (ты)

### 1.1 Создай репозиторий

1. Открой [github.com/new](https://github.com/new)
2. Имя: `inclinic` (или любое)
3. **Private** — можно, это нормально
4. **Не** ставь галочки README / .gitignore (у нас уже есть)
5. **Create repository**

### 1.2 Отправь код с компьютера

В терминале в папке `E:\Clinic`:

```powershell
cd E:\Clinic
git add .
git commit -m "Подготовка к деплою на Render"
git branch -M main
git remote add origin https://github.com/ТВОЙ_ЛОГИН/inclinic.git
git push -u origin main
```

Замени `ТВОЙ_ЛОГИН` на свой логин GitHub.

> Если Git спросит логин/пароль — используй **Personal Access Token** вместо пароля:  
> GitHub → Settings → Developer settings → Personal access tokens → Generate new token.

---

## ШАГ 2 — Деплой на Render (ты)

### 2.1 Регистрация

1. [render.com](https://render.com) → **Get Started** → войди через **GitHub**
2. Разреши доступ к репозиторию `inclinic`

### 2.2 Blueprint (самый простой способ)

1. Dashboard → **New +** → **Blueprint**
2. Подключи репозиторий `inclinic`
3. Render покажет `render.yaml` — нажми **Apply**

### 2.3 Заполни секреты (Render спросит при деплое)

| Переменная | Что вписать |
|------------|-------------|
| `ADMIN_USERNAME` | Логин для `/admin` (придумай новый) |
| `ADMIN_PASSWORD` | Сильный пароль для админки |
| `TELEGRAM_BOT_TOKEN` | Токен от @BotFather |
| `TELEGRAM_CHAT_ID` | Твой chat id (число) |
| `TELEGRAM_WEBHOOK_SECRET` | Любая строка 8+ символов (латиница/цифры) |
| `TELEGRAM_WEBHOOK_PUBLIC_URL` | Пока оставь пустым — заполнишь после деплоя |
| `NEXT_PUBLIC_BASE_URL` | То же — после деплоя |

`JWT_SECRET` Render сгенерирует сам.

### 2.4 Дождись билда

5–15 минут. Когда статус **Live** — скопируй URL, например:  
`https://inclinic-xxxx.onrender.com`

---

## ШАГ 3 — Дописать URL и Telegram (ты)

### 3.1 Обнови переменные на Render

Render → сервис **inclinic** → **Environment**:

```
TELEGRAM_WEBHOOK_PUBLIC_URL = https://inclinic-xxxx.onrender.com
NEXT_PUBLIC_BASE_URL          = https://inclinic-xxxx.onrender.com
```

Сохрани → Render перезапустит сайт.

### 3.2 Подключи Telegram webhook

Render → **inclinic** → вкладка **Shell** → выполни:

```bash
npm run telegram:webhook
```

Должно написать `✓ Webhook зарегистрирован`. В Telegram придёт тестовое сообщение.

---

## ШАГ 4 — Проверка (ты)

| Страница | Ссылка |
|----------|--------|
| Сайт | `https://твой-url.onrender.com` |
| Запись | `https://твой-url.onrender.com/booking` |
| Админка | `https://твой-url.onrender.com/admin` |

Отправь ссылку на сайт друзьям — они увидят клинику. Админка только с твоим логином и паролем.

---

## Важно знать

- **Бесплатный Render** «засыпает» без посетителей — первый заход после паузы ~30–60 сек.
- **Не публикуй** `.env.local` в GitHub — там пароли и токены.
- После деплоя **смени пароль админки**, если использовал старый локальный.
- Telegram без HTTPS не работает — на Render HTTPS есть автоматически.

---

## Если что-то сломалось

**Билд упал** → Render → Logs → ищи красные строки.

**Админка не пускает** → проверь `ADMIN_USERNAME` / `ADMIN_PASSWORD` в Environment.

**Telegram кнопки не работают** → проверь `npm run telegram:status` (URL должен быть `https://inclinic.onrender.com`). Webhook регистрируется при каждом старте сервера. **Не запускай `npm run dev` с `TELEGRAM_FORCE_DEV_POLLING=true`** — это сбрасывает webhook. Локально кнопки работают только на деплое или через ngrok.

**База пустая** → в Shell: `npx prisma db seed`
