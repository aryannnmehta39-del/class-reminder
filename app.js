let user=null,timer=null,deferredInstall=null;
const $=id=>document.getElementById(id);
const norm=s=>(s||'').trim().toUpperCase().replace(/\s+/g,' ');
let store=JSON.parse(localStorage.getItem('cr_final_store')||'{"notes":[],"assignments":[],"announcements":[]}');

function userKey(){return 'cr_user_profile_'+user.roll}
function passwordKey(){return 'cr_user_password_'+user.roll}
function avatarKey(){return 'cr_user_avatar_'+user.roll}
function getPassword(){return localStorage.getItem(passwordKey())||user.roll}
function saveStore(){localStorage.setItem('cr_final_store',JSON.stringify(store))}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function login(){
 const name=norm($('loginName').value),pass=$('loginPassword').value.trim();
 const found=STUDENTS.find(x=>norm(x.name)===name);
 if(!found || getStoredPassword(found.roll)!==pass){
   $('loginError').textContent='Invalid name or password. First login uses your roll number.';
   $('loginError').classList.remove('hide'); return;
 }
 user=found; localStorage.setItem('cr_final_user',found.roll);
 $('loginError').classList.add('hide');$('login').classList.add('hide');$('app').classList.remove('hide');
 $('who').textContent=user.name; renderProfile();render();startReminders();
}
function getStoredPassword(roll){return localStorage.getItem('cr_user_password_'+roll)||roll}
function logout(){localStorage.removeItem('cr_final_user');location.reload()}

function showPage(id){
 document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
 $(id).classList.add('active');
 document.querySelectorAll('.sidebar button[data-page]').forEach(x=>x.classList.remove('active'));
 const b=document.querySelector(`[data-page="${id}"]`); if(b)b.classList.add('active');
 $('pageTitle').textContent=id[0].toUpperCase()+id.slice(1);
 if(id==='profile')renderProfile();
}
function render(){
 $('classCount').textContent=CLASSES.length;$('noteCount').textContent=store.notes.length;$('assignmentCount').textContent=store.assignments.length;
 $('tableBody').innerHTML=CLASSES.map(c=>`<tr><td class="day">${esc(c.day)}</td><td>${c.start}–${c.end}</td><td><b>${esc(c.subject)}</b></td><td>${esc(c.teacher)}</td><td><span class="badge">${esc(c.room)}</span></td></tr>`).join('');
 $('reminderList').innerHTML=CLASSES.map(c=>`<div class="row"><span><b>${esc(c.subject)}</b><br><small class="muted">${c.day} · ${c.start}–${c.end} · ${esc(c.teacher)} · Room ${esc(c.room)}</small></span><span class="badge">${$('minutes').value} min</span></div>`).join('');
 $('notesList').innerHTML=store.notes.map((n,i)=>`<div class="row"><span>📄 ${esc(n)}</span><button class="secondary" onclick="store.notes.splice(${i},1);saveStore();render()">Delete</button></div>`).join('')||'<p class="muted">No notes.</p>';
 $('assignmentList').innerHTML=store.assignments.map((a,i)=>`<div class="row"><span><b>${esc(a.t)}</b><br><small class="muted">${esc(a.d)}</small></span><button class="secondary" onclick="store.assignments.splice(${i},1);saveStore();render()">Delete</button></div>`).join('')||'<p class="muted">No assignments.</p>';
 $('announcementList').innerHTML=store.announcements.map(a=>`<div class="notice"><b>${esc(a.t)}</b><small>${esc(a.m)}</small></div>`).join('')||'<p class="muted">No announcements.</p>';
 $('today').innerHTML='<p class="muted">Open Timetable to view all Semester III classes.</p>';
}
function renderProfile(){
 $('profileName').textContent=user.name;$('profileRoll').textContent=user.roll;
 const a=localStorage.getItem(avatarKey());
 const src=a||'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#dce8f8"/><text x="50%" y="54%" text-anchor="middle" font-size="80" font-family="Arial" fill="#176fe5">'+user.name[0]+'</text></svg>');
 $('profileAvatar').src=src;$('topAvatar').src=src;
}
async function saveAvatar(){
 const f=$('avatarInput').files[0]; if(!f)return alert('Choose a photo first.');
 if(f.size>2_000_000)return alert('Please choose a photo under 2 MB.');
 const reader=new FileReader();reader.onload=()=>{localStorage.setItem(avatarKey(),reader.result);renderProfile();$('avatarInput').value='';alert('Profile photo updated.')};reader.readAsDataURL(f);
}
function changePassword(){
 const cur=$('currentPassword').value,newp=$('newPassword').value,conf=$('confirmPassword').value,msg=$('passwordMessage');
 msg.classList.remove('hide','bad');
 if(cur!==getPassword()){msg.textContent='Current password is incorrect.';msg.classList.add('bad');return}
 if(newp.length<6){msg.textContent='New password must be at least 6 characters.';msg.classList.add('bad');return}
 if(newp!==conf){msg.textContent='New passwords do not match.';msg.classList.add('bad');return}
 localStorage.setItem(passwordKey(),newp);msg.textContent='Password changed successfully. Use the new password next time.';$('currentPassword').value='';$('newPassword').value='';$('confirmPassword').value='';
}
async function notify(){if(!('Notification'in window)){alert('Notifications are not supported.');return}let p=await Notification.requestPermission();alert(p==='granted'?'Notifications enabled.':'Permission not granted.')}
function test(){if(Notification.permission==='granted')new Notification('Class Reminder',{body:'Test notification is working.'});else notify()}
function check(){/* Browser/PWA reminder checks can run while the app is active. */}
function startReminders(){clearInterval(timer);timer=setInterval(check,60000);check()}
function addNote(){const f=$('noteInput').files[0];if(!f)return alert('Choose a file.');store.notes.push(f.name);saveStore();render();$('noteInput').value=''}
function addAssignment(){const t=prompt('Assignment name?');if(!t)return;store.assignments.push({t,d:prompt('Due date/time?')||'Not specified'});saveStore();render()}
function addAnnouncement(){const t=prompt('Announcement title?');if(!t)return;store.announcements.unshift({t,m:prompt('Message?')||''});saveStore();render()}

$('loginBtn').onclick=login;$('loginPassword').onkeydown=e=>{if(e.key==='Enter')login()};$('loginName').onkeydown=e=>{if(e.key==='Enter')login()};
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
$('logout').onclick=logout;$('notifyBtn').onclick=notify;$('testBtn').onclick=test;$('noteBtn').onclick=addNote;
$('addAssignment').onclick=addAssignment;$('addAnnouncement').onclick=addAnnouncement;$('minutes').onchange=render;
$('saveAvatar').onclick=saveAvatar;$('changePassword').onclick=changePassword;
$('installBtn').onclick=()=>{if(deferredInstall)deferredInstall.prompt();else alert('iPhone: Safari → Share → Add to Home Screen. Android: Chrome → menu → Install app/Add to Home screen.')};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e});
window.addEventListener('load',()=>{
 if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
 const r=localStorage.getItem('cr_final_user'),u=STUDENTS.find(x=>x.roll===r);
 if(u){user=u;$('login').classList.add('hide');$('app').classList.remove('hide');$('who').textContent=u.name;renderProfile();render();startReminders()}
});
