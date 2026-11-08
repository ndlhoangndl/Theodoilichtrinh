import fs from 'node:fs/promises';
import path from 'node:path';
import { Presentation, PresentationFile } from 'file:///C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';

const OUT = path.resolve('D:/Code/Lichtrinh/deliverables');
const BUILD = path.resolve('D:/Code/Lichtrinh/.codex-build/lichtrinh-slides');
await fs.mkdir(OUT, { recursive: true });
await fs.mkdir(BUILD, { recursive: true });
const ppt = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const C = { bg:'#F6F4EE', ink:'#18332F', green:'#2F6F62', mint:'#DCEAE3', coral:'#D78366', pale:'#F0E1D7', gray:'#586761', light:'#FFFFFF', line:'#D8DED8', gold:'#D8B46A', dark:'#102721' };
const FONT='Arial';
const noLine={style:'solid',fill:'none',width:0};
function box(s,x,y,w,h,fill,opts={}) { return s.shapes.add({geometry:opts.geometry||'rect',name:opts.name,position:{left:x,top:y,width:w,height:h},fill,line:opts.line||noLine,borderRadius:opts.radius}); }
function txt(s,x,y,w,h,str,opt={}) {
 const sh=s.shapes.add({geometry:'textbox',name:opt.name,position:{left:x,top:y,width:w,height:h},fill:'none',line:noLine});
 sh.text=str; sh.text.insets=opt.insets??0; sh.text.style={typeface:FONT,fontSize:opt.size||24,color:opt.color||C.ink,bold:opt.bold||false,alignment:opt.align||'left',verticalAlignment:opt.valign||'top',autoFit:'shrinkText',wrap:'square',lineSpacing:opt.lineSpacing}; return sh;
}
function line(s,x,y,w,h,color=C.line) { box(s,x,y,w,h,color); }
function base(num,title,sub='') { const s=ppt.slides.add(); s.background.fill=C.bg; box(s,0,0,15,720,C.green); txt(s,58,38,1110,54,title,{size:43,bold:true}); if(sub) txt(s,60,98,1070,34,sub,{size:20,color:C.gray}); line(s,60,666,1160,2,C.line); txt(s,60,680,900,20,'LỊCH TRÌNH  /  ĐỀ TÀI LẬP TRÌNH DI ĐỘNG',{size:13,color:C.gray,bold:true}); txt(s,1150,675,70,25,String(num).padStart(2,'0'),{size:17,color:C.green,bold:true,align:'right'}); return s; }
function bulletList(s,x,y,w,items,{size=24,gap=65,color=C.ink,dot=C.coral}={}) { items.forEach((it,i)=>{ box(s,x,y+i*gap+9,11,11,dot,{geometry:'ellipse'}); txt(s,x+28,y+i*gap,w-28,gap-5,it,{size,color}); }); }

// 1 — cover
{
 const s=ppt.slides.add(); s.background.fill=C.dark;
 box(s,0,0,18,720,C.coral); box(s,785,0,495,720,'#193A33');
 txt(s,78,70,590,30,'ĐỀ TÀI  •  LẬP TRÌNH DI ĐỘNG',{size:19,color:'#BBD4C8',bold:true});
 txt(s,78,156,630,180,'LỊCH TRÌNH',{size:68,color:'#F7F4ED',bold:true});
 txt(s,78,270,620,102,'Ứng dụng theo dõi thói quen\nvà kế hoạch cá nhân',{size:36,color:'#E4EDE7'});
 line(s,78,415,112,5,C.coral);
 txt(s,78,448,560,70,'Giúp người dùng duy trì nếp sống tốt\nvà nhìn lại tiến độ mỗi ngày',{size:23,color:'#C4D5CC'});
 txt(s,78,600,620,32,'Nhóm: ……………     Lớp: ……………     GVHD: ……………',{size:17,color:'#C4D5CC'});
 // Editable calendar / check-in motif as a clean typographic composition
 txt(s,860,114,330,36,'MỘT NGÀY CÓ CHỦ ĐÍCH',{size:19,color:'#BBD4C8',bold:true,align:'center'});
 box(s,865,184,320,315,'#F6F4EE',{radius:20});
 txt(s,895,207,220,32,'HÔM NAY',{size:17,color:C.gray,bold:true});
 txt(s,895,244,250,55,'Thứ Hai, 12',{size:32,bold:true});
 line(s,895,307,260,2,C.line);
 [['✓','Đọc 10 trang'],['✓','Đi bộ 20 phút'],['○','Ngủ trước 23:00']].forEach((r,i)=>{
   box(s,895,334+i*48,29,29,i<2?C.green:'#FFFFFF',{geometry:'ellipse',line:{style:'solid',fill:i<2?C.green:'#B7C2BC',width:2}});
   txt(s,895,334+i*48,29,27,r[0],{size:19,color:'#FFFFFF',bold:true,align:'center',valign:'middle'});
   txt(s,940,336+i*48,200,30,r[1],{size:21,color:C.ink});
 });
 txt(s,895,473,244,18,'2 / 3 thói quen hoàn thành',{size:15,color:C.green,bold:true});
 txt(s,843,560,360,64,'Theo dõi • Ghi nhận • Tiến bộ',{size:19,color:'#D7E5DC',align:'center'});
 s.speakerNotes.text='Mở đầu: giới thiệu đây là đề tài ứng dụng di động quản lý thói quen và kế hoạch cá nhân.';
}
// 2 — rationale
{
 const s=base(2,'Lý do chọn đề tài','Thói quen tốt thường khó duy trì khi người dùng thiếu cách theo dõi đều đặn.');
 txt(s,70,164,420,145,'“Mình đã làm được\ngì hôm nay?”',{size:39,bold:true,color:C.green});
 txt(s,72,328,420,112,'Câu hỏi đơn giản nhưng dễ bị bỏ quên khi việc học, công việc và sinh hoạt nằm ở nhiều nơi.',{size:23,color:C.gray});
 line(s,540,155,2,420,C.line);
 txt(s,590,158,560,35,'NHỮNG KHÓ KHĂN THƯỜNG GẶP',{size:18,color:C.coral,bold:true});
 bulletList(s,590,222,565,[
  'Ghi mục tiêu ở nhiều ứng dụng hoặc sổ tay.',
  'Quên điểm danh nên khó biết mình có duy trì đều không.',
  'Thiếu số liệu để nhận ra tiến độ theo tuần và tháng.'
 ],{size:25,gap:102});
 txt(s,590,555,540,48,'Đề tài chọn cách giải quyết bằng một ứng dụng gọn, dùng được mỗi ngày.',{size:23,bold:true});
}
// 3 — audience, problem, purpose
{
 const s=base(3,'Người dùng và mục tiêu','Ứng dụng hỗ trợ tự quản lý thói quen cá nhân, không thay thế tư vấn y tế.');
 txt(s,75,166,410,36,'ĐỐI TƯỢNG',{size:19,color:C.coral,bold:true});
 txt(s,75,213,430,112,'Học sinh, sinh viên và người đi làm muốn xây dựng nếp sống tích cực.',{size:31,bold:true});
 line(s,75,355,420,2,C.line);
 txt(s,75,384,410,36,'VẤN ĐỀ',{size:19,color:C.coral,bold:true});
 txt(s,75,432,430,120,'Khó duy trì mục tiêu và khó nhìn lại kết quả khi việc ghi chép bị phân tán.',{size:26});
 box(s,565,160,3,430,C.green);
 txt(s,615,166,510,36,'MỤC TIÊU ỨNG DỤNG',{size:19,color:C.green,bold:true});
 bulletList(s,615,220,540,[
  'Tạo và quản lý danh sách thói quen cá nhân.',
  'Ghi nhận hoàn thành theo ngày; lưu tâm trạng hoặc ghi chú.',
  'Hiển thị lịch sử và thống kê để người dùng tự đánh giá.'
 ],{size:25,gap:100,dot:C.green});
}
// 4 — competitor comparison
{
 const s=base(4,'Ứng dụng tham khảo','So sánh theo nhóm tính năng được giới thiệu trên trang chính thức.');
 // table header
 const xs=[68,286,690,1003], ws=[218,404,313,205];
 box(s,68,158,1138,55,C.ink);
 ['ỨNG DỤNG','TRỌNG TÂM','ĐIỂM MẠNH','GỢI Ý CHO ĐỀ TÀI'].forEach((v,i)=>txt(s,xs[i]+14,174,ws[i]-26,28,v,{size:16,color:'#FFFFFF',bold:true}));
 const rows=[
  ['Loop Habit Tracker','Theo dõi thói quen','Nhắc nhở, biểu đồ và thống kê.','Thêm nhật ký và mục tiêu.'],
  ['Habitica','Thói quen theo kiểu trò chơi','Nhiệm vụ, phần thưởng và tiến trình nhân vật.','Động lực không cần chơi hóa.'],
  ['TickTick','Quản lý việc và thời gian','Kết hợp lịch, Pomodoro và Habit Tracker.','Giới hạn MVP để dễ dùng.']
 ];
 rows.forEach((r,i)=>{
  const y=213+i*124; box(s,68,y,1138,124,i%2===0?'#FFFFFF':'#EEF1EB');
  for(let j=0;j<4;j++) txt(s,xs[j]+14,y+20,ws[j]-28,87,r[j],{size:j===0?22:20,bold:j===0,color:j===0?C.green:C.ink});
  line(s,68,y+123,1138,1,C.line);
 });
 txt(s,72,603,1110,36,'Khoảng trống đề tài hướng đến: theo dõi thói quen gắn với tự ghi nhận và tổng kết tháng.',{size:21,color:C.green,bold:true});
 s.speakerNotes.text='Nguồn tham khảo (trang chính thức):\nLoop Habit Tracker — https://loophabits.org/\nHabitica — https://habitica.com/static/features\nTickTick — https://ticktick.com/features\nGhi chú: cột “Gợi ý” là hướng chọn phạm vi cho đề tài, không phải kết luận rằng ứng dụng hiện có thiếu các tính năng đó.';
}
// 5 — proposed solution
{
 const s=base(5,'Giải pháp đề xuất','Một vòng sử dụng ngắn để việc theo dõi không trở thành gánh nặng.');
 const steps=[
  {n:'01',t:'Chọn thói quen',d:'Tạo mục tiêu phù hợp với lịch cá nhân.'},
  {n:'02',t:'Ghi nhận hôm nay',d:'Chạm để đánh dấu hoàn thành; thêm ghi chú nếu muốn.'},
  {n:'03',t:'Xem lại tiến độ',d:'Theo dõi chuỗi ngày và tỷ lệ hoàn thành.'},
  {n:'04',t:'Điều chỉnh mục tiêu',d:'Dùng tổng kết để thay đổi kế hoạch cho tháng sau.'}
 ];
 steps.forEach((st,i)=>{
  const x=76+i*296;
  txt(s,x,188,240,52,st.n,{size:42,color:C.coral,bold:true});
  line(s,x,255,230,4,C.green);
  txt(s,x,286,245,70,st.t,{size:25,bold:true});
  txt(s,x,370,236,125,st.d,{size:21,color:C.gray});
 });
 box(s,76,546,1126,65,C.mint,{radius:12});
 txt(s,100,563,1070,32,'Trọng tâm: giúp người dùng ghi nhận nhanh và hiểu tiến độ của chính mình.',{size:24,color:C.ink,bold:true,align:'center'});
}
// 6 — functions
{
 const s=base(6,'Chức năng và phạm vi','Ưu tiên hoàn thiện luồng cốt lõi trước; tính năng mở rộng triển khai khi còn thời gian.');
 txt(s,76,160,500,37,'CHỨC NĂNG CHÍNH  •  MVP',{size:19,color:C.green,bold:true});
 bulletList(s,76,214,500,[
  'Đăng ký, đăng nhập, hồ sơ cá nhân',
  'Thêm / sửa / xóa thói quen',
  'Điểm danh và ghi chú theo ngày',
  'Lịch sử, chuỗi ngày và thống kê tháng'
 ],{size:23,gap:86,dot:C.green});
 line(s,640,160,2,435,C.line);
 txt(s,696,160,500,37,'CHỨC NĂNG MỞ RỘNG',{size:19,color:C.coral,bold:true});
 bulletList(s,696,214,500,[
  'Mục tiêu tuần / tháng và tổng kết tháng',
  'Nhắc giờ bằng thông báo trên điện thoại',
  'Pomodoro và chủ đề giao diện',
  'Sao lưu, đồng bộ dữ liệu qua máy chủ'
 ],{size:23,gap:86,dot:C.coral});
 txt(s,75,598,1120,35,'Không đưa chat quản trị và bảng điều khiển web vào phạm vi bản di động đầu tiên.',{size:18,color:C.gray});
}
// 7 — editable use case
{
 const s=base(7,'Sơ đồ Use Case','Tác nhân chính: người dùng ứng dụng.');
 // System boundary and one-to-one associations keep the editable diagram readable.
 box(s,310,152,888,448,'#FFFFFF',{line:{style:'solid',fill:C.green,width:2},radius:18});
 txt(s,342,165,820,30,'ỨNG DỤNG LỊCH TRÌNH',{size:18,color:C.green,bold:true});
 // Actor
 box(s,116,284,3,72,C.ink); box(s,83,270,68,3,C.ink); box(s,116,355,3,72,C.ink); box(s,66,392,102,3,C.ink);
 box(s,97,238,41,41,'none',{geometry:'ellipse',line:{style:'solid',fill:C.ink,width:3}});
 box(s,67,355,51,3,C.ink); box(s,118,355,50,3,C.ink);
 txt(s,53,440,150,38,'Người dùng',{size:20,bold:true,align:'center'});
 const cases=['Đăng ký / Đăng nhập','Quản lý thói quen','Điểm danh hằng ngày','Ghi tâm trạng / nhật ký','Xem lịch sử / thống kê','Quản lý mục tiêu','Cài nhắc nhở / Pomodoro'];
 cases.forEach((label,i)=>{
   const y=195+i*55;
   box(s,438,y,620,43,'#E7F0EA',{geometry:'ellipse',line:{style:'solid',fill:'#A4BDB0',width:1}});
   txt(s,451,y+8,594,27,label,{size:19,bold:true,align:'center',valign:'middle'});
   box(s,168,y+21,270,2,'#92A89D');
 });
}
// 8 — technology and architecture
{
 const s=base(8,'Công nghệ và kiến trúc','Phương án phù hợp cho ứng dụng Android học phần.');
 const cols=[
  {x:70,w:330,head:'ỨNG DỤNG ANDROID',tech:'Kotlin\nAndroid Studio',desc:'Giao diện và xử lý nghiệp vụ trên điện thoại.'},
  {x:475,w:330,head:'LƯU TRỮ',tech:'Room\nCơ sở dữ liệu cục bộ',desc:'Lưu thói quen, điểm danh và nhật ký; dùng được khi offline.'},
  {x:880,w:330,head:'MỞ RỘNG',tech:'Express + MongoDB\nAPI đồng bộ',desc:'Tận dụng backend sẵn có nếu cần tài khoản và sao lưu.'}
 ];
 cols.forEach((c,i)=>{
  txt(s,c.x,181,c.w,32,c.head,{size:17,color:i===1?C.coral:C.green,bold:true,align:'center'});
  box(s,c.x,234,c.w,148,i===1?C.pale:C.mint,{radius:18});
  txt(s,c.x+20,265,c.w-40,88,c.tech,{size:28,bold:true,align:'center',valign:'middle'});
  txt(s,c.x+10,408,c.w-20,106,c.desc,{size:21,color:C.gray,align:'center'});
 });
 // Relationship labels between technology blocks
 txt(s,401,291,74,40,'⇄',{size:35,color:C.coral,bold:true,align:'center'});
 txt(s,806,291,74,40,'⇄',{size:35,color:C.coral,bold:true,align:'center'});
 box(s,114,558,1052,54,C.dark,{radius:12});
 txt(s,138,571,1003,30,'MVP: Kotlin + Room. Backend là phần mở rộng; nếu môn yêu cầu Java, đổi ngôn ngữ theo quy định lớp.',{size:20,color:'#FFFFFF',bold:true,align:'center'});
}
// 9 — team and implementation
{
 const s=base(9,'Kế hoạch và phân công nhóm','Ví dụ cho nhóm 4 thành viên; điều chỉnh theo số lượng thực tế.');
 const stages=[['1','Phân tích','Use Case, dữ liệu'],['2','Thiết kế','Luồng màn hình'],['3','Lập trình','Chia module'],['4','Hoàn thiện','Tích hợp, báo cáo']];
 stages.forEach((a,i)=>{
  const x=85+i*292;
  box(s,x,165,54,54,i===3?C.coral:C.green,{geometry:'ellipse'});
  txt(s,x,176,54,32,a[0],{size:23,color:'#FFFFFF',bold:true,align:'center'});
  if(i<3) box(s,x+55,190,225,3,C.line);
  txt(s,x,243,240,39,a[1],{size:25,bold:true});
  txt(s,x,294,250,56,a[2],{size:20,color:C.gray});
 });
 line(s,75,382,1128,2,C.line);
 const roles=[
  ['Thành viên 1','Phân tích yêu cầu, Use Case và điều phối'],
  ['Thành viên 2','Giao diện Android và điều hướng màn hình'],
  ['Thành viên 3','Room, dữ liệu và chức năng điểm danh'],
  ['Thành viên 4','Thống kê, thông báo, tích hợp và slide']
 ];
 roles.forEach((r,i)=>{
  const y=420+i*48;
  txt(s,82,y,205,32,r[0],{size:19,color:C.green,bold:true});
  txt(s,290,y,825,34,r[1],{size:20});
 });
}
// 10 — expected outcome
{
 const s=ppt.slides.add(); s.background.fill=C.green;
 txt(s,76,63,1100,48,'KẾT QUẢ KỲ VỌNG',{size:20,color:'#DCEAE3',bold:true});
 txt(s,76,132,600,120,'Một ứng dụng Android\ndùng được cho việc theo dõi hằng ngày',{size:43,color:'#FFFFFF',bold:true});
 line(s,78,370,110,5,C.coral);
 txt(s,78,412,505,118,'Người dùng tạo thói quen, ghi nhận tiến độ và xem lại kết quả trên cùng một ứng dụng.',{size:27,color:'#F1F5F1'});
 const outcomes=[['01','Thêm / quản lý thói quen'],['02','Điểm danh và lưu dữ liệu'],['03','Xem lịch sử, thống kê']];
 outcomes.forEach((a,i)=>{
  const y=170+i*123;
  txt(s,730,y,80,45,a[0],{size:29,color:'#D8B46A',bold:true});
  txt(s,820,y+4,370,46,a[1],{size:24,color:'#FFFFFF',bold:true});
  if(i<2) line(s,820,y+69,340,1,'#6D9588');
 });
 txt(s,78,626,1090,38,'LỊCH TRÌNH  •  XIN CẢM ƠN THẦY CÔ VÀ CÁC BẠN',{size:19,color:'#DCEAE3',bold:true});
 s.speakerNotes.text='Kết luận: nhấn mạnh bản đầu tiên ưu tiên luồng theo dõi thói quen; các tính năng đồng bộ và mở rộng triển khai sau khi hoàn thiện lõi.';
}

// Render slide previews for visual review.
for (let i=0;i<ppt.slides.items.length;i++) {
 const blob=await ppt.export({slide:ppt.slides.items[i],format:'png',scale:1});
 await fs.writeFile(path.join(BUILD,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await blob.arrayBuffer()));
}
const draft=path.join(BUILD,'lich-trinh-de-tai-10-slides-draft.pptx');
await (await PresentationFile.exportPptx(ppt)).save(draft);
console.log(JSON.stringify({draft,slides:ppt.slides.items.length,build:BUILD}));


