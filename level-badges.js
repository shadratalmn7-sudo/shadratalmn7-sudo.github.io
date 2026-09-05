export function levelBadge(level=1,size=28){
 const raw=Math.max(1,Number(level)||1),n=Math.min(20,raw),future=raw>20;
 const ring=future?'#64748b':n>=20?'#c7a338':n>=15?'#a96d3d':n>=10?'#7c8da6':'#2563eb';
 const core=n>=20?'#0f172a':'#f8fbff',text=n>=20?'#fde68a':'#0f2f70',label=future?'21+':String(n);
 return `<svg class="level-badge-svg" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="Level ${label}"><defs><linearGradient id="lv${n}-${size}" x1="0" x2="1"><stop stop-color="${ring}"/><stop offset="1" stop-color="#1748b5"/></linearGradient></defs><path d="M32 4 49 10 58 26 54 46 32 60 10 46 6 26 15 10Z" fill="url(#lv${n}-${size})"/><path d="M32 11 45 16 51 28 48 41 32 52 16 41 13 28 19 16Z" fill="${core}"/><text x="32" y="38" text-anchor="middle" font-size="${future?13:17}" font-weight="900" font-family="Arial,sans-serif" fill="${text}">${label}</text></svg>`
}
export function mountLevelBadges(root=document){root.querySelectorAll('[data-level-badge]').forEach(el=>{el.innerHTML=levelBadge(el.dataset.levelBadge||1,Number(el.dataset.badgeSize||28))})}
