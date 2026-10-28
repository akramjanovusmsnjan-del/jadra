
const chat = document.getElementById("chat");
const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const memoryList = document.getElementById("memoryList");

const HISTORY_KEY = "jadra_ai_history_v1";
const MEMORY_KEY = "jadra_ai_memory_v1";

let history = loadData(HISTORY_KEY, []);
let memory = loadData(MEMORY_KEY, []);

function loadData(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function saveData() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch {
    alert("Brauzer xotirasi to‘ldi yoki saqlash bloklangan.");
  }
}

function showMessage(text, who, save = true) {
  document.getElementById("welcome")?.remove();

  const row = document.createElement("div");
  row.className = `message ${who}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = who === "user" ? "S" : "✦";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  row.append(avatar, bubble);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;

  if (save) {
    history.push({ text, who, time: Date.now() });
    saveData();
  }
}

function renderHistory() {
  chat.innerHTML = "";

  if (!history.length) {
    chat.innerHTML = `
      <div id="welcome" class="welcome">
        <div class="welcome-icon">✦</div>
        <h1>Salom! Men JADRA AI 💛</h1>
        <p>Men bilan istagan mavzuda suhbatlashishing mumkin.</p>
        <div class="suggestions">
          <button class="suggestion">Bugun kayfiyatim ajoyib!</button>
          <button class="suggestion">Bir oz suhbatlashamizmi?</button>
          <button class="suggestion">Men haqimda nimalarni bilasan?</button>
        </div>
      </div>`;
  } else {
    history.forEach(item => showMessage(item.text, item.who, false));
  }

  renderMemory();
}

function renderMemory() {
  memoryList.innerHTML = "";

  if (!memory.length) {
    memoryList.textContent = "Hozircha xotira bo‘sh.";
    return;
  }

  memory.forEach(item => {
    const div = document.createElement("div");
    div.className = "memory-item";
    div.textContent = item;
    memoryList.appendChild(div);
  });
}

function remember(item) {
  item = item.trim();

  if (!item || memory.some(m => m.toLowerCase() === item.toLowerCase())) {
    return false;
  }

  memory.unshift(item);
  memory = memory.slice(0, 30);
  saveData();
  renderMemory();
  return true;
}

function getPersonalMemory() {
  if (!memory.length) {
    return "Hozircha sen haqingda alohida ma’lumot saqlamaganman. O‘zing haqingda biror narsa aytsang, eslab qolishga harakat qilaman.";
  }

  return "Men sen haqingda saqlagan ma’lumotlar:\n" +
    memory.map((item, i) => `${i + 1}. ${item}`).join("\n");
}

function learnFromMessage(message) {
  const text = message.trim();
  let match;

  const patterns = [
    {
      regex: /(?:mening ismim|ismim|meni ismim)\s+([a-zA-ZА-Яа-яЁё‘'ʻ`-]+)/i,
      label: "Ismi"
    },
    {
      regex: /(?:men\s+)(\d{1,2})\s*yosh(?:daman|da)/i,
      label: "Yoshi"
    },
    {
      regex: /(?:men|menga)\s+(?:yoqadi|yoqadi ekan)\s+(.+)/i,
      label: "Qiziqishi"
    },
    {
      regex: /(?:mening sevimli|sevimli)\s+(.+)/i,
      label: "Sevimli narsa"
    }
  ];

  for (const pattern of patterns) {
    match = text.match(pattern.regex);
    if (match) {
      let value = match[1].trim().replace(/[.!?]+$/, "");
      if (value.length > 0 && value.length < 100) {
        remember(`${pattern.label}: ${value}`);
      }
    }
  }

  if (/eslab qol|esda saqla|yodlab qol/i.test(text)) {
    const cleaned = text
      .replace(/iltimos/gi, "")
      .replace(/eslab qol(?:gin)?/gi, "")
      .replace(/esda saqla(?:gin)?/gi, "")
      .replace(/yodlab qol(?:gin)?/gi, "")
      .replace(/men haqimda/gi, "")
      .replace(/[.!?,]/g, "")
      .trim();

    if (cleaned.length >= 3 && cleaned.length < 150) {
      remember(cleaned);
    }
  }
}

function makeReply(rawMessage) {
  const original = rawMessage.trim();
  const m = original.toLowerCase().replace(/[’‘ʻ`]/g, "'");

  if (!original) return "Biror narsa yoz, men seni tinglayapman. 💛";

  if (/men haqimda nimalarni bilasan|men haqimda nima bilasan|xotiramni ko'rsat|nimani eslaysan|meni eslaysanmi/.test(m)) {
    return getPersonalMemory();
  }

  if (/meni unut|xotirani tozala|hammasini unut|xotiradan o'chir/.test(m)) {
    return "Xotirani tozalash uchun chap tomondagi «Xotirani tozalash» tugmasini bos. Shunda saqlangan ma’lumotlar o‘chadi.";
  }

  if (/^(salom|assalomu alaykum|assalom|hello|hi|hey)\b/.test(m)) {
    return "Salom! 💛 Seni ko‘rib turganimdan xursandman! Bugun kayfiyating qanday? Nimalar bo‘lyapti?";
  }

  if (/qalesan|qalaysan|yaxshimisan|ishlar qalay/.test(m)) {
    return "Men tayyorman, suhbatga doim shayman! 😄 O‘zing-chi, qalaysan? Buguning qanday o‘tyapti?";
  }

  if (/zerik|zerikdim/.test(m)) {
    return "Unda zerikishga yo‘l qo‘ymaymiz! 😄 Keling, bir-birimizga qiziq savollar beramizmi yoki kulgili voqealar haqida gaplashamizmi?";
  }

  if (/xafa|yig'lagim|kayfiyatim yo'q|yomonman|ko'nglim g'ash/.test(m)) {
    return "Voy, seni nima xafa qildi? 💛 Xohlasang, bemalol ayt. Men seni tinglayman, hukm qilmayman.";
  }

  if (/xursand|kayfiyatim ajoyib|baxtliman|zo'rman|yaxshiman/.test(m)) {
    return "Voy, zo‘r-ku! 🥰 Shu kayfiyating doimiy bo‘lsin! Bugun seni nima xursand qildi?";
  }

  if (/rahmat|tashakkur/.test(m)) {
    return "Arzimaydi! 💛 Suhbatimiz senga yoqayotgan bo‘lsa, men xursandman. Yana nimalar haqida gaplashamiz?";
  }

  if (/hazil|kulgili/.test(m)) {
    return "Mayli, bitta hazil 😄\nKompyuter nega shifokorga bordi?\nChunki uning Windows'i shamollab qolibdi! 😂";
  }

  if (/kim bo'lasan|kimsan|o'zing kimsan|nima qila olasan/.test(m)) {
    return "Men JADRA AI — sening shaxsiy suhbatdoshingman! 💛 Gaplashishimiz, hazillashishimiz va sen aytgan ayrim ma’lumotlarni eslab qolishim mumkin. Hozircha haqiqiy AI modeliga ulanmaganman.";
  }

  if (/ismim|mening ismim/.test(m)) {
    const found = memory.find(item => item.toLowerCase().startsWith("ismi:"));
    if (found) return `Ha, eslayman! ${found} 😊`;
    return "Ismingni ayt-chi, suhbatlarimizda eslab qolishga harakat qilaman. 💛";
  }

  if (/eslab qol|esda saqla|yodlab qol/.test(m)) {
    return "Mayli! 💛 Aytgan ma’lumotingni xotiraga saqlashga harakat qildim. Chap tomondagi xotira bo‘limidan tekshirishing mumkin.";
  }

  if (/sevgi|sevaman|muhabbat/.test(m)) {
    return "Sevgi juda qiziq mavzu-ku! 💛 Ba’zan insonni baxtli qiladi, ba’zan esa ko‘p o‘ylantiradi. Sen bu haqda nimani o‘ylayapsan?";
  }

  if (/o'qish|dars|maktab|universitet|imtihon/.test(m)) {
    return "O‘qish haqida gaplashamiz! 📚 Hozir qaysi fan yoki vazifa seni ko‘proq o‘ylantiryapti?";
  }

  if (/dastur|kod|python|javascript|html|css/.test(m)) {
    return "Dasturlash haqida ham suhbatlashamiz! 💻 Men oddiy misollar va tavsiyalar bera olaman. Faqat murakkab savollarga javobim cheklangan bo‘lishi mumkin, chunki haqiqiy AI modeliga ulanmaganman.";
  }

  if (/\?$/.test(original)) {
    return "Qiziq savol ekan! 😊 Men hozircha oldindan yozilgan suhbat qoidalari bilan ishlayman, shuning uchun hamma savolga aniq javob bera olmayman. Biroz boshqacharoq tushuntirib bera olasanmi?";
  }

  const replies = [
    "Ha, tushundim. 💛 Yana ayt-chi, keyin nima bo‘ldi?",
    "Qiziq ekan! 😊 Bu haqda yana gapirib ber.",
    "Men seni tinglayapman. Davom etaver!",
    "Hmm, tushunarli. Sen bu vaziyatda o‘zingni qanday his qilding?",
    "Rostdanmi? 😄 Batafsilroq aytib ber-chi!",
    "Men bilan bemalol gaplashishing mumkin. Yana nima xayolingda?",
    "Tushundim. 💛 Bu sen uchun muhimga o‘xshaydi."
  ];

  return replies[Math.floor(Math.random() * replies.length)];
}

function sendMessage(message) {
  const text = message.trim();
  if (!text) return;

  showMessage(text, "user");
  learnFromMessage(text);

  const reply = makeReply(text);
  showMessage(reply, "bot");
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const text = input.value;
  input.value = "";
  input.style.height = "auto";
  sendMessage(text);
  input.focus();
});

input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 140) + "px";
});

document.getElementById("newChat").addEventListener("click", () => {
  history = [];
  saveData();
  renderHistory();
  input.focus();
});

document.getElementById("clearMemory").addEventListener("click", () => {
  if (confirm("Saqlangan xotiradagi barcha ma’lumotlarni o‘chirmoqchimisiz?")) {
    memory = [];
    saveData();
    renderMemory();
  }
});

document.getElementById("clearHistory").addEventListener("click", () => {
  if (confirm("Barcha suhbatlar tarixini o‘chirmoqchimisiz?")) {
    history = [];
    saveData();
    renderHistory();
  }
});

document.addEventListener("click", event => {
  const button = event.target.closest(".suggestion");
  if (!button) return;

  const text = button.textContent;
  sendMessage(text);
});

renderHistory();
