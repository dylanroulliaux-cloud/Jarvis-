const $=s=>document.querySelector(s);
const messages=$("#messages"), input=$("#userInput"), form=$("#chatForm");
let lastReply="Je suis opérationnel, Monsieur. Comment puis-je vous assister ?";
function addMessage(who,text){const el=document.createElement("article");el.className="message "+who;const tag=document.createElement("div");tag.className="message-tag";tag.textContent=who==="jarvis"?"JARVIS":"MONSIEUR";const p=document.createElement("p");p.textContent=text;el.append(tag,p);messages.append(el);messages.scrollTop=messages.scrollHeight;if(who==="jarvis")lastReply=text}
function localReply(text){
 const q=text.toLowerCase();
 if(q.includes("bonjour")||q.includes("salut"))return "Bonjour Monsieur. Je suis à votre disposition.";
 if(q.includes("qui es-tu")||q.includes("présente"))return "Je suis J.A.R.V.I.S., votre assistant personnel. Cette première version fonctionne localement dans votre navigateur. Mon cerveau connecté sera ajouté lors de la prochaine étape.";
 if(q.includes("heure")||q.includes("date"))return "Nous sommes le "+new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})+". Pour l'heure exacte, consultez l'horloge de votre iPhone, Monsieur.";
 if(q.includes("aide")||q.includes("commandes"))return "Je peux déjà répondre à quelques commandes de démonstration. La connexion à Mammouth AI, aux applications et à votre mémoire avancée sera ajoutée dans la prochaine version.";
 if(q.includes("projet")||q.includes("jarvis"))return "Votre projet JARVIS est en phase de prototype. La prochaine étape sera de connecter mon cerveau à une API sécurisée, puis d'ajouter la mémoire et les commandes vocales.";
 return "Demande reçue, Monsieur. Mon interface fonctionne, mais mon cerveau IA distant n'est pas encore connecté. Nous allons ajouter Mammouth AI dans la prochaine étape. Pour l'instant, vous pouvez tester la conversation et ma voix.";
}
form.addEventListener("submit",e=>{e.preventDefault();const t=input.value.trim();if(!t)return;addMessage("user",t);input.value="";$("#reactorLabel").textContent="ANALYSE";$("#subtitle").textContent="Traitement de votre demande…";setTimeout(()=>{const reply=localReply(t);addMessage("jarvis",reply);$("#reactorLabel").textContent="EN ATTENTE";$("#subtitle").textContent="Tous les systèmes sont prêts.";},450)});
$("#voiceButton").addEventListener("click",()=>{if(!("speechSynthesis"in window)){alert("La synthèse vocale n'est pas disponible dans ce navigateur.");return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(lastReply);u.lang="fr-FR";u.rate=.92;u.pitch=.85;speechSynthesis.speak(u)});
$("#clearButton").addEventListener("click",()=>{messages.replaceChildren();addMessage("jarvis","Conversation réinitialisée, Monsieur.")});
$("#modelSelect").addEventListener("change",e=>{const labels={auto:"Sélection automatique",fast:"Mode rapide",advanced:"Mode avancé",local:"Mode local / démonstration"};$("#subtitle").textContent=labels[e.target.value]+" sélectionné.";});
if("serviceWorker"in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
