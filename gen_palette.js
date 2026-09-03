const fs = require('fs');
const dir = 'C:/Users/Administrator/WorkBuddy AI/2026-09-01-22-15-41/bead-pattern';

// MARD221 标准版色卡（来源：拼豆图鉴 pd.anqstar.com/colors，9 色系共 221 色）
const S = { A:'黄橙', B:'绿', C:'蓝青', D:'蓝紫', E:'粉玫', F:'红', G:'棕肤', H:'黑白', M:'大地' };
const hexes = {
  A:['FAF4C8','FFFFD5','FEFF8B','FBED56','F4D738','FEAC4C','FE8B4C','FFDA45','FF995B','F77C31','FFDD99','FE9F72','FFC365','FD543D','FFF365','FFFF9F','FFE36E','FEBE7D','FD7C72','FFD568','FFE395','F4F57D','E6C9B7','F7F8A2','FFD67D','FFC830'],
  B:['E6EE31','63F347','9EF780','5DE035','35E352','65E2A6','3DAF80','1C9C4F','27523A','95D3C2','5D722A','166F41','CAEB7B','ADE946','2E5132','C5ED9C','9BB13A','E6EE49','24B88C','C2F0CC','156A6B','0B3C43','303A21','EEFCA5','4E846D','8D7A35','CCE1AF','9EE5B9','C5E254','E2FCB1','B0E792','9CAB5A'],
  C:['E8FFE7','A9F9FC','A0E2FB','41CCFF','01ACEB','50AAF0','3677D2','0F54C0','324BCA','3EBCE2','28DDDE','1C334D','CDE8FF','D5FDFF','22C4C6','1557A8','04D1F6','1D3344','1887A2','176DAF','BEDDFF','67B4BE','C8E2FF','7CC4FF','A9E5E5','3CAED8','D3DFFA','BBCFED','34488E'],
  D:['AEB4F2','858EDD','2F54AF','182A84','B843C5','AC7BDE','8854B3','E2D3FF','D5B9F8','361851','B9BAE1','DE9AD4','B90095','8B279B','2F1F90','E3E1EE','C4D4F6','A45EC7','D8C3D7','9C32B2','9A009B','333A95','EBDAFC','7786E5','494FC7','DFC2F8'],
  E:['FDD3CC','FEC0DF','FFB7E7','E8649E','F551A2','F13D74','C63478','FFDBE9','E970CC','D33793','FCDDD2','F78FC3','B5006D','FFD1BA','F8C7C9','FFF3EB','FFE2EA','FFC7DB','FEBAD5','D8C7D1','BD9DA1','B785A1','937A8D','E1BCE8'],
  F:['FD957B','FC3D46','F74941','FC283C','E7002F','943630','971937','BC0028','E2677A','8A4526','5A2121','FD4E6A','F35744','FFA9AD','D30022','FEC2A6','E69C79','D37C46','C1444A','CD9391','F7B4C6','FDC0D0','F67E66','E698AA','E54B4F'],
  G:['FFE2CE','FFC4AA','F4C3A5','E1B383','EDB045','E99C17','9D5B3E','753832','E6B483','D98C39','E0C593','FFC890','B7714A','8D614C','FCF9E0','F2D9BA','78524B','FFE4CC','E07935','A94023','B88558'],
  H:['FDFBFF','FEFFFF','B6B1BA','89858C','48464E','2F2B2F','000000','E7D6DB','EDEDED','EEE9EA','CECDD5','FFF5ED','F5ECD2','CFD7D3','98A6A8','1D1414','F1EDED','FFFDF0','F6EFE2','949FA3','FFFBE1','CACAD4','9A9D94'],
  M:['BCC6B8','8AA386','697D80','E3D2BC','D0CCAA','B0A782','B4A497','B38281','A58767','C5B2BC','9F7594','644749','D19066','C77362','757D78']
};

let pal = [];
for (const k of ['A','B','C','D','E','F','G','H','M']) {
  const arr = hexes[k];
  for (let i = 0; i < arr.length; i++) pal.push({ id: k + (i+1), name: S[k], hex: '#' + arr[i] });
}

const body = pal.map(p => `  { id: '${p.id}', name: '${p.name}', hex: '${p.hex}' }`).join(',\n');
const block = `const PALETTE = [\n${body}\n];`;

let src = fs.readFileSync(dir + '/app.js', 'utf8');
const before = (src.match(/const PALETTE = \[[\s\S]*?\n\];/) || [''])[0];
if (!before) { console.error('PALETTE block not found'); process.exit(1); }
src = src.replace(/const PALETTE = \[[\s\S]*?\n\];/, block);
src = src.replace(/（共 \d+ 色）/, '（共 ' + pal.length + ' 色，MARD221 标准版）');

fs.writeFileSync(dir + '/app.js', src);
console.log('palette entries written:', pal.length);
console.log('ids unique:', new Set(pal.map(p=>p.id)).size === pal.length);
