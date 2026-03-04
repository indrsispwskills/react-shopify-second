(function(){
  var navLinks=document.querySelectorAll('.nav-link[data-section]');
  var sections=[];
  navLinks.forEach(function(l){var s=document.getElementById(l.getAttribute('data-section'));if(s)sections.push({el:s,id:l.getAttribute('data-section')})});
  function updateSpy(){var current='';sections.forEach(function(s){if(s.el.getBoundingClientRect().top<=120)current=s.id});navLinks.forEach(function(l){l.classList.toggle('active',l.getAttribute('data-section')===current)})}
  var navBar=document.getElementById('navBar'),navProgress=document.getElementById('navProgress');
  function updateProgress(){var scrollY=window.pageYOffset||document.documentElement.scrollTop;var h=document.documentElement.scrollHeight-window.innerHeight;navProgress.style.width=(h>0?(scrollY/h*100):0)+'%';navBar.classList.toggle('scrolled',scrollY>20)}
  var btt=document.getElementById('btt');
  function updateBtt(){btt.classList.toggle('vis',(window.pageYOffset||document.documentElement.scrollTop)>800)}
  window.addEventListener('scroll',function(){updateSpy();updateProgress();updateBtt()},{passive:true});
  updateSpy();updateProgress();

  // Multi-direction scroll reveal
  var ro=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('vis');ro.unobserve(e.target)}})},{threshold:.06,rootMargin:'0px 0px -60px 0px'});
  ['.rv','.rv-left','.rv-right','.rv-scale'].forEach(function(cls){document.querySelectorAll(cls).forEach(function(el){ro.observe(el)})});

  // Animated counters
  var co=new IntersectionObserver(function(entries){entries.forEach(function(e){if(!e.isIntersecting)return;var el=e.target;var target=parseFloat(el.getAttribute('data-target'));var suffix=el.getAttribute('data-suffix')||'';var isD=el.getAttribute('data-decimal')==='true';var dur=1600,start=null;function a(ts){if(!start)start=ts;var p=Math.min((ts-start)/dur,1);var eased=1-Math.pow(1-p,3);el.textContent=(isD?(eased*target).toFixed(1):Math.round(eased*target))+suffix;if(p<1)requestAnimationFrame(a)}requestAnimationFrame(a);co.unobserve(el)})},{threshold:.5});
  document.querySelectorAll('.counter').forEach(function(el){co.observe(el)});
})();
function toggleExpand(btn){var body=btn.nextElementSibling,isOpen=btn.classList.contains('open');var section=btn.closest('section')||btn.closest('.content-max');if(section){section.querySelectorAll('.expand-btn.open').forEach(function(b){b.classList.remove('open');b.setAttribute('aria-expanded','false');b.nextElementSibling.classList.remove('open')})}if(!isOpen){btn.classList.add('open');btn.setAttribute('aria-expanded','true');body.classList.add('open')}}

function toggleSeMobileNav(){
  var o=document.getElementById('seMobOverlay'),m=document.getElementById('seMobMenu');
  if(o&&m){o.classList.toggle('open');m.classList.toggle('open');document.body.style.overflow=m.classList.contains('open')?'hidden':''}
}
