/* Krishna Computer v5 — local-first shop helper */
const $ = id => document.getElementById(id);
const makeId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const localDate = d => { const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`; };
const today = localDate(new Date());
$("today").textContent = new Date().toLocaleDateString("hi-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
$("lDate").value = today;
const load = (k, fallback=[]) => { try { const v=JSON.parse(localStorage.getItem(k)); return v ?? fallback; } catch { return fallback; } };
let customers = load("kc_customers"), ledger = load("kc_ledger");
if (!Array.isArray(customers)) customers=[];
if (!Array.isArray(ledger)) ledger=[];
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>$ ("toast").classList.remove("show"),2600);}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function persist(){try{localStorage.setItem("kc_customers",JSON.stringify(customers));localStorage.setItem("kc_ledger",JSON.stringify(ledger));render();return true;}catch(e){toast("स्टोरेज भर गया या उपलब्ध नहीं है। बैकअप लें।");return false;}}
function csvDownload(rows,name){const csv="\uFEFF"+rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n");download(new Blob([csv],{type:"text/csv;charset=utf-8"}),name);}
function render(){
 $("customerCount").textContent=customers.length;
 const todayRows=ledger.filter(x=>x.date===today);
 $("todayIncome").textContent=money(todayRows.filter(x=>x.type==="income"||x.type==="paid").reduce((s,x)=>s+Number(x.amount||0),0));
 $("todayExpense").textContent=money(todayRows.filter(x=>x.type==="expense").reduce((s,x)=>s+Number(x.amount||0),0));
 $("dueTotal").textContent=money(ledger.reduce((s,x)=>s+(x.type==="due"?Number(x.amount||0):x.type==="paid"?-Number(x.amount||0):0),0));
 const q=($ ("customerSearch").value||"").toLowerCase();
 const filtered=customers.filter(c=>(`${c.name||""} ${c.phone||""} ${c.note||""}`).toLowerCase().includes(q));
 $("customerList").innerHTML=filtered.length?filtered.map(c=>`<div class="item"><div><strong>${esc(c.name)}</strong><small>${esc(c.phone||"मोबाइल नहीं")} · ${esc(c.note||"कोई नोट नहीं")}</small></div><div class="actions"><button class="small" onclick="messageCustomer('${esc(c.id)}')">WhatsApp</button><button class="danger" onclick="deleteCustomer('${esc(c.id)}')">हटाएं</button></div></div>`).join(""):'<div class="empty">अभी ग्राहक नहीं हैं। ऊपर से पहला ग्राहक जोड़ें।</div>';
 const names={income:"कमाई",expense:"खर्च",due:"उधारी दी",paid:"उधारी वसूली"};
 $("ledgerList").innerHTML=ledger.length?[...ledger].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,100).map(x=>`<div class="item"><div><strong>${names[x.type]||"लेन-देन"} · ${money(x.amount)}</strong><small>${esc(x.desc||"विवरण नहीं")} · ${esc(x.date||"")}</small></div><button class="danger" onclick="deleteLedger('${esc(x.id)}')">हटाएं</button></div>`).join(""):'<div class="empty">अभी कोई लेन-देन दर्ज नहीं है।</div>';
}
$("customerForm").addEventListener("submit",e=>{e.preventDefault();const phone=$("cPhone").value.replace(/\D/g,"");if(phone&&phone.length!==10)return toast("मोबाइल नंबर 10 अंकों का लिखें");customers.push({id:makeId(),name:$("cName").value.trim(),phone,note:$("cNote").value.trim()});e.target.reset();if(persist())toast("ग्राहक सेव हो गया");});
$("customerSearch").addEventListener("input",render);
window.deleteCustomer=id=>{if(confirm("इस ग्राहक को हटाएं?")){customers=customers.filter(x=>x.id!==id);persist();}};
window.messageCustomer=id=>{const c=customers.find(x=>x.id===id);if(c?.phone){$("waPhone").value=c.phone;$("waMessage").value=`नमस्ते ${c.name}! कृष्णा कम्प्यूटर, सोयत कलां से नमस्कार।`;document.querySelector('[data-tab="whatsapp"]').click();}else toast("इस ग्राहक का मोबाइल नंबर दर्ज नहीं है");};
$("exportCustomers").onclick=()=>{csvDownload([["नाम","मोबाइल","पता/नोट"],...customers.map(c=>[c.name,c.phone,c.note])],"krishna-customers.csv");};
$("ledgerForm").addEventListener("submit",e=>{e.preventDefault();const amount=Number($("lAmount").value);if(!Number.isFinite(amount)||amount<=0)return toast("रकम सही दर्ज करें");ledger.push({id:makeId(),type:$("lType").value,amount,desc:$("lDesc").value.trim(),date:$("lDate").value||today});e.target.reset();$("lDate").value=today;if(persist())toast("हिसाब सेव हो गया");});
window.deleteLedger=id=>{if(confirm("यह लेन-देन हटाएं?")){ledger=ledger.filter(x=>x.id!==id);persist();}};
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".panel").forEach(x=>x.classList.toggle("active",x.id===b.dataset.tab));}));
function download(blob,name){const a=document.createElement("a"),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
$("backupBtn").onclick=()=>{download(new Blob([JSON.stringify({app:"Krishna Computer",version:5,customers,ledger,exported:new Date().toISOString()},null,2)],{type:"application/json"}),"krishna-computer-backup.json");toast("बैकअप डाउनलोड हो गया");};
$("restoreBtn").onclick=()=>$("restoreFile").click();
$("restoreFile").onchange=async()=>{const f=$("restoreFile").files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(d.app!=="Krishna Computer"||!Array.isArray(d.customers)||!Array.isArray(d.ledger))throw Error("invalid");if(!confirm(`बैकअप में ${d.customers.length} ग्राहक और ${d.ledger.length} लेन-देन हैं। वर्तमान डेटा बदल जाएगा। जारी रखें?`))return;const oldC=customers,oldL=ledger;customers=d.customers;ledger=d.ledger;if(!persist()){customers=oldC;ledger=oldL;}else toast("बैकअप सफलतापूर्वक वापस आ गया");}catch{toast("गलत या खराब Krishna Computer बैकअप फाइल");}finally{$("restoreFile").value="";}};
$("exportCsv").onclick=()=>csvDownload([["तारीख","प्रकार","रकम","विवरण"],...ledger.map(x=>[x.date,x.type,x.amount,x.desc])],"krishna-hisab.csv");
$("printBtn").onclick=()=>{const f=$("printFile").files[0];if(!f)return toast("पहले फाइल चुनें");const url=URL.createObjectURL(f),w=window.open(url,"_blank");if(!w){URL.revokeObjectURL(url);toast("पॉप-अप की अनुमति दें, फिर दोबारा कोशिश करें");return;}if(f.type.startsWith("image/"))w.addEventListener("load",()=>w.print(),{once:true});};
$("scanFile").onchange=()=>{const f=$("scanFile").files[0];$("scanStatus").textContent=f?"चुनी गई फाइल: "+f.name:"अभी कोई फाइल नहीं चुनी गई।";$("downloadScan").disabled=!f;};
$("downloadScan").onclick=()=>{const f=$("scanFile").files[0];if(f)download(f,f.name);};
$("pdfFiles").onchange=()=>{$("pdfFileNames").textContent=[...$("pdfFiles").files].map(f=>f.name).join(" · ")||"कोई फाइल नहीं चुनी गई।";};
$("pdfPrint").onclick=()=>{const fs=[...$("pdfFiles").files];if(!fs.length)return toast("पहले फोटो फाइलें चुनें");if(fs.some(f=>!f.type.startsWith("image/")))return toast("PDF बनाने के लिए केवल फोटो फाइलें चुनें");const urls=fs.map(f=>URL.createObjectURL(f)),w=window.open("","_blank");if(!w){urls.forEach(URL.revokeObjectURL);return toast("पॉप-अप की अनुमति दें");}w.document.write('<!doctype html><html><head><title>PDF</title><style>@page{margin:10mm}body{margin:0}img{width:100%;height:260mm;object-fit:contain;page-break-after:always}</style></head><body>'+urls.map(u=>`<img src="${u}">`).join("")+'</body></html>');w.document.close();w.onload=()=>w.print();};
let photoUrl=null;
$("photoFile").onchange=()=>{const f=$("photoFile").files[0];if(!f)return;if(!f.type.startsWith("image/"))return toast("कृपया फोटो फाइल चुनें");if(photoUrl)URL.revokeObjectURL(photoUrl);photoUrl=URL.createObjectURL(f);$("photoPreview").src=photoUrl;$("photoPreview").hidden=false;$("photoPlaceholder").hidden=true;};
$("photoPrint").onclick=()=>{if(!photoUrl)return toast("पहले फोटो चुनें");const count=Math.max(1,Math.min(40,Number($("photoCopies").value)||1)),size=$("photoSize").value,w=window.open("","_blank");if(!w)return toast("पॉप-अप की अनुमति दें");const width=size==="custom"?"45mm":size==="35x45"?"35mm":"25mm",height=size==="custom"?"auto":size==="35x45"?"45mm":"35mm";w.document.write(`<!doctype html><html><head><title>Photo Sheet</title><style>@page{size:A4;margin:8mm}body{font-family:Arial;display:flex;flex-wrap:wrap;align-content:flex-start;gap:5mm}.p{width:${width};height:${height};object-fit:cover}</style></head><body>${Array.from({length:count},()=>`<img class="p" src="${photoUrl}">`).join("")}</body></html>`);w.document.close();w.onload=()=>w.print();};
$("waForm").onsubmit=e=>{e.preventDefault();let p=$("waPhone").value.replace(/\D/g,"");if(p.length===10)p="91"+p;if(p.length<10||p.length>15)return toast("मोबाइल नंबर जांचें");window.open(`https://wa.me/${p}?text=${encodeURIComponent($("waMessage").value)}`,"_blank","noopener");};
$("aiForm").onsubmit=e=>{e.preventDefault();const q=$("aiQuestion").value.trim();if(!q)return;addBubble(q,"user");$("aiQuestion").value="";const t=q.toLowerCase();let a="मैं Krishna Computer का ऑफलाइन सहायक हूं। इस ऐप के फीचर और सामान्य दुकान के काम समझा सकता हूं। इंटरनेट आधारित असली AI के लिए सुरक्षित सर्वर/API की जरूरत होगी।";if(t.includes("ग्राहक"))a="ग्राहक टैब खोलें, नाम और मोबाइल नंबर भरें और ‘ग्राहक जोड़ें’ दबाएं। ग्राहक सूची CSV में भी डाउनलोड कर सकते हैं।";else if(t.includes("हिसाब")||t.includes("कमाई"))a="दुकान का हिसाब टैब खोलें। कमाई, खर्च, उधारी दी या उधारी वसूली चुनकर रकम सेव करें।";else if(t.includes("प्रिंट")||t.includes("स्कैन"))a="प्रिंट के लिए फाइल चुनें। HP स्कैनर से स्कैन करने के लिए Windows में HP Scan चलाएं और बनी फाइल यहां चुनें।";else if(t.includes("व्हाट्स"))a="WhatsApp टैब में मोबाइल नंबर और संदेश लिखकर बटन दबाएं। संदेश WhatsApp में खुलेगा; भेजने से पहले जांच लें।";else if(t.includes("बैकअप"))a="ऊपर ‘बैकअप डाउनलोड’ से JSON बैकअप रखें। वापस लाने के लिए ‘बैकअप वापस लाएं’ चुनें। Restore पर वर्तमान रिकॉर्ड बदल जाएंगे।";else if(t.includes("फोटो"))a="फोटो स्टूडियो में फोटो चुनें, पासपोर्ट या छोटी फोटो का आकार और कॉपी संख्या सेट करें, फिर फोटो शीट प्रिंट करें।";else if(t.includes("पीडीएफ")||t.includes("pdf"))a="PDF टूल में फोटो फाइलें चुनें, PDF बनाएं/सेव करें दबाएं और प्रिंट विंडो में Save as PDF चुनें। मौजूदा PDF merge/edit सुविधा शामिल नहीं है।";setTimeout(()=>addBubble(a,"bot"),180);};
function addBubble(s,who){const d=document.createElement("div");d.className="bubble "+who;d.textContent=s;$("chat").appendChild(d);$("chat").scrollTop=$("chat").scrollHeight;}
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
render();


// Customer self-registration and document storage (local browser only).
const REG_DB="kc_registration_db", REG_STORE="registrations";
function openRegDB(){
 return new Promise((resolve,reject)=>{
  if(!("indexedDB" in window)) return reject(new Error("इस ब्राउज़र में IndexedDB उपलब्ध नहीं है"));
  const req=indexedDB.open(REG_DB,1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(REG_STORE))db.createObjectStore(REG_STORE,{keyPath:"id"});};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}
async function saveRegistration(record){
 const db=await openRegDB();
 return new Promise((resolve,reject)=>{const tx=db.transaction(REG_STORE,"readwrite");tx.objectStore(REG_STORE).put(record);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});
}
async function getRegistrations(){
 const db=await openRegDB();
 return new Promise((resolve,reject)=>{const req=db.transaction(REG_STORE,"readonly").objectStore(REG_STORE).getAll();req.onsuccess=()=>{db.close();resolve((req.result||[]).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));};req.onerror=()=>{db.close();reject(req.error);};});
}
$("selfRegForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const file=$("regDoc").files[0],phone=$("regPhone").value.replace(/\D/g,"");
 if(phone.length!==10)return toast("मोबाइल नंबर 10 अंकों का होना चाहिए");
 if(!file)return toast("दस्तावेज़ फाइल चुनें");
 if(file.size>8*1024*1024)return toast("फाइल 8 MB से छोटी रखें");
 const allowed=["application/pdf","image/jpeg","image/png"];
 if(!allowed.includes(file.type))return toast("केवल PDF, JPG या PNG फाइल चुनें");
 const id="KC-"+new Date().toISOString().slice(0,10).replaceAll("-","")+"-"+Math.random().toString(36).slice(2,7).toUpperCase();
 const record={id,name:$("regName").value.trim(),guardian:$("regGuardian").value.trim(),dob:$("regDob").value,phone,address:$("regAddress").value.trim(),docType:$("regDocType").value,fileName:file.name,fileType:file.type,fileBlob:file,createdAt:new Date().toISOString()};
 try{
  await saveRegistration(record);
  $("regStatus").textContent=`रजिस्ट्रेशन सफल! आपका नंबर: ${id}`;
  e.target.reset();await renderRegistrations();toast("रजिस्ट्रेशन और दस्तावेज़ सेव हो गए");
 }catch(err){console.error(err);toast("सेव नहीं हुआ। डिवाइस में जगह/ब्राउज़र सपोर्ट जांचें");}
});
async function renderRegistrations(){
 const host=$("registrationList");if(!host)return;
 try{
  const rows=await getRegistrations();
  host.innerHTML=rows.length?rows.map(r=>`<article class="item"><div><strong>${esc(r.name)} · ${esc(r.id)}</strong><small>${esc(r.phone)} · ${esc(r.docType)} · ${esc(new Date(r.createdAt).toLocaleString("hi-IN"))}<br>${esc(r.fileName)}</small></div><div class="actions"><button class="small" type="button" onclick="downloadRegDoc('${esc(r.id)}')">दस्तावेज़ डाउनलोड</button><button class="danger" type="button" onclick="deleteReg('${esc(r.id)}')">हटाएं</button></div></article>`).join(""):'<div class="empty">अभी कोई रजिस्ट्रेशन नहीं है।</div>';
 }catch(err){host.innerHTML='<div class="empty">इस ब्राउज़र में दस्तावेज़ स्टोरेज उपलब्ध नहीं है।</div>';}
}
window.downloadRegDoc=async id=>{
 try{const r=(await getRegistrations()).find(x=>x.id===id);if(!r)return toast("रिकॉर्ड नहीं मिला");const url=URL.createObjectURL(r.fileBlob);const a=document.createElement("a");a.href=url;a.download=r.fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}catch(e){toast("दस्तावेज़ डाउनलोड नहीं हुआ");}
};
window.deleteReg=async id=>{
 if(!confirm("यह रजिस्ट्रेशन और अपलोड दस्तावेज़ हमेशा के लिए हटाएं?"))return;
 try{const db=await openRegDB();await new Promise((resolve,reject)=>{const tx=db.transaction(REG_STORE,"readwrite");tx.objectStore(REG_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();await renderRegistrations();toast("रिकॉर्ड हटा दिया गया");}catch(e){toast("रिकॉर्ड नहीं हट सका");}
};
$("refreshRegs").addEventListener("click",renderRegistrations);
renderRegistrations();
