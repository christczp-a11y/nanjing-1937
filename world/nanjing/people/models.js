var e={cnCoat:[[73,85,101],[69,80,98],[77,89,113],[65,77,93]],cnHelmet:[[66,78,78],[61,73,74]],jpCoat:[[85,80,64],[79,74,59],[88,84,66],[83,78,61]],jpHelmet:[[68,65,50],[63,60,47]],civCoat:[[34,33,34],[26,34,60],[122,112,92],[46,52,82],[106,80,58],[132,136,140],[36,44,30],[30,29,28],[138,122,98]],civTrousers:[[44,43,42],[62,63,70],[92,88,82],[56,55,58]],childCoat:[[112,62,54],[82,100,128],[100,78,56],[70,76,94]],hats:[[52,52,56],[62,60,57],[24,24,26],[40,50,78],[104,101,98]],kit:[[40,55,95],[186,180,164],[90,76,62],[70,95,140],[106,50,40],[150,126,82],[158,140,96],[80,68,56]],forCoat:[[40,40,46],[88,88,94],[56,46,40]],jpNavy:[[44,52,70],[38,46,64]],officer:[[73,70,64],[60,67,62]],hatsM:[[52,52,56],[62,60,57],[24,24,26]]},t=[[172,134,102],[24,22,20],[74,52,34],[48,50,54],[150,128,86],[230,200,140],[255,230,170],[42,20,16],[54,45,38],[28,26,26],[130,112,80],[214,210,198],[170,40,36],[150,154,158],[72,73,69],[80,88,86]],n=e=>e.map(e=>(e/255)**2.2);function r(){let r=[],i={};for(let[t,a]of Object.entries(e)){i[t]=r.length;for(let e of a)r.push(n(e))}for(;r.length<64;)r.push([1,0,1]);return{list:r,idx:i,fixed:t.map(n)}}var i={BODY:0,LEG_L:1,LEG_R:2,ARM_L:3,ARM_R:4,RIFLE:5,FLASH:6,LANTERN:7,BASKET:8,HEAD:10,H_NECK:11,H_TAIL:12,SHIN_L:20,SHIN_R:21,FORE_L:22,FORE_R:23,STICK:24,FOOT_L:25,FOOT_R:26,H_BODY:40},a={SKIN:0,HAIR:1,COAT:2,TROUSERS:3,HEAD:4,KIT:5,WOOD:6,METAL:7,ROPE:8,LANTERN:9,FLASH:10,MARK:11,LEATHER:12,SHOE:13,BRASS:14,WHITE:15,RED:16,STEEL:17,PUTTEE_JP:18,PUTTEE_CN:19},o={HELMET_CN:0,HELMET_JP:1,CAP:2,HAT:3,SKULLCAP:4,SCARF:5,RIFLE:6,PACK:7,BLANKET:8,BUNDLE:9,BEDROLL:10,POLE:11,GOWN:12,LANTERN:13,CARRY:14,FLAG:15,FLASH:16,WOMAN:17,CHILD:18,OLD:19,BAYONET:20,UMBRELLA:21,GREATCOAT:22,BANNER:23},s={SWING:0,CARRY:1,TIED:2,POLE:3,AIM:4,LOW:5,LANTERN:6,PULL:7,STICK:8,HANDSUP:9,CLIMB:10,PORT:11,PRONE_AIM:12},c={NORMAL:0,SIT:1,ASTRIDE:2},l={cycleM:1.37,runFrom:1.2,runTo:1.8,cycleAtWalk(e,t=1){return t*(1.37+(e<=1?0:e<=1.2?2.15*(e-1):.43+1.8333*Math.min(Math.max(e-1.2,0),.6)))}},u={lo:1.4,hi:2.4},d=!0,f=[`iPos`,`iPose`,`iAct`,`iLook`,`iVar`,`iMove`,`iVel`],p={value:0},m={civilian:[.42,1.62],soldier:[.5,1.7],horse:[.6,2]},h=.84,g=.47,_=.075,v=1.35,y=1.06,ee=1.4;function b(e,t,n,r,i,a,o,s,c,l=-1,u=null,d=0,f=0){let p=new e.BoxGeometry(t,n,r);d&&p.rotateX(d),f&&p.rotateZ(f),p.translate(i,a,o);let m=p.attributes.position.count,h=new Float32Array(m*4),g=new Float32Array(m),[_,v]=u??[.8,0];for(let e=0;e<m;e++)h.set([s,_,v,l],e*4),g[e]=c;return p.setAttribute(`aBone`,new e.BufferAttribute(h,4)),p.setAttribute(`aSlot`,new e.BufferAttribute(g,1)),p.deleteAttribute(`uv`),p}function x(e,t={}){let n=t.padded??!0,r=t.shin??a.TROUSERS,o=t.shoe??a.SHOE,s=b.bind(null,e),c=n?.42:.37,l=n?.26:.22,u=n?.165:.15,d=n?.135:.12,f=[];for(let[e,n,c,l,p]of[[1,i.LEG_L,i.SHIN_L,i.FOOT_L,i.ARM_L],[-1,i.LEG_R,i.SHIN_R,i.FOOT_R,i.ARM_R]])f.push(s(u,.4,.17,e*.095,.655,0,n,a.TROUSERS,-1,[h,0]),s(d,.385,.145,e*.095,.2675,0,c,r,-1,[g,0]),s(.115,.075,.26,e*.095,.0375,.065,l,o,-1,[_,0]),s(.115,.31,.125,e*.27,1.205,0,p,t.coat??a.COAT,-1,[v,0]),s(.1,.26,.11,e*.27,.93,0,e>0?i.FORE_L:i.FORE_R,t.coat??a.COAT,-1,[y,0]),s(.085,.1,.095,e*.27,.755,.005,e>0?i.FORE_L:i.FORE_R,a.SKIN,-1,[y,0]));let p=t.coat??a.COAT;return f.push(s(.385,.17,.245,0,.925,0,i.BODY,p),s(c,.4,l,0,1.21,0,i.BODY,p),s(c+.08,.08,l-.02,0,1.345,0,i.BODY,p),s(.19,.05,.2,0,1.43,0,i.BODY,p),s(.08,.06,.08,0,1.425,0,i.HEAD,a.SKIN,-1,[ee,0]),s(.165,.185,.185,0,1.51,.005,i.HEAD,a.SKIN),s(.175,.05,.195,0,1.585,-.005,i.HEAD,a.HAIR),s(.175,.11,.05,0,1.52,-.105,i.HEAD,a.HAIR)),t.belt&&f.push(s(c+.012,.05,l+.012,0,1,0,i.BODY,a.LEATHER),s(.08,.09,.05,.12,1,l/2+.02,i.BODY,a.LEATHER),s(.08,.09,.05,-.12,1,l/2+.02,i.BODY,a.LEATHER)),f}var S=e=>b.bind(null,e),C=()=>typeof window<`u`&&window.__njMarksOld===!0,te=e=>{let t=S(e),n=o.HELMET_CN,r=a.HEAD;return C()?[t(.28,.03,.3,0,1.597,-.005,i.HEAD,r,n),t(.25,.05,.27,0,1.637,-.005,i.HEAD,r,n),t(.19,.035,.21,0,1.68,-.005,i.HEAD,r,n)]:[t(.215,.075,.24,0,1.645,-.01,i.HEAD,r,n),t(.17,.04,.195,0,1.7,-.01,i.HEAD,r,n),t(.025,.115,.255,.122,1.575,-.02,i.HEAD,r,n,null,0,.42),t(.025,.115,.255,-.122,1.575,-.02,i.HEAD,r,n,null,0,-.42),t(.235,.115,.025,0,1.57,-.142,i.HEAD,r,n,null,.45),t(.2,.022,.07,0,1.6,.118,i.HEAD,r,n,null,.2)]},ne=e=>{let t=S(e),n=o.HELMET_JP,r=a.HEAD;return C()?[t(.265,.03,.285,0,1.597,0,i.HEAD,r,n),t(.24,.05,.26,0,1.637,-.005,i.HEAD,r,n),t(.185,.035,.2,0,1.68,-.005,i.HEAD,r,n),t(.045,.045,.012,0,1.64,.127,i.HEAD,a.BRASS,n)]:[t(.205,.07,.235,0,1.585,-.008,i.HEAD,r,n),t(.19,.035,.22,0,1.6375,-.008,i.HEAD,r,n),t(.14,.022,.17,0,1.666,-.008,i.HEAD,r,n),t(.04,.04,.012,0,1.6,.11,i.HEAD,a.BRASS,n)]},re=e=>{let t=S(e);return[t(.19,.07,.21,0,1.625,-.01,i.HEAD,a.HEAD,o.CAP),t(.16,.015,.07,0,1.592,.125,i.HEAD,a.HEAD,o.CAP)]},ie=e=>{let t=S(e);return[...re(e),t(.04,.04,.012,0,1.628,.1,i.HEAD,a.BRASS,o.CAP)]},ae=e=>{let t=S(e);return[t(.19,.09,.21,0,1.64,-.005,i.HEAD,a.HEAD,o.HAT),t(.31,.02,.33,0,1.595,-.005,i.HEAD,a.HEAD,o.HAT)]},w=e=>{let t=S(e);return[t(.185,.055,.205,0,1.617,-.005,i.HEAD,a.HEAD,o.SKULLCAP),t(.02,.03,.02,0,1.655,-.005,i.HEAD,a.HAIR,o.SKULLCAP)]},T=e=>{let t=S(e);return[t(.21,.06,.23,0,1.59,-.012,i.HEAD,a.HEAD,o.SCARF),t(.21,.16,.075,0,1.565,-.1525,i.HEAD,a.HEAD,o.SCARF),t(.03,.135,.2,.0975,1.5375,-.02,i.HEAD,a.HEAD,o.SCARF),t(.03,.135,.2,-.0975,1.5375,-.02,i.HEAD,a.HEAD,o.SCARF)]},oe=e=>[S(e)(.09,.09,.09,0,1.585,-.14,i.HEAD,a.HAIR,o.WOMAN)],se=(e,t=!1)=>{let n=S(e),r=[n(.045,1.2,.06,0,0,0,i.RIFLE,a.WOOD,o.RIFLE,[0,0]),n(.03,.62,.035,0,.3,.012,i.RIFLE,a.METAL,o.RIFLE,[0,0])];return t&&r.push(n(.018,.4,.012,0,.8,.012,i.RIFLE,a.STEEL,o.BAYONET,[0,0])),r},ce=e=>{let t=S(e);return[t(.32,.34,.14,0,1.17,-.2,i.BODY,a.KIT,o.PACK),t(.34,.05,.02,0,1.25,-.275,i.BODY,a.LEATHER,o.PACK)]},le=e=>{let t=S(e);return[t(.44,.1,.12,0,1.38,-.19,i.BODY,a.KIT,o.BLANKET),t(.06,.34,.12,.2,1.17,-.19,i.BODY,a.KIT,o.BLANKET),t(.06,.34,.12,-.2,1.17,-.19,i.BODY,a.KIT,o.BLANKET)]},ue=e=>{let t=S(e);return[t(.045,.85,.045,.14,1.02,-.3,i.BODY,a.WOOD,o.UMBRELLA,null,.08),t(.07,.26,.07,.14,1.4,-.3,i.BODY,a.ROPE,o.UMBRELLA,null,.08)]},de=e=>{let t=S(e);return[t(.44,.36,.26,0,1.08,-.255,i.BODY,a.KIT,o.BUNDLE),t(.12,.08,.12,0,1.29,-.255,i.BODY,a.KIT,o.BUNDLE)]},fe=e=>[S(e)(.6,.18,.18,0,1.36,-.17,i.BODY,a.KIT,o.BEDROLL)],pe=e=>{let t=S(e);return[t(.45,.64,.31,0,.62,0,i.BODY,a.COAT,o.GOWN),t(.46,.03,.32,0,.31,0,i.BODY,a.TROUSERS,o.GOWN)]},E=e=>{let t=S(e);return[t(.46,.44,.3,0,.84,0,i.BODY,a.COAT,o.GREATCOAT),t(.475,.05,.315,0,.645,0,i.BODY,a.COAT,o.GREATCOAT)]},me=e=>[S(e)(.43,.22,.28,0,.82,0,i.BODY,a.COAT,o.WOMAN)],D=e=>{let t=S(e);return[t(.02,.16,.02,.27,.69,.06,i.LANTERN,a.WOOD,o.LANTERN,[y,0]),t(.15,.2,.15,.27,.52,.06,i.LANTERN,a.LANTERN,o.LANTERN,[y,0])]},he=e=>{let t=S(e),n=[t(.045,.045,1.7,-.15,1.43,0,i.BODY,a.WOOD,o.POLE)];for(let e of[1,-1]){n.push(t(.44,.34,.42,-.15,.52,e*.72,i.BASKET,a.KIT,o.POLE,[1.41,e*.72]));for(let r of[-.17,.17])n.push(t(.016,.72,.016,-.15,1.05,e*.72+r,i.BASKET,a.ROPE,o.POLE,[1.41,e*.72]))}return n},O=e=>[S(e)(.42,.3,.3,0,1,.4,i.BODY,a.KIT,o.CARRY)],ge=e=>{let t=S(e);return[t(.03,2.4,.03,-.27,1.25,.33,i.BODY,a.WOOD,o.FLAG),t(.015,.6,.85,-.27,2.1,-.1,i.BODY,a.WHITE,o.FLAG),t(.02,.12,.3,-.27,2.1,-.1,i.BODY,a.RED,o.FLAG),t(.021,.3,.12,-.27,2.1,-.1,i.BODY,a.RED,o.FLAG),t(.022,.23,.23,-.27,2.1,-.1,i.BODY,a.RED,o.FLAG)]};function k(e,t,n,r,o,s,c,l,u,d,f){let p=[],m=[],h=[],g=[],_=[],v=(e,n,r,a)=>(p.push(t+r*.001,e,n),m.push(r,0,0),h.push(i.BODY,.8,0,f),g.push(a),p.length/3-1),y=e=>{let t=Math.sin(e),i=Math.cos(e),a=1e9;return t>1e-6&&(a=Math.min(a,(r-c)/t)),t<-1e-6&&(a=Math.min(a,(n-c)/t)),i>1e-6&&(a=Math.min(a,(s-l)/i)),i<-1e-6&&(a=Math.min(a,(o-l)/i)),[c+t*a,l+i*a]},ee=[[r,s],[r,o],[n,o],[n,s]].map(([e,t])=>[e,t,Math.atan2(e-c,t-l)]),b=e=>(e%(2*Math.PI)+2*Math.PI)%(2*Math.PI);for(let e of[1,-1]){let t=(t,n,r)=>{e>0?_.push(t,n,r):_.push(t,r,n)};for(let n=0;n<2*u;n++){let r=n*Math.PI/u,i=(n+1)*Math.PI/u,o=n%2==0?a.RED:a.WHITE,s=[y(r),...ee.filter(e=>b(e[2])>r&&b(e[2])<i).sort((e,t)=>b(e[2])-b(t[2])),y(i)],d=v(c,l,e,o),f=s.map(([t,n])=>v(t,n,e,o));for(let e=0;e+1<f.length;e++)t(d,f[e],f[e+1])}if(d<=0)continue;let n=v(c,l,e*1,a.RED),r=[];for(let t=0;t<16;t++)r.push(v(c+d*Math.sin(t*2*Math.PI/16),l+d*Math.cos(t*2*Math.PI/16),e,a.RED));for(let i=0;i<16;i++)p[r[i]*3]+=e*.001,t(n,r[i],r[(i+1)%16]);p[n*3]+=e*.001}let x=new e.BufferGeometry;return x.setAttribute(`position`,new e.Float32BufferAttribute(p,3)),x.setAttribute(`normal`,new e.Float32BufferAttribute(m,3)),x.setAttribute(`aBone`,new e.Float32BufferAttribute(h,4)),x.setAttribute(`aSlot`,new e.Float32BufferAttribute(g,1)),x.setIndex(_),x}var _e=e=>C()?ge(e):[S(e)(.03,2.4,.03,-.27,1.25,.33,i.BODY,a.WOOD,o.FLAG),k(e,-.27,1.8,2.4,-.525,.315,2.1,-.0675,8,.11,o.FLAG)];function ve(e,t,n,r,o,s,c){let l=[],u=[],d=[],f=[],p=[],m=[[-s/2,-o,s/2,o],[-o,-s/2,o,s/2],[-o,o-s,s/2,o],[o-s,-s/2,o,o],[-s/2,-o,o,-o+s],[-o,-o,-o+s,s/2]];for(let e of[1,-1])for(let[o,s,h,g]of m){let m=l.length/3;for(let[p,m]of[[o,s],[h,s],[h,g],[o,g]])l.push(t+e*.008,n+m,r-e*p),u.push(e,0,0),d.push(i.BODY,.8,0,c),f.push(a.RED);p.push(m,m+1,m+2,m,m+2,m+3)}let h=new e.BufferGeometry;return h.setAttribute(`position`,new e.Float32BufferAttribute(l,3)),h.setAttribute(`normal`,new e.Float32BufferAttribute(u,3)),h.setAttribute(`aBone`,new e.Float32BufferAttribute(d,4)),h.setAttribute(`aSlot`,new e.Float32BufferAttribute(f,1)),h.setIndex(p),h}var ye=e=>{let t=S(e),n=[t(.03,2.2,.03,-.27,1.35,.33,i.BODY,a.WOOD,o.BANNER),t(.012,.5,.7,-.27,2.2,-.03,i.BODY,a.KIT,o.BANNER)];return C()||n.push(ve(e,-.27,2.2,-.03,.16,.05,o.BANNER)),n},be=e=>[S(e)(.032,.92,.032,-.27,.46,.27,i.STICK,a.WOOD,o.OLD)],xe={SOLDIER_CN:0,SOLDIER_JP:1,CIVILIAN:2,BUNDLE:3,POLE:4,HORSE:5};function Se(e,t){let n={shin:a.PUTTEE_CN,shoe:a.SHOE,belt:!0},r={shin:a.PUTTEE_JP,shoe:a.LEATHER,belt:!0};return[t([...x(e,n),...E(e),...te(e),...re(e),...se(e),...ce(e),...le(e),...ue(e),...D(e),...T(e)]),t([...x(e,r),...E(e),...ne(e),...ie(e),...se(e,!0),...ce(e),...O(e),..._e(e),...D(e)]),t([...x(e),...pe(e),...me(e),...ae(e),...w(e),...T(e),...oe(e),...be(e),...D(e),...O(e),...ye(e)]),t([...x(e),...de(e),...fe(e),...T(e),...w(e),...oe(e),...me(e),...D(e)]),t([...x(e),...he(e),...w(e),...T(e)]),we(e,t)]}function A(e){let t=b.bind(null,e);return[t(.15,.82,.16,.09,.41,0,i.LEG_L,a.TROUSERS,-1,[.82,0]),t(.15,.82,.16,-.09,.41,0,i.LEG_R,a.TROUSERS,-1,[.82,0]),t(.5,.58,.26,0,1.11,0,i.BODY,a.COAT),t(.17,.2,.19,0,1.5,.005,i.HEAD,a.SKIN)]}function Ce(e,t){let n=b.bind(null,e),r=C()?e=>[n(.27,.11,.29,0,1.64,0,i.HEAD,a.HEAD,e)]:e=>e===o.HELMET_CN?[n(.215,.085,.24,0,1.66,-.01,i.HEAD,a.HEAD,e),n(.3,.07,.32,0,1.585,-.02,i.HEAD,a.HEAD,e)]:[n(.21,.09,.24,0,1.6,-.008,i.HEAD,a.HEAD,e)],s=[n(.05,1.2,.06,0,0,0,i.RIFLE,a.WOOD,o.RIFLE,[0,0])],c=C()?[]:[n(.025,.4,.02,0,.8,.012,i.RIFLE,a.STEEL,o.BAYONET,[0,0])],l=n(.48,.3,.3,0,.77,0,i.BODY,a.COAT,o.GREATCOAT),u=[n(.32,.34,.15,0,1.15,-.2,i.BODY,a.KIT,o.PACK)],d=e=>n(.2,.08,.22,0,1.62,0,i.HEAD,a.HEAD,e),f=[n(.45,.64,.31,0,.6,0,i.BODY,a.COAT,o.GOWN)],p=[d(o.HAT),d(o.SKULLCAP),n(.21,.19,.13,0,1.52,-.065,i.HEAD,a.HEAD,o.SCARF)],m=n(.42,.3,.3,0,1,.4,i.BODY,a.KIT,o.CARRY),h=n(.012,.5,.7,-.27,2.2,-.03,i.BODY,a.KIT,o.BANNER);return[t([...A(e),l,...r(o.HELMET_CN),d(o.CAP),...s,...u,p[2]]),t([...A(e),l,...r(o.HELMET_JP),d(o.CAP),...s,...c,...u,m,n(.03,2.4,.03,-.27,1.25,.33,i.BODY,a.WOOD,o.FLAG),...C()?[n(.015,.6,.85,-.27,2.1,-.1,i.BODY,a.WHITE,o.FLAG),n(.022,.3,.3,-.27,2.1,-.1,i.BODY,a.RED,o.FLAG)]:[k(e,-.27,1.8,2.4,-.525,.315,2.1,-.0675,8,0,o.FLAG)]]),t([...A(e),...f,...p,m,h]),t([...A(e),n(.44,.36,.26,0,1.08,-.255,i.BODY,a.KIT,o.BUNDLE),n(.6,.18,.18,0,1.36,-.17,i.BODY,a.KIT,o.BEDROLL),p[1],p[2]]),t([...A(e),n(.05,.05,1.7,-.15,1.43,0,i.BODY,a.WOOD,o.POLE),n(.44,.34,.42,-.15,.52,.72,i.BASKET,a.KIT,o.POLE,[1.41,.72]),n(.44,.34,.42,-.15,.52,-.72,i.BASKET,a.KIT,o.POLE,[1.41,-.72]),p[1],p[2]]),Te(e,t)]}function we(e,t){let n=b.bind(null,e),r=[],o=a.COAT;r.push(n(.56,.6,1,0,1.2,.15,i.H_BODY,o)),r.push(n(.5,.5,.55,0,1.24,-.62,i.H_BODY,o)),r.push(n(.46,.64,.4,0,1.28,.72,i.H_BODY,o)),r.push(n(.28,.64,.3,0,1.58,.92,i.H_NECK,o,-1,[1.32,.78],-.75)),r.push(n(.2,.22,.5,0,1.8,1.24,i.H_NECK,o,-1,[1.32,.78],.5)),r.push(n(.16,.14,.18,0,1.7,1.45,i.H_NECK,a.HAIR,-1,[1.32,.78],.5)),r.push(n(.05,.12,.06,.07,1.96,1.12,i.H_NECK,o,-1,[1.32,.78]),n(.05,.12,.06,-.07,1.96,1.12,i.H_NECK,o,-1,[1.32,.78])),r.push(n(.06,.5,.12,0,1.78,.78,i.H_NECK,a.HAIR,-1,[1.32,.78],-.75)),r.push(n(.12,.6,.12,0,1,-.92,i.H_TAIL,a.HAIR,-1,[1.4,-.86],-.3)),r.push(n(.6,.08,.5,0,1.52,.05,i.H_BODY,a.KIT));for(let[e,t,i,o,s]of[[.17,.62,41,45,!0],[-.17,.62,42,46,!0],[.17,-.64,44,48,!1],[-.17,-.64,43,47,!1]])r.push(n(.14,.5,.17,e,.97,t,i,a.TROUSERS,-1,[1.2,t])),r.push(n(.1,.66,.11,e,.4,t,o,a.TROUSERS,-1,[.72,t])),r.push(n(.13,.07,.15,e,.035,t+.01,o,a.SHOE,-1,[.72,t]));return t(r)}function Te(e,t){let n=b.bind(null,e),r=[],o=a.COAT;r.push(n(.55,.62,1.55,0,1.18,0,i.H_BODY,o),n(.3,.62,.36,0,1.55,.86,i.H_NECK,o,-1,[1.32,.78],-.75),n(.22,.24,.55,0,1.78,1.18,i.H_NECK,o,-1,[1.32,.78],.5)),r.push(n(.6,.1,.5,0,1.52,.05,i.H_BODY,a.KIT));for(let[e,t,i]of[[.17,.62,41],[-.17,.62,42],[.17,-.64,44],[-.17,-.64,43]])r.push(n(.13,.95,.15,e,.475,t,i,a.TROUSERS,-1,[.95,t]));return t(r)}var Ee=1<<o.FLAG|1<<o.BANNER,De=1<<o.RIFLE|1<<o.PACK|1<<o.HELMET_CN,Oe=1<<o.PACK,ke=1<<o.RIFLE,j=1<<o.OLD;function Ae(e,t,n,r,i,a,l){let u=e=>e-Math.floor(e),d=i%8,f=Math.floor(i/8);i>=64&&(d=i-64,f=0);let p=r*127.1+n%4096*.0713+t%4096*.0371,m=u(Math.sin(p)*43758.5453),h=u(Math.sin(p*1.7+3.1)*24634.6345),g=u(Math.sin(p*2.3+7.7)*19347.1137),_=.94+.12*m;if((t&Ee)!==0&&d===s.SWING&&(f===c.NORMAL||f===c.ASTRIDE)&&(d=s.POLE),e===0)h<.35&&(t&Oe)!==0&&(t|=1<<o.UMBRELLA),g<.3&&(t&De)!==0&&(t|=1<<o.GREATCOAT),_=.96+.1*m;else if(e===1)h<.7&&(t&ke)!==0&&(t|=1<<o.BAYONET),g<.55&&(t|=1<<o.GREATCOAT),_=.96+.1*m;else if(e<5){let r=Math.floor(n/4096)%64,i=n%64;e!==4&&(r===a.hats+3||r===a.hats+4)?(t|=1<<o.WOMAN,_=.9+.06*m,e===2&&(t&j)!==0&&d===0&&f===0&&(d=s.STICK)):i>=a.childCoat&&i<a.childCoat+4?(t|=1<<o.CHILD,_=1):e===2&&((t&j)!==0||g<.05&&(i<a.forCoat||i>=a.forCoat+3)&&!(r>=a.hatsM&&r<a.hatsM+3))&&(t|=j,d===0&&f===0&&(d=s.STICK))}else _=1;return l.kit=t,l.m2=d+16*f,l.build=_,l.shade=.88+.24*h,l.r3=g,l}var M=`
attribute vec4 aBone;
attribute float aSlot;
attribute vec4 iPos;
attribute vec4 iPose;
attribute vec4 iAct;
attribute vec4 iLook;
attribute vec4 iVar;
${f.includes(`iMove`)?`attribute vec4 iMove;`:`const vec4 iMove = vec4(0.0);`}   // (lean rad, turn rad/s, strideK, spare): neutral zeros
${f.includes(`iVel`)?`attribute vec4 iVel;`:`const vec4 iVel = vec4(0.0);`}
uniform float uDt;
float rigPhase() { return iPose.x + iVel.w * uDt; }
float pBit(float v, float b) { return mod(floor(v / exp2(b) + 0.001), 2.0); }
// (wave 6j, rig2) the extra stride length (m) of a pace above the walk, as a function of the walk value: GAIT.cycleAtWalk's own formula (1.80 at walk 1.2, 2.15 at 1.39, 2.90 at 1.8), for both levels
float cycExtra(float walk) { return walk <= 1.0 ? 0.0 : walk <= 1.2 ? 2.15 * (walk - 1.0) : 0.43 + 1.8333 * clamp(walk - 1.2, 0.0, 0.6); }
// (wave 6e, E4) the opacity fade the mod writes into iVar.w: iVar.w = f0 + 2 k, f0 the near level's share (0..1), k = round(fade * 15) (an integer 0..15). An
// With RIG_FADE false (the mod then writes the old encoding, iVar.w = f0 alone) the helpers are the old behaviour: no fade.
float rigFade() { return floor(iVar.w * 0.5 + 0.001) / 15.0; }
float rigNear() { return iVar.w - 2.0 * floor(iVar.w * 0.5 + 0.001); }
// rotations about an axis through a point (positive: +y towards +z about x; +x towards +y about z; +z towards +x about y)
void rX(inout vec3 p, inout vec3 n, float a, float oy, float oz) {
  float c = cos(a), s = sin(a);
  float qy = p.y - oy, qz = p.z - oz;
  p.y = oy + qy * c - qz * s; p.z = oz + qy * s + qz * c;
  n.yz = vec2(n.y * c - n.z * s, n.y * s + n.z * c);
}
void rZ(inout vec3 p, inout vec3 n, float a, float ox, float oy) {
  float c = cos(a), s = sin(a);
  float qx = p.x - ox, qy = p.y - oy;
  p.x = ox + qx * c - qy * s; p.y = oy + qx * s + qy * c;
  n.xy = vec2(n.x * c - n.y * s, n.x * s + n.y * c);
}
void rY(inout vec3 p, inout vec3 n, float a, float ox, float oz) {
  float c = cos(a), s = sin(a);
  float qx = p.x - ox, qz = p.z - oz;
  p.x = ox + qx * c + qz * s; p.z = oz - qx * s + qz * c;
  n.xz = vec2(n.x * c + n.z * s, -n.x * s + n.z * c);
}
// the last steps of every pose: the fall onto the ground, the dark mark's sinking, scale, heading, place
void finishPose(inout vec3 p, inout vec3 n, float fall) {
  float f = abs(fall);
  if (f > 0.0) {
    float dir = fall > 0.0 ? 1.0 : -1.0, a = dir * 1.5708 * smoothstep(0.0, 1.0, f);
    rX(p, n, a, 0.0, dir * 0.11);
    p.y += 0.06 * f;
  }
  p.y *= 1.0 - iLook.w;
  p *= iLook.z;
  float h = iPos.w, c = cos(h), s = sin(h);
  p = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  n = vec3(n.x * c + n.z * s, n.y, -n.x * s + n.z * c);
  p += iPos.xyz + iVel.xyz * uDt;
}
// the horse (its own rig; one code for both levels of detail: the legs of the near level are one piece)
void horsePose(inout vec3 p, inout vec3 n, float cls) {
  float phase = mod(rigPhase(), PI2), walk = min(iPose.y, 1.0), sw = sin(phase);
  if (cls > 40.5) {
    // legs: diagonal pairs (fore left 41 with hind right 43, fore right 42 with hind left 44); 45..48 are the lower legs
    bool lowr = cls > 44.5;
    float base = lowr ? cls - 4.0 : cls;
    float pairSign = (base < 41.5 || (base > 42.5 && base < 43.5)) ? 1.0 : -1.0;
    // (wave 6e, E4) the horse's legs swing on the flattened sine too (asin(0.96 sin) / asin(0.96): nearly linear through the stance) at the amplitude that keeps the hoof still on the ground
    // at the horse's cycle (2.6 m, the 1.2 m leg): 0.46 rad
    float a = pairSign * 0.46 * walk * 0.777 * asin(0.96 * sw);
    if (lowr) {
      float bend = 0.9 * walk * max(0.0, -pairSign * cos(phase));
      rX(p, n, bend, aBone.y, aBone.z);
      rX(p, n, a, 1.2, aBone.z);
    } else rX(p, n, a, aBone.y, aBone.z);
  } else if (cls > 39.5) {
    // the body: rigid
  } else if (cls > 11.5) {
    rX(p, n, 0.15 * walk * sin(phase + 1.0), aBone.y, aBone.z);       // tail
  } else if (cls > 10.5) {
    rX(p, n, 0.06 * walk * sin(2.0 * phase), aBone.y, aBone.z);       // neck and head nod
  }
}
`,N=`
const float HIP = 0.84, KNEE = 0.47, ANKLE = 0.075, SHO = 1.35, ELBOW = 1.06, NECK = 1.40, LT = 0.37, LS = 0.395;
// (wave 6e, E4) THE WALK, WITH FEET THAT DO NOT SLIDE. The behaviours advance the phase by 2 pi per GAIT.cycleM * scale metres walked (M2), so on that cycle the planted
// foot has to move back against the body at exactly the body's speed: the stance foot's place under the hip is LINEAR in the phase, x = cyc / 2 pi * t, and the leg is
// solved to it with two-bone IK (thigh LT, shin LS), the foot rolling heel to toe about its own ends. The swing carries the foot forward over a full cycle length in the
// world (a rest-to-rest curve, so it leaves and lands at the ground's own speed, 0), lifted. The old sinusoid dragged the foot at up to 3 x the body speed (it was within
// 1.2 cm of the ground for the first third of every swing: skating). The hip rides a bob of H(phi) = GH_M + GH_B cos 2 phi (7 cm, 推测: the compass-gait value for a 0.685 m
// step on a 0.84 m hip; a real walker's 4-5 cm needs the foot's rocker, which is the roll below). Stance duty 0.545-0.575 (a little double support), per figure.
const float GCYC = ${l.cycleM.toFixed(4)}, GH_M = 0.785, GH_B = 0.035, GH_MR = 0.78, GH_BR = -0.025, GZS = 0.7672, GZSR = 0.66, RUN_FROM = ${l.runFrom.toFixed(3)}, RUN_TO = ${l.runTo.toFixed(3)};
// (wave 6j, rig2) the extra stride length of a pace above the walk, as a function of the walk value: GAIT.cycleAtWalk's own formula (1.80 at walk 1.2, 2.15 at 1.39, 2.90 at 1.8)
// (cycExtra: see RIG_POSE_HEAD)
// the leg's angles for the gait at full amplitude (walk, jog and run: run 0..1 is the cycle-length blend of legAngles): x thigh, y knee, z ankle. phase: this figure's stride phase;
// cyc: its cycle length (rig units); H: the hip's height above the ground now
vec3 gaitLeg(float side, float phase, float r, float cyc, float H, float run) {
  float D = min(0.56, mix(GZS, GZSR, run) / cyc) + 0.03 * (1.0 - 0.5 * run) * (fract(r * 5.7) - 0.5);   // the stance travel stays 0.384 m whatever the cycle: the leg can reach no further
  float t = mod(phase + (side > 0.0 ? 0.0 : PI) + PI, PI2) - PI;
  float xb, lift = 0.0, pitch;
  if (abs(t) <= PI * D) {
    xb = cyc / PI2 * t;
    float p = (t + PI * D) / (2.0 * PI * D);
    pitch = (0.32 + 0.12 * run) * smoothstep(0.62, 1.0, p) - 0.14 * (1.0 - smoothstep(0.0, 0.18, p));
  } else {
    float tt = t >= -PI * D ? t : t + PI2;
    float s = max(0.0, (tt - PI * D) / (PI2 * (1.0 - D)));
    float E = s * s * (3.0 - 2.0 * s);
    xb = 0.5 * D * cyc - cyc * E + (1.0 - D) * cyc * s;
    lift = (0.075 + 0.02 * fract(r * 3.1)) * (1.0 + 1.1 * run) * sin(PI * pow(s, 0.65));
    pitch = (0.32 + 0.12 * run) * (1.0 - smoothstep(0.0, 0.5, s)) - 0.14 * smoothstep(0.6, 1.0, s);
  }
  float rise = pitch > 0.0 ? 0.195 * sin(pitch) + 0.075 * (1.0 - cos(pitch)) : 0.065 * sin(-pitch) + 0.075 * (1.0 - cos(pitch));
  float dv = H - (ANKLE + lift + rise);
  float d = clamp(length(vec2(xb, dv)), 0.25, (LT + LS) * 0.9995);
  float beta = acos(clamp((LT * LT + d * d - LS * LS) / (2.0 * LT * d), -1.0, 1.0));
  float kap = acos(clamp((LT * LT + LS * LS - d * d) / (2.0 * LT * LS), -1.0, 1.0));
  float th = atan(xb, dv) - beta, kn = PI - kap;
  return vec3(th, kn, pitch - (th + kn));
}
// the angles of one leg: x thigh (+: backwards), y knee flexion (+: the shin goes backwards), z ankle, w abduction
vec4 legAngles(float side, float phase, float walk, float crouch, float mArm, float mLeg, float stride, float lying, float r, float climb, float cyc, float H) {
  float w1 = min(walk, 1.0), run = smoothstep(1.4, 2.1, cyc);   // (the run is a property of the CYCLE length: a longer cycle = a faster pace = a shorter stance, a flight, a lower hip)
  float ph = phase + (side > 0.0 ? 0.0 : 3.14159265);
  float sn = sin(ph), cs = cos(ph);
  // (wave 6e, E4) the walk is the planted-foot gait above, faded in with the pace (a figure at 0.3 m/s shuffles; from about 0.6 m/s it is the full gait); the
  // run is the same gait with a shorter stance, a higher lift, a flight and a lower hip (the cycle length comes from the walk value: GAIT.cycleAtWalk), crouch: see pose()
  float g = smoothstep(0.0, 0.7, w1);
  float th = 0.0, kn = 0.0, an = 0.0, ab = 0.0;
  if (g > 0.0) { vec3 q = gaitLeg(side, phase, r, cyc, H, run); th = g * q.x; kn = g * q.y; an = g * q.z; }
  if (climb > 0.5) { th = -0.7 + 0.45 * sn; kn = 1.0 + 0.5 * max(0.0, -cs); an = 0.0; }
  if (mLeg > 0.5 && mLeg < 1.5) { th = -1.5; kn = 1.5; an = 0.0; }                      // sitting on a seat
  else if (mLeg > 1.5) { th = -0.35; kn = 0.55; an = 0.0; ab = 0.42; }                    // astride (a horse)
  else if (crouch > 0.0) {
    float c = crouch;
    float thC, knC, anC;
    if (abs(mArm - 2.0) < 0.5 && c > 0.5) { thC = 0.0; knC = 1.5 * c; anC = 0.0; }        // kneeling upright (hands tied)
    else if (abs(mArm - 4.0) < 0.5 && c > 0.3) {                                           // kneeling to fire: right knee down
      if (side > 0.0) { thC = -1.2 * c; knC = 2.1 * c; anC = -(thC + knC) * 0.8; }
      else { thC = 0.15 * c; knC = 1.4 * c; anC = 0.0; }
    } else {                                                                               // squatting, feet flat
      float d = 0.765 - 0.5 * c;
      float ck = clamp((LT * LT + LS * LS - d * d) / (2.0 * LT * LS), -1.0, 1.0);
      thC = -acos(clamp((LT * LT + d * d - LS * LS) / (2.0 * LT * d), -1.0, 1.0));
      knC = 3.14159265 - acos(ck);
      anC = -(thC + knC) * 0.8;
    }
    float k = smoothstep(0.0, 0.25, c) * (1.0 - g * (1.0 - smoothstep(0.55, 0.8, c)));   // (an advance at a crouch keeps the walking legs: the hip is lowered instead, see pose)
    th = mix(th, thC, k); kn = mix(kn, knC, k); an = mix(an, anC, k);
  }
  // lying (a figure that has fallen): legs a little apart, one knee up (by the figure's random number)
  if (lying > 0.0) {
    th = mix(th, 0.1, lying); kn = mix(kn, 0.7 * step(0.55, fract(r * 7.31 + side * 0.37)) * (mArm > 11.5 ? 0.25 : 1.0), lying);
    an = mix(an, mArm > 11.5 ? 0.5 : 0.0, lying); ab = mix(ab, mArm > 11.5 ? 0.14 : 0.1 + 0.2 * fract(r * 3.7), lying);
  }
  return vec4(th, kn, an, ab);
}
// the angles of one arm: x upper arm (-: forward), y forearm flexion (-: forward), z abduction, w yaw inwards
vec4 armAngles(float side, float phase, float walk, float mArm, float stride, float lying, float r, float aim) {
  float w1 = min(walk, 1.0), run = smoothstep(1.2, 1.8, walk);
  float sw = (side > 0.0 ? -1.0 : 1.0) * sin(phase);
  run = max(run, 0.85 * smoothstep(1.4, 2.1, GCYC + cycExtra(walk))); float up = (0.5 * w1 + 0.4 * run) * stride * sw;
  float fo = -(0.08 + 0.3 * w1 + 0.9 * run) - 0.35 * w1 * max(0.0, -sw);
  float ab = 0.03 + 0.05 * w1, yaw = 0.0;
  if (mArm > 0.5 && mArm < 1.5) { up = -0.55; fo = -0.95; ab = 0.0; }                      // carrying in front
  else if (mArm > 1.5 && mArm < 2.5) { up = 0.45; fo = -0.05; ab = -0.3; }                  // hands tied behind the back
  else if (mArm > 2.5 && mArm < 3.5) { if (side < 0.0) { up = -0.6; fo = -1.9; ab = 0.0; yaw = 0.0; } } // pole on the right shoulder
  else if (mArm > 3.5 && mArm < 4.5) {                                                      // aiming a rifle
    if (side < 0.0) { up = -0.5; fo = -1.6; ab = -0.08; yaw = 0.45; } else { up = -1.2; fo = -0.2; ab = 0.0; yaw = 0.55; }
  }
  else if (mArm > 4.5 && mArm < 5.5) { up = -0.3; fo = -0.25; ab = 0.0; }                   // holding something low (a stretcher)
  else if (mArm > 5.5 && mArm < 6.5) { if (side > 0.0) { up = -0.4 + 0.1 * sw; fo = -0.75; ab = 0.0; } }  // lantern in the left hand
  else if (mArm > 6.5 && mArm < 7.5) { up = -0.38; fo = -0.35; ab = 0.0; }                 // pulling by the shafts
  else if (mArm > 7.5 && mArm < 8.5) { if (side < 0.0) { up = -0.5; fo = -0.35; ab = 0.0; } else { up *= 0.6; } }  // a stick in the right hand
  else if (mArm > 8.5 && mArm < 9.5) { up = -2.6; fo = -0.1; ab = 0.3; }                    // hands up
  else if (mArm > 9.5 && mArm < 10.5) { float c = sin(phase + (side > 0.0 ? 0.0 : 3.14159265)); up = -2.35 + 0.35 * c; fo = -0.3 - 0.4 * max(0.0, c); ab = 0.1; } // climbing a rope
  else if (mArm > 10.5 && mArm < 11.5) { if (side > 0.0) { up = -1.05; fo = -0.55; ab = -0.12; yaw = 0.3; } else { up = -0.42; fo = -1.0; ab = 0.06; yaw = 0.35; } }   // rifle at the port: left hand to the fore-end, right hand at the grip
  else if (mArm > 11.5) { if (side > 0.0) { up = -2.7; fo = -0.15; ab = -0.05; yaw = 0.0; } else { up = -2.15; fo = -1.2; ab = 0.1; yaw = 0.0; } }   // prone: the arms (turned forward along the ground by the fall) reach to the rifle
  if (lying > 0.0 && mArm < 11.5) { up = mix(up, 0.2 * fract(r * 5.3), lying); fo = mix(fo, -0.15, lying); ab = mix(ab, 0.3 + 0.9 * fract(r * 9.1 + side * 0.31), lying); yaw = mix(yaw, 0.0, lying); }
  return vec4(up, fo, ab, yaw);
}
// Poses one vertex: the limb chains, the lean, the drop, the fall, the build, scale, heading and place.
void pose(inout vec3 p, inout vec3 n) {
  float cls = aBone.x, kit = aBone.w;
  if (kit >= 0.0 && pBit(iLook.x, kit) < 0.5) { p = vec3(0.0); return; }
  if (cls > 10.5 && (cls < 12.5 || cls > 39.5)) { horsePose(p, n, cls); p.y *= 1.0 + 0.04 * (2.0 * fract(iVar.z * 91.7) - 1.0); p.z *= 1.0 + 0.03 * (2.0 * fract(iVar.z * 47.3) - 1.0); finishPose(p, n, iPose.w); return; }
  float phase = rigPhase(), walk = iPose.y, crouch = iPose.z, fall = iPose.w;
  float mode = iAct.y, mArm = mod(mode, 16.0), mLeg = floor(mode / 16.0 + 0.001);
  float lying = smoothstep(0.15, 0.9, abs(fall));
  walk *= 1.0 - lying;
  // (wave 6e, E4) an advance at a crouch (walking, crouch 0.2 to 0.55, free arms, a rifle) carries it at the port
  if (crouch > 0.2 && mArm < 0.5 && mLeg < 0.5 && smoothstep(0.0, 0.7, min(walk, 1.0)) * (1.0 - smoothstep(0.55, 0.8, crouch)) > 0.3 && pBit(iLook.x, 6.0) > 0.5) mArm = 11.0;
  float r = iVar.z;
  // (wave 6j, rig2) the pack is a little bigger or smaller on every back (+-12 %: the same figure, the same size, every frame: r is the figure's own number)
  if (kit > 6.5 && kit < 7.5) { vec3 pc = vec3(0.0, 1.17, -0.2); float ps = 0.88 + 0.24 * fract(r * 33.1); p = pc + (p - pc) * vec3(1.0, ps, ps); }
  // (wave C, marks) the cloth of a carried flag (kit 15) or banner (kit 23) is a sheet: it sways with the bearer's step, more toward the fly (0 at the pole)
  if ((kit > 14.5 && kit < 15.5) || (kit > 22.5 && kit < 23.5)) { float fl = clamp((0.31 - p.z) / 0.84, 0.0, 1.0); if (p.y > 1.7) p.x += fl * (0.03 + 0.05 * min(walk, 1.0)) * sin(phase * 2.0 - fl * 4.0 + r * 6.28); }
  // a figure that stands (arms free, legs free, not crouching or lying) is not a statue: each one holds its arms a little differently and
  // looks its own way (by the figure's random number: the same figure the same way every frame)
  float idle = (1.0 - min(walk, 1.0)) * (mArm < 0.5 ? 1.0 : 0.0) * (1.0 - lying) * (crouch < 0.01 ? 1.0 : 0.0) * (mLeg < 0.5 ? 1.0 : 0.0);
  bool gown = pBit(iLook.x, 12.0) > 0.5, old = pBit(iLook.x, 19.0) > 0.5, child = pBit(iLook.x, 18.0) > 0.5;
  float stride = (0.9 + 0.2 * r) * (gown ? 0.62 : 1.0) * (old ? 0.7 : 1.0) * (1.0 + iMove.z);
  float climb = step(9.5, mArm) * step(mArm, 10.5);
  // (wave 6e, E4) a woman in a gown and an old man take shorter steps: the same distance-locked phase is run faster (more steps to the metre) and the foot's travel is
  // shortened to match, so the feet still do not slide. The phase is wrapped (a stride phase counted over kilometres loses precision in a 32-bit float)
  float gK = (gown ? 0.82 : 1.0) * (old ? 0.75 : 1.0);
  phase = mod(phase / gK, PI2);
  // ---- the legs
  float wG = smoothstep(0.0, 0.7, min(walk, 1.0));
  float cwk = wG * (1.0 - smoothstep(0.55, 0.8, crouch));                              // an advance at a crouch: walking legs, the hip lowered by the crouch
  // the cycle of a pace above the walk: 1.37 + 0.45 (v - 1.3) m (spec 5.2) through behave.js gait()'s own walk(v) (walk 1.0 at 1.5 m/s, 1.2 at 2.5, 1.8 at 5): 1.46 m at 1.5, 1.91 at 2.5, 2.27 at 3.3, 3.04 at 5
  float gcyc = GCYC * gK + cycExtra(walk);
  float rr = smoothstep(1.4, 2.1, gcyc);
  float gH = mix(GH_M, GH_MR, rr) + mix(GH_B, GH_BR, rr) * cos(2.0 * phase) - 0.22 * crouch * cwk;
  vec4 lL = legAngles(1.0, phase, walk, crouch, mArm, mLeg, stride, lying, r, climb, gcyc, gH);
  vec4 lR = legAngles(-1.0, phase, walk, crouch, mArm, mLeg, stride, lying, r, climb, gcyc, gH);
  // the figure comes down so that the lowest foot rests on the ground (the walk's bob, a squat, a kneel)
  float yL = HIP - LT * cos(lL.x) - LS * cos(lL.x + lL.y), yR = HIP - LT * cos(lR.x) - LS * cos(lR.x + lR.y);
  float drop = (mLeg < 0.5 && climb < 0.5) ? max(0.0, min(yL, yR) - ANKLE) : 0.0;
  // (wave 6e, E4) in the walk the hip rides its own bob (the planted foot is solved for it): the drop follows the gait weight; a crouch, a run and the old foot rule keep theirs
  float gD = (mLeg < 0.5 && climb < 0.5) ? wG * (1.0 - smoothstep(0.55, 0.8, crouch)) : 0.0;
  drop = mix(drop, HIP - gH, gD);
  // the lean of the upper body about the hip: walking, running, a squat, pulling, a stoop
  float w1 = min(walk, 1.0), run = smoothstep(1.2, 1.8, walk);
  float lean = 0.05 * w1 + 0.1 * rr + 0.1 * run +(old ? 0.2 : 0.0) + (abs(mArm - 7.0) < 0.5 ? 0.28 : 0.0);
  // (wave 6e, E4) lean INTO an acceleration and back into a braking (iMove.x = 0.1 * a rad, from the behaviour's own closed-form ramps: no state, so no overshoot), the torso
  // leads a turn (yaw about the hip, the head more) and banks into it; all of it follows the motion fade-in so a standing figure is never tilted
  float mv = smoothstep(0.0, 0.2, w1);
  lean += clamp(iMove.x, -0.35, 0.35) * mv + (fract(r * 53.1) - 0.5) * 0.08 * mv;
  float yawT = clamp(iMove.y * 0.18, -0.4, 0.4) * smoothstep(0.0, 0.3, w1), bankT = -clamp(iMove.y * 0.04, -0.12, 0.12) * smoothstep(0.0, 0.3, w1) * (0.4 + 0.6 * run);
  if (crouch > 0.0) lean += (abs(mArm - 2.0) < 0.5 ? 0.12 : abs(mArm - 4.0) < 0.5 ? 0.22 : 0.45 - 0.15 * cwk) * smoothstep(0.0, 0.25, crouch);
  if (climb > 0.5) lean = -0.2;
  // ---- the limbs
  if (cls > 0.5 && cls < 2.5) {                                                     // thigh
    vec4 L = cls < 1.5 ? lL : lR;
    rX(p, n, L.x, HIP, 0.0);
    if (L.w != 0.0) rZ(p, n, (cls < 1.5 ? 1.0 : -1.0) * L.w, 0.0, HIP);
  } else if (cls > 19.5 && cls < 21.5) {                                            // shin
    float s = cls < 20.5 ? 1.0 : -1.0; vec4 L = s > 0.0 ? lL : lR;
    rX(p, n, L.y, KNEE, 0.0); rX(p, n, L.x, HIP, 0.0);
    if (L.w != 0.0) rZ(p, n, s * L.w, 0.0, HIP);
  } else if (cls > 24.5 && cls < 26.5) {                                            // foot
    float s = cls < 25.5 ? 1.0 : -1.0; vec4 L = s > 0.0 ? lL : lR;
    rX(p, n, L.z, ANKLE, 0.0); rX(p, n, L.y, KNEE, 0.0); rX(p, n, L.x, HIP, 0.0);
    if (L.w != 0.0) rZ(p, n, s * L.w, 0.0, HIP);
  } else if ((cls > 2.5 && cls < 4.5) || (cls > 21.5 && cls < 23.5) || (cls > 6.5 && cls < 7.5)) {  // arms, forearms, the lantern
    float s = (cls < 3.5 || (cls > 21.5 && cls < 22.5) || (cls > 6.5 && cls < 7.5)) ? 1.0 : -1.0;
    vec4 A = armAngles(s, phase, walk, mArm, stride, lying, r, iAct.x);
    if (idle > 0.0) { A.x += (fract(r * 17.3 + s * 0.37) - 0.5) * 0.4 * idle; A.z += 0.14 * fract(r * 9.7 + s * 0.11) * idle; A.y -= 0.35 * step(0.85, fract(r * 3.3 + s * 0.5)) * idle; }
    float sx = s * 0.265;
    if (cls > 6.5 && cls < 7.5) {
      // the lantern: moves with the left hand (rest place 0.27, 0.755, 0.0) but hangs straight down
      vec3 hp = vec3(0.27, 0.755, 0.0), hn = vec3(0.0, 1.0, 0.0);
      rX(hp, hn, A.y, ELBOW, 0.0); rX(hp, hn, A.x, SHO, 0.0); rZ(hp, hn, s * A.z, sx, SHO); rY(hp, hn, -s * A.w, sx, 0.0);
      p += hp - vec3(0.27, 0.755, 0.0);
    } else {
      if (cls > 21.5) rX(p, n, A.y, ELBOW, 0.0);
      rX(p, n, A.x, SHO, 0.0);
      if (A.z != 0.0) rZ(p, n, s * A.z, sx, SHO);
      if (A.w != 0.0) rY(p, n, -s * A.w, sx, 0.0);
    }
  } else if (cls > 4.5 && cls < 5.5) {                                              // the rifle: slung over the right shoulder, or held level to aim
    vec3 q = p, m = n;
    if (mArm > 11.5) { q += vec3(-0.06, 1.75, 0.0); }                                  // prone: along the ground in front of the head (the fall turns +y into forward)
    else if (mArm > 10.5) { rZ(q, m, -0.7, 0.0, 0.0); rX(q, m, 0.35, 0.0, 0.0); q += vec3(0.02, 1.16, 0.32); }   // at the port: across the body, muzzle up and to the left
    else if (iAct.x > 0.5) { rX(q, m, 1.5708, 0.0, 0.0); q += vec3(-0.08, 1.33, 0.42); rY(q, m, 0.09, -0.08, 0.0); }
    else { rX(q, m, -0.26 + 0.12 * (fract(r * 71.9) - 0.5), 0.0, 0.0); q += vec3(-0.19, 1.05, -0.15); }
    p = q; n = m;
  } else if (cls > 5.5 && cls < 6.5) {                                              // the muzzle flash at the end of the levelled rifle
    p *= iAct.w * step(0.5, iAct.x); p += mArm > 11.5 ? vec3(-0.06, 2.4, 0.0) : vec3(-0.08, 1.33, 1.17);
  } else if (cls > 7.5 && cls < 8.5) {                                              // baskets swing a little on their ropes
    rX(p, n, 0.09 * walk * sin(2.0 * phase + 0.7), aBone.y, aBone.z);
  } else if (cls > 9.5 && cls < 10.5) {                                             // the head: kept level against the lean; a child's is bigger
    if (child) { p = vec3(0.0, 1.51, 0.0) + (p - vec3(0.0, 1.51, 0.0)) * 1.28; }
    rY(p, n, (fract(r * 23.9) - 0.5) * 0.36 * (1.0 - 0.5 * pBit(iLook.x, 6.0)), 0.0, 0.0); rX(p, n, (fract(r * 61.3) - 0.5) * 0.16, NECK, 0.0);
    if (idle > 0.0) rY(p, n, (fract(r * 13.1 + 0.3) - 0.5) * 1.2 * idle * (1.0 - 0.65 * pBit(iLook.x, 6.0)), 0.0, 0.0);   // (a soldier under arms looks about less)
    rX(p, n, -0.55 * lean, NECK, 0.0);
    if (yawT != 0.0) rY(p, n, clamp(iMove.y * 0.2, -0.45, 0.45) * smoothstep(0.0, 0.3, w1), 0.0, 0.0);              // (the head leads the turn first)
    if (mArm > 11.5) rX(p, n, -1.0 * lying, NECK, 0.0);                                  // prone: the head comes up to look along the rifle
  }
  // the upper body and everything on it leans about the hip (the legs do not)
  bool legPart = (cls > 0.5 && cls < 2.5) || (cls > 19.5 && cls < 21.5) || (cls > 24.5 && cls < 26.5);
  if (!legPart && lean != 0.0) rX(p, n, lean, HIP, 0.0);
  if (!legPart && yawT != 0.0) { rY(p, n, yawT, 0.0, 0.0); if (bankT != 0.0) rZ(p, n, bankT, 0.0, HIP); }
  if (cls > 23.5 && cls < 24.5) {                                                   // the stick: its foot stays on the ground in front of the right hand
    // (it is rigid with the body frame, so it leans with it: put it back upright)
    rX(p, n, -lean, HIP, 0.0);
  }
  // a figure that kneels or squats has come down; a walker bobs
  p.y -= drop;
  // build: the figure's width (a random number per figure) and depth
  // (wave 6j, rig2) a height of its own (+-3 % on top of the figure's scale) and a shoulder width of its own (+-6 %: the body, the arms and the hands, not the hips)
  p.y *= 1.0 + 0.03 * (2.0 * fract(r * 91.7) - 1.0);
  if (cls < 0.5 || (cls > 2.5 && cls < 4.5) || (cls > 6.5 && cls < 7.5) || (cls > 21.5 && cls < 23.5)) p.x *= 1.0 + 0.06 * (2.0 * fract(r * 47.3) - 1.0);
  p.x *= iVar.x; p.z *= 1.0 + (iVar.x - 1.0) * 0.5;
  finishPose(p, n, fall);
}
`,P=`
void pose(inout vec3 p, inout vec3 n) {
  float cls = aBone.x, kit = aBone.w;
  if (kit >= 0.0 && pBit(iLook.x, kit) < 0.5) { p = vec3(0.0); return; }
  if (cls > 10.5 && (cls < 12.5 || cls > 39.5)) { horsePose(p, n, cls); p.y *= 1.0 + 0.04 * (2.0 * fract(iVar.z * 91.7) - 1.0); p.z *= 1.0 + 0.03 * (2.0 * fract(iVar.z * 47.3) - 1.0); finishPose(p, n, iPose.w); return; }
  float phase = rigPhase(), walk = min(iPose.y, 1.0), crouch = iPose.z, fall = iPose.w;
  float runL = smoothstep(1.2, 1.8, iPose.y);   // (wave 6e, E4: the cheap level runs too: wider legs, arms, a forward lean)
  float mode = iAct.y, arm = mod(mode, 16.0), legs = floor(mode / 16.0 + 0.001);
  // (wave 6j, rig2) the cheap level walks on the near level's own phase (a woman in a gown and an old man take more, shorter steps: phase / gK) and its own stride: the leg swing is scaled by the cycle
  // length (the extra stride of a pace above the walk), so a cheap column at 300 m does not skate while the same men at 100 m walk
  float gK1 = (pBit(iLook.x, 12.0) > 0.5 ? 0.82 : 1.0) * (pBit(iLook.x, 19.0) > 0.5 ? 0.75 : 1.0);
  phase = mod(phase / gK1, PI2);
  float sw = sin(phase);
  float gcyc1 = ${l.cycleM.toFixed(4)} * gK1 + cycExtra(iPose.y);
  // the left leg's swing: the flattened sine at the amplitude that keeps its planted foot still on the ground at the cycle (0.82 m leg: 0.22 m of foot travel per rad = cycle / 2 pi at 1.37 m)
  float aW = 0.36 * (gcyc1 / ${l.cycleM.toFixed(4)}) * smoothstep(0.0, 0.7, walk) * 0.777 * asin(0.96 * sw);
  // the trunk leans forward into a walk, a jog and a run (the near level's numbers) and into an acceleration
  float lean1 = 0.05 * walk + 0.1 * smoothstep(1.4, 2.1, gcyc1) + 0.1 * runL + clamp(iMove.x, -0.35, 0.35) * smoothstep(0.0, 0.2, walk);
  if (crouch > 0.2 && arm < 0.5 && legs < 0.5 && smoothstep(0.0, 0.7, walk) * (1.0 - smoothstep(0.55, 0.8, crouch)) > 0.3 && pBit(iLook.x, 6.0) > 0.5) arm = 11.0;
  bool isArmL = cls > 2.5 && cls < 3.5 || cls > 6.5 && cls < 7.5, isArmR = cls > 3.5 && cls < 4.5;
  bool isLeg = cls > 0.5 && cls < 2.5;
  if (cls > 4.5 && cls < 5.5) {
    vec3 q = p, m = n;
    if (arm > 11.5) { q += vec3(-0.06, 1.75, 0.0); }
    else if (arm > 10.5) { rZ(q, m, -0.7, 0.0, 0.0); rX(q, m, 0.35, 0.0, 0.0); q += vec3(0.02, 1.16, 0.32); }
    else if (iAct.x > 0.5) { rX(q, m, 1.5708, 0.0, 0.0); q += vec3(-0.08, 1.33, 0.42); }
    else { rX(q, m, -0.26, 0.0, 0.0); q += vec3(-0.19, 1.05, -0.15); }
    p = q; n = m;
  }
  if (cls > 5.5 && cls < 6.5) { p *= iAct.w * step(0.5, iAct.x); p += arm > 11.5 ? vec3(-0.06, 2.4, 0.0) : vec3(-0.08, 1.33, 1.17); }
  if (isLeg) {
    // (wave 6e, E4) the cheap leg's swing is the flattened sine the near level's planted foot has (asin(0.96 sin) / asin(0.96): nearly linear through the stance), at the
    // amplitude that keeps the cheap foot still on the ground at GAIT.cycleM (0.36 rad on a 0.82 m leg), faded in with the pace like the near level's
    float a = (cls < 1.5 ? 1.0 : -1.0) * aW;
    if (legs > 0.5 && legs < 1.5) a = -1.45;
    if (legs > 1.5) { a = -0.3; rZ(p, n, sign(p.x) * 0.42, 0.0, 0.82); }
    rX(p, n, a, aBone.y, aBone.z);
  }
  if (isArmL || isArmR) {
    float s = (isArmL ? -1.0 : 1.0) * 0.4 * (1.0 + runL) * walk * sw, a = s;
    if (arm > 0.5 && arm < 1.5) a = -1.15;
    else if (arm > 1.5 && arm < 2.5) a = 0.38;
    else if (arm > 2.5 && arm < 3.5) a = isArmR ? 0.25 * s : s;
    else if (arm > 3.5 && arm < 4.5) a = -1.38;
    else if (arm > 4.5 && arm < 5.5) a = -0.32;
    else if (arm > 5.5 && arm < 6.5) a = isArmL ? -0.42 + 0.12 * s : s;
    else if (arm > 6.5 && arm < 7.5) a = 0.12;
    else if (arm > 8.5 && arm < 9.5) a = -2.9;
    else if (arm > 10.5 && arm < 11.5) a = isArmL ? -1.0 : -0.75;
    else if (arm > 11.5) a = -2.4;
    rX(p, n, a, aBone.y, aBone.z);
  }
  if (cls > 7.5 && cls < 8.5) rX(p, n, 0.09 * walk * sin(2.0 * phase + 0.7), aBone.y, aBone.z);
  if (isLeg) { p.y *= 1.0 - 0.5 * crouch; }
  else { rX(p, n, 0.42 * crouch + lean1, 0.8, 0.0); p.y -= 0.41 * crouch; }
  // the straight cheap leg lifts its foot by 0.82 (1 - cos a) when it swings: the whole figure comes down by that (the hip's bob), so both feet stand on the ground
  p.y -= (legs < 0.5 ? 0.82 * (1.0 - cos(aW)) : 0.0) * (1.0 - crouch);
  p.y *= 1.0 + 0.03 * (2.0 * fract(iVar.z * 91.7) - 1.0);
  if (cls < 0.5) p.x *= 1.0 + 0.06 * (2.0 * fract(iVar.z * 47.3) - 1.0);
  p.x *= iVar.x; p.z *= 1.0 + (iVar.x - 1.0) * 0.5;
  finishPose(p, n, fall);
}
`,F=`
uniform vec3 uPal[64];
uniform vec3 uFixed[16];
uniform float uLanternGain;
uniform float uFlashGain;
uniform float uPpmK;
varying vec3 vCol;
varying vec3 vGlow;
varying vec2 vKeep;
varying float vFade;
varying float vFadeO;
void rigColour() {
  float packed = iLook.y;
  float cCoat = mod(packed, 64.0), cTrou = mod(floor(packed / 64.0 + 0.001), 64.0);
  float cHead = mod(floor(packed / 4096.0 + 0.001), 64.0), cKit = mod(floor(packed / 262144.0 + 0.001), 64.0);
  float slot = aSlot;
  vGlow = vec3(0.0);
  if (slot < 0.5) vCol = uFixed[0] * (0.88 + 0.24 * fract(iVar.z * 5.17)) * vec3(1.0, 0.97 + 0.06 * fract(iVar.z * 3.31), 0.95 + 0.1 * fract(iVar.z * 8.9)); // (skin: a little different on every figure)
  // an old man's hair is grey (wave 6b, WP3: linear 0.32, sRGB 153, read as WHITE in the warm light (221,202,162 in the frame, seen from behind the
  // whole back and top of the head was one white cube: previews/sim/w6/wp3-figures/c4_scarf_pale.png); now linear 0.105, sRGB 88)
  else if (slot < 1.5) vCol = (pBit(iLook.x, 19.0) > 0.5) ? vec3(0.105, 0.105, 0.1) : uFixed[1];
  else if (slot < 2.5) vCol = uPal[int(cCoat)] * iVar.y;
  else if (slot < 3.5) vCol = uPal[int(cTrou)] * (0.9 + 0.1 * iVar.y);
  else if (slot < 4.5) vCol = uPal[int(cHead)] * (0.92 + 0.08 * iVar.y);
  else if (slot < 5.5) vCol = uPal[int(cKit)];
  else vCol = uFixed[int(slot - 4.0)];
  if (slot > 8.5 && slot < 9.5) vGlow = uFixed[5] * vec3(1.0, 0.62, 0.3) * iAct.z * uLanternGain;
  if (slot > 9.5 && slot < 10.5) vGlow = vec3(1.0, 0.8, 0.45) * iAct.w * uFlashGain;
  vCol = mix(vCol, uFixed[7], iLook.w);
  // which pixels of this figure are drawn at this level (a screen-door dither between the levels: LOD 0 keeps b < vKeep.y,
  // LOD 1 keeps vKeep.x <= b < vKeep.y); iVar.w is the near level's share, the far fade is the figure's size in pixels
  float dd = max(1.0, distance(cameraPosition, iPos.xyz + vec3(0.0, 0.8, 0.0)));
  float hpx = 1.62 * iLook.z * uPpmK / dd;
#ifdef RIG_LOD1
  vKeep = vec2(rigNear(), smoothstep(${u.lo.toFixed(3)}, ${u.hi.toFixed(3)}, hpx));
#else
  vKeep = vec2(0.0, rigNear());
#endif
  vFade = rigFade(); vFadeO = fract(iVar.z * 13.7);
}
`,je=`
if (uLampOn > 0.5) {
  mat3 rigLw = transpose(mat3(viewMatrix));
  vec3 rigAt = cameraPosition + rigLw * geometryPosition;
  vec2 rigUv = vec2(rigAt.x - uLampRect.x, uLampRect.y - rigAt.z) / (2.0 * uLampRect.z) + 0.5;
  vec2 rigEdge = smoothstep(vec2(0.0), vec2(0.04), rigUv) * (1.0 - smoothstep(vec2(0.96), vec2(1.0), rigUv));
  float rigUp = smoothstep(0.25, 0.7, (rigLw * geometryNormal).y);
  vec4 rigHi = texture2D(uLampMap, vec2(rigUv.x * 0.5, rigUv.y)), rigLo = texture2D(uLampMap, vec2(rigUv.x * 0.5 + 0.5, rigUv.y));
  float rigLvH = 1.0 - smoothstep(2.5, 5.0, abs(rigAt.y - (rigHi.a * 1000.0 - 200.0))), rigLvL = 1.0 - smoothstep(2.5, 5.0, abs(rigAt.y - (rigLo.a * 1000.0 - 200.0)));
  reflectedLight.directDiffuse += max(rigHi.rgb * rigLvH, rigLo.rgb * rigLvL) * rigEdge.x * rigEdge.y * (1.0 - rigUp) * 0.55 * material.diffuseColor;
}
`,I=`
varying vec3 vCol;
varying vec3 vGlow;
varying vec2 vKeep;
varying float vFade;
varying float vFadeO;
uniform float uDark;
`,L=`
{
  // interleaved gradient noise (Jimenez): the same pixel always gets the same number
  float rb = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  if (rb < vKeep.x || rb >= vKeep.y) discard;
  // (wave 6e, E4) the opacity fade: a second, independent pattern (the R2 low-discrepancy sequence of the pixel: no diagonal stripes, no line-up with the level dither above)
  if (fract(dot(gl_FragCoord.xy, vec2(0.75487766, 0.56984029)) + vFadeO) >= vFade) discard;
}
`,Me=(()=>{let e=5381;for(let t of[M,N,P,F,I,L])for(let n=0;n<t.length;n++)e=(e*33^t.charCodeAt(n))>>>0;return e.toString(36)})();function Ne(e,t,n,r=0,i=null){let a=new e.MeshStandardMaterial({color:16777215,roughness:.92,metalness:0});i??={uPal:{value:n.list.map(t=>new e.Vector3(...t))},uFixed:{value:n.fixed.map(t=>new e.Vector3(...t))},uLanternGain:{value:9},uFlashGain:{value:60},uPpmK:{value:1e3},uDark:{value:0},uDt:p};let o=r===1?P:N;return a.onBeforeCompile=e=>{Object.assign(e.uniforms,i),e.uniforms.uLampOn=t.uLampOn,e.uniforms.uLampMap=t.uLampMap,e.uniforms.uLampRect=t.uLampRect,e.vertexShader=e.vertexShader.replace(`#include <common>`,(r===1?`#define RIG_LOD1
`:``)+`#include <common>
`+M+o+F+`
vec3 gPosed;`).replace(`#include <beginnormal_vertex>`,`vec3 objectNormal = vec3(normal);
gPosed = vec3(position);
pose(gPosed, objectNormal);
rigColour();`).replace(`#include <begin_vertex>`,`vec3 transformed = gPosed;`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
`+I).replace(`#include <clipping_planes_fragment>`,`#include <clipping_planes_fragment>
`+L).replace(`#include <color_fragment>`,`#include <color_fragment>
diffuseColor.rgb = vCol * (1.0 + 0.4 * uDark);`).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
totalEmissiveRadiance += vGlow;`).replace(`#include <lights_fragment_end>`,`#include <lights_fragment_end>
`+je)},a.customProgramCacheKey=()=>`nj-people-rig-${Me}-l${r}`,a.userData.rigUniforms=i,a.onBeforeRender=()=>{let e=globalThis.__app?.env?.dark;typeof e==`number`&&(i.uDark.value=e)},a}var Pe=`
{
  float rb = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  if (fract(dot(gl_FragCoord.xy, vec2(0.75487766, 0.56984029)) + vFadeD.y) >= vFadeD.x) discard;
}
`;function Fe(e,t=0){let n=new e.MeshDepthMaterial({depthPacking:e.RGBADepthPacking}),r=t===1?P:N;return n.onBeforeCompile=e=>{e.vertexShader=e.vertexShader.replace(`#include <common>`,(e.uniforms.uDt=p,`#include <common>
`+M+r+`
varying vec2 vFadeD;`)).replace(`#include <begin_vertex>`,`vec3 transformed = vec3(position);
vec3 _n = vec3(0.0, 1.0, 0.0);
pose(transformed, _n);
vFadeD = vec2(rigFade(), fract(iVar.z * 13.7));`),e.fragmentShader=e.fragmentShader.replace(`varying vec2 vHighPrecisionZW;`,`varying vec2 vHighPrecisionZW;
varying vec2 vFadeD;`).replace(`#include <clipping_planes_fragment>`,`#include <clipping_planes_fragment>
`+Pe)},n.customProgramCacheKey=()=>`nj-people-rig-depth-${Me}-l${t}`,n}function R(e,t,r){t=t.index?t.toNonIndexed():t;let i=t.attributes.position.count,a=new Float32Array(i*3),o=n(r);for(let e=0;e<i;e++)a.set(o,e*3);return t.setAttribute(`color`,new e.BufferAttribute(a,3)),t.attributes.uv&&t.deleteAttribute(`uv`),t}var z=(e,t,n,r,i,a,o,s,c=0,l=0,u=0)=>{let d=new e.BoxGeometry(t,n,r);return u&&d.rotateZ(u),l&&d.rotateX(l),c&&d.rotateY(c),R(e,d.translate(i,a,o),s)},B=(e,t,n,r,i,a,o,s,c=`x`,l=10)=>{let u=new e.CylinderGeometry(n,t,r,l);return c===`x`?u.rotateZ(Math.PI/2):c===`z`&&u.rotateX(Math.PI/2),R(e,u.translate(i,a,o),s)};function V(e,t,n,r,{bow:i=.15,stern:a=.6,rise:o=.3,sternRise:s=.5,rgb:c}){let l=new e.BoxGeometry(1,1,1,1,1,8),u=l.attributes.position;for(let e=0;e<u.count;e++){let c=u.getZ(e)+.5,l=u.getY(e)>0,d=c>.5?(c-.5)*2:(.5-c)*2,f=1-(1-(c>.5?i:a))*d**2.2;u.setX(e,u.getX(e)*n*f*(l?1:.78));let p=(c>.5?o:s)*d**2;u.setY(e,l?r+p:0),u.setZ(e,(c-.5)*t)}let d=l.toNonIndexed();return d.computeVertexNormals(),R(e,d,c)}var H=(e,t,n,r,i,a,o=.06,s=null,c=4)=>{let l=[B(e,t,t,o,n,r,i,a,`x`,14),B(e,t*.2,t*.2,o*1.6,n,r,i,s??a,`x`,8)];for(let u=0;u<c;u++){let d=new e.BoxGeometry(o*.7,t*1.84,.035);d.rotateX(u*Math.PI/c),l.push(R(e,d.translate(n,r,i),s??a))}return l},U=[104,94,62],W=[70,64,44],G=[22,21,20],K=[92,70,48],q=[58,44,32],J=[128,133,136],Y=[70,72,74],X=[150,128,88],Z=[30,34,38],Q=[112,114,116],$=[214,202,160],Ie=[128,120,92];function Le(e,t){let n=e=>t(e),r={},i=(t,n,r,i=.22)=>[B(e,t,t,i,n,t,r,G,`x`,14),B(e,t*.58,t*.58,i+.03,n,t,r,Q,`x`,10),B(e,t*.22,t*.22,i+.07,n,t,r,W,`x`,6)];r.truck=n([z(e,.9,.62,1.05,0,1.12,2,U),z(e,.7,.5,.04,0,1.12,2.53,[36,34,30]),z(e,.9,.04,.5,0,1.45,2.05,W),z(e,1.86,.12,1.2,0,.98,2.05,W),z(e,.16,.16,.12,.6,1.22,2.58,$),z(e,.16,.16,.12,-.6,1.22,2.58,$),z(e,1.8,.08,.14,0,.72,2.62,Q),z(e,1.7,.9,1.15,0,1.6,.95,U),z(e,1.5,.42,.04,0,1.78,1.53,Z),z(e,.04,.4,.8,.86,1.72,.9,Z),z(e,.04,.4,.8,-.86,1.72,.9,Z),z(e,.03,.78,.04,.86,1.52,.5,W),z(e,.03,.78,.04,-.86,1.52,.5,W),z(e,1.74,.07,1.2,0,2.08,.95,W),z(e,.12,.18,5,.55,.7,.2,G),z(e,.12,.18,5,-.55,.7,.2,G),z(e,.16,.06,.5,.95,.62,1,q),z(e,.16,.06,.5,-.95,.62,1,q),z(e,1.9,.1,3.1,0,1.06,-1.1,K),z(e,.06,.5,3.1,.92,1.36,-1.1,U),z(e,.06,.5,3.1,-.92,1.36,-1.1,U),z(e,1.9,.5,.06,0,1.36,-2.62,U),z(e,1.9,.5,.06,0,1.36,.42,U),z(e,.08,.5,.08,.95,1.36,-.4,q),z(e,.08,.5,.08,-.95,1.36,-.4,q),z(e,.08,.5,.08,.95,1.36,-1.8,q),z(e,.08,.5,.08,-.95,1.36,-1.8,q),B(e,.4,.4,.1,0,.8,-2.75,G,`z`,12),...i(.45,.8,1.95),...i(.45,-.8,1.95),...i(.45,.8,-.75),...i(.45,-.8,-.75),...i(.45,.8,-1.75),...i(.45,-.8,-1.75)]),r.truckCover=n([z(e,1.88,.95,3,0,2.08,-1.1,Ie),z(e,1.5,.3,3,0,2.7,-1.1,[136,128,100]),z(e,1.9,.08,.1,0,2.5,-2.6,[96,88,66])]);{let t=[z(e,.5,.95,5.5,.82,.62,-.05,W),z(e,.5,.95,5.5,-.82,.62,-.05,W),z(e,1.3,.75,4.5,0,1.25,-.2,U),z(e,1.3,.5,.9,0,1.25,2.3,U,0,.55),z(e,2.15,.08,4.6,0,1.12,-.2,W),z(e,.5,.3,.1,.5,1.45,2.4,W),B(e,.66,.6,.62,0,1.92,.45,U,`y`,8),B(e,.24,.22,.36,0,2.38,.35,U,`y`,8),B(e,.06,.06,.75,0,1.95,1.4,W,`z`,6),z(e,.9,.12,1.2,0,.75,-3.3,W),z(e,.04,1.2,.04,-.5,2.4,-1.4,Q),z(e,1.2,.3,.9,0,1.55,-1.9,W)];for(let n of[1,-1])for(let r=0;r<6;r++)t.push(B(e,.3,.3,.12,n*1.1,.42,-2.1+r*.85,[58,56,46],`x`,10));r.tank89=n(t)}{let t=[z(e,.32,.6,3,.62,.4,0,W),z(e,.32,.6,3,-.62,.4,0,W),z(e,1,.62,2.6,0,.92,-.1,U),z(e,1,.4,.7,0,.92,1.3,U,0,.6),B(e,.42,.38,.42,-.15,1.42,.35,U,`y`,8),B(e,.03,.03,.5,-.15,1.45,.95,W,`z`,5),z(e,.4,.14,.4,.3,1.3,1.1,W)];for(let n of[1,-1])for(let r=0;r<4;r++)t.push(B(e,.22,.22,.1,n*.82,.24,-1+r*.7,[58,56,46],`x`,8));r.tankette=n(t)}r.gun=n([...H(e,.62,.78,.62,0,q,.1,K),...H(e,.62,-.78,.62,0,q,.1,K),B(e,.05,.05,1.6,0,.62,0,W,`x`,6),z(e,1.2,.95,.05,0,1,.25,U),B(e,.09,.06,2.3,0,1.05,.8,W,`z`,8),z(e,.3,.3,.9,0,.95,.05,U),z(e,.24,.16,2.3,0,.42,-1.2,U,0,.22)]),r.limber=n([...H(e,.62,.78,.62,0,q,.1,K),...H(e,.62,-.78,.62,0,q,.1,K),z(e,1.2,.6,.9,0,1.15,0,U),z(e,.08,.08,2.8,0,.95,1.8,K),z(e,1,.08,.8,0,1.5,0,W)]),r.cart=n([...H(e,.42,.58,.42,-.2,q,.08,K),...H(e,.42,-.58,.42,-.2,q,.08,K),z(e,1,.07,2.1,0,.72,-.2,K),z(e,.05,.14,2.1,.5,.82,-.2,q),z(e,.05,.14,2.1,-.5,.82,-.2,q),z(e,.06,.06,1.6,.3,.62,1.5,K,0,.18),z(e,.06,.06,1.6,-.3,.62,1.5,K,0,.18),z(e,.8,.45,.7,.05,.98,.1,[44,56,92]),z(e,.7,.4,.8,-.05,.96,-.75,[140,120,90]),z(e,.5,.3,.5,.1,1.33,-.3,[96,70,50]),z(e,.04,.04,1.3,0,1.2,-.3,q)]),r.cartEmpty=n([...H(e,.42,.58,.42,-.2,q,.08,K),...H(e,.42,-.58,.42,-.2,q,.08,K),z(e,1,.07,2.1,0,.72,-.2,K),z(e,.05,.14,2.1,.5,.82,-.2,q),z(e,.05,.14,2.1,-.5,.82,-.2,q),z(e,.06,.06,1.6,.3,.62,1.5,K,0,.18),z(e,.06,.06,1.6,-.3,.62,1.5,K,0,.18)]),r.rickshaw=n([...H(e,.55,.46,.55,-.25,[30,28,26],.05,[150,146,136],6),...H(e,.55,-.46,.55,-.25,[30,28,26],.05,[150,146,136],6),z(e,.62,.36,.5,0,.82,-.2,[36,34,32]),z(e,.62,.5,.1,0,1.12,-.45,[36,34,32]),z(e,.06,.4,.5,.31,1,-.2,[36,34,32]),z(e,.06,.4,.5,-.31,1,-.2,[36,34,32]),z(e,.5,.1,.46,0,1.02,-.2,[96,60,44]),z(e,.66,.38,.32,0,1.38,-.55,[26,26,28],0,-.5),z(e,.05,.05,.9,.31,1.52,-.28,[26,26,28],0,-.7),z(e,.05,.05,.9,-.31,1.52,-.28,[26,26,28],0,-.7),z(e,.04,.04,1.7,.27,.72,.85,q,0,.12),z(e,.04,.04,1.7,-.27,.72,.85,q,0,.12),z(e,.62,.03,.03,0,.68,1.65,q),z(e,.1,.12,.1,.36,.95,.1,[190,170,100]),z(e,.1,.12,.1,-.36,.95,.1,[190,170,100])]);{let t=[40,42,44],i=[150,150,146],a=[z(e,1.8,.55,4.3,0,.78,0,t),z(e,1.5,.52,2,0,1.3,-.35,t),z(e,1.46,.05,1.9,0,1.58,-.35,[30,32,34]),z(e,1.52,.38,.04,0,1.33,.65,Z),z(e,1.52,.34,.04,0,1.33,-1.35,Z),z(e,.04,.34,1.7,.76,1.33,-.35,Z),z(e,.04,.34,1.7,-.76,1.33,-.35,Z),z(e,.9,.4,.04,0,.82,2.17,i),z(e,1.9,.07,.14,0,.5,2.2,i),z(e,1.9,.07,.14,0,.5,-2.2,i),z(e,.16,.16,.14,.62,.98,2.15,$),z(e,.16,.16,.14,-.62,.98,2.15,$),z(e,.18,.06,3.2,.98,.42,0,[26,26,26]),z(e,.18,.06,3.2,-.98,.42,0,[26,26,26]),B(e,.34,.34,.1,0,.62,-2.28,G,`z`,12)];for(let t of[1,-1])for(let n of[1.35,-1.3])a.push(B(e,.34,.34,.2,t*.82,.34,n,G,`x`,12),B(e,.2,.2,.22,t*.82,.34,n,Q,`x`,8));r.car=n(a)}{let t=[96,108,92],i=[z(e,2.2,1.7,6,0,1.45,-.6,t),z(e,1.5,1,1.5,0,1,3,t),z(e,2.1,.1,5.9,0,2.35,-.6,[66,72,62]),z(e,2,.6,.04,0,1.9,2.25,Z),z(e,1.2,.5,.04,0,1.5,3.76,[50,52,50]),z(e,2.3,.08,.14,0,.62,3.8,Q),z(e,.16,.16,.12,.55,1,3.78,$),z(e,.16,.16,.12,-.55,1,3.78,$),z(e,2,.08,4,0,2.48,-.8,q),z(e,.04,.3,4,.9,2.62,-.8,q),z(e,.04,.3,4,-.9,2.62,-.8,q)];for(let t of[1,-1]){for(let n=0;n<5;n++)i.push(z(e,.04,.6,.8,t*1.1,1.95,-2.9+n*1.15,Z));i.push(z(e,.04,1.2,.05,t*1.1,1.5,.05,[46,52,44])),i.push(B(e,.5,.5,.3,t*.95,.5,2.6,G,`x`,14),B(e,.5,.5,.3,t*.95,.5,-2.4,G,`x`,14),B(e,.3,.3,.34,t*.95,.5,2.6,Q,`x`,8),B(e,.3,.3,.34,t*.95,.5,-2.4,Q,`x`,8))}r.bus=n(i)}{let t=[30,30,32];r.bicycle=n([B(e,.34,.34,.03,0,.34,.6,G,`x`,14),B(e,.34,.34,.03,0,.34,-.6,G,`x`,14),z(e,.04,.04,1,0,.62,0,t,0,-.25),z(e,.04,.5,.04,0,.55,-.5,t,0,.2),z(e,.04,.62,.04,0,.65,.5,t,0,-.35),z(e,.5,.04,.04,0,1,.62,t),z(e,.1,.05,.22,0,.98,-.44,[40,28,20])])}r.barrow=n([...H(e,.5,0,.5,.3,q,.1,K),z(e,.5,.06,1.2,.5,.66,.3,K),z(e,.5,.06,1.2,-.5,.66,.3,K),z(e,.05,.05,2,.28,.7,-.3,K,0,.05),z(e,.05,.05,2,-.28,.7,-.3,K,0,.05),z(e,.04,.5,.04,.35,.28,-1.1,q),z(e,.04,.5,.04,-.35,.28,-1.1,q),z(e,.45,.4,.7,.5,.9,.3,[96,70,50]),z(e,.45,.35,.6,-.5,.88,.3,[140,120,90])]),r.oxcart=n([...H(e,.75,.9,.75,-.2,q,.1,K,5),...H(e,.75,-.9,.75,-.2,q,.1,K,5),z(e,1.5,.1,3,0,1,-.4,K),z(e,.06,.4,3,.72,1.25,-.4,q),z(e,.06,.4,3,-.72,1.25,-.4,q),z(e,1.4,.8,1.6,0,1.6,-.9,X),z(e,.08,.08,2.4,.3,.95,2.2,K,0,.05),z(e,.08,.08,2.4,-.3,.95,2.2,K,0,.05)]),r.tub=n([B(e,.8,.85,.6,0,.1,0,[100,78,54],`y`,14),B(e,.7,.7,.05,0,.4,0,[40,30,22],`y`,14),z(e,.9,.05,.1,0,.45,.7,q)]),r.stretcher=n([z(e,.04,.04,2.4,.28,0,0,K),z(e,.04,.04,2.4,-.28,0,0,K),z(e,.5,.2,1.65,0,.1,0,[70,66,58])]),r.load=n([z(e,.8,.6,.8,.45,1.41,-.3,[120,96,64]),z(e,.8,.5,1,-.45,1.36,-.5,[96,80,60]),z(e,.7,.5,.7,.4,1.36,-1.6,[70,58,46]),z(e,.9,.7,.8,-.4,1.46,-1.7,[150,140,120]),z(e,.6,.4,.6,0,1.91,-1,[110,60,48])]),r.mound=n([B(e,1,.55,.5,0,.25,0,[72,60,46],`y`,14)]);{let t=[[78,82,86],[104,94,62],[150,146,136],[66,70,74],[112,100,76]],i=[];for(let n=0;n<5;n++)i.push(z(e,.07,.2,.07,0,n*.2+.1,0,t[n])),i.push(z(e,.11,.025,.11,0,n*.2+.2,0,t[(n+2)%5]));r.rope=n(i)}return r}function Re(e,t){let n=e=>t(e),r={};{let t=[138,112,76],i=[70,54,36],a=[V(e,17,4.4,1.3,{bow:.25,stern:.55,rise:.5,sternRise:1.1,rgb:[70,54,38]}),z(e,3.6,.06,13.5,0,1.33,.3,[96,76,54]),z(e,.18,.5,14,2.05,1.7,.2,[58,44,32]),z(e,.18,.5,14,-2.05,1.7,.2,[58,44,32]),z(e,3.2,1.3,4,0,2,-4.4,X),z(e,3.5,.12,4.4,0,2.7,-4.4,[110,94,64]),z(e,3,.9,.12,0,1.9,-7,[58,44,32]),z(e,.2,1.6,2.2,0,1.2,-9,[58,44,32]),B(e,.13,.1,11,0,6.8,2.5,q,`y`,6),z(e,.16,.16,8.4,0,4.1,2.5,q)];for(let n=0;n<9;n++){let r=4.1+n*.62,o=n>=6,s=o?7.4-(n-5)*.5:7.9-n*.12;a.push(z(e,.04,o?.5:.56,s,0,r+.3,2.5-(o?.2:0),t)),a.push(z(e,.08,.06,s+.3,0,r,2.5,i))}r.junk=n(a)}r.sampan=n([V(e,7,1.8,.62,{bow:.18,stern:.45,rise:.25,sternRise:.35,rgb:[82,62,42]}),z(e,1.6,.05,5,0,.63,0,[104,82,58]),z(e,1.5,.7,2.4,0,1,-.2,X),z(e,1.3,.1,2.4,0,1.4,-.2,[120,100,70]),z(e,.06,.06,3.2,.2,.9,-4,K,0,-.25),z(e,.3,.04,.9,.2,.55,-5.4,K,0,-.25)]),r.raft=n([z(e,.86,.07,2.05,-1.32,.18,.02,[64,34,28]),z(e,.9,.07,2,-.44,.18,-.05,[86,64,44]),z(e,.84,.07,2.1,.43,.18,.05,[40,36,34]),z(e,.9,.07,1.95,1.3,.18,-.02,[100,80,56]),z(e,.1,.03,.1,-1.32,.23,.6,[170,150,90]),z(e,.1,.03,.1,.43,.23,-.4,[170,150,90]),z(e,3.6,.08,.14,0,.25,.7,K),z(e,3.6,.08,.14,0,.25,-.7,K),B(e,.17,.17,3.4,0,.06,.95,[80,66,50],`x`,7),B(e,.17,.17,3.4,0,.06,-.95,[80,66,50],`x`,7)]),r.gunboat=n([V(e,45.9,5.56,2.3,{bow:.12,stern:.6,rise:.6,sternRise:.2,rgb:J}),z(e,5.2,.08,40,0,2.32,-.5,[118,108,92]),z(e,4,2.4,6,0,3.5,8,J),z(e,3.4,1.4,3,0,5.4,8.6,J),z(e,3.2,.4,.1,0,5.5,10.2,Z),B(e,.75,.7,3.4,0,4.9,1,Y,`y`,10),B(e,.12,.08,10,0,8,6,Y,`y`,6),z(e,4.4,1.6,9,0,3.1,-7,J),B(e,.55,.5,.8,0,2.8,15.5,J,`y`,8),B(e,.06,.06,2.6,0,3,17,Y,`z`,6),z(e,.1,2.4,.1,2.5,3.2,12,Y),z(e,.1,2.4,.1,-2.5,3.2,12,Y),z(e,5,.06,.06,0,4.4,12,Y),z(e,.3,1.2,.6,0,3.4,-11,[210,208,200])]);{let t=[212,208,196],i=[V(e,62,10,3.2,{bow:.15,stern:.7,rise:1.2,sternRise:.3,rgb:[34,34,36]}),z(e,9.4,.1,54,0,3.25,-1,[140,120,90]),z(e,8.4,2.6,34,0,4.6,-3,t),z(e,7.4,2.4,26,0,7.1,-3,t),z(e,8.6,.12,36,0,5.95,-3,[100,88,70]),z(e,7.6,.12,28,0,8.35,-3,[100,88,70]),z(e,5.4,2.2,5,0,9.4,6,t),B(e,1.5,1.4,6,0,9.6,-4,[196,168,108],`y`,12),B(e,1.4,1.4,1,0,12.8,-4,[30,30,32],`y`,12),B(e,.2,.14,16,0,10,18,q,`y`,6),B(e,.2,.14,14,0,8.5,-20,q,`y`,6),z(e,8.4,.1,6,0,3.4,22,[120,104,80]),z(e,3,1.4,3,0,4.3,22,[60,56,50])];for(let t of[1,-1]){for(let n=0;n<11;n++)i.push(z(e,.06,.9,1.2,t*4.23,4.7,-17+n*2.9,Z));for(let n=0;n<8;n++)i.push(z(e,.06,.9,1.2,t*3.73,7.2,-14+n*2.9,Z))}r.steamer=n(i)}return r.launch=n([V(e,15,3,1.2,{bow:.12,stern:.6,rise:.35,sternRise:.15,rgb:[60,60,62]}),z(e,2.4,1.5,5.5,0,1.95,-1.5,[180,172,156]),B(e,.32,.3,2.2,0,3.4,.6,[36,34,32],`y`,8),z(e,2.6,.1,5.8,0,2.75,-1.5,[96,88,76]),z(e,2.42,.4,.04,0,2.2,1.28,Z)]),r}function ze(e,t){let n=e=>t(e),r={},i=[178,34,34],a=[150,152,132],o=[96,98,86];r.bomber=n([B(e,.55,.85,16.4,0,0,0,a,`z`,10),z(e,25,.3,3.6,0,-.1,1,a),z(e,9,.31,1.2,0,-.1,3.1,a),B(e,.6,.7,3.4,3.6,-.05,2,o,`z`,10),B(e,.6,.7,3.4,-3.6,-.05,2,o,`z`,10),z(e,7.6,.18,2,0,.2,-7,a),z(e,.14,2.3,1.6,3.5,1.2,-7.2,a),z(e,.14,2.3,1.6,-3.5,1.2,-7.2,a),z(e,.8,.5,2.4,0,.75,4.5,[52,60,66]),B(e,1,1,.04,9.5,.08,.8,i,`y`,16),B(e,1,1,.04,-9.5,.08,.8,i,`y`,16)]);let s=[176,178,172];return r.fighter=n([B(e,.35,.62,7.4,0,0,0,s,`z`,10),z(e,11,.18,1.9,0,-.32,.6,s),z(e,3.4,.12,1,0,.1,-3.2,s),z(e,.1,1.2,1,0,.6,-3.3,s),B(e,.62,.66,.6,0,0,3.6,[60,60,62],`z`,12),z(e,.15,.7,.3,1.3,-.75,.9,s),z(e,.15,.7,.3,-1.3,-.75,.9,s),B(e,.7,.7,.04,4,-.2,.5,i,`y`,14),B(e,.7,.7,.04,-4,-.2,.5,i,`y`,14)]),r}function Be(e){return new e.CircleGeometry(1,18)}export{xe as ARCH,s as ARM,i as CLS,m as FAR_SHAPE,l as GAIT,o as KIT,c as LEGS,u as LOD,e as PAL,f as RIG_ATTRS,p as RIG_DT,d as RIG_FADE,a as SLOT,Re as buildBoats,r as buildPalette,Se as buildPeople,Ce as buildPeopleLod1,ze as buildPlanes,Le as buildVehicles,Ae as figureLook,Be as propDisc,Fe as rigDepthMaterial,Ne as rigMaterial};