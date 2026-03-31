import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  update,
  remove,
  get
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";


// 🔐 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAzv3bITbFXniupND8S38LhRyfbpaO7WEo",
  authDomain: "rhepis-6bdbd.firebaseapp.com",
  databaseURL: "https://rhepis-6bdbd-default-rtdb.firebaseio.com",
  projectId: "rhepis-6bdbd",
  storageBucket: "rhepis-6bdbd.firebasestorage.app",
  messagingSenderId: "10811334318",
  appId: "1:10811334318:web:44a05a52227dc2d463573f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);


// =========================
// 🔐 LOGIN
// =========================
window.login = async () => {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  if (!email || !senha) {
    alert("Preencha tudo");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, senha);
    window.location.href = "painel.html";
  } catch (e) {
    alert(e.message);
  }
};


// =========================
// 🆕 CADASTRO
// =========================
window.cadastrar = async () => {
  const nome = document.getElementById("nome").value;
  const matricula = document.getElementById("matricula").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  if (!nome || !matricula || !email || !senha) {
    alert("Preencha tudo");
    return;
  }

  try {
    const user = await createUserWithEmailAndPassword(auth, email, senha);

    await set(ref(db, "usuarios/" + user.user.uid), {
      nome,
      matricula,
      email
    });

    alert("Cadastrado!");
    window.location.href = "index.html";
  } catch (e) {
    alert(e.message);
  }
};


// =========================
// 📦 TAMANHOS DINÂMICOS
// =========================
const tamanhos = {
  "Bota": ["33","34","35","36","37","38","39","40","41","42","43","44","45","46"],
  "Calça preta": ["34","36","38","40","42","44","46","48","50","52","54","56"],
  "Calça supply": ["P","M","G","GG","XG","XXG"],
  "Camiseta Eficiência": ["P","M","G","GG","XG","XXG","EXGG"],
  "Camiseta Leroy": ["P","M","G","GG","XG","XXG","EXGG"],
  "Colete": ["P","M","G","GG","XG"],
  "Jaqueta supply": ["P","M","G","GG","XG","XXG"],
  "Jaqueta Leroy": ["P","M","G","GG","XG","XXG"],
  "Camiseta Aprendiz": ["PP","P","M","G","GG","XG","XXG"],
  "Camiseta supply": ["PP","P","M","G","GG","XG","XXG","EXGG"],
  "Capacete": ["Verde","Amarelo","Vermelho","Branco"],
  "Estilete": ["Único"],
  "Luva": ["P","M","G"]
};

const itemSelect = document.getElementById("item");
const tamanhoSelect = document.getElementById("tamanho");

if (itemSelect && tamanhoSelect) {
  itemSelect.addEventListener("change", () => {
    const item = itemSelect.value;
    tamanhoSelect.innerHTML = "";

    if (!tamanhos[item]) {
      tamanhoSelect.innerHTML = "<option>Selecione um item válido</option>";
      return;
    }

    tamanhos[item].forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      tamanhoSelect.appendChild(opt);
    });
  });
}


// =========================
// 📦 ENVIAR PEDIDO (COM NOME)
// =========================
window.enviarPedido = async () => {
  const user = auth.currentUser;

  if (!user) {
    alert("Faça login");
    return;
  }

  const snap = await get(ref(db, "usuarios/" + user.uid));
  const dados = snap.val();

  const item = document.getElementById("item").value;
  const tamanho = document.getElementById("tamanho").value;
  const quantidade = document.getElementById("quantidade").value;

  if (!item || !tamanho || !quantidade) {
    alert("Preencha tudo");
    return;
  }

  await push(ref(db, "pedidos"), {
    uid: user.uid,
    nome: dados.nome,
    matricula: dados.matricula,
    item,
    variacao: tamanho,
    quantidade,
    status: "pendente"
  });

  alert("Pedido enviado!");
  window.location.href = "usuario.html";
};


// =========================
// 👤 USUÁRIO
// =========================
onAuthStateChanged(auth, user => {
  const lista = document.getElementById("listaPedidos");
  if (!user || !lista) return;

  onValue(ref(db, "pedidos"), snap => {
    lista.innerHTML = "";

    snap.forEach(c => {
      const p = c.val();

      if (p.uid === user.uid) {
        lista.innerHTML += `
          <div class="card-pedido">
            <div class="pedido-info">
              <strong>${p.item} (${p.variacao})</strong>
              <span class="status ${p.status}">${p.status}</span>
            </div>
          </div>
        `;
      }
    });
  });
});


// =========================
// 🧑‍💼 RH
// =========================
const painel = document.getElementById("painelRH");

if (painel) {
  onValue(ref(db, "pedidos"), snap => {
    painel.innerHTML = "";

    snap.forEach(c => {
      const p = c.val();
      const id = c.key;

     painel.innerHTML += `
  <div class="card-pedido">

    <div class="pedido-info">
      <span><strong>${p.nome}</strong> - ${p.matricula}</span>
      <span>${p.item}</span>
      <span>${p.variacao}</span>
      <span class="status ${p.status}">${p.status}</span>
    </div>

    <div class="acoes">
      <button class="btn-acao btn-aprovar" onclick="mudar('${id}','aprovado')">✔</button>
      <button class="btn-acao btn-negar" onclick="mudar('${id}','negado')">✖</button>
      <button class="btn-acao btn-retirada" onclick="mudar('${id}','retirada')">📦</button>
      <button class="btn-acao btn-excluir" onclick="excluir('${id}')">🗑</button>
    </div>

  </div>
`;
    });
  });
}


// =========================
// 🔄 STATUS
// =========================
window.mudar = (id, status) => {
  update(ref(db, "pedidos/" + id), { status });
};


// =========================
// 🗑 EXCLUIR
// =========================
window.excluir = async (id) => {
  const confirmar = confirm("Tem certeza que deseja excluir este pedido?");
  if (!confirmar) return;

  try {
    await remove(ref(db, "pedidos/" + id));
  } catch (e) {
    alert("Erro ao excluir: " + e.message);
  }
};
