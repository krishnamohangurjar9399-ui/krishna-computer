const $ = id => document.getElementById(id);
const today = new Date().toISOString().slice(0,10);
$("today").textContent = new Date().toLocaleDateString("hi-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
$("lDate").value = today;
const load = (k, fallback=[]) => { try{return JSON.parse(localStorage.getItem(k)) ?? fallback}catch{return fallback} };
let customers = load("kc_customers"), ledger = load("kc_ledger");
const save = () => {localStorage.setItem("kc_customers",JSON.stringify(customers));localStorage.setItem("kc_ledger",JSON.stringify(ledger));render()};
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2})}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2300)}
function render(){
 $("customerCount").textContent=customers.length;
 const todayRows=ledger.filter(x=>x.date===today);
 $("todayIncome").textContent=money(todayRows.filter(x=>x.type==="income"||x.type==="paid").reduce((s,x)=>s+x.amount,0));
 $("todayExpense").textContent=money(todayRows.filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount,0));
 $("dueTotal").textContent=money(ledger.reduce((s,x)=>s+(x.type==="due"?x.amount:x.type==="paid"?-x.amount:0),0));
 const q=($("customerSearch").value||"").toLowerCase();
 const filtered=customers.filter(c=>(c.name+" "+c.phone+" "+c.note).toLowerCase().includes(q));
 $("customerList").innerHTML=filtered.length?filtered.map(c=>`<div class="item"><div><strong>${esc(c.name)}</strong><small>${esc(c.phone||"मोबाइल नहीं")} · ${esc(c.note||"कोई नोट नहीं")}</small></div><div class="actions"><button class="small" onclick="messageCustomer('${c.id}')">WhatsApp</button><button class="danger" onclick="deleteCustomer('${c.id}')">हटाएं</button></div></div>`).join(""):'<div class="empty">अभी ग्राहक नहीं हैं। ऊपर से पहला ग्राहक जोड़ें।</div>';
 const names={income:"कमाई",expense:"खर्च",due:"उधारी दी",paid:"उधारी वसूली"};
 $("ledgerList").innerHTML=ledger.length?[...ledger].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,100).map(x=>`<div class="item"><div><strong>${names[x.type]} · ${money(x.amount)}</strong><small>${esc(x.desc||"विवरण नहीं")} · ${x.date}</small></div><button class="danger" onclick="deleteLedger('${x.id}')">हटाएं</button></div>`).join(""):'<div class="empty">अभी कोई लेन-देन दर्ज नहीं है।</div>';
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("customerForm").addEventListener("submit",e=>{e.preventDefault();customers.push({id:crypto.randomUUID(),name:$("cName").value.trim(),phone:$("cPhone").value.trim(),note:$("cNote").value.trim()});e.target.reset();save();toast("ग्राहक सेव हो गया")});
$("customerSearch").addEventListener("input",render);
window.deleteCustomer=id=>{if(confirm("इस ग्राहक को हटाएं?")){customers=customers.filter(x=>x.id!==id);save()}};
window.messageCustomer=id=>{const c=customers.find(x=>x.id===id);if(c?.phone){$("waPhone").value=c.phone;$("waMessage").value=`नमस्ते ${c.name}! कृष्णा कम्प्यूटर, सोयत कलां से नमस्कार।`;$("tabs")?.scrollIntoView?.();document.querySelector('[data-tab="whatsapp"]').click()}else toast("इस ग्राहक का मोबाइल नंबर दर्ज नहीं है")};
$("ledgerForm").addEventListener("submit",e=>{e.preventDefault();ledger.push({id:crypto.randomUUID(),type:$("lType").value,amount:Number($("lAmount").value),desc:$("lDesc").value.trim(),date:$("lDate").value});e.target.reset();$("lDate").value=today;save();toast("हिसाब सेव हो गया")});
window.deleteLedger=id=>{if(confirm("यह लेन-देन हटाएं?")){ledger=ledger.filter(x=>x.id!==id);save()}};
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".panel").forEach(x=>x.classList.toggle("active",x.id===b.dataset.tab))}));
$("backupBtn").onclick=()=>{const blob=new Blob([JSON.stringify({customers,ledger,exported:new Date().toISOString()},null,2)],{type:"application/json"});download(blob,"krishna-computer-backup.json");toast("बैकअप डाउनलोड हो गया")};
function download(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)}
$("exportCsv").onclick=()=>{const rows=[["तारीख","प्रकार","रकम","विवरण"],...ledger.map(x=>[x.date,x.type,x.amount,x.desc])];const csv="\uFEFF"+rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\n");download(new Blob([csv],{type:"text/csv;charset=utf-8"}),"krishna-hisab.csv")};
$("printBtn").onclick=()=>{const f=$("printFile").files[0];if(!f)return toast("पहले फाइल चुनें");const url=URL.createObjectURL(f);const w=window.open(url,"_blank");if(!w)toast("पॉप-अप की अनुमति दें, फिर दोबारा कोशिश करें");else if(f.type.startsWith("image/"))w.onload=()=>w.print()};
$("scanFile").onchange=()=>{$("scanStatus").textContent=$("scanFile").files[0]?"चुनी गई फाइल: "+$("scanFile").files[0].name:"अभी कोई फाइल नहीं चुनी गई।"};
$("pdfFiles").onchange=()=>{$("pdfFileNames").textContent=[...$("pdfFiles").files].map(f=>f.name).join(" · ")||"कोई फाइल नहीं चुनी गई।"};
$("pdfPrint").onclick=()=>{const fs=[...$("pdfFiles").files];if(!fs.length)return toast("पहले फाइल चुनें");const images=fs.filter(f=>f.type.startsWith("image/"));if(images.length!==fs.length)return toast("इस शुरुआती संस्करण में PDF बनाने के लिए फोटो फाइलें चुनें");const urls=images.map(f=>URL.createObjectURL(f));const w=window.open("","_blank");if(!w)return toast("पॉप-अप की अनुमति दें");w.document.write('<html><head><title>PDF</title><style>body{margin:0}img{width:100%;max-height:100vh;object-fit:contain;page-break-after:always}</style></head><body>'+urls.map(u=>`<img src="${u}">`).join("")+'</body></html>');w.document.close();w.onload=()=>w.print()};
let photoUrl=null;
$("photoFile").onchange=()=>{const f=$("photoFile").files[0];if(!f)return;if(photoUrl)URL.revokeObjectURL(photoUrl);photoUrl=URL.createObjectURL(f);$("photoPreview").src=photoUrl;$("photoPreview").hidden=false;$("photoPlaceholder").hidden=true};
$("photoPrint").onclick=()=>{if(!photoUrl)return toast("पहले फोटो चुनें");const count=Math.max(1,Math.min(40,Number($("photoCopies").value)||1));const size=$("photoSize").value;const dim=size==="35x45"?"35mm 45mm":size==="25x35"?"25mm 35mm":"auto";const w=window.open("","_blank");if(!w)return toast("पॉप-अप की अनुमति दें");w.document.write(`<html><head><title>Photo Sheet</title><style>body{font-family:Arial;display:flex;flex-wrap:wrap;gap:5mm;padding:8mm}.p{width:${size==="custom"?"45mm":size==="35x45"?"35mm":"25mm"};height:${size==="custom"?"auto":size==="35x45"?"45mm":"35mm"};object-fit:cover}</style></head><body>${Array.from({length:count},()=>`<img class="p" src="${photoUrl}">`).join("")}</body></html>`);w.document.close();w.onload=()=>w.print()};
$("waForm").onsubmit=e=>{e.preventDefault();let p=$("waPhone").value.replace(/\D/g,"");if(p.length===10)p="91"+p;if(p.length<10)return toast("मोबाइल नंबर जांचें");location.href=`https://wa.me/${p}?text=${encodeURIComponent($("waMessage").value)}`};
$("aiForm").onsubmit=e=>{e.preventDefault();const q=$("aiQuestion").value.trim();if(!q)return;addBubble(q,"user");$("aiQuestion").value="";const t=q.toLowerCase();let a="मैं अभी शुरुआती ऑफलाइन सहायक हूं। ग्राहक, दुकान के हिसाब, प्रिंट, स्कैन, PDF और WhatsApp टैब इस्तेमाल कर सकते हैं। असली AI जवाबों के लिए सुरक्षित API कनेक्शन अगले चरण में जोड़ा जाएगा।";if(t.includes("ग्राहक"))a="ग्राहक टैब खोलें, नाम और मोबाइल नंबर भरें और ‘ग्राहक जोड़ें’ दबाएं।";else if(t.includes("हिसाब")||t.includes("कमाई"))a="दुकान का हिसाब टैब खोलें। कमाई, खर्च, उधारी दी या उधारी वसूली चुनकर रकम सेव करें।";else if(t.includes("प्रिंट")||t.includes("स्कैन"))a="प्रिंट के लिए फाइल चुनें। HP स्कैनर से स्कैन करने के लिए Windows में HP Scan चलाएं और बनी फाइल यहां चुनें।";else if(t.includes("व्हाट्स"))a="WhatsApp टैब में मोबाइल नंबर और संदेश लिखकर ‘WhatsApp पर भेजें’ दबाएं।";setTimeout(()=>addBubble(a,"bot"),250)};
function addBubble(s,who){const d=document.createElement("div");d.className="bubble "+who;d.textContent=s;$("chat").appendChild(d);$("chat").scrollTop=$("chat").scrollHeight}
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
render();